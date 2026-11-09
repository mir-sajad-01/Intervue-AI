import express from 'express';
import { body } from 'express-validator';
import { evaluateFeedback } from '../controllers/feedbackController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/errorMiddleware.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post(
  '/evaluate',
  protect,
  aiLimiter,
  [
    body('transcript').isString().trim().isLength({ min: 1, max: 12000 }).withMessage('Add an answer between 1 and 12,000 characters.'),
    body('question').isString().trim().isLength({ min: 1, max: 1000 }).withMessage('A valid interview question is required.')
  ],
  validate,
  evaluateFeedback
);

export default router;
