import crypto from 'node:crypto';
import { AppError } from '../utils/app-error.js';

function secret() {
  const value = process.env.BOOKING_TOKEN_SECRET?.trim() || process.env.JWT_SECRET?.trim();
  if (!value) throw new AppError(503, 'Booking security is not configured');
  return value;
}

function signature(value) {
  return crypto.createHmac('sha256', secret()).update(value).digest('base64url');
}

export function createBookingToken(payload, lifetimeMinutes = 30) {
  const body = Buffer.from(JSON.stringify({ ...payload, expiresAt: Date.now() + lifetimeMinutes * 60_000 })).toString('base64url');
  return `${body}.${signature(body)}`;
}

export function readBookingToken(token) {
  const [body, suppliedSignature] = String(token || '').split('.');
  if (!body || !suppliedSignature) throw new AppError(400, 'Booking session is invalid or expired');
  const expectedSignature = signature(body);
  if (suppliedSignature.length !== expectedSignature.length || !crypto.timingSafeEqual(Buffer.from(suppliedSignature), Buffer.from(expectedSignature))) throw new AppError(400, 'Booking session is invalid or expired');
  let payload;
  try { payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')); } catch { throw new AppError(400, 'Booking session is invalid or expired'); }
  if (!payload.expiresAt || payload.expiresAt <= Date.now()) throw new AppError(400, 'Booking session has expired. Please request the appointment again.');
  return payload;
}

export function bookingOtpDigest({ bookingId, code }) {
  return crypto.createHmac('sha256', secret()).update(`${bookingId}:${code}`).digest('hex');
}
