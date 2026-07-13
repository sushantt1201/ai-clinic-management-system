import { Otp } from '../models/otp.model.js';
import { sendOtpEmail } from '../services/email.service.js';
import { AppError } from '../utils/app-error.js';
import { createOtpCode, createOtpVerificationToken, hashOtp } from '../utils/otp.js';

export async function sendRegistrationOtp(request, response) {
  const email = request.body.email?.trim().toLowerCase();
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) throw new AppError(422, 'Enter a valid email address');
  const code = createOtpCode();
  await Otp.deleteMany({ email, purpose: 'registration' });
  await Otp.create({ email, codeHash: hashOtp(code), purpose: 'registration', expiresAt: new Date(Date.now() + 10 * 60 * 1000) });
  try { await sendOtpEmail({ email, code }); }
  catch (error) { await Otp.deleteMany({ email, purpose: 'registration' }); throw error; }
  response.json({ success: true, message: 'Verification code sent to your email' });
}

export async function verifyRegistrationOtp(request, response) {
  const email = request.body.email?.trim().toLowerCase();
  const code = request.body.code?.trim();
  const record = await Otp.findOne({ email, purpose: 'registration' }).sort({ createdAt: -1 });
  if (!record || record.expiresAt <= new Date()) throw new AppError(400, 'The verification code has expired. Request a new one.');
  if (record.attempts >= 5) throw new AppError(429, 'Too many incorrect attempts. Request a new code.');
  if (record.codeHash !== hashOtp(code ?? '')) {
    record.attempts += 1; await record.save();
    throw new AppError(400, 'Incorrect verification code');
  }
  await Otp.deleteMany({ email, purpose: 'registration' });
  response.json({ success: true, message: 'Email verified', verificationToken: createOtpVerificationToken(email) });
}
