import express from 'express';
import { body } from 'express-validator';
import { analyzeEmotionFrame } from '../controllers/emotionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/errorMiddleware.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post(
  '/analyze',
  protect,
  aiLimiter,
  [
    body('imageBase64').isString().isLength({ min: 1, max: 5_500_000 }).withMessage('A valid camera frame is required.'),
    body('sessionId').optional().isMongoId().withMessage('This interview session ID is invalid.')
  ],
  validate,
  analyzeEmotionFrame
);

export default router;
