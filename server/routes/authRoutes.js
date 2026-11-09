import express from 'express';
import {
  changePassword,
  deleteAccount,
  getProfile,
  login,
  logout,
  refresh,
  register,
  updateProfile
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/errorMiddleware.js';
import { requireTrustedBrowserOrigin } from '../middleware/originGuard.js';
import { authLimiter, refreshLimiter } from '../middleware/rateLimiter.js';
import {
  changePasswordRules,
  loginRules,
  profileRules,
  refreshRules,
  registerRules
} from '../validators/authValidators.js';

const router = express.Router();

router.post('/register', requireTrustedBrowserOrigin, authLimiter, registerRules, validate, register);
router.post('/login', requireTrustedBrowserOrigin, authLimiter, loginRules, validate, login);
router.post('/refresh', requireTrustedBrowserOrigin, refreshLimiter, refreshRules, validate, refresh);
router.post('/logout', requireTrustedBrowserOrigin, logout);

router.get('/profile', protect, getProfile);
router.put('/profile', protect, profileRules, validate, updateProfile);
router.put('/password', protect, changePasswordRules, validate, changePassword);
router.delete('/account', protect, deleteAccount);

export default router;
