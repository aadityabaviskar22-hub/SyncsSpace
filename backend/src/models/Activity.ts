import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type ActivityActionType =
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_DELETED'
  | 'NOTE_CREATED'
  | 'NOTE_UPDATED'
  | 'NOTE_DELETED'
  | 'PROJECT_CREATED'
  | 'PROJECT_UPDATED'
  | 'PROJECT_DELETED'
  | 'USER_REGISTER'
  | 'USER_ROLE_CHANGED'
  | 'USER_DELETED';

export type ActivityEntityType = 'Task' | 'Note' | 'Project' | 'User' | 'Message';

export interface IActivity extends Document {
  actorId: Types.ObjectId;
  actionType: ActivityActionType;
  entityType: ActivityEntityType;
  entityId: Types.ObjectId;
  projectId?: Types.ObjectId;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    actionType: {
      type: String,
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: ['Task', 'Note', 'Project', 'User', 'Message'],
      required: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

ActivitySchema.index({ createdAt: -1 });
ActivitySchema.index({ projectId: 1, createdAt: -1 });

export const Activity: Model<IActivity> = mongoose.model<IActivity>('Activity', ActivitySchema);
export default Activity;
