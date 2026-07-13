import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

function secret() {
  return process.env.JWT_SECRET;
}

export function createOtpCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

export function hashOtp(code) {
  return crypto.createHmac('sha256', secret()).update(code).digest('hex');
}

export function createOtpVerificationToken(email) {
  return jwt.sign({ email, purpose: 'registration-otp' }, secret(), {
    expiresIn: '10m', issuer: 'peoples-clinic-api', audience: 'peoples-clinic-registration',
  });
}

export function verifyOtpVerificationToken(token, email) {
  const payload = jwt.verify(token, secret(), {
    issuer: 'peoples-clinic-api', audience: 'peoples-clinic-registration',
  });
  return payload.purpose === 'registration-otp' && payload.email === email;
}
