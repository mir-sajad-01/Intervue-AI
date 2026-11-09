import jwt from 'jsonwebtoken';
import { createHash, timingSafeEqual } from 'node:crypto';
import User from '../models/User.js';
import Session from '../models/Session.js';
import SessionSnapshot from '../models/SessionSnapshot.js';
import { signAccessToken, signRefreshToken } from '../middleware/authMiddleware.js';
import { sendApiError } from '../middleware/errorMiddleware.js';

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_REFRESH_SESSIONS = 5;
const REFRESH_COOKIE_NAME = 'intervue_refresh';

const hashToken = (token) => createHash('sha256').update(token).digest('hex');

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/api/auth'
});

const setRefreshCookie = (res, token) => {
  res.cookie(REFRESH_COOKIE_NAME, token, { ...cookieOptions(), maxAge: REFRESH_TOKEN_TTL_MS });
};

const clearRefreshCookie = (res) => res.clearCookie(REFRESH_COOKIE_NAME, cookieOptions());

const safeTokenMatch = (left, right) => {
  if (typeof left !== 'string' || typeof right !== 'string' || left.length !== right.length) return false;
  return timingSafeEqual(Buffer.from(left), Buffer.from(right));
};

const tokenPayload = async (user, res) => {
  const accessToken = signAccessToken(user._id, user.authVersion || 0);
  const refreshToken = signRefreshToken(user._id);
  user.refreshTokens = user.refreshTokens.filter((session) => new Date(session.expiresAt) > new Date());
  user.refreshTokens.push({ tokenHash: hashToken(refreshToken), expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS) });
  user.refreshTokens = user.refreshTokens.slice(-MAX_REFRESH_SESSIONS);
  user.refreshToken = null;
  await user.save();
  setRefreshCookie(res, refreshToken);
  return {
    user: { id: user._id, name: user.name, email: user.email, createdAt: user.createdAt },
    accessToken
  };
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return sendApiError(res, {
      statusCode: 409,
      code: 'EMAIL_ALREADY_REGISTERED',
      message: 'An account with this email already exists.',
      requestId: req.requestId,
      fieldErrors: { email: 'This email is already registered.' }
    });

    const user = await User.create({ name, email, password });
    console.log(`Registered account ${user._id}`);
    res.status(201).json(await tokenPayload(user, res));
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+authVersion');
    if (!user || !(await user.matchPassword(password))) {
      return sendApiError(res, {
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'The email or password is incorrect.',
        requestId: req.requestId
      });
    }

    console.log(`User logged in ${user._id}`);
    res.json(await tokenPayload(user, res));
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
    if (!refreshToken) return sendApiError(res, {
      statusCode: 401,
      code: 'REFRESH_TOKEN_REQUIRED',
      message: 'Your session has expired. Please sign in again.',
      requestId: req.requestId
    });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, { algorithms: ['HS256'] });
    const user = await User.findById(decoded.id).select('+refreshToken +authVersion');
    const tokenHash = hashToken(refreshToken);
    const sessionIndex = user?.refreshTokens.findIndex((session) => safeTokenMatch(session.tokenHash, tokenHash)) ?? -1;
    const previousSession = user?.refreshTokens.find((session) =>
      session.previousTokenHash && safeTokenMatch(session.previousTokenHash, tokenHash)
    );
    const isGraceRefresh = Boolean(
      previousSession && Date.now() - new Date(previousSession.rotatedAt).getTime() < 30_000
    );
    const isLegacyToken = Boolean(user?.refreshToken && safeTokenMatch(user.refreshToken, refreshToken));

    if (!user || (sessionIndex < 0 && !isGraceRefresh && !isLegacyToken)) {
      clearRefreshCookie(res);
      return sendApiError(res, {
        statusCode: 401,
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Your session has expired. Please sign in again.',
        requestId: req.requestId
      });
    }

    if (isGraceRefresh) {
      return res.json({ accessToken: signAccessToken(user._id, user.authVersion || 0) });
    }

    const nextRefreshToken = signRefreshToken(user._id);
    const nextSession = {
      tokenHash: hashToken(nextRefreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      previousTokenHash: tokenHash,
      rotatedAt: new Date()
    };
    user.refreshTokens = user.refreshTokens.filter((session) => new Date(session.expiresAt) > new Date());
    const liveSessionIndex = sessionIndex >= 0
      ? user.refreshTokens.findIndex((session) => safeTokenMatch(session.tokenHash, tokenHash))
      : -1;
    if (liveSessionIndex >= 0) {
      const [currentSession] = user.refreshTokens.splice(liveSessionIndex, 1);
      if (currentSession) user.refreshTokens.push(nextSession);
    } else {
      user.refreshTokens.push(nextSession);
    }
    user.refreshTokens = user.refreshTokens.slice(-MAX_REFRESH_SESSIONS);
    user.refreshToken = null;
    await user.save();

    setRefreshCookie(res, nextRefreshToken);
    res.json({ accessToken: signAccessToken(user._id, user.authVersion || 0) });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      clearRefreshCookie(res);
      return sendApiError(res, {
        statusCode: 401,
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Your session has expired. Please sign in again.',
        requestId: req.requestId
      });
    }
    return next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await User.updateOne(
        { 'refreshTokens.tokenHash': tokenHash },
        { $pull: { refreshTokens: { tokenHash } } }
      );
      await User.updateOne(
        { 'refreshTokens.previousTokenHash': tokenHash },
        { $pull: { refreshTokens: { previousTokenHash: tokenHash } } }
      );
      await User.updateOne({ refreshToken }, { $set: { refreshToken: null } });
    }
    clearRefreshCookie(res);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const totalSessions = await Session.countDocuments({ userId: req.user._id, status: 'completed' });
    const avg = await Session.aggregate([
      { $match: { userId: req.user._id, status: 'completed' } },
      { $group: { _id: null, averageScore: { $avg: '$finalScore' } } }
    ]);
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        createdAt: req.user.createdAt
      },
      stats: { totalSessions, averageScore: Math.round(avg[0]?.averageScore || 0) }
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const emailOwner = await User.findOne({ email, _id: { $ne: req.user._id } });
    if (emailOwner) return sendApiError(res, {
      statusCode: 409,
      code: 'EMAIL_ALREADY_IN_USE',
      message: 'Another account already uses this email address.',
      requestId: req.requestId,
      fieldErrors: { email: 'This email is already in use.' }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, email },
      { new: true, runValidators: true }
    ).select('-password -refreshToken -refreshTokens -authVersion');

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+authVersion');
    if (!(await user.matchPassword(oldPassword))) {
      return sendApiError(res, {
        statusCode: 400,
        code: 'CURRENT_PASSWORD_INVALID',
        message: 'The current password is incorrect.',
        requestId: req.requestId,
        fieldErrors: { oldPassword: 'The current password is incorrect.' }
      });
    }
    if (await user.matchPassword(newPassword)) {
      return sendApiError(res, {
        statusCode: 400,
        code: 'PASSWORD_UNCHANGED',
        message: 'Choose a password different from your current one.',
        requestId: req.requestId,
        fieldErrors: { newPassword: 'Choose a password different from your current one.' }
      });
    }
    user.password = newPassword;
    user.authVersion = (user.authVersion || 0) + 1;
    user.refreshTokens = [];
    user.refreshToken = null;
    await user.save();
    clearRefreshCookie(res);
    res.json({ message: 'Password updated. Please sign in again.' });
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req, res, next) => {
  try {
    const sessions = await Session.find({ userId: req.user._id }).select('_id');
    await SessionSnapshot.deleteMany({ sessionId: { $in: sessions.map((session) => session._id) } });
    await Session.deleteMany({ userId: req.user._id });
    await User.findByIdAndDelete(req.user._id);
    clearRefreshCookie(res);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
};
