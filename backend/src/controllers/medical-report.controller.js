import { MedicalReport } from '../models/medical-report.model.js';
import { Medication } from '../models/medication.model.js';
import { deleteMedicalReport, uploadMedicalReport } from '../services/cloudinary.service.js';
import { requestMedicalSummary } from '../services/medical-summary.service.js';
import { AppError } from '../utils/app-error.js';
import { asyncHandler } from '../utils/async-handler.js';

export const listMyReports = asyncHandler(async (request, response) => {
  const staleBefore = new Date(Date.now() - 4 * 60 * 1000);
  await MedicalReport.updateMany(
    {
      patient: request.user._id,
      summaryStatus: 'pending',
      $or: [{ summaryStartedAt: { $lt: staleBefore } }, { summaryStartedAt: { $exists: false }, createdAt: { $lt: staleBefore } }],
    },
    { $set: { summaryStatus: 'failed', summaryError: 'Processing was interrupted. Select Retry summary to continue.' } },
  );
  const reports = await MedicalReport.find({ patient: request.user._id }).sort({ createdAt: -1 }).lean();
  response.json({ success: true, reports });
});

const SUMMARY_JOB_TIMEOUT_MS = 3 * 60 * 1000;

async function generateSummary(reportId, suppliedFileData = '') {
  const report = await MedicalReport.findById(reportId);
  if (!report) return;
  try {
    const result = await Promise.race([
      requestMedicalSummary(report, suppliedFileData),
      new Promise((_, reject) => {
        setTimeout(() => reject(new AppError(504, 'AI summary timed out. Select Retry summary to try again.')), SUMMARY_JOB_TIMEOUT_MS);
      }),
    ]);
    report.aiSummary = result.summary;
    report.keyFindings = result.keyFindings;
    report.summaryStatus = 'ready';
    report.summaryError = '';
  } catch (error) {
    report.summaryStatus = 'failed';
    report.summaryError = error.message;
    console.error('[medical-summary] processing failed', { reportId: report._id.toString(), message: error.message });
  }
  await report.save();
}

export const createMedicalReport = asyncHandler(async (request, response) => {
  const { fileData, fileName, mimeType, size } = request.body;
  const allowedMimeTypes = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
  if (!fileData || !fileName || !allowedMimeTypes.has(mimeType)) throw new AppError(400, 'Select a PDF, JPG, PNG or WEBP medical report');
  if (!Number.isFinite(size) || size <= 0 || size > 15 * 1024 * 1024) throw new AppError(400, 'Medical report must be smaller than 15 MB');
  if (!String(fileData).startsWith(`data:${mimeType};base64,`)) throw new AppError(400, 'Medical report data is invalid');
  const inferredTitle = String(fileName).replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  const title = String(request.body.title || inferredTitle || 'Medical report').trim().slice(0, 100);
  const allowedTypes = ['lab-report', 'prescription', 'scan', 'discharge-summary', 'other'];
  const lowerName = String(fileName).toLowerCase();
  const inferredType = /prescri|medicine|medication/.test(lowerName)
    ? 'prescription'
    : /discharge|release/.test(lowerName)
      ? 'discharge-summary'
      : /scan|xray|x-ray|mri|ct\b|ultrasound/.test(lowerName) || mimeType.startsWith('image/')
        ? 'scan'
        : /lab|blood|cbc|test|report/.test(lowerName)
          ? 'lab-report'
          : 'other';
  const reportType = allowedTypes.includes(request.body.reportType) ? request.body.reportType : inferredType;
  const uploaded = await uploadMedicalReport(fileData, request.user._id.toString());
  const report = await MedicalReport.create({
    patient: request.user._id,
    title,
    reportType,
    appointmentId: String(request.body.appointmentId || '').trim(),
    originalName: String(fileName).trim().slice(0, 180),
    mimeType,
    size,
    cloudinaryPublicId: uploaded.publicId,
    cloudinaryResourceType: uploaded.resourceType,
    fileUrl: uploaded.fileUrl,
    summaryStatus: 'pending',
    summaryStartedAt: new Date(),
  });
  response.status(201).json({ success: true, message: 'Medical report uploaded. AI extraction is processing in the background.', report });
  void generateSummary(report._id, fileData).catch(() => {});
});

