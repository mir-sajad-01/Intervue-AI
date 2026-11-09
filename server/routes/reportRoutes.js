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
    query('to')
      .optional()
      .isISO8601().withMessage('to must be a valid ISO date')
      .bail()
      .custom((to, { req }) => !req.query.from || new Date(to) >= new Date(req.query.from))
      .withMessage('to must be on or after from'),
    query('type').optional({ checkFalsy: true }).isIn(['HR', 'Technical', 'Behavioural', 'Mixed', 'Custom']).withMessage('Choose a valid interview type.'),
    query('difficulty').optional({ checkFalsy: true }).isIn(['Easy', 'Medium', 'Hard']).withMessage('Choose a valid difficulty level.')
  ],
  validate,
  getReportSummary
);

export default router;
