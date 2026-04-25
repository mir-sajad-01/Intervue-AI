import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Session from '../models/Session.js';
import SessionSnapshot from '../models/SessionSnapshot.js';
import { signAccessToken, signRefreshToken } from '../middleware/authMiddleware.js';

const tokenPayload = async (user) => {
  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);
  user.refreshToken = refreshToken;
  await user.save();
  return {
    user: { id: user._id, name: user.name, email: user.email, createdAt: user.createdAt },
    accessToken,
    refreshToken
  };
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email is already registered' });

    const user = await User.create({ name, email, password });
    console.log(`Registered user ${email}`);
    res.status(201).json(await tokenPayload(user));
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log(`User logged in ${email}`);
    res.json(await tokenPayload(user));
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: 'Refresh token required' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: 'Refresh token invalid' });
    }

    res.json({ accessToken: signAccessToken(user._id) });
  } catch (error) {
    res.status(401).json({ message: 'Refresh token expired or invalid' });
  }
};

export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await User.findOneAndUpdate({ refreshToken }, { refreshToken: null });
    }
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
      user: req.user,
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
    if (emailOwner) return res.status(409).json({ message: 'Email is already in use' });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, email },
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!(await user.matchPassword(oldPassword))) {
      return res.status(400).json({ message: 'Old password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
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
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
};
