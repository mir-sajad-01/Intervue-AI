import express from 'express';
import {
  deleteSession,
  endSession,
  getDashboardStats,
  getSessionById,
  getSessions,
  startSession,
  submitAnswer
} from '../controllers/sessionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/errorMiddleware.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import {
  endSessionRules,
  sessionIdRules,
  sessionListRules,
  startSessionRules,
  submitAnswerRules
} from '../validators/sessionValidators.js';

const router = express.Router();

router.use(protect);

router.post('/start', aiLimiter, startSessionRules, validate, startSession);
router.post('/:id/answer', aiLimiter, submitAnswerRules, validate, submitAnswer);
router.post('/:id/end', endSessionRules, validate, endSession);
router.delete('/:id', sessionIdRules, validate, deleteSession);
router.get('/', sessionListRules, validate, getSessions);
router.get('/:id', sessionIdRules, validate, getSessionById);

export const dashboardStatsHandler = [protect, getDashboardStats];
export default router;