export const summarizeMedicalReport = asyncHandler(async (request, response) => {
  const report = await MedicalReport.findOne({ _id: request.params.id, patient: request.user._id });
  if (!report) throw new AppError(404, 'Medical report not found');
  report.summaryStatus = 'pending';
  report.summaryError = '';
  report.summaryStartedAt = new Date();
  await report.save();
  response.status(202).json({ success: true, message: 'AI health summary is processing', report });
  void generateSummary(report._id).catch(() => {});
});

export const shareMedicalReport = asyncHandler(async (request, response) => {
  const report = await MedicalReport.findOne({ _id: request.params.id, patient: request.user._id });
  if (!report) throw new AppError(404, 'Medical report not found');
  if (report.summaryStatus !== 'ready') throw new AppError(409, 'Generate the AI health summary before sharing it');
  if (!report.sharedWithDoctor) {
    report.sharedWithDoctor = true;
    report.sharedAt = new Date();
  }
  await report.save();
  response.json({ success: true, message: 'AI health summary shared with your doctor', report });
});

function prescriptionMedicines(text) {
  const results = [];
  for (const rawLine of String(text || '').split(/\r?\n/)) {
    const line = rawLine.replace(/[*#•]/g, '').trim();
    const match = line.match(/(?:medicine|drug)?\s*:?\s*([a-z][a-z0-9 +.-]{1,60}?)\s*[-:–]?\s*(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|tablet|capsule)s?)\b/i);
    if (!match) continue;
    const lower = line.toLowerCase();
    let times = ['morning'];
    if (/\b(?:bd|bid|twice|two times)\b/.test(lower)) times = ['morning', 'evening'];
    if (/\b(?:tds|tid|thrice|three times)\b/.test(lower)) times = ['morning', 'afternoon', 'evening'];
    if (/\b(?:qid|four times)\b/.test(lower)) times = ['morning', 'afternoon', 'evening', 'night'];
    if (/\b(?:night|bedtime|hs)\b/.test(lower) && !times.includes('night')) times = ['night'];
    results.push({ medicineName: match[1].trim(), dosage: match[2].trim(), times, instructions: line.slice(0, 240) });
  }
  return [...new Map(results.map(item => [`${item.medicineName.toLowerCase()}-${item.dosage.toLowerCase()}`, item])).values()].slice(0, 20);
}

export const importPrescriptionMedications = asyncHandler(async (request, response) => {
  const report = await MedicalReport.findOne({ _id: request.params.id, patient: request.user._id });
  if (!report) throw new AppError(404, 'Prescription report not found');
  if (report.reportType !== 'prescription' || report.summaryStatus !== 'ready') throw new AppError(409, 'A completed prescription summary is required');
  const medicines = prescriptionMedicines(`${report.aiSummary}\n${report.keyFindings.join('\n')}`);
  if (!medicines.length) throw new AppError(422, 'No medicine schedules could be detected automatically. Add them manually from Medication Manager.');
  const startDate = new Date().toISOString().slice(0, 10);
  const created = [];
  for (const medicine of medicines) {
    const existing = await Medication.findOne({ patient: request.user._id, medicineName: new RegExp(`^${medicine.medicineName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'), dosage: medicine.dosage, active: true });
    if (existing) continue;
    created.push(await Medication.create({ patient: request.user._id, prescriptionReport: report._id, source: 'prescription-ai', priority: 'important', startDate, ...medicine }));
  }
  response.json({ success: true, message: `${created.length} medicine schedule${created.length===1?'':'s'} imported. Review and edit them in Medication Manager.`, medications: created });
});

export const deleteMyMedicalReport = asyncHandler(async (request, response) => {
  const report = await MedicalReport.findOne({ _id: request.params.id, patient: request.user._id });
  if (!report) throw new AppError(404, 'Medical report not found');
  await deleteMedicalReport(report.cloudinaryPublicId, report.cloudinaryResourceType);
  await report.deleteOne();
  response.json({ success: true, message: 'Medical report removed' });
});
