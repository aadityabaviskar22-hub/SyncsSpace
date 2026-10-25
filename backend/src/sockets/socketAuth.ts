import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import User, { UserRole } from '../models/User.js';

export interface SocketUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
}

// Extend Socket data typing
declare module 'socket.io' {
  interface Socket {
    user?: SocketUser;
  }
}

/**
 * Socket.IO Handshake Authentication Middleware
 * Validates JWT token from socket.handshake.auth.token or Authorization header
 */
export const socketAuthMiddleware = async (
  socket: Socket,
  next: (err?: Error) => void
): Promise<void> => {
  try {
    // 1. Extract token from auth payload or fallback to handshake headers
    let token: string | undefined = socket.handshake.auth?.token;

    if (!token && socket.handshake.headers?.authorization) {
      const authHeader = socket.handshake.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      } else {
        token = authHeader;
      }
    }

    if (!token) {
      return next(new Error('Authentication error: Token not provided in socket handshake.'));
    }

    // 2. Verify JWT signature
    const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_access_key_change_in_production_123!';
    const decoded = jwt.verify(token, jwtSecret) as {
      userId: string;
      email: string;
      role: UserRole;
    };

    // 3. Confirm user exists in MongoDB
    const user = await User.findById(decoded.userId).select('name email role avatar department isOnline');
    if (!user) {
      return next(new Error('Authentication error: User no longer exists.'));
    }

    // 4. Attach verified user to socket instance
    socket.user = {
      _id: (user._id as any).toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      department: user.department,
    };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return next(new Error('Authentication error: Token expired. Please re-authenticate.'));
    }
    return next(new Error('Authentication error: Invalid or corrupted token.'));
  }
};
