import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';

const router = Router();

router.use(authenticateToken);

// 1. Tasks completed per week
router.get('/tasks-completed-per-week', analyticsController.getTasksCompletedPerWeek);

// 2. Workload per user (Managers & Admins)
router.get('/workload-per-user', authorizeRoles('Manager', 'Admin'), analyticsController.getWorkloadPerUser);

// 3. Tasks distribution by status
router.get('/tasks-by-status', analyticsController.getTasksByStatus);

// 4. System-wide overview analytics for Angular Admin Dashboard
router.get('/overview', authorizeRoles('Admin'), analyticsController.getOverviewAnalytics);

export default router;
