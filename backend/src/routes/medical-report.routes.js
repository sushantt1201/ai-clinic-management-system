import { Router } from 'express';
import { createMedicalReport, deleteMyMedicalReport, importPrescriptionMedications, listMyReports, shareMedicalReport, summarizeMedicalReport } from '../controllers/medical-report.controller.js';
import { allowRoles, requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth, allowRoles('patient'));
router.get('/', listMyReports);
router.post('/', createMedicalReport);
router.post('/:id/summarize', summarizeMedicalReport);
router.patch('/:id/share', shareMedicalReport);
router.post('/:id/import-medications', importPrescriptionMedications);
router.delete('/:id', deleteMyMedicalReport);

export default router;
