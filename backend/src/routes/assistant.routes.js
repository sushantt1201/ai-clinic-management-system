import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { chatWithAssistant } from '../controllers/assistant.controller.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 40, standardHeaders: 'draft-8', legacyHeaders: false });
router.post('/chat', limiter, asyncHandler(chatWithAssistant));
export default router;
