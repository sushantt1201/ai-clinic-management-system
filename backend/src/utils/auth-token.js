import jwt from 'jsonwebtoken';

export const AUTH_COOKIE_NAME = 'clinic_session';

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function getJwtSecret() {
  const secret = process.env.JWT_SECRET?.trim();

  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long. Add it to backend/.env.');
  }

  return secret;
}

export function createAuthToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, getJwtSecret(), {
    expiresIn: '7d',
    issuer: 'aura-care-api',
    audience: 'aura-care-web',
  });
}

export function verifyAuthToken(token) {
  return jwt.verify(token, getJwtSecret(), {
    issuer: 'aura-care-api',
    audience: 'aura-care-web',
  });
}

export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_MS,
    path: '/',
  };
}

export function getClearAuthCookieOptions() {
  const options = getAuthCookieOptions();
  delete options.maxAge;
  return options;
}
