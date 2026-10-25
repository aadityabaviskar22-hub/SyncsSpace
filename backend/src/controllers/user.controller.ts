import { Request, Response, NextFunction } from 'express';
import User from '../models/User.js';
import { logActivity } from '../utils/activityLogger.js';

export const getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const skip = (page - 1) * limit;
    const { role, search, department } = req.query;

    const query: any = {};

    if (role && role !== 'ALL') {
      query.role = role;
    }
    if (department) {
      query.department = department;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -refreshTokens')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).select('-password -refreshTokens');
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.params.id;
    const currentUserId = req.user!._id;
    const currentUserRole = req.user!.role;

    // Only self or Admin can update profile fields
    if (userId !== currentUserId && currentUserRole !== 'Admin') {
      res.status(403).json({
        success: false,
        message: 'You are not authorized to edit another user profile.',
      });
      return;
    }

    const { name, department, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      userId,
      {
        ...(name && { name }),
        ...(department && { department }),
        ...(avatar !== undefined && { avatar }),
      },
      { new: true, runValidators: true }
    ).select('-password -refreshTokens');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { role } = req.body;
    const targetUserId = req.params.id;

    if (!['Admin', 'Manager', 'Member'].includes(role)) {
      res.status(400).json({
        success: false,
        message: 'Invalid role specified. Must be Admin, Manager, or Member.',
      });
      return;
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found.',
      });
      return;
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    // Log activity
    await logActivity({
      actorId: req.user!._id,
      actionType: 'USER_ROLE_CHANGED',
      entityType: 'User',
      entityId: user._id as any,
      metadata: { targetUserEmail: user.email, fromRole: oldRole, toRole: role },
    });

    res.status(200).json({
      success: true,
      message: `User role changed from ${oldRole} to ${role}.`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const targetUserId = req.params.id;

    // Prevent Admin from deleting themselves
    if (targetUserId === req.user!._id) {
      res.status(400).json({
        success: false,
        message: 'You cannot delete your own admin account.',
      });
      return;
    }

    const user = await User.findByIdAndDelete(targetUserId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found.',
      });
      return;
    }

    // Log deletion
    await logActivity({
      actorId: req.user!._id,
      actionType: 'USER_DELETED',
      entityType: 'User',
      entityId: user._id as any,
      metadata: { deletedEmail: user.email, name: user.name },
    });

    res.status(200).json({
      success: true,
      message: `User ${user.email} was removed successfully.`,
    });
  } catch (error) {
    next(error);
  }
};
