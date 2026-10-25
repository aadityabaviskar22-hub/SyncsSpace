import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface INote extends Document {
  title: string;
  content: string;
  projectId: Types.ObjectId;
  authorId: Types.ObjectId;
  lastModifiedBy?: Types.ObjectId;
  isPinned: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>(
  {
    title: {
      type: String,
      required: [true, 'Please provide note title'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      default: '',
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project association is required'],
      index: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
      index: true,
    },
    lastModifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

NoteSchema.index({ projectId: 1, isPinned: -1, updatedAt: -1 });

export const Note: Model<INote> = mongoose.model<INote>('Note', NoteSchema);
export default Note;
