import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/auth.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

// Registration route with input validation
router.post(
  '/register',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ max: 100 })
      .withMessage('Name must not exceed 100 characters'),
    body('email')
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('department')
      .optional()
      .trim()
      .isLength({ max: 50 }),
    body('role')
      .optional()
      .isIn(['Admin', 'Manager', 'Member'])
      .withMessage('Role must be Admin, Manager, or Member'),
    validate,
  ],
  authController.register
);

// Login route with input validation
router.post(
  '/login',
  [
    body('email')
      .trim()
      .isEmail()
      .withMessage('Valid email is required')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    validate,
  ],
  authController.login
);

// Token Refresh route
router.post(
  '/refresh',
  [
    body('refreshToken')
      .notEmpty()
      .withMessage('Refresh token is required'),
    validate,
  ],
  authController.refreshToken
);

// Logout route
router.post('/logout', authenticateToken, authController.logout);

// Current User Profile route
router.get('/me', authenticateToken, authController.getMe);

export default router;
