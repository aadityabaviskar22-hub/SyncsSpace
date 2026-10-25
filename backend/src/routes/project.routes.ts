import { Router } from 'express';
import { body, param } from 'express-validator';
import * as projectController from '../controllers/project.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

router.use(authenticateToken);

// List projects current user has access to (Admins see all)
router.get('/', projectController.getAllProjects);

// Get single project
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid Project ID format'), validate],
  projectController.getProjectById
);

// Create project: Managers and Admins only
router.post(
  '/',
  authorizeRoles('Manager', 'Admin'),
  [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Project title is required')
      .isLength({ max: 120 })
      .withMessage('Title cannot exceed 120 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 }),
    body('priority')
      .optional()
      .isIn(['Low', 'Medium', 'High', 'Critical'])
      .withMessage('Invalid priority value'),
    body('status')
      .optional()
      .isIn(['Planning', 'Active', 'On-Hold', 'Completed'])
      .withMessage('Invalid status value'),
    body('members')
      .optional()
      .isArray()
      .withMessage('Members must be an array of user IDs'),
    validate,
  ],
  projectController.createProject
);

// Update project: Managers and Admins
router.put(
  '/:id',
  authorizeRoles('Manager', 'Admin'),
  [
    param('id').isMongoId().withMessage('Invalid Project ID format'),
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('status').optional().isIn(['Planning', 'Active', 'On-Hold', 'Completed']),
    body('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical']),
    body('members').optional().isArray(),
    validate,
  ],
  projectController.updateProject
);

// Delete project: Managers and Admins
router.delete(
  '/:id',
  authorizeRoles('Manager', 'Admin'),
  [param('id').isMongoId().withMessage('Invalid Project ID format'), validate],
  projectController.deleteProject
);

export default router;
