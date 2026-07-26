import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema({
  medicineName: { type: String, required: true, trim: true, maxlength: 100 },
  dosage: { type: String, required: true, trim: true, maxlength: 80 },
  times: [{ type: String, enum: ['morning', 'afternoon', 'evening', 'night'] }],
  instructions: { type: String, trim: true, maxlength: 240, default: '' },
  durationDays: { type: Number, min: 1, max: 365, default: 7 },
}, { _id: false });

const consultationSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true, index: true },
  patientEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  patientName: { type: String, trim: true, default: 'Patient' },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorName: { type: String, required: true, trim: true },
  appointmentDate: { type: String, default: '' },
  clinicalNotes: { type: String, trim: true, maxlength: 6000, default: '' },
  recommendedTests: { type: String, trim: true, maxlength: 3000, default: '' },
  nextVisitDate: { type: String, default: '' },
  nextVisitTime: { type: String, trim: true, maxlength: 30, default: '' },
  prescriptions: { type: [prescriptionSchema], default: [] },
  status: { type: String, enum: ['draft', 'sent', 'completed'], default: 'draft' },
  sentAt: Date,
}, { timestamps: true });

export const Consultation = mongoose.model('Consultation', consultationSchema);
