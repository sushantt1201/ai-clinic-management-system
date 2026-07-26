import { User } from '../models/user.model.js';
import { AppError } from '../utils/app-error.js';

export async function getAdminSummary(_request, response) {
  const [patients, doctors, pendingDoctors, admins] = await Promise.all([
    User.countDocuments({ role: 'patient' }), User.countDocuments({ role: 'doctor', isActive: true }),
    User.find({ role: 'doctor', isActive: false }).select('fullName email phone createdAt').sort({ createdAt: -1 }),
    User.countDocuments({ role: 'admin' }),
  ]);
  response.json({ success: true, summary: { patients, approvedDoctors: doctors, admins, pendingDoctors: pendingDoctors.length }, pendingDoctors });
}

export async function approveDoctor(request, response) {
  const doctor = await User.findOneAndUpdate({ _id: request.params.id, role: 'doctor' }, { isActive: true }, { new: true });
  if (!doctor) throw new AppError(404, 'Doctor account not found');
  response.json({ success: true, message: `${doctor.fullName} has been approved` });
}

export async function listUsers(request, response) {
  const role = ['patient', 'doctor', 'admin'].includes(request.query.role) ? request.query.role : undefined;
  const users = await User.find(role ? { role } : {}).select('fullName email phone role isActive createdAt lastLoginAt').sort({ createdAt: -1 }).lean();
  response.json({ success: true, users });
}

export async function createAdministrator(request, response) {
  const fullName = String(request.body.fullName || '').trim();
  const email = String(request.body.email || '').trim().toLowerCase();
  const password = String(request.body.password || '');
  if (fullName.length < 2) throw new AppError(422, 'Enter the administrator name');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new AppError(422, 'Enter a valid administrator email');
  if (password.length < 8) throw new AppError(422, 'Administrator password must contain at least 8 characters');
  if (await User.exists({ email })) throw new AppError(409, 'An account already exists with this email');
  const administrator = await User.create({ fullName, email, password, role: 'admin', isActive: true });
  response.status(201).json({ success: true, message: 'Administrator account created', administrator });
}
