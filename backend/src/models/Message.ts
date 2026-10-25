import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IMessage extends Document {
  projectId: Types.ObjectId;
  senderId: Types.ObjectId;
  text: string;
  attachments: string[];
  isSystemMessage: boolean;
  readBy: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender ID is required'],
      index: true,
    },
    text: {
      type: String,
      required: [true, 'Message text is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    attachments: {
      type: [String],
      default: [],
    },
    isSystemMessage: {
      type: Boolean,
      default: false,
    },
    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

MessageSchema.index({ projectId: 1, createdAt: -1 });

export const Message: Model<IMessage> = mongoose.model<IMessage>('Message', MessageSchema);
export default Message;
