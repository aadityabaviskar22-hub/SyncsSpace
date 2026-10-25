import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type TaskStatus = 'Todo' | 'InProgress' | 'InReview' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface ITaskAttachment {
  filename: string;
  originalName: string;
  path: string;
  mimetype: string;
  size: number;
  uploadedAt: Date;
}

export interface ITask extends Document {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  orderIndex: number;
  projectId: Types.ObjectId;
  assignedTo?: Types.ObjectId;
  createdBy: Types.ObjectId;
  dueDate?: Date;
  completedAt?: Date;
  tags: string[];
  attachments: ITaskAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

const TaskAttachmentSchema = new Schema<ITaskAttachment>(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    path: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const TaskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: [true, 'Please provide a task title'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['Todo', 'InProgress', 'InReview', 'Done'],
      default: 'Todo',
      index: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    orderIndex: {
      type: Number,
      default: 0,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Parent project ID is required'],
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Task creator is required'],
    },
    dueDate: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    tags: {
      type: [String],
      default: [],
    },
    attachments: {
      type: [TaskAttachmentSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Composite indexes for fast Kanban sorting & status queries
TaskSchema.index({ projectId: 1, status: 1, orderIndex: 1 });
TaskSchema.index({ assignedTo: 1, status: 1 });
TaskSchema.index({ completedAt: 1 });

// Automatically handle completedAt timestamp when status changes
TaskSchema.pre('save', function () {
  if (this.isModified('status')) {
    if (this.status === 'Done' && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status !== 'Done') {
      this.completedAt = undefined;
    }
  }
});

export const Task: Model<ITask> = mongoose.model<ITask>('Task', TaskSchema);
export default Task;
