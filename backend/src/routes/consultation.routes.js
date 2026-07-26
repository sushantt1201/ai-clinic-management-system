import { Router } from 'express';
import { getConsultation, listDoctorConsultations, listMyConsultations, listPatientReportsForDoctor, saveConsultation } from '../controllers/consultation.controller.js';
import { allowRoles, requireAuth } from '../middleware/auth.middleware.js';

const router = Router();
router.use(requireAuth);
router.get('/mine', allowRoles('patient'), listMyConsultations);
router.get('/doctor', allowRoles('doctor'), listDoctorConsultations);
router.get('/patient-reports/:email', allowRoles('doctor'), listPatientReportsForDoctor);
router.get('/:bookingId', allowRoles('doctor'), getConsultation);
router.put('/:bookingId', allowRoles('doctor'), saveConsultation);
export default router;
