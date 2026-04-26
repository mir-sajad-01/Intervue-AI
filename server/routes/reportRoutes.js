import express from 'express';
import { query } from 'express-validator';
import { getReportSummary } from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/errorMiddleware.js';

const router = express.Router();

router.use(protect);

router.get(
  '/summary',
  [
    query('from').optional().isISO8601().withMessage('from must be a valid ISO date'),
    query('to').optional().isISO8601().withMessage('to must be a valid ISO date'),
    query('type').optional({ checkFalsy: true }).isIn(['HR', 'Technical', 'Behavioural', 'Mixed', 'Custom']),
    query('difficulty').optional({ checkFalsy: true }).isIn(['Easy', 'Medium', 'Hard'])
  ],
  validate,
  getReportSummary
);

export default router;
