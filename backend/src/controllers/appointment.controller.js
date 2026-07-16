import crypto from 'node:crypto';
import { Appointment } from '../models/appointment.model.js';
import { Otp } from '../models/otp.model.js';
import { User } from '../models/user.model.js';
import { sendAppointmentOtpEmail } from '../services/email.service.js';
import { createPaymentOrder, verifyPaymentSignature } from '../services/razorpay.service.js';
import { AppError } from '../utils/app-error.js';
import { createOtpCode, hashOtp } from '../utils/otp.js';

const doctors = {
  'dr-ananya-sharma': { name: 'Dr. Ananya Sharma', fee: 400 },
  'dr-rahul-mehta': { name: 'Dr. Rahul Mehta', fee: 500 },
  'dr-priya-verma': { name: 'Dr. Priya Verma', fee: 600 },
};
const active = ['pending_otp', 'pending_payment', 'payment_processing', 'confirmed'];

function slots() {
  const result = [];
  for (const [start, end] of [[9 * 60, 12 * 60], [15 * 60, 17 * 60]]) for (let value = start; value < end; value += 15) result.push(`${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`);
  return result;
}
function validate(body) {
  const doctor = doctors[body.doctor];
  if (!doctor) throw new AppError(422, 'Select an available doctor');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email || '')) throw new AppError(422, 'Enter a valid email address');
  if (!/^\+91\d{10}$/.test(body.phone || '')) throw new AppError(422, 'Enter a valid Indian phone number');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.appointmentDate || '') || body.appointmentDate < new Date().toISOString().slice(0, 10)) throw new AppError(422, 'Choose today or a future date');
  const date = new Date(`${body.appointmentDate}T00:00:00`);
  if ([0, 6].includes(date.getDay())) throw new AppError(422, 'The clinic is closed on weekends');
  if (!slots().includes(body.appointmentTime)) throw new AppError(422, 'Choose a valid 15-minute clinic slot');
  return doctor;
}
async function availableSlots(doctorSlug, date) {
  const booked = await Appointment.distinct('appointmentTime', { doctorSlug, appointmentDate: date, status: { $in: active } });
  return slots().filter((slot) => !booked.includes(slot));
}

export async function requestAppointment(request, response) {
  const doctor = validate(request.body);
  const alternatives = await availableSlots(request.body.doctor, request.body.appointmentDate);
  if (!alternatives.includes(request.body.appointmentTime)) return response.status(409).json({ success: false, message: 'That slot is unavailable', availableSlots: alternatives });
  const email = request.body.email.trim().toLowerCase();
  const patient = await User.findOne({ email, role: 'patient' });
  const appointment = await Appointment.create({ bookingId: `APT-${Date.now()}-${crypto.randomInt(100, 999)}`, patient: patient?._id,
    patientName: request.body.name.trim(), email, phone: request.body.phone, doctorSlug: request.body.doctor, doctorName: doctor.name,
    feeInr: doctor.fee, appointmentDate: request.body.appointmentDate, appointmentTime: request.body.appointmentTime, source: request.body.source });
  const code = createOtpCode();
  await Otp.deleteMany({ appointmentId: appointment._id, purpose: 'appointment-booking' });
  await Otp.create({ email, appointmentId: appointment._id, codeHash: hashOtp(code), purpose: 'appointment-booking', expiresAt: new Date(Date.now() + 10 * 60 * 1000) });
  try { await sendAppointmentOtpEmail({ email, code, patientName: appointment.patientName, doctorName: doctor.name, date: appointment.appointmentDate, time: appointment.appointmentTime }); }
  catch (error) { await Promise.all([appointment.deleteOne(), Otp.deleteMany({ appointmentId: appointment._id })]); throw error; }
  response.status(201).json({ success: true, message: 'OTP sent to your email', appointmentId: appointment._id, bookingId: appointment.bookingId, feeInr: doctor.fee, doctorName: doctor.name });
}

