import express from 'express';
import { body } from 'express-validator';
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

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  validate,
  register
);

router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  validate,
  login
);

router.post('/refresh', [body('refreshToken').notEmpty()], validate, refresh);
router.post('/logout', logout);

router.get('/profile', protect, getProfile);
router.put(
  '/profile',
  protect,
  [body('name').trim().isLength({ min: 2 }), body('email').isEmail().normalizeEmail()],
  validate,
  updateProfile
);
router.put(
  '/password',
  protect,
  [body('oldPassword').notEmpty(), body('newPassword').isLength({ min: 6 })],
  validate,
  changePassword
);
router.delete('/account', protect, deleteAccount);

export default router;
