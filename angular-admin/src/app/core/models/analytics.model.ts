import { Activity } from './activity.model.js';

export interface TasksWeeklyStat {
  year: number;
  week: number;
  label: string;
  completedCount: number;
}

export interface UserWorkload {
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  department?: string;
  totalTasks: number;
  todo: number;
  inProgress: number;
  inReview: number;
  done: number;
  completionPercentage: number;
}

export interface TaskStatusStat {
  status: string;
  count: number;
  percentage: number;
}

export interface OverviewAnalytics {
  users: {
    total: number;
    online: number;
  };
  projects: {
    total: number;
    active: number;
  };
  tasks: {
    total: number;
    completed: number;
    completionRate: number;
  };
  recentActivities: Activity[];
}
