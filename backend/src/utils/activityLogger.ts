import { Activity, ActivityActionType, ActivityEntityType } from '../models/Activity.js';
import mongoose from 'mongoose';
import { broadcastRealtimeActivity } from '../sockets/socketServer.js';

interface LogActivityParams {
  actorId: mongoose.Types.ObjectId | string;
  actionType: ActivityActionType;
  entityType: ActivityEntityType;
  entityId: mongoose.Types.ObjectId | string;
  projectId?: mongoose.Types.ObjectId | string;
  metadata?: Record<string, any>;
}

export const logActivity = async (params: LogActivityParams): Promise<void> => {
  try {
    const activityDoc = await Activity.create({
      actorId: new mongoose.Types.ObjectId(params.actorId),
      actionType: params.actionType,
      entityType: params.entityType,
      entityId: new mongoose.Types.ObjectId(params.entityId),
      projectId: params.projectId ? new mongoose.Types.ObjectId(params.projectId) : undefined,
      metadata: params.metadata || {},
      createdAt: new Date(),
    });

    // Populate actor details for client consumption
    const populatedActivity = await Activity.findById(activityDoc._id).populate(
      'actorId',
      'name email avatar department'
    );

    // Broadcast in real-time across Socket.IO rooms
    broadcastRealtimeActivity(populatedActivity);
  } catch (error) {
    console.error('[ActivityLogger] Error logging activity:', error);
  }
};
