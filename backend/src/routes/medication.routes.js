import { Router } from 'express';
import { createMedication, deleteMedication, listMyMedications, markDose, updateMedication } from '../controllers/medication.controller.js';
import { allowRoles, requireAuth } from '../middleware/auth.middleware.js';

const router = Router();
router.use(requireAuth, allowRoles('patient'));
router.get('/', listMyMedications);
router.post('/', createMedication);
router.put('/:id', updateMedication);
router.delete('/:id', deleteMedication);
router.patch('/:id/doses', markDose);

export default router;
