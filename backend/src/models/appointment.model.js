import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true, index: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  patientName: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  phone: { type: String, required: true, trim: true },
  doctorSlug: { type: String, required: true, index: true },
  doctorName: { type: String, required: true },
  feeInr: { type: Number, required: true },
  appointmentDate: { type: String, required: true, index: true },
  appointmentTime: { type: String, required: true },
  source: { type: String, default: 'website-booking-form' },
  status: { type: String, enum: ['pending_otp', 'pending_payment', 'payment_processing', 'confirmed', 'cancelled', 'failed'], default: 'pending_otp', index: true },
  otpVerifiedAt: Date,
  razorpayOrderId: String,
  razorpayPaymentId: String,
  calendarEventId: String,
  automationResponse: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

appointmentSchema.index({ doctorSlug: 1, appointmentDate: 1, appointmentTime: 1, status: 1 });
export const Appointment = mongoose.model('Appointment', appointmentSchema);
