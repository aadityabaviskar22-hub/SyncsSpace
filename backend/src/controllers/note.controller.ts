import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Note from '../models/Note.js';
import Project from '../models/Project.js';
import { logActivity } from '../utils/activityLogger.js';
import { getIO } from '../sockets/socketServer.js';

export const getNotesByProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { isPinned } = req.query;

    const query: any = { projectId: new mongoose.Types.ObjectId(projectId) };
    if (isPinned !== undefined) {
      query.isPinned = isPinned === 'true';
    }

    const notes = await Note.find(query)
      .populate('authorId', 'name email avatar')
      .populate('lastModifiedBy', 'name email avatar')
      .sort({ isPinned: -1, updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: notes.length,
      data: notes,
    });
  } catch (error) {
    next(error);
  }
};

export const getNoteById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const note = await Note.findById(req.params.id)
      .populate('authorId', 'name email avatar')
      .populate('lastModifiedBy', 'name email avatar');

    if (!note) {
      res.status(404).json({
        success: false,
        message: 'Note not found.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: note,
    });
  } catch (error) {
    next(error);
  }
};

export const createNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { title, content, isPinned } = req.body;
    const currentUserId = req.user!._id;

    // Check project exists
    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Parent project not found.',
      });
      return;
    }

    const note = await Note.create({
      title,
      content: content || '',
      projectId: new mongoose.Types.ObjectId(projectId),
      authorId: new mongoose.Types.ObjectId(currentUserId),
      lastModifiedBy: new mongoose.Types.ObjectId(currentUserId),
      isPinned: isPinned || false,
      version: 1,
    });

    const populatedNote = await Note.findById(note._id)
      .populate('authorId', 'name email avatar')
      .populate('lastModifiedBy', 'name email avatar');

    // 1. Automatically log activity entry
    await logActivity({
      actorId: currentUserId,
      actionType: 'NOTE_CREATED',
      entityType: 'Note',
      entityId: note._id as any,
      projectId: new mongoose.Types.ObjectId(projectId),
      metadata: { noteTitle: note.title },
    });

    // 2. Broadcast note:created to project room
    try {
      getIO().to(`project_${projectId}`).emit('note:created', populatedNote);
    } catch (e) {
      // Ignore
    }

    res.status(201).json({
      success: true,
      message: 'Note created successfully.',
      data: populatedNote,
    });
  } catch (error) {
    next(error);
  }
};

export const updateNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      res.status(404).json({
        success: false,
        message: 'Note not found.',
      });
      return;
    }

    const { title, content, isPinned, version } = req.body;

    // Optimistic Concurrency Control Check:
    if (version !== undefined && Number(version) !== note.version) {
      res.status(409).json({
        success: false,
        message: 'Conflict: This note has been modified by another teammate. Please refresh.',
        currentVersion: note.version,
      });
      return;
    }

    if (title) note.title = title;
    if (content !== undefined) note.content = content;
    if (isPinned !== undefined) note.isPinned = isPinned;

    note.lastModifiedBy = new mongoose.Types.ObjectId(req.user!._id);
    note.version += 1;

    await note.save();

    const updatedNote = await Note.findById(note._id)
      .populate('authorId', 'name email avatar')
      .populate('lastModifiedBy', 'name email avatar');

    // 1. Automatically log activity entry
    await logActivity({
      actorId: req.user!._id,
      actionType: 'NOTE_UPDATED',
      entityType: 'Note',
      entityId: note._id as any,
      projectId: note.projectId,
      metadata: { noteTitle: note.title, newVersion: note.version },
    });

    // 2. Broadcast note:updated to project room
    try {
      getIO().to(`project_${note.projectId}`).emit('note:updated', {
        projectId: note.projectId,
        noteId: note._id,
        note: updatedNote,
        updatedBy: { _id: req.user!._id, name: req.user!.name },
      });
    } catch (e) {
      // Ignore
    }

    res.status(200).json({
      success: true,
      message: 'Note updated successfully.',
      data: updatedNote,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      res.status(404).json({
        success: false,
        message: 'Note not found.',
      });
      return;
    }

    const isAuthor = note.authorId.toString() === req.user!._id;
    if (req.user!.role === 'Member' && !isAuthor) {
      res.status(403).json({
        success: false,
        message: 'Members can only delete notes they personally created.',
      });
      return;
    }

    const projectId = note.projectId;
    const noteId = note._id;
    const noteTitle = note.title;

    await Note.findByIdAndDelete(noteId);

    // 1. Automatically log activity entry
    await logActivity({
      actorId: req.user!._id,
      actionType: 'NOTE_DELETED',
      entityType: 'Note',
      entityId: noteId as any,
      projectId,
      metadata: { deletedNoteTitle: noteTitle },
    });

    // 2. Broadcast note:deleted to project room
    try {
      getIO().to(`project_${projectId}`).emit('note:deleted', {
        projectId,
        noteId,
      });
    } catch (e) {
      // Ignore
    }

    res.status(200).json({
      success: true,
      message: 'Note deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
