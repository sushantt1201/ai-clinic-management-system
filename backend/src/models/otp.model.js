import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  codeHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  purpose: { type: String, enum: ['registration', 'password-reset', 'appointment-booking'], default: 'registration', index: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', index: true },
  expiresAt: { type: Date, required: true, expires: 0 },
}, { timestamps: true });

export const Otp = mongoose.model('Otp', otpSchema);
