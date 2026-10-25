import { User } from './user.model.js';

export type ProjectStatus = 'Planning' | 'Active' | 'On-Hold' | 'Completed';
export type ProjectPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Project {
  _id: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  createdBy: User;
  members: User[];
  startDate?: string | Date;
  dueDate?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface ProjectListResponse {
  success: boolean;
  count: number;
  data: Project[];
}
