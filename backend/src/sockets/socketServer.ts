import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import mongoose from 'mongoose';
import { socketAuthMiddleware, SocketUser } from './socketAuth.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';

let io: Server | null = null;

// Track active socket connections per user ID (allows multi-tab support)
const userSocketMap = new Map<string, Set<string>>();

export const initSocketServer = (httpServer: HttpServer): Server => {
  const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
  const adminOrigin = process.env.ADMIN_ORIGIN || 'http://localhost:4200';
  const allowedOrigins = [clientOrigin, adminOrigin, 'http://localhost:5173'];

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // 1. Authenticate handshakes using JWT
  io.use(socketAuthMiddleware);

  // 2. Main Connection Lifecycle
  io.on('connection', async (socket: Socket) => {
    const user = socket.user as SocketUser;
    const userId = user._id;

    console.log(`[Socket] User connected: ${user.name} (${user.email}) [Socket ID: ${socket.id}]`);

    // Add socket to user's connection set
    if (!userSocketMap.has(userId)) {
      userSocketMap.set(userId, new Set());
    }
    userSocketMap.get(userId)!.add(socket.id);

    // Join personal user room for direct private notifications
    socket.join(`user_${userId}`);

    // Admins automatically join the admin telemetry room
    if (user.role === 'Admin') {
      socket.join('admin_room');
    }

    // Update presence in MongoDB & broadcast online status
    try {
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastActiveAt: new Date(),
      });

      io!.emit('presence:online', {
        userId,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        department: user.department,
        isOnline: true,
        lastActiveAt: new Date(),
      });
    } catch (err) {
      console.error('[Socket] Error updating user presence:', err);
    }

    // ==========================================
    // 3. PROJECT ROOM MANAGEMENT (RBAC ENFORCED)
    // ==========================================

    socket.on('project:join', async (data: { projectId: string }) => {
      try {
        const { projectId } = data;
        if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
          socket.emit('socket:error', { message: 'Invalid project ID provided.' });
          return;
        }

        const project = await Project.findById(projectId);
        if (!project) {
          socket.emit('socket:error', { message: 'Project not found.' });
          return;
        }

        // Membership authorization check:
        // User must be creator, member, or system Admin
        const isCreator = project.createdBy.toString() === userId;
        const isMember = project.members.some((m) => m.toString() === userId);
        const isAdmin = user.role === 'Admin';

        if (!isCreator && !isMember && !isAdmin) {
          socket.emit('socket:error', {
            message: 'Forbidden: You are not a member of this project.',
            code: 'FORBIDDEN_PROJECT_ACCESS',
          });
          return;
        }

        const roomName = `project_${projectId}`;
        socket.join(roomName);

        socket.emit('project:joined', { projectId, title: project.title });

        // Notify other peers in this project room that a member joined
        socket.to(roomName).emit('presence:member_joined', {
          projectId,
          user: {
            _id: user._id,
            name: user.name,
            avatar: user.avatar,
            role: user.role,
          },
        });

        console.log(`[Socket] ${user.name} joined room: ${roomName}`);
      } catch (err) {
        console.error('[Socket] Error in project:join:', err);
        socket.emit('socket:error', { message: 'Failed to join project room.' });
      }
    });

    socket.on('project:leave', (data: { projectId: string }) => {
      const { projectId } = data;
      if (projectId) {
        const roomName = `project_${projectId}`;
        socket.leave(roomName);

        socket.to(roomName).emit('presence:member_left', {
          projectId,
          userId: user._id,
          name: user.name,
        });

        console.log(`[Socket] ${user.name} left room: ${roomName}`);
      }
    });

    // ==========================================
    // 4. TASK REAL-TIME SYNCHRONIZATION
    // ==========================================

    // Live Kanban card position & status shift
    socket.on(
      'task:moved',
      (data: {
        projectId: string;
        taskId: string;
        newStatus: string;
        orderIndex: number;
      }) => {
        const { projectId, taskId, newStatus, orderIndex } = data;
        const roomName = `project_${projectId}`;

        // Broadcast to all other peers in the project room with 0ms visual delay
        socket.to(roomName).emit('task:moved', {
          taskId,
          projectId,
          newStatus,
          orderIndex,
          movedBy: {
            _id: user._id,
            name: user.name,
            avatar: user.avatar,
          },
        });
      }
    );

    // Relay task creations, edits, and deletions
    socket.on('task:created', (data: { projectId: string; task: any }) => {
      socket.to(`project_${data.projectId}`).emit('task:created', data.task);
    });

    socket.on('task:updated', (data: { projectId: string; taskId: string; updates: any }) => {
      socket.to(`project_${data.projectId}`).emit('task:updated', data);
    });

    socket.on('task:deleted', (data: { projectId: string; taskId: string }) => {
      socket.to(`project_${data.projectId}`).emit('task:deleted', {
        projectId: data.projectId,
        taskId: data.taskId,
      });
    });

    // ==========================================
    // 5. COLLABORATIVE NOTES & TYPING INDICATORS
    // ==========================================

    // "User is editing" note indicator
    socket.on(
      'note:editing',
      (data: {
        projectId: string;
        noteId: string;
        isEditing: boolean;
      }) => {
        const roomName = `project_${data.projectId}`;
        socket.to(roomName).emit('note:editing', {
          noteId: data.noteId,
          projectId: data.projectId,
          isEditing: data.isEditing,
          user: {
            _id: user._id,
            name: user.name,
            avatar: user.avatar,
          },
        });
      }
    );

    // Live note content updates / delta patches
    socket.on(
      'note:updated',
      (data: {
        projectId: string;
        noteId: string;
        content: string;
        title?: string;
        version: number;
      }) => {
        const roomName = `project_${data.projectId}`;
        socket.to(roomName).emit('note:updated', {
          ...data,
          updatedBy: {
            _id: user._id,
            name: user.name,
          },
        });
      }
    );

    // ==========================================
    // 6. LIVE KANBAN BOARD PRESENCE & CURSORS
    // ==========================================

    socket.on(
      'kanban:cursor',
      (data: {
        projectId: string;
        x: number;
        y: number;
        column?: string;
        activeCardId?: string;
      }) => {
        const roomName = `project_${data.projectId}`;
        socket.to(roomName).emit('kanban:cursor', {
          ...data,
          user: {
            _id: user._id,
            name: user.name,
            avatar: user.avatar,
          },
        });
      }
    );

    // ==========================================
    // 7. REAL-TIME CHAT & PERSISTENCE
    // ==========================================

    socket.on('user:typing', (data: { projectId: string; isTyping: boolean }) => {
      socket.to(`project_${data.projectId}`).emit('user:typing', {
        projectId: data.projectId,
        isTyping: data.isTyping,
        user: {
          _id: user._id,
          name: user.name,
        },
      });
    });

    socket.on(
      'chat:message',
      async (data: { projectId: string; text: string; attachments?: string[] }) => {
        try {
          const { projectId, text, attachments = [] } = data;
          if (!projectId || !text || text.trim() === '') return;

          // 1. Persist chat message directly to MongoDB
          const messageDoc = await Message.create({
            projectId: new mongoose.Types.ObjectId(projectId),
            senderId: new mongoose.Types.ObjectId(userId),
            text: text.trim(),
            attachments,
            createdAt: new Date(),
          });

          // 2. Populate sender details for immediate display
          const populatedMessage = await Message.findById(messageDoc._id).populate(
            'senderId',
            'name email avatar department'
          );

          // 3. Broadcast to all members in the project room (including sender)
          io!.to(`project_${projectId}`).emit('chat:message', populatedMessage);
        } catch (err) {
          console.error('[Socket] Error saving chat message:', err);
          socket.emit('socket:error', { message: 'Could not send chat message.' });
        }
      }
    );

    // ==========================================
    // 8. DISCONNECTION & CLEANUP
    // ==========================================

    socket.on('disconnect', async () => {
      console.log(`[Socket] User disconnected: ${user.name} [Socket ID: ${socket.id}]`);

      const userSockets = userSocketMap.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);

        // If user has no more open tabs/connections, mark offline
        if (userSockets.size === 0) {
          userSocketMap.delete(userId);

          try {
            const now = new Date();
            await User.findByIdAndUpdate(userId, {
              isOnline: false,
              lastActiveAt: now,
            });

            // Broadcast offline status globally
            io!.emit('presence:online', {
              userId,
              name: user.name,
              isOnline: false,
              lastActiveAt: now,
            });
          } catch (err) {
            console.error('[Socket] Error setting user offline:', err);
          }
        }
      }
    });
  });

  return io;
};

