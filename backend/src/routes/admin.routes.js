import { Router } from 'express';
import { approveDoctor, createAdministrator, getAdminSummary, listUsers } from '../controllers/admin.controller.js';
import { allowRoles, requireAuth } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();
router.use(requireAuth, allowRoles('admin'));
router.get('/summary', asyncHandler(getAdminSummary));
router.get('/users', asyncHandler(listUsers));
router.post('/administrators', asyncHandler(createAdministrator));
router.patch('/doctors/:id/approve', asyncHandler(approveDoctor));
export default router;
