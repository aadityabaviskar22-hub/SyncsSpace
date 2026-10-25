import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Task from '../models/Task.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Activity from '../models/Activity.js';

/**
 * Endpoint 1: Tasks completed per week
 * Aggregates tasks marked 'Done' grouped by ISO week and year
 */
export const getTasksCompletedPerWeek = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId, weeks = 12 } = req.query;
    const matchFilter: any = {
      status: 'Done',
    };

    if (projectId) {
      matchFilter.projectId = new mongoose.Types.ObjectId(projectId as string);
    }

    // Filter by completedAt or fallback to updatedAt
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - parseInt(weeks as string, 10) * 7);
    matchFilter.$or = [
      { completedAt: { $gte: dateLimit } },
      { completedAt: { $exists: false }, updatedAt: { $gte: dateLimit } },
    ];

    const weeklyStats = await Task.aggregate([
      { $match: matchFilter },
      {
        $project: {
          effectiveDate: { $ifNull: ['$completedAt', '$updatedAt'] },
        },
      },
      {
        $group: {
          _id: {
            year: { $isoWeekYear: '$effectiveDate' },
            week: { $isoWeek: '$effectiveDate' },
          },
          completedCount: { $sum: 1 },
        },
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.week': 1,
        },
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          week: '$_id.week',
          label: {
            $concat: ['W', { $toString: '$_id.week' }, ' ', { $toString: '$_id.year' }],
          },
          completedCount: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      timeframeWeeks: Number(weeks),
      data: weeklyStats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Endpoint 2: Workload per user
 * Aggregates task distribution across users (total, todo, in progress, done)
 */
export const getWorkloadPerUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId } = req.query;
    const matchFilter: any = {
      assignedTo: { $exists: true, $ne: null },
    };

    if (projectId) {
      matchFilter.projectId = new mongoose.Types.ObjectId(projectId as string);
    }

    const workload = await Task.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$assignedTo',
          totalTasks: { $sum: 1 },
          todo: {
            $sum: { $cond: [{ $eq: ['$status', 'Todo'] }, 1, 0] },
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$status', 'InProgress'] }, 1, 0] },
          },
          inReview: {
            $sum: { $cond: [{ $eq: ['$status', 'InReview'] }, 1, 0] },
          },
          done: {
            $sum: { $cond: [{ $eq: ['$status', 'Done'] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      {
        $unwind: '$userDetails',
      },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          name: '$userDetails.name',
          email: '$userDetails.email',
          avatar: '$userDetails.avatar',
          department: '$userDetails.department',
          totalTasks: 1,
          todo: 1,
          inProgress: 1,
          inReview: 1,
          done: 1,
          completionPercentage: {
            $cond: [
              { $gt: ['$totalTasks', 0] },
              { $round: [{ $multiply: [{ $divide: ['$done', '$totalTasks'] }, 100] }, 1] },
              0,
            ],
          },
        },
      },
      { $sort: { totalTasks: -1 } },
    ]);

    res.status(200).json({
      success: true,
      count: workload.length,
      data: workload,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Endpoint 3: Tasks by status
 * Aggregates task distribution across status categories with percentage
 */
export const getTasksByStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId } = req.query;
    const matchFilter: any = {};

    if (projectId) {
      matchFilter.projectId = new mongoose.Types.ObjectId(projectId as string);
    }

    const [statusCounts, totalTasks] = await Promise.all([
      Task.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      Task.countDocuments(matchFilter),
    ]);

    // Ensure all 4 standard statuses are present in output even if 0
    const standardStatuses = ['Todo', 'InProgress', 'InReview', 'Done'];
    const statusMap = new Map<string, number>(statusCounts.map((s) => [s._id, s.count]));

    const formattedData = standardStatuses.map((status) => {
      const count = statusMap.get(status) || 0;
      return {
        status,
        count,
        percentage: totalTasks > 0 ? Number(((count / totalTasks) * 100).toFixed(1)) : 0,
      };
    });

    res.status(200).json({
      success: true,
      totalTasks,
      data: formattedData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * System Overview Analytics (Used by Angular Admin Dashboard)
 */
export const getOverviewAnalytics = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [
      totalUsers,
      onlineUsers,
      totalProjects,
      activeProjects,
      totalTasks,
      doneTasks,
      recentActivities,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isOnline: true }),
      Project.countDocuments(),
      Project.countDocuments({ status: 'Active' }),
      Task.countDocuments(),
      Task.countDocuments({ status: 'Done' }),
      Activity.find()
        .populate('actorId', 'name email avatar')
        .populate('projectId', 'title')
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    const taskCompletionRate = totalTasks > 0 ? Number(((doneTasks / totalTasks) * 100).toFixed(1)) : 0;

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          online: onlineUsers,
        },
        projects: {
          total: totalProjects,
          active: activeProjects,
        },
        tasks: {
          total: totalTasks,
          completed: doneTasks,
          completionRate: taskCompletionRate,
        },
        recentActivities,
      },
    });
  } catch (error) {
    next(error);
  }
};
