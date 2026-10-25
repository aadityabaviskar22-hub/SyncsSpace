import { Router } from 'express';
import { body, param } from 'express-validator';
import * as userController from '../controllers/user.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

// All user routes require authentication
router.use(authenticateToken);

// List users: accessible by Admin & Manager (e.g. for assigning team members)
router.get('/', authorizeRoles('Admin', 'Manager', 'Member'), userController.getAllUsers);

// Get single user by ID
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid User ID format'), validate],
  userController.getUserById
);

// Update user profile (self or Admin)
router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid User ID format'),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('department').optional().trim(),
    validate,
  ],
  userController.updateUser
);

// Admin-only: Change user role (promote/demote)
router.patch(
  '/:id/role',
  authorizeRoles('Admin'),
  [
    param('id').isMongoId().withMessage('Invalid User ID format'),
    body('role').isIn(['Admin', 'Manager', 'Member']).withMessage('Role must be Admin, Manager, or Member'),
    validate,
  ],
  userController.updateUserRole
);

// Admin-only: Delete user
router.delete(
  '/:id',
  authorizeRoles('Admin'),
  [param('id').isMongoId().withMessage('Invalid User ID format'), validate],
  userController.deleteUser
);

export default router;
