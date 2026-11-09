import rateLimit from 'express-rate-limit';
import { sendApiError } from './errorMiddleware.js';

const rateLimitHandler = (req, res) => sendApiError(res, {
  statusCode: 429,
  code: 'RATE_LIMITED',
  message: 'Too many requests. Please wait a moment and try again.',
  requestId: req.requestId
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

export const questionGenerationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});
