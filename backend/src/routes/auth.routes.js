import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { changePassword, getCurrentUser, googleLogin, login, logout, register } from '../controllers/auth.controller.js';
import { sendRegistrationOtp, verifyRegistrationOtp } from '../controllers/otp.controller.js';
import { requestPasswordReset, resetPassword } from '../controllers/password-reset.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again later.' },
});

router.post('/register', authLimiter, asyncHandler(register));
router.post('/login', authLimiter, asyncHandler(login));
router.post('/google', authLimiter, asyncHandler(googleLogin));
router.post('/otp/send', authLimiter, asyncHandler(sendRegistrationOtp));
router.post('/otp/verify', authLimiter, asyncHandler(verifyRegistrationOtp));
router.post('/password/forgot', authLimiter, asyncHandler(requestPasswordReset));
router.post('/password/reset', authLimiter, asyncHandler(resetPassword));
router.post('/logout', logout);
router.get('/me', requireAuth, getCurrentUser);
router.patch('/password', requireAuth, asyncHandler(changePassword));

export default router;
