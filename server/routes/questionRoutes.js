import express from 'express';
import { query } from 'express-validator';
import { getQuestions } from '../controllers/questionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/errorMiddleware.js';

const router = express.Router();

router.get(
  '/',
  protect,
  [
    query('type').optional().isIn(['HR', 'Technical', 'Behavioural', 'Mixed']),
    query('difficulty').optional().isIn(['Easy', 'Medium', 'Hard']),
    query('limit').optional().isInt({ min: 1, max: 30 })
  ],
  validate,
  getQuestions
);

export default router;
