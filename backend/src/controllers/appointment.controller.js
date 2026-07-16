import crypto from 'node:crypto';
import { sendAppointmentOtpEmail } from '../services/email.service.js';
import { bookingOtpDigest, createBookingToken, readBookingToken } from '../services/booking-token.service.js';
import { createPaymentOrder, verifyPaymentSignature } from '../services/razorpay.service.js';
import { AppError } from '../utils/app-error.js';
import { createOtpCode } from '../utils/otp.js';

const doctors = {
  'dr-ananya-sharma': { name: 'Dr. Ananya Sharma', fee: 400 },
  'dr-rahul-mehta': { name: 'Dr. Rahul Mehta', fee: 500 },
  'dr-priya-verma': { name: 'Dr. Priya Verma', fee: 600 },
};

function clinicSlots() {
  const result = [];
  for (const [start,end] of [[540,720],[900,1020]]) for (let value=start;value<end;value+=15) result.push(`${String(Math.floor(value/60)).padStart(2,'0')}:${String(value%60).padStart(2,'0')}`);
  return result;
}

function validate(body) {
  const doctor = doctors[body.doctor];
  if (!doctor) throw new AppError(422, 'Select an available doctor');
  if (!String(body.name || '').trim()) throw new AppError(422, 'Enter the patient name');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email || '')) throw new AppError(422, 'Enter a valid email address');
  if (!/^\+91\d{10}$/.test(body.phone || '')) throw new AppError(422, 'Enter a valid Indian phone number');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.appointmentDate || '') || body.appointmentDate < new Date().toISOString().slice(0,10)) throw new AppError(422, 'Choose today or a future date');
  const date = new Date(`${body.appointmentDate}T00:00:00`);
  if ([0,6].includes(date.getDay())) throw new AppError(422, 'The clinic is closed on weekends');
  if (!clinicSlots().includes(body.appointmentTime)) throw new AppError(422, 'Choose a valid 15-minute clinic slot');
  return doctor;
}

function patientAppointmentsWebhook() {
  const configured = process.env.N8N_PATIENT_APPOINTMENTS_WEBHOOK_URL?.trim();
  return configured || process.env.N8N_BOOKING_CONFIRM_WEBHOOK_URL?.trim()?.replace(/\/appointment\/?$/, '/patient-appointments');
}

async function sheetAppointments(payload) {
  const webhook = patientAppointmentsWebhook();
  if (!webhook) throw new AppError(503, 'Google Sheets appointment synchronization is not configured');
  let result;
  try { result = await fetch(webhook,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)}); }
  catch { throw new AppError(502, 'Could not reach the Google Sheets appointment workflow'); }
  const data = await result.json().catch(()=>({}));
  if (!result.ok || data.success === false) throw new AppError(502,data.message || 'Could not check appointment availability');
  return data.appointments || [];
}

export async function requestAppointment(request,response) {
  const doctor = validate(request.body);
  const appointments = await sheetAppointments({ role:'admin' });
  const displayTime = toDisplayTime(request.body.appointmentTime);
  const booked = appointments.some(item => String(item.doctorName || item.Doctor || '').trim().toLowerCase() === doctor.name.toLowerCase() && (item.date || item.Date) === request.body.appointmentDate && (item.time || item.Time) === displayTime && String(item.status || item.Status || '').toLowerCase() !== 'cancelled');
  if (booked) {
    const used = new Set(appointments.filter(item => String(item.doctorName || item.Doctor || '').trim().toLowerCase() === doctor.name.toLowerCase() && (item.date || item.Date) === request.body.appointmentDate).map(item => item.time || item.Time));
    return response.status(409).json({success:false,message:'That slot is unavailable',availableSlots:clinicSlots().filter(slot=>!used.has(toDisplayTime(slot)))});
  }
  const booking = { bookingId:`APT-${Date.now()}-${crypto.randomInt(100,999)}`, patientName:request.body.name.trim(), email:request.body.email.trim().toLowerCase(), phone:request.body.phone, doctorSlug:request.body.doctor, doctorName:doctor.name, feeInr:doctor.fee, appointmentDate:request.body.appointmentDate, appointmentTime:request.body.appointmentTime, source:request.body.source || 'website-booking-form' };
  const code = createOtpCode();
  const token = createBookingToken({ ...booking, stage:'otp', otpDigest:bookingOtpDigest({bookingId:booking.bookingId,code}) },10);
  await sendAppointmentOtpEmail({email:booking.email,code,patientName:booking.patientName,doctorName:booking.doctorName,date:booking.appointmentDate,time:displayTime});
  response.status(201).json({success:true,message:'OTP sent to your email',appointmentId:token,bookingId:booking.bookingId,feeInr:booking.feeInr,doctorName:booking.doctorName});
}

