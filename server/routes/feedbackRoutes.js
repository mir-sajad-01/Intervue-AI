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
  [body('transcript').trim().isLength({ min: 1 }), body('question').trim().isLength({ min: 1 })],
  validate,
  evaluateFeedback
);

export default router;
