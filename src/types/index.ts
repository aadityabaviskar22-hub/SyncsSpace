export type UserRole = 'Admin' | 'Manager' | 'Member';

export interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  isOnline?: boolean;
  lastActiveAt?: string | Date;
}

export type TaskStatus = 'Todo' | 'InProgress' | 'InReview' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface TaskAttachment {
  _id?: string;
  filename: string;
  originalName: string;
  path?: string;
  mimetype: string;
  size: number;
  uploadedAt: string | Date;
}

export interface TaskComment {
  _id: string;
  user: User;
  text: string;
  createdAt: string | Date;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  orderIndex: number;
  projectId: string;
  assignedTo?: User;
  createdBy: User;
  dueDate?: string | Date;
  completedAt?: string | Date;
  tags: string[];
  attachments: TaskAttachment[];
  comments?: TaskComment[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Note {
  _id: string;
  title: string;
  content: string;
  projectId: string;
  authorId: User;
  lastModifiedBy?: User;
  isPinned: boolean;
  version: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Message {
  _id: string;
  projectId: string;
  senderId: User;
  text: string;
  attachments?: string[];
  isSystemMessage?: boolean;
  readBy?: string[];
  createdAt: string | Date;
}

export interface NotificationItem {
  _id: string;
  recipientId: string;
  senderId?: User;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string | Date;
}

export interface Project {
  _id: string;
  title: string;
  description?: string;
  status: 'Planning' | 'Active' | 'On-Hold' | 'Completed';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  createdBy: User;
  members: User[];
  startDate?: string | Date;
  dueDate?: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
}
