import { Router } from 'express';
import { body, param } from 'express-validator';
import * as noteController from '../controllers/note.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

router.use(authenticateToken);

// 1. Get notes by project
router.get(
  '/projects/:projectId/notes',
  [param('projectId').isMongoId().withMessage('Invalid Project ID'), validate],
  noteController.getNotesByProject
);

// 2. Create note in project
router.post(
  '/projects/:projectId/notes',
  [
    param('projectId').isMongoId().withMessage('Invalid Project ID'),
    body('title').trim().notEmpty().withMessage('Note title is required'),
    validate,
  ],
  noteController.createNote
);

// 3. Get single note by ID
router.get(
  '/notes/:id',
  [param('id').isMongoId().withMessage('Invalid Note ID'), validate],
  noteController.getNoteById
);

// 4. Update note content & optimistic version check
router.put(
  '/notes/:id',
  [
    param('id').isMongoId().withMessage('Invalid Note ID'),
    body('title').optional().trim().notEmpty(),
    body('version').optional().isNumeric(),
    validate,
  ],
  noteController.updateNote
);

// 5. Delete note
router.delete(
  '/notes/:id',
  [param('id').isMongoId().withMessage('Invalid Note ID'), validate],
  noteController.deleteNote
);

export default router;