export async function verifyAppointmentOtp(request, response) {
  const appointment = await Appointment.findById(request.params.id);
  if (!appointment || appointment.status !== 'pending_otp') throw new AppError(404, 'Appointment request not found');
  const record = await Otp.findOne({ appointmentId: appointment._id, purpose: 'appointment-booking' }).sort({ createdAt: -1 });
  if (!record || record.expiresAt <= new Date()) throw new AppError(400, 'The OTP has expired');
  if (record.attempts >= 5) throw new AppError(429, 'Too many incorrect OTP attempts');
  if (record.codeHash !== hashOtp(String(request.body.code || ''))) { record.attempts += 1; await record.save(); throw new AppError(400, 'Incorrect OTP'); }
  appointment.otpVerifiedAt = new Date(); appointment.status = 'pending_payment'; await appointment.save(); await Otp.deleteMany({ appointmentId: appointment._id });
  response.json({ success: true, message: 'Email verified. Continue to payment.', feeInr: appointment.feeInr });
}

export async function createAppointmentPayment(request, response) {
  const appointment = await Appointment.findById(request.params.id);
  if (!appointment || appointment.status !== 'pending_payment' || !appointment.otpVerifiedAt) throw new AppError(400, 'Verify the appointment email before payment');
  const order = await createPaymentOrder({ amountInr: appointment.feeInr, receipt: appointment.bookingId, notes: { bookingId: appointment.bookingId } });
  appointment.razorpayOrderId = order.id; appointment.status = 'payment_processing'; await appointment.save();
  response.json({ success: true, order: { id: order.id, amount: order.amount, currency: order.currency, keyId: order.keyId }, appointment: { id: appointment._id, bookingId: appointment.bookingId, patientName: appointment.patientName, doctorName: appointment.doctorName, date: appointment.appointmentDate, time: appointment.appointmentTime, feeInr: appointment.feeInr } });
}

export async function verifyAppointmentPayment(request, response) {
  const appointment = await Appointment.findById(request.params.id);
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = request.body;
  if (!appointment || !['payment_processing', 'failed'].includes(appointment.status) || orderId !== appointment.razorpayOrderId) throw new AppError(400, 'Invalid payment confirmation');
  if (!verifyPaymentSignature({ orderId, paymentId, signature })) throw new AppError(400, 'Payment signature verification failed');
  if (appointment.razorpayPaymentId && appointment.razorpayPaymentId !== paymentId) throw new AppError(400, 'This appointment already has a different payment');
  appointment.razorpayPaymentId = paymentId;
  const webhook = process.env.N8N_BOOKING_CONFIRM_WEBHOOK_URL?.trim();
  if (!webhook) throw new AppError(503, 'Booking automation is not configured');
  const [hours, minutes] = appointment.appointmentTime.split(':').map(Number);
  const displayTime = `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
  const automationPayload = { name: appointment.patientName, email: appointment.email, phone: appointment.phone, doctor: appointment.doctorSlug, doctor_name: appointment.doctorName, fee: appointment.feeInr, date: appointment.appointmentDate, time: displayTime, source: appointment.source, otp_verified_at: appointment.otpVerifiedAt.toISOString(), payment_status: 'paid', payment_id: paymentId, booking_status: 'confirmed', booking_id: appointment.bookingId };
  console.log('[appointment-confirmation] sending to n8n', { bookingId: appointment.bookingId, doctor: appointment.doctorSlug, date: appointment.appointmentDate, time: displayTime });
  const automation = await fetch(webhook, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(automationPayload) });
  const automationData = await automation.json().catch(() => ({}));
  console.log('[appointment-confirmation] n8n response', { bookingId: appointment.bookingId, status: automation.status, body: automationData });
  if (!automation.ok || automationData.success === false) {
    appointment.status = 'failed'; appointment.automationResponse = automationData; await appointment.save();
    const reason = automationData.message || `n8n returned HTTP ${automation.status}`;
    throw new AppError(502, `Payment succeeded, but booking confirmation failed: ${reason}`, { availableSlots: automationData.availableSlots || [] });
  }
  appointment.status = 'confirmed'; appointment.automationResponse = automationData; appointment.calendarEventId = automationData.calendar_event_id; await appointment.save();
  response.json({ success: true, message: 'Appointment booked successfully', appointment });
}

export async function listAppointments(request, response) {
  const filter = request.user.role === 'admin' ? {} : request.user.role === 'patient' ? { $or: [{ patient: request.user._id }, { email: request.user.email }] } : { doctorName: request.user.fullName };
  response.json({ success: true, appointments: await Appointment.find(filter).sort({ appointmentDate: 1, appointmentTime: 1 }).lean() });
}
