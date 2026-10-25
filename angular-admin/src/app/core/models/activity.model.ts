import { User } from './user.model.js';
import { Project } from './project.model.js';

export interface Activity {
  _id: string;
  actorId: User;
  actionType: string;
  entityType: string;
  entityId: string;
  projectId?: Project;
  metadata?: Record<string, any>;
  createdAt: string | Date;
}

export interface ActivityListResponse {
  success: boolean;
  data: Activity[];
}
