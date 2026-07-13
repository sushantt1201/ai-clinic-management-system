import { Router } from 'express';
import { approveDoctor, getAdminSummary } from '../controllers/admin.controller.js';
import { allowRoles, requireAuth } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();
router.use(requireAuth, allowRoles('admin'));
router.get('/summary', asyncHandler(getAdminSummary));
router.patch('/doctors/:id/approve', asyncHandler(approveDoctor));
export default router;
