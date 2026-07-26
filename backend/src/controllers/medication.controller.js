import { Medication } from '../models/medication.model.js';
import { AppError } from '../utils/app-error.js';
import { asyncHandler } from '../utils/async-handler.js';

const validTimes = new Set(['morning', 'afternoon', 'evening', 'night']);

function medicationFields(body) {
  const medicineName = String(body.medicineName || '').trim();
  const dosage = String(body.dosage || '').trim();
  const times = [...new Set(Array.isArray(body.times) ? body.times.filter(time => validTimes.has(time)) : [])];
  if (medicineName.length < 2) throw new AppError(400, 'Enter a valid medicine name');
  if (!dosage) throw new AppError(400, 'Enter the prescribed dosage');
  if (!times.length) throw new AppError(400, 'Select at least one medicine time');
  return {
    medicineName,
    dosage,
    times,
    instructions: String(body.instructions || '').trim(),
    priority: ['routine', 'important', 'urgent'].includes(body.priority) ? body.priority : 'routine',
    startDate: body.startDate || new Date().toISOString().slice(0, 10),
    endDate: body.endDate || '',
  };
}

export const listMyMedications = asyncHandler(async (request, response) => {
  const medications = await Medication.find({ patient: request.user._id }).sort({ active: -1, createdAt: -1 }).lean();
  response.json({ success: true, medications });
});

export const createMedication = asyncHandler(async (request, response) => {
  const medication = await Medication.create({
    patient: request.user._id,
    ...medicationFields(request.body),
  });
  response.status(201).json({ success: true, message: 'Medicine schedule added', medication });
});

export const updateMedication = asyncHandler(async (request, response) => {
  const medication = await Medication.findOne({ _id: request.params.id, patient: request.user._id });
  if (!medication) throw new AppError(404, 'Medicine schedule not found');
  Object.assign(medication, medicationFields(request.body));
  await medication.save();
  response.json({ success: true, message: 'Medicine schedule updated', medication });
});

export const deleteMedication = asyncHandler(async (request, response) => {
  const medication = await Medication.findOneAndDelete({ _id: request.params.id, patient: request.user._id });
  if (!medication) throw new AppError(404, 'Medicine schedule not found');
  response.json({ success: true, message: 'Medicine removed' });
});

export const markDose = asyncHandler(async (request, response) => {
  const { time, status } = request.body;
  const date = request.body.date || new Date().toISOString().slice(0, 10);
  if (!validTimes.has(time) || !['taken', 'missed'].includes(status)) throw new AppError(400, 'Dose update is invalid');
  const medication = await Medication.findOne({ _id: request.params.id, patient: request.user._id });
  if (!medication) throw new AppError(404, 'Medicine schedule not found');
  medication.doseLogs = medication.doseLogs.filter(log => !(log.date === date && log.time === time));
  medication.doseLogs.push({ date, time, status, markedAt: new Date() });
  await medication.save();
  response.json({ success: true, message: `Dose marked ${status}`, medication });
});
