import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Task, { ITaskAttachment } from '../models/Task.js';
import Project from '../models/Project.js';
import { logActivity } from '../utils/activityLogger.js';
import { getIO, sendNotification } from '../sockets/socketServer.js';

export const getTasksByProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { status, assignedTo, priority } = req.query;

    const query: any = { projectId: new mongoose.Types.ObjectId(projectId) };

    if (status) query.status = status;
    if (assignedTo) query.assignedTo = new mongoose.Types.ObjectId(assignedTo as string);
    if (priority) query.priority = priority;

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email avatar isOnline')
      .populate('createdBy', 'name email avatar')
      .sort({ orderIndex: 1, createdAt: 1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email avatar department isOnline')
      .populate('createdBy', 'name email avatar')
      .populate('projectId', 'title status');

    if (!task) {
      res.status(404).json({
        success: false,
        message: 'Task not found.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { title, description, status, priority, orderIndex, assignedTo, dueDate, tags } = req.body;
    const currentUserId = req.user!._id;

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Parent project not found.',
      });
      return;
    }

    // Process uploaded multer file attachments if any
    const attachments: ITaskAttachment[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        attachments.push({
          filename: file.filename,
          originalName: file.originalname,
          path: file.path,
          mimetype: file.mimetype,
          size: file.size,
          uploadedAt: new Date(),
        });
      }
    }

    const parsedTags = typeof tags === 'string' ? tags.split(',').map((t) => t.trim()) : tags || [];

    const task = await Task.create({
      title,
      description: description || '',
      status: status || 'Todo',
      priority: priority || 'Medium',
      orderIndex: orderIndex ? Number(orderIndex) : 0,
      projectId: new mongoose.Types.ObjectId(projectId),
      assignedTo: assignedTo ? new mongoose.Types.ObjectId(assignedTo) : undefined,
      createdBy: new mongoose.Types.ObjectId(currentUserId),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      tags: parsedTags,
      attachments,
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatar isOnline')
      .populate('createdBy', 'name email avatar');

    // 1. Automatically log activity entry (which broadcasts via socket)
    await logActivity({
      actorId: currentUserId,
      actionType: 'TASK_CREATED',
      entityType: 'Task',
      entityId: task._id as any,
      projectId: new mongoose.Types.ObjectId(projectId),
      metadata: {
        taskTitle: task.title,
        status: task.status,
        priority: task.priority,
        attachmentsCount: attachments.length,
      },
    });

    // 2. Broadcast task:created to the project room
    try {
      getIO().to(`project_${projectId}`).emit('task:created', populatedTask);
    } catch (e) {
      // Socket emission failure shouldn't fail HTTP response
    }

    // 3. If assigned to another member, send direct real-time notification
    if (assignedTo && assignedTo.toString() !== currentUserId) {
      await sendNotification({
        recipientId: assignedTo.toString(),
        senderId: currentUserId,
        title: 'New Task Assigned',
        message: `${req.user!.name} assigned you to task "${task.title}" in ${project.title}.`,
        link: `/projects/${projectId}?task=${task._id}`,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      data: populatedTask,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      res.status(404).json({
        success: false,
        message: 'Task not found.',
      });
      return;
    }

    const { title, description, status, priority, orderIndex, assignedTo, dueDate, tags } = req.body;
    const oldStatus = task.status;
    const previousAssignee = task.assignedTo?.toString();

    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (status) task.status = status;
    if (priority) task.priority = priority;
    if (orderIndex !== undefined) task.orderIndex = Number(orderIndex);
    if (assignedTo !== undefined) {
      task.assignedTo = assignedTo ? new mongoose.Types.ObjectId(assignedTo) : undefined;
    }
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : undefined;
    if (tags !== undefined) {
      task.tags = typeof tags === 'string' ? tags.split(',').map((t) => t.trim()) : tags;
    }

    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        task.attachments.push({
          filename: file.filename,
          originalName: file.originalname,
          path: file.path,
          mimetype: file.mimetype,
          size: file.size,
          uploadedAt: new Date(),
        });
      }
    }

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatar isOnline')
      .populate('createdBy', 'name email avatar');

    // 1. Log activity entry
    await logActivity({
      actorId: req.user!._id,
      actionType: 'TASK_UPDATED',
      entityType: 'Task',
      entityId: task._id as any,
      projectId: task.projectId,
      metadata: {
        taskTitle: task.title,
        statusChange: oldStatus !== task.status ? { from: oldStatus, to: task.status } : undefined,
      },
    });

    // 2. Broadcast task:updated to the project room
    try {
      getIO().to(`project_${task.projectId}`).emit('task:updated', {
        projectId: task.projectId,
        taskId: task._id,
        updates: updatedTask,
        updatedBy: { _id: req.user!._id, name: req.user!.name },
      });
    } catch (e) {
      // Ignore if socket not ready
    }

    // 3. Notify newly assigned member if reassigned
    if (
      assignedTo &&
      assignedTo.toString() !== previousAssignee &&
      assignedTo.toString() !== req.user!._id
    ) {
      await sendNotification({
        recipientId: assignedTo.toString(),
        senderId: req.user!._id,
        title: 'Task Assigned',
        message: `${req.user!.name} assigned you to task "${task.title}".`,
        link: `/projects/${task.projectId}?task=${task._id}`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task updated successfully.',
      data: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTaskStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, orderIndex } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      res.status(404).json({
        success: false,
        message: 'Task not found.',
      });
      return;
    }

    const oldStatus = task.status;
    task.status = status;
    if (orderIndex !== undefined) {
      task.orderIndex = Number(orderIndex);
    }

    await task.save();

    // 1. Log activity entry
    await logActivity({
      actorId: req.user!._id,
      actionType: 'TASK_UPDATED',
      entityType: 'Task',
      entityId: task._id as any,
      projectId: task.projectId,
      metadata: {
        taskTitle: task.title,
        statusTransition: `${oldStatus} -> ${status}`,
        newIndex: task.orderIndex,
      },
    });

    // 2. Broadcast task:moved to the project room (Kanban sync)
    try {
      getIO().to(`project_${task.projectId}`).emit('task:moved', {
        taskId: task._id,
        projectId: task.projectId,
        newStatus: task.status,
        orderIndex: task.orderIndex,
        movedBy: {
          _id: req.user!._id,
          name: req.user!.name,
        },
      });
    } catch (e) {
      // Ignore
    }

    res.status(200).json({
      success: true,
      message: 'Task status updated.',
      data: {
        id: task._id,
        status: task.status,
        orderIndex: task.orderIndex,
        completedAt: task.completedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      res.status(404).json({
        success: false,
        message: 'Task not found.',
      });
      return;
    }

    const isCreator = task.createdBy.toString() === req.user!._id;
    if (req.user!.role === 'Member' && !isCreator) {
      res.status(403).json({
        success: false,
        message: 'Members can only delete tasks they personally created.',
      });
      return;
    }

    const projectId = task.projectId;
    const taskId = task._id;
    const taskTitle = task.title;

    await Task.findByIdAndDelete(taskId);

    // 1. Log activity entry
    await logActivity({
      actorId: req.user!._id,
      actionType: 'TASK_DELETED',
      entityType: 'Task',
      entityId: taskId as any,
      projectId,
      metadata: { deletedTaskTitle: taskTitle },
    });

    // 2. Broadcast task:deleted to the project room
    try {
      getIO().to(`project_${projectId}`).emit('task:deleted', {
        projectId,
        taskId,
      });
    } catch (e) {
      // Ignore
    }

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