export async function verifyAppointmentOtp(request,response) {
  const booking = readBookingToken(request.params.id);
  if (booking.stage !== 'otp' || booking.otpDigest !== bookingOtpDigest({bookingId:booking.bookingId,code:String(request.body.code || '')})) throw new AppError(400,'Incorrect or expired OTP');
  const details = { ...booking };
  delete details.otpDigest;
  delete details.expiresAt;
  const token = createBookingToken({...details,stage:'verified'},20);
  response.json({success:true,message:'Email verified. Continue to payment.',feeInr:booking.feeInr,appointmentId:token});
}

export async function createAppointmentPayment(request,response) {
  const booking = readBookingToken(request.params.id);
  if (booking.stage !== 'verified') throw new AppError(400,'Verify the appointment email before payment');
  const order = await createPaymentOrder({amountInr:booking.feeInr,receipt:booking.bookingId,notes:{bookingId:booking.bookingId}});
  const details={...booking};
  delete details.expiresAt;
  const token=createBookingToken({...details,stage:'payment',razorpayOrderId:order.id},30);
  response.json({success:true,appointmentId:token,order:{id:order.id,amount:order.amount,currency:order.currency,keyId:order.keyId},appointment:{bookingId:booking.bookingId,doctorName:booking.doctorName,feeInr:booking.feeInr}});
}

export async function verifyAppointmentPayment(request,response) {
  const booking=readBookingToken(request.params.id);
  const {razorpay_order_id:orderId,razorpay_payment_id:paymentId,razorpay_signature:signature}=request.body;
  if (booking.stage!=='payment' || orderId!==booking.razorpayOrderId || !verifyPaymentSignature({orderId,paymentId,signature})) throw new AppError(400,'Invalid payment confirmation');
  const webhook=process.env.N8N_BOOKING_CONFIRM_WEBHOOK_URL?.trim();
  if(!webhook) throw new AppError(503,'Booking automation is not configured');
  const payload={name:booking.patientName,email:booking.email,phone:booking.phone,doctor:booking.doctorSlug,doctor_name:booking.doctorName,fee:booking.feeInr,date:booking.appointmentDate,time:toDisplayTime(booking.appointmentTime),source:booking.source,otp_verified_at:new Date().toISOString(),payment_status:'paid',payment_id:paymentId,booking_status:'confirmed',booking_id:booking.bookingId};
  const automation=await fetch(webhook,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
  const data=await automation.json().catch(()=>({}));
  if(!automation.ok || data.success===false) throw new AppError(502,`Payment succeeded, but booking confirmation failed: ${data.message || `n8n returned HTTP ${automation.status}`}`);
  response.json({success:true,message:'Appointment booked successfully',appointment:{bookingId:booking.bookingId,patientName:booking.patientName,email:booking.email,phone:booking.phone,doctorName:booking.doctorName,feeInr:booking.feeInr,appointmentDate:booking.appointmentDate,appointmentTime:booking.appointmentTime,status:'confirmed',paymentId}});
}

export async function listAppointments(request,response){response.json({success:true,appointments:await sheetAppointments({email:request.user.email,role:request.user.role,doctor_name:request.user.fullName})});}

function toDisplayTime(time){const[hours,minutes]=time.split(':').map(Number);return `${hours%12||12}:${String(minutes).padStart(2,'0')} ${hours>=12?'PM':'AM'}`;}
