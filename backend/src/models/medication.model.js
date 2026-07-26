import mongoose from 'mongoose';

const doseLogSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    time: { type: String, required: true },
    status: { type: String, enum: ['taken', 'missed'], required: true },
    markedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const medicationSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    medicineName: { type: String, required: true, trim: true, maxlength: 100 },
    dosage: { type: String, required: true, trim: true, maxlength: 80 },
    times: [{ type: String, enum: ['morning', 'afternoon', 'evening', 'night'] }],
    instructions: { type: String, trim: true, maxlength: 240, default: '' },
    priority: { type: String, enum: ['routine', 'important', 'urgent'], default: 'routine' },
    startDate: { type: String, required: true },
    endDate: { type: String, default: '' },
    active: { type: Boolean, default: true },
    source: { type: String, enum: ['manual', 'prescription-ai', 'doctor'], default: 'manual' },
    prescriptionReport: { type: mongoose.Schema.Types.ObjectId, ref: 'MedicalReport' },
    consultation: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultation' },
    doseLogs: [doseLogSchema],
  },
  { timestamps: true },
);

medicationSchema.index({ patient: 1, active: 1, createdAt: -1 });

export const Medication = mongoose.model('Medication', medicationSchema);
