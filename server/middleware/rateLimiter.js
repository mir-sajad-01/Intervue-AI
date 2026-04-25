import rateLimit from 'express-rate-limit';

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many AI requests, please slow down.' }
});
