import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { logActivity } from '../utils/activityLogger.js';

const getAccessSecret = () => process.env.JWT_SECRET || 'super_secret_jwt_access_key_change_in_production_123!';
const getRefreshSecret = () => process.env.JWT_REFRESH_SECRET || 'super_secret_jwt_refresh_key_change_in_production_456!';
const ACCESS_EXPIRES = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

const generateTokens = (userId: string, email: string, role: string) => {
  const accessToken = jwt.sign({ userId, email, role }, getAccessSecret(), {
    expiresIn: ACCESS_EXPIRES as any,
  });

  const refreshToken = jwt.sign({ userId }, getRefreshSecret(), {
    expiresIn: REFRESH_EXPIRES as any,
  });

  return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password, department, role } = req.body;

    // Check if email already registered
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
      return;
    }

    // Role safety: Public registration only creates 'Member' or 'Manager', never 'Admin' unless DB is empty
    let assignedRole = role || 'Member';
    const totalUsers = await User.countDocuments();
    if (totalUsers === 0) {
      // First user registered in system becomes Admin automatically
      assignedRole = 'Admin';
    } else if (assignedRole === 'Admin') {
      assignedRole = 'Member';
    }

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      department: department || 'Engineering',
      role: assignedRole,
      isOnline: true,
      lastActiveAt: new Date(),
    });

    const { accessToken, refreshToken } = generateTokens(
      (newUser._id as any).toString(),
      newUser.email,
      newUser.role
    );

    // Save refresh token
    newUser.refreshTokens = [refreshToken];
    await newUser.save();

    // Log registration activity
    await logActivity({
      actorId: newUser._id as any,
      actionType: 'USER_REGISTER',
      entityType: 'User',
      entityId: newUser._id as any,
      metadata: { email: newUser.email, role: newUser.role, department: newUser.department },
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      accessToken,
      refreshToken,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        isOnline: newUser.isOnline,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Fetch user including hidden password and refreshTokens fields
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password +refreshTokens');
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
      return;
    }

    const { accessToken, refreshToken } = generateTokens(
      (user._id as any).toString(),
      user.email,
      user.role
    );

    // Store refresh token (limit stored tokens to last 5 sessions)
    const existingTokens = user.refreshTokens || [];
    user.refreshTokens = [...existingTokens.slice(-4), refreshToken];
    user.isOnline = true;
    user.lastActiveAt = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        avatar: user.avatar,
        isOnline: user.isOnline,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken: incomingToken } = req.body;

    if (!incomingToken) {
      res.status(400).json({
        success: false,
        message: 'Refresh token is required.',
      });
      return;
    }

    let decoded: any;
    try {
      decoded = jwt.verify(incomingToken, getRefreshSecret());
    } catch (err) {
      res.status(403).json({
        success: false,
        message: 'Invalid or expired refresh token. Please login again.',
      });
      return;
    }

    const user = await User.findById(decoded.userId).select('+refreshTokens');
    if (!user || !user.refreshTokens.includes(incomingToken)) {
      res.status(403).json({
        success: false,
        message: 'Refresh token revoked or invalid session.',
      });
      return;
    }

    // Generate new access token and rotate refresh token
    const newTokens = generateTokens(
      (user._id as any).toString(),
      user.email,
      user.role
    );

    // Replace used refresh token with the new one
    user.refreshTokens = user.refreshTokens.filter((t) => t !== incomingToken);
    user.refreshTokens.push(newTokens.refreshToken);
    await user.save();

    res.status(200).json({
      success: true,
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken: tokenToRevoke } = req.body;
    const userId = req.user?._id;

    if (userId) {
      const user = await User.findById(userId).select('+refreshTokens');
      if (user) {
        if (tokenToRevoke) {
          user.refreshTokens = (user.refreshTokens || []).filter((t) => t !== tokenToRevoke);
        } else {
          user.refreshTokens = [];
        }
        user.isOnline = false;
        user.lastActiveAt = new Date();
        await user.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user!._id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        avatar: user.avatar,
        isOnline: user.isOnline,
        lastActiveAt: user.lastActiveAt,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};
