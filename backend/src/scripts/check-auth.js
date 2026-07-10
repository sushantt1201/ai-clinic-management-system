import 'dotenv/config';
import { createApp } from '../app.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { allowRoles } from '../middleware/auth.middleware.js';
import { User } from '../models/user.model.js';

process.env.JWT_SECRET ||= 'local-authentication-check-secret-32-characters-minimum';

const suffix = `${Date.now()}${Math.floor(Math.random() * 10_000)}`;
const testEmail = `codex-auth-${suffix}@example.com`;
const testPhone = `+91${String(suffix).slice(-10).padStart(10, '7')}`;
const password = 'ClinicTest123';
let server;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function request(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers ?? {}) },
  });
  const body = await response.json();
  return { response, body };
}

try {
  await connectDatabase();
  const app = createApp();
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  const registration = await request(baseUrl, '/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      fullName: 'Authentication Test Patient',
      email: testEmail,
      phone: testPhone,
      password,
    }),
  });
  assert(registration.response.status === 201, `Registration failed: ${JSON.stringify(registration.body)}`);
  assert(registration.body.user.role === 'patient', 'Public registration did not enforce the patient role');
  assert(!('password' in registration.body.user), 'Registration response exposed a password');

  const storedUser = await User.findOne({ email: testEmail }).select('+password');
  assert(storedUser.password !== password, 'The stored password was not hashed');
  assert(storedUser.password.startsWith('$2'), 'The stored password is not a bcrypt hash');

  const roleInjection = await request(baseUrl, '/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      fullName: 'Role Injection Test',
      email: `role-${testEmail}`,
      phone: `+92${String(suffix).slice(-10).padStart(10, '8')}`,
      password,
      role: 'admin',
    }),
  });
  assert(roleInjection.response.status === 422, 'Public registration accepted a requested admin role');

  const duplicate = await request(baseUrl, '/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      fullName: 'Duplicate Patient',
      email: testEmail,
      phone: testPhone,
      password,
    }),
  });
  assert(duplicate.response.status === 409, 'Duplicate registration was not rejected');

  const invalidLogin = await request(baseUrl, '/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: testEmail, password: 'IncorrectPassword1' }),
  });
  assert(invalidLogin.response.status === 401, 'Invalid login was not rejected');

  const login = await request(baseUrl, '/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: testEmail, password }),
  });
  assert(login.response.status === 200, `Login failed: ${JSON.stringify(login.body)}`);
  const cookie = login.response.headers.get('set-cookie')?.split(';')[0];
  assert(cookie?.startsWith('clinic_session='), 'Login did not issue the secure session cookie');

  const profile = await request(baseUrl, '/api/v1/auth/me', { headers: { cookie } });
  assert(profile.response.status === 200, 'Authenticated profile request failed');
  assert(profile.body.user.email === testEmail, 'Profile returned the wrong user');

  const anonymousProfile = await request(baseUrl, '/api/v1/auth/me');
  assert(anonymousProfile.response.status === 401, 'Anonymous profile request was not rejected');

  const logout = await request(baseUrl, '/api/v1/auth/logout', { method: 'POST', headers: { cookie } });
  assert(logout.response.status === 200, 'Logout failed');

  let authorizationError;
  allowRoles('doctor')({ user: { role: 'patient' } }, {}, (error) => {
    authorizationError = error;
  });
  assert(authorizationError?.statusCode === 403, 'Role protection did not reject a patient from a doctor route');

  let patientWasAllowed = false;
  allowRoles('patient')({ user: { role: 'patient' } }, {}, () => {
    patientWasAllowed = true;
  });
  assert(patientWasAllowed, 'Role protection rejected an allowed patient');

  console.log(
    'Authentication check passed: validation, hashing, registration, duplicate protection, login, session, profile, logout, and role protection.',
  );
} finally {
  if (server) await new Promise((resolve) => server.close(resolve));
  await User.deleteOne({ email: testEmail }).catch(() => {});
  await disconnectDatabase();
}
