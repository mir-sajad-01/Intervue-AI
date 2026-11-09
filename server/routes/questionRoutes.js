import express from 'express';
import { query } from 'express-validator';
import { getQuestions } from '../controllers/questionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/errorMiddleware.js';
import { questionGenerationLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.get(
  '/',
  protect,
  questionGenerationLimiter,
  [
    query('type').optional().isIn(['HR', 'Technical', 'Behavioural', 'Mixed', 'Custom']).withMessage('Choose a valid interview type.'),
    query('difficulty').optional().isIn(['Easy', 'Medium', 'Hard']).withMessage('Choose a valid difficulty level.'),
    query('limit').optional().isInt({ min: 1, max: 30 }).withMessage('Question count must be between 1 and 30.'),
    query('topic')
      .if((_, { req }) => req.query.type === 'Custom')
      .trim()
      .isLength({ min: 2, max: 120 })
      .withMessage('Describe your interview focus in 2–120 characters.')
  ],
  validate,
  getQuestions
);

export default router;
