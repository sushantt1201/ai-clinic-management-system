import mongoose from 'mongoose';

const medicalReportSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    reportType: {
      type: String,
      enum: ['lab-report', 'prescription', 'scan', 'discharge-summary', 'other'],
      default: 'other',
    },
    appointmentId: { type: String, trim: true, maxlength: 80 },
    originalName: { type: String, required: true, trim: true, maxlength: 180 },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    cloudinaryPublicId: { type: String, required: true, unique: true },
    cloudinaryResourceType: { type: String, default: 'image' },
    fileUrl: { type: String, required: true },
    summaryStatus: { type: String, enum: ['not-requested', 'pending', 'ready', 'failed'], default: 'not-requested' },
    aiSummary: { type: String, default: '' },
    keyFindings: { type: [String], default: [] },
    summaryError: { type: String, default: '' },
    summaryStartedAt: Date,
    sharedWithDoctor: { type: Boolean, default: false },
    sharedAt: Date,
  },
  { timestamps: true },
);

medicalReportSchema.index({ patient: 1, createdAt: -1 });

export const MedicalReport = mongoose.model('MedicalReport', medicalReportSchema);
