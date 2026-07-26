import { Consultation } from '../models/consultation.model.js';
import { MedicalReport } from '../models/medical-report.model.js';
import { Medication } from '../models/medication.model.js';
import { User } from '../models/user.model.js';
import { AppError } from '../utils/app-error.js';
import { asyncHandler } from '../utils/async-handler.js';

const validTimes = new Set(['morning', 'afternoon', 'evening', 'night']);

function cleanPrescriptions(value) {
  if (!Array.isArray(value)) return [];
  return value.map(item => ({
    medicineName: String(item.medicineName || '').trim(),
    dosage: String(item.dosage || '').trim(),
    times: [...new Set(Array.isArray(item.times) ? item.times.filter(time => validTimes.has(time)) : [])],
    instructions: String(item.instructions || '').trim(),
    durationDays: Math.min(365, Math.max(1, Number(item.durationDays) || 7)),
  })).filter(item => item.medicineName.length >= 2 && item.dosage && item.times.length);
}

export const getConsultation = asyncHandler(async (request, response) => {
  const consultation = await Consultation.findOne({ bookingId: request.params.bookingId, doctor: request.user._id }).lean();
  response.json({ success: true, consultation });
});

export const saveConsultation = asyncHandler(async (request, response) => {
  const bookingId = String(request.params.bookingId || '').trim();
  const patientEmail = String(request.body.patientEmail || '').trim().toLowerCase();
  if (!/^ID-[A-Za-z0-9-]+$/.test(bookingId)) throw new AppError(422, 'Enter a valid booking ID');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(patientEmail)) throw new AppError(422, 'The appointment does not contain a valid patient email');
  const prescriptions = cleanPrescriptions(request.body.prescriptions);
  const status = ['draft', 'sent', 'completed'].includes(request.body.status) ? request.body.status : 'draft';
  const patient = await User.findOne({ email: patientEmail, role: 'patient' });
  const consultation = await Consultation.findOneAndUpdate(
    { bookingId },
    {
      patientEmail,
      patient: patient?._id,
      patientName: String(request.body.patientName || 'Patient').trim(),
      doctor: request.user._id,
      doctorName: request.user.fullName,
      appointmentDate: String(request.body.appointmentDate || '').trim(),
      clinicalNotes: String(request.body.clinicalNotes || '').trim(),
      recommendedTests: String(request.body.recommendedTests || '').trim(),
      nextVisitDate: String(request.body.nextVisitDate || '').trim(),
      nextVisitTime: String(request.body.nextVisitTime || '').trim(),
      prescriptions,
      status,
      ...(status !== 'draft' ? { sentAt: new Date() } : {}),
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  );

  if (status !== 'draft') {
    if (patient) {
      await Medication.deleteMany({ patient: patient._id, consultation: consultation._id });
      if (prescriptions.length) {
        const startDate = new Date().toISOString().slice(0, 10);
        await Medication.insertMany(prescriptions.map(item => {
          const endDate = new Date(`${startDate}T00:00:00`);
          endDate.setDate(endDate.getDate() + item.durationDays - 1);
          return { patient: patient._id, consultation: consultation._id, ...item, startDate, endDate: endDate.toISOString().slice(0, 10), priority: 'important', source: 'doctor' };
        }));
      }
    }
  }
  response.json({ success: true, message: status === 'draft' ? 'Consultation draft saved' : 'Prescription and visit instructions sent to the patient', consultation });
});

export const listMyConsultations = asyncHandler(async (request, response) => {
  const consultations = await Consultation.find({
    $or: [{ patient: request.user._id }, { patientEmail: request.user.email }],
    status: { $in: ['sent', 'completed'] },
  }).sort({ sentAt: -1, createdAt: -1 }).lean();
  response.json({ success: true, consultations });
});

export const listDoctorConsultations = asyncHandler(async (request, response) => {
  const consultations = await Consultation.find(
    { doctor: request.user._id },
    { bookingId: 1, patientEmail: 1, patientName: 1, appointmentDate: 1, status: 1, updatedAt: 1 },
  ).sort({ updatedAt: -1 }).lean();
  response.json({ success: true, consultations });
});

export const listPatientReportsForDoctor = asyncHandler(async (request, response) => {
  const patient = await User.findOne({ email: String(request.params.email || '').toLowerCase(), role: 'patient' });
  if (!patient) return response.json({ success: true, reports: [] });
  const reports = await MedicalReport.find(
    { patient: patient._id, sharedWithDoctor: true, summaryStatus: 'ready' },
    { title: 1, reportType: 1, aiSummary: 1, keyFindings: 1, createdAt: 1, sharedAt: 1 },
  ).sort({ createdAt: -1 }).lean();
  response.json({ success: true, reports });
});
