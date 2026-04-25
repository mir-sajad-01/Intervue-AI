import express from 'express';
import { body, param, query } from 'express-validator';
import {
  endSession,
  getDashboardStats,
  getSessionById,
  getSessions,
  startSession,
  submitAnswer
} from '../controllers/sessionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/errorMiddleware.js';

const router = express.Router();

router.use(protect);

router.post(
  '/start',
  [
    body('type').isIn(['HR', 'Technical', 'Behavioural', 'Mixed', 'Custom']),
    body('difficulty').isIn(['Easy', 'Medium', 'Hard']),
    body('totalQuestions').isInt({ min: 1, max: 30 }).withMessage('Question count must be between 1 and 30'),
    body('topic')
      .if(body('type').equals('Custom'))
      .trim()
      .isLength({ min: 2, max: 120 })
      .withMessage('Custom topic must be between 2 and 120 characters')
  ],
  validate,
  startSession
);

router.post(
  '/:id/answer',
  [
    param('id').isMongoId(),
    body('questionId').isMongoId(),
    body('transcript').isString().trim().isLength({ min: 1 }).withMessage('Transcript is required')
  ],
  validate,
  submitAnswer
);

router.post('/:id/end', [param('id').isMongoId(), body('duration').optional().isNumeric()], validate, endSession);

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('type').optional({ checkFalsy: true }).isIn(['HR', 'Technical', 'Behavioural', 'Mixed', 'Custom']),
    query('difficulty').optional({ checkFalsy: true }).isIn(['Easy', 'Medium', 'Hard']),
    query('sortBy').optional().isIn(['date', 'score']),
    query('order').optional().isIn(['asc', 'desc'])
  ],
  validate,
  getSessions
);

router.get('/:id', [param('id').isMongoId()], validate, getSessionById);

export const dashboardStatsHandler = [protect, getDashboardStats];
export default router;
