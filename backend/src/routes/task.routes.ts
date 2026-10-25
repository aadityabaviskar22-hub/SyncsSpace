import { Router } from 'express';
import { body, param } from 'express-validator';
import * as taskController from '../controllers/task.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { uploadTaskAttachments } from '../middlewares/upload.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

router.use(authenticateToken);

// 1. Get all tasks for a specific project
router.get(
  '/projects/:projectId/tasks',
  [param('projectId').isMongoId().withMessage('Invalid Project ID'), validate],
  taskController.getTasksByProject
);

// 2. Create task with optional file attachment uploads using multer
router.post(
  '/projects/:projectId/tasks',
  uploadTaskAttachments.array('attachments', 5),
  [
    param('projectId').isMongoId().withMessage('Invalid Project ID'),
    body('title').trim().notEmpty().withMessage('Task title is required'),
    body('status').optional().isIn(['Todo', 'InProgress', 'InReview', 'Done']),
    body('priority').optional().isIn(['Low', 'Medium', 'High', 'Urgent']),
    body('assignedTo').optional().isMongoId().withMessage('Invalid assigned user ID'),
    validate,
  ],
  taskController.createTask
);

// 3. Get single task by ID
router.get(
  '/tasks/:id',
  [param('id').isMongoId().withMessage('Invalid Task ID'), validate],
  taskController.getTaskById
);

// 4. Update task details and optionally append new file attachments
router.put(
  '/tasks/:id',
  uploadTaskAttachments.array('attachments', 5),
  [
    param('id').isMongoId().withMessage('Invalid Task ID'),
    body('title').optional().trim().notEmpty(),
    body('status').optional().isIn(['Todo', 'InProgress', 'InReview', 'Done']),
    body('priority').optional().isIn(['Low', 'Medium', 'High', 'Urgent']),
    body('assignedTo').optional().isMongoId(),
    validate,
  ],
  taskController.updateTask
);

// 5. Kanban Status & Order Index transition (for real-time drag-and-drop)
router.patch(
  '/tasks/:id/status',
  [
    param('id').isMongoId().withMessage('Invalid Task ID'),
    body('status')
      .notEmpty()
      .withMessage('Status is required')
      .isIn(['Todo', 'InProgress', 'InReview', 'Done'])
      .withMessage('Status must be Todo, InProgress, InReview, or Done'),
    body('orderIndex').optional().isNumeric().withMessage('orderIndex must be a number'),
    validate,
  ],
  taskController.updateTaskStatus
);

// 6. Delete task
router.delete(
  '/tasks/:id',
  [param('id').isMongoId().withMessage('Invalid Task ID'), validate],
  taskController.deleteTask
);

export default router;
