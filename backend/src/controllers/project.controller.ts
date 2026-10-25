import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Note from '../models/Note.js';
import { logActivity } from '../utils/activityLogger.js';

export const getAllProjects = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const role = req.user!.role;
    const { status, priority, search } = req.query;

    const query: any = {};

    // RBAC: Admins can see all projects; Members and Managers see projects they are part of
    if (role !== 'Admin') {
      const userObjectId = new mongoose.Types.ObjectId(userId);
      query.$or = [{ createdBy: userObjectId }, { members: userObjectId }];
    }

    if (status) {
      query.status = status;
    }
    if (priority) {
      query.priority = priority;
    }
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const projects = await Project.find(query)
      .populate('createdBy', 'name email avatar department')
      .populate('members', 'name email avatar isOnline')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email avatar department')
      .populate('members', 'name email avatar isOnline');

    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
      return;
    }

    // Check membership authorization
    const userId = req.user!._id;
    const isMemberOrCreator =
      project.createdBy._id.toString() === userId ||
      project.members.some((m: any) => m._id.toString() === userId);

    if (req.user!.role !== 'Admin' && !isMemberOrCreator) {
      res.status(403).json({
        success: false,
        message: 'Access denied: You are not assigned to this project.',
      });
      return;
    }

    // Calculate quick task stats for this project
    const taskStats = await Task.aggregate([
      { $match: { projectId: project._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        project,
        taskStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, description, priority, status, members = [], startDate, dueDate } = req.body;
    const currentUserId = req.user!._id;

    // Automatically include the creator in the members list
    const memberSet = new Set<string>(members.map((m: any) => m.toString()));
    memberSet.add(currentUserId);

    const project = await Project.create({
      title,
      description,
      priority: priority || 'Medium',
      status: status || 'Active',
      createdBy: new mongoose.Types.ObjectId(currentUserId),
      members: Array.from(memberSet).map((id) => new mongoose.Types.ObjectId(id)),
      startDate,
      dueDate,
    });

    const populatedProject = await Project.findById(project._id)
      .populate('createdBy', 'name email avatar')
      .populate('members', 'name email avatar isOnline');

    // Auto-log activity
    await logActivity({
      actorId: currentUserId,
      actionType: 'PROJECT_CREATED',
      entityType: 'Project',
      entityId: project._id as any,
      projectId: project._id as any,
      metadata: { title: project.title, priority: project.priority },
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully.',
      data: populatedProject,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
      return;
    }

    // Only Admin or project Manager creator can update workspace settings
    const isCreator = project.createdBy.toString() === req.user!._id;
    if (req.user!.role !== 'Admin' && (!isCreator || req.user!.role !== 'Manager')) {
      res.status(403).json({
        success: false,
        message: 'Only the project manager or system admin can update project settings.',
      });
      return;
    }

    const { title, description, status, priority, members, startDate, dueDate } = req.body;

    if (title) project.title = title;
    if (description !== undefined) project.description = description;
    if (status) project.status = status;
    if (priority) project.priority = priority;
    if (startDate !== undefined) project.startDate = startDate;
    if (dueDate !== undefined) project.dueDate = dueDate;
    if (members && Array.isArray(members)) {
      project.members = members.map((id: string) => new mongoose.Types.ObjectId(id));
    }

    await project.save();

    const updated = await Project.findById(project._id)
      .populate('createdBy', 'name email avatar')
      .populate('members', 'name email avatar isOnline');

    // Auto-log activity
    await logActivity({
      actorId: req.user!._id,
      actionType: 'PROJECT_UPDATED',
      entityType: 'Project',
      entityId: project._id as any,
      projectId: project._id as any,
      metadata: { title: project.title, status: project.status },
    });

    res.status(200).json({
      success: true,
      message: 'Project updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
      return;
    }

    // Admins or project owner managers can delete
    const isCreator = project.createdBy.toString() === req.user!._id;
    if (req.user!.role !== 'Admin' && !isCreator) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this project.',
      });
      return;
    }

    // Cascade delete associated tasks and notes
    await Promise.all([
      Task.deleteMany({ projectId: project._id }),
      Note.deleteMany({ projectId: project._id }),
      Project.findByIdAndDelete(project._id),
    ]);

    // Auto-log activity
    await logActivity({
      actorId: req.user!._id,
      actionType: 'PROJECT_DELETED',
      entityType: 'Project',
      entityId: project._id as any,
      projectId: project._id as any,
      metadata: { deletedTitle: project.title },
    });

    res.status(200).json({
      success: true,
      message: 'Project and all associated tasks and notes have been deleted.',
    });
  } catch (error) {
    next(error);
  }
};
