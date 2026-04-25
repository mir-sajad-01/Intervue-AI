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
  [body('imageBase64').isString().notEmpty(), body('sessionId').optional().isMongoId()],
  validate,
  analyzeEmotionFrame
);

export default router;
