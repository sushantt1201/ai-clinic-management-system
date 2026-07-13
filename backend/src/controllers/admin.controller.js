import { User } from '../models/user.model.js';
import { AppError } from '../utils/app-error.js';

export async function getAdminSummary(_request, response) {
  const [patients, doctors, pendingDoctors, admins] = await Promise.all([
    User.countDocuments({ role: 'patient' }), User.countDocuments({ role: 'doctor', isActive: true }),
    User.find({ role: 'doctor', isActive: false }).select('fullName email phone createdAt').sort({ createdAt: -1 }),
    User.countDocuments({ role: 'admin' }),
  ]);
  response.json({ success: true, summary: { patients, doctors, admins, pending: pendingDoctors.length }, pendingDoctors });
}

export async function approveDoctor(request, response) {
  const doctor = await User.findOneAndUpdate({ _id: request.params.id, role: 'doctor' }, { isActive: true }, { new: true });
  if (!doctor) throw new AppError(404, 'Doctor account not found');
  response.json({ success: true, message: `${doctor.fullName} has been approved` });
}
