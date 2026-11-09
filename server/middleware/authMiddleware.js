import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import User from '../models/User.js';
import { sendApiError } from './errorMiddleware.js';

export const protect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return sendApiError(res, { statusCode: 401, code: 'UNAUTHENTICATED', message: 'Please sign in to continue.', requestId: req.requestId });
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    req.user = await User.findById(decoded.id).select('-password -refreshToken -refreshTokens +authVersion');

    if (!req.user) {
      return sendApiError(res, { statusCode: 401, code: 'UNAUTHENTICATED', message: 'Please sign in to continue.', requestId: req.requestId });
    }
    if ((decoded.version ?? 0) !== req.user.authVersion) {
      return sendApiError(res, { statusCode: 401, code: 'UNAUTHENTICATED', message: 'Your session has expired. Please sign in again.', requestId: req.requestId });
    }

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return sendApiError(res, { statusCode: 401, code: 'UNAUTHENTICATED', message: 'Your session has expired. Please sign in again.', requestId: req.requestId });
    }
    return next(error);
  }

  return next();
};

export const signAccessToken = (id, version = 0) =>
  jwt.sign({ id, version }, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '15m' });

export const signRefreshToken = (id) =>
  jwt.sign({ id, jti: randomUUID() }, process.env.JWT_REFRESH_SECRET, { algorithm: 'HS256', expiresIn: '7d' });
