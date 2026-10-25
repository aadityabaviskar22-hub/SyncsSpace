import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type ProjectStatus = 'Planning' | 'Active' | 'On-Hold' | 'Completed';
export type ProjectPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface IProject extends Document {
  title: string;
  description?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  createdBy: Types.ObjectId;
  members: Types.ObjectId[];
  startDate?: Date;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    title: {
      type: String,
      required: [true, 'Please provide a project title'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: ['Planning', 'Active', 'On-Hold', 'Completed'],
      default: 'Active',
      index: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Project creator is required'],
      index: true,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    startDate: {
      type: Date,
    },
    dueDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

ProjectSchema.index({ members: 1 });
ProjectSchema.index({ status: 1, createdBy: 1 });

export const Project: Model<IProject> = mongoose.model<IProject>('Project', ProjectSchema);
export default Project;
