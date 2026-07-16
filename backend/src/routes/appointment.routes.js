import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { createAppointmentPayment, listAppointments, requestAppointment, verifyAppointmentOtp, verifyAppointmentPayment } from '../controllers/appointment.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false });
router.post('/request', limiter, asyncHandler(requestAppointment));
router.post('/:id/otp/verify', limiter, asyncHandler(verifyAppointmentOtp));
router.post('/:id/payment/order', limiter, asyncHandler(createAppointmentPayment));
router.post('/:id/payment/verify', limiter, asyncHandler(verifyAppointmentPayment));
router.get('/', requireAuth, asyncHandler(listAppointments));
export default router;