/**
 * Access the initialized Socket.IO instance anywhere in Express controllers
 */
export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.IO has not been initialized yet. Call initSocketServer first.');
  }
  return io;
};

/**
 * Send real-time notification: Persists to MongoDB and emits to the recipient's personal room
 */
export const sendNotification = async (params: {
  recipientId: string;
  senderId?: string;
  title: string;
  message: string;
  link?: string;
}): Promise<void> => {
  try {
    const notification = await Notification.create({
      recipientId: new mongoose.Types.ObjectId(params.recipientId),
      senderId: params.senderId ? new mongoose.Types.ObjectId(params.senderId) : undefined,
      title: params.title,
      message: params.message,
      link: params.link || '',
      isRead: false,
      createdAt: new Date(),
    });

    const populated = await Notification.findById(notification._id).populate(
      'senderId',
      'name avatar'
    );

    if (io) {
      io.to(`user_${params.recipientId}`).emit('notification:new', populated);
    }
  } catch (error) {
    console.error('[Socket] Error sending real-time notification:', error);
  }
};

/**
 * Real-time Activity broadcast: pushes audit log event to project members and admin room
 */
export const broadcastRealtimeActivity = (activity: any): void => {
  if (!io) return;

  // Broadcast to Admins
  io.to('admin_room').emit('activity:logged', activity);

  // Broadcast to Project members if project-scoped
  if (activity.projectId) {
    io.to(`project_${activity.projectId}`).emit('activity:logged', activity);
  }
};
