import { User } from '../models/user.model.js';
import { AppError } from '../utils/app-error.js';
import {
  AUTH_COOKIE_NAME,
  createAuthToken,
  getAuthCookieOptions,
  getClearAuthCookieOptions,
} from '../utils/auth-token.js';
import { loginSchema, parseRequest, registerSchema } from '../validators/auth.validator.js';
import { verifyOtpVerificationToken } from '../utils/otp.js';

function publicUser(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

function validate(schema, body) {
  const result = parseRequest(schema, body);
  if (result.validationErrors) {
    throw new AppError(422, 'Please correct the highlighted fields', result.validationErrors);
  }
  return result;
}

function setSessionCookie(response, user) {
  response.cookie(AUTH_COOKIE_NAME, createAuthToken(user), getAuthCookieOptions());
}

export async function register(request, response) {
  const input = validate(registerSchema, request.body);
  try {
    if (!verifyOtpVerificationToken(input.verificationToken, input.email)) throw new Error('Invalid token');
  } catch { throw new AppError(401, 'Email verification expired or is invalid'); }

  const existingUser = await User.findOne({
    $or: [{ email: input.email }, { phone: input.phone }],
  }).select('_id');

  if (existingUser) throw new AppError(409, 'An account with this email or phone already exists');

  const account = { ...input };
  delete account.verificationToken;
  const user = await User.create({ ...account, isActive: input.role === 'patient' });
  if (user.isActive) setSessionCookie(response, user);

  response.status(201).json({
    success: true,
    message: user.isActive ? 'Patient account created successfully' : 'Doctor account submitted for administrator approval',
    user: publicUser(user),
  });
}

export async function login(request, response) {
  const input = validate(loginSchema, request.body);
  const normalizedIdentifier = input.identifier.toLowerCase();
  const user = await User.findOne({
    $or: [{ email: normalizedIdentifier }, { phone: input.identifier }],
  }).select('+password');

  if (!user || !(await user.comparePassword(input.password))) {
    throw new AppError(401, 'Invalid email, phone, or password');
  }

  if (user.role !== input.expectedRole) throw new AppError(403, `This account is not registered as ${input.expectedRole}`);

  if (!user.isActive) throw new AppError(403, user.role === 'doctor' ? 'Your doctor account is awaiting administrator approval' : 'This account has been disabled');

  user.lastLoginAt = new Date();
  await user.save({ validateModifiedOnly: true });
  setSessionCookie(response, user);

  response.status(200).json({
    success: true,
    message: 'Signed in successfully',
    user: publicUser(user),
  });
}

export async function changePassword(request, response) {
  const { currentPassword, newPassword } = request.body;
  if (!currentPassword || !newPassword || newPassword.length < 8) throw new AppError(422, 'Current password and a valid new password are required');
  const user = await User.findById(request.user.id).select('+password');
  if (!user.password || !(await user.comparePassword(currentPassword))) throw new AppError(401, 'Current password is incorrect');
  user.password = newPassword;
  await user.save();
  response.json({ success: true, message: 'Password changed successfully' });
}

export async function googleLogin(request, response) {
  const credential = request.body.credential;
  const expectedRole = request.body.expectedRole;
  if (!credential || !['patient', 'doctor', 'admin'].includes(expectedRole)) throw new AppError(422, 'Google credential and role are required');
  const googleResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
  if (!googleResponse.ok) throw new AppError(401, 'Google sign-in could not be verified');
  const profile = await googleResponse.json();
  if (profile.aud !== process.env.GOOGLE_CLIENT_ID || profile.email_verified !== 'true') throw new AppError(401, 'Google account verification failed');

  let user = await User.findOne({ $or: [{ googleSubject: profile.sub }, { email: profile.email.toLowerCase() }] }).select('+googleSubject');
  if (!user) {
    if (expectedRole !== 'patient') throw new AppError(403, `${expectedRole} Google login requires an existing clinic account`);
    user = await User.create({ fullName: profile.name, email: profile.email, googleSubject: profile.sub, authProvider: 'google', role: 'patient' });
  } else if (!user.googleSubject) {
    user.googleSubject = profile.sub;
    await user.save({ validateModifiedOnly: true });
  }
  if (user.role !== expectedRole) throw new AppError(403, `This Google account is not registered as ${expectedRole}`);
  if (!user.isActive) throw new AppError(403, 'This account is awaiting approval or has been disabled');
  user.lastLoginAt = new Date(); await user.save({ validateModifiedOnly: true });
  setSessionCookie(response, user);
  response.json({ success: true, message: 'Signed in with Google', user: publicUser(user) });
}

export function logout(_request, response) {
  response.clearCookie(AUTH_COOKIE_NAME, getClearAuthCookieOptions());
  response.status(200).json({ success: true, message: 'Signed out successfully' });
}

export function getCurrentUser(request, response) {
  response.status(200).json({ success: true, user: publicUser(request.user) });
}
