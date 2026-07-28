import { Otp } from '../models/otp.model.js';
import { User } from '../models/user.model.js';
import { sendOtpEmail } from '../services/email.service.js';
import { AppError } from '../utils/app-error.js';
import { createOtpCode, hashOtp } from '../utils/otp.js';

export async function requestPasswordReset(request, response) {
    const email = request.body.email?.trim().toLowerCase();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) throw new AppError(422, 'Enter a valid email address');
    const user = await User.findOne({ email });
    if (user) { const code = createOtpCode(); await Otp.deleteMany({ email, purpose: 'password-reset' }); await Otp.create({ email, codeHash: hashOtp(code), purpose: 'password-reset', expiresAt: new Date(Date.now() + 10 * 60 * 1000) }); await sendOtpEmail({ email, code }); }
    response.json({ success: true, message: 'If that account exists, a password reset code has been sent' });
}
export async function resetPassword(request, response) {
    const email = request.body.email?.trim().toLowerCase(), code = request.body.code?.trim(), newPassword = request.body.newPassword;
    if (!newPassword || newPassword.length < 8) throw new AppError(422, 'New password must contain at least 8 characters');
    const record = await Otp.findOne({ email, purpose: 'password-reset' }).sort({ createdAt: -1 });
    if (!record || record.expiresAt <= new Date()) throw new AppError(400, 'Reset code expired. Request a new one.');
    if (record.attempts >= 5) throw new AppError(429, 'Too many attempts. Request a new code.');
    if (record.codeHash !== hashOtp(code ?? '')) { record.attempts += 1; await record.save(); throw new AppError(400, 'Incorrect reset code'); }
    const user = await User.findOne({ email }); if (!user) throw new AppError(400, 'Password reset failed'); user.password = newPassword; user.authProvider = 'local'; await user.save(); await Otp.deleteMany({ email, purpose: 'password-reset' });
    response.json({ success: true, message: 'Password reset successfully. You can now log in.' });
}
