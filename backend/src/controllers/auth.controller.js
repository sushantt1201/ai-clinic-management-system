import { User } from '../models/user.model.js';
import { AppError } from '../utils/app-error.js';
import {
  AUTH_COOKIE_NAME,
  createAuthToken,
  getAuthCookieOptions,
  getClearAuthCookieOptions,
} from '../utils/auth-token.js';
import { loginSchema, parseRequest, registerSchema } from '../validators/auth.validator.js';

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

  const existingUser = await User.findOne({
    $or: [{ email: input.email }, { phone: input.phone }],
  }).select('_id');

  if (existingUser) throw new AppError(409, 'An account with this email or phone already exists');

  const user = await User.create({ ...input, role: 'patient' });
  setSessionCookie(response, user);

  response.status(201).json({
    success: true,
    message: 'Patient account created successfully',
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

  if (!user.isActive) throw new AppError(403, 'This account has been disabled');

  user.lastLoginAt = new Date();
  await user.save({ validateModifiedOnly: true });
  setSessionCookie(response, user);

  response.status(200).json({
    success: true,
    message: 'Signed in successfully',
    user: publicUser(user),
  });
}

export function logout(_request, response) {
  response.clearCookie(AUTH_COOKIE_NAME, getClearAuthCookieOptions());
  response.status(200).json({ success: true, message: 'Signed out successfully' });
}

export function getCurrentUser(request, response) {
  response.status(200).json({ success: true, user: publicUser(request.user) });
}
