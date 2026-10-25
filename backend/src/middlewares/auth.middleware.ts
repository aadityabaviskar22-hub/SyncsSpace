import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { UserRole } from '../models/User.js';

export interface AuthenticatedUserPayload {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUserPayload;
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
    return;
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_access_key_change_in_production_123!';
    const decoded = jwt.verify(token, jwtSecret) as {
      userId: string;
      email: string;
      role: UserRole;
    };

    // Verify user still exists in database
    const user = await User.findById(decoded.userId).select('name email role isOnline');
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid token: User no longer exists.',
      });
      return;
    }

    req.user = {
      _id: (user._id as any).toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: 'Token expired. Please refresh your session.',
        isExpired: true,
      });
      return;
    }

    res.status(403).json({
      success: false,
      message: 'Invalid or corrupted token.',
    });
  }
};
