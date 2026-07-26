import crypto from 'node:crypto';
import { AppError } from '../utils/app-error.js';

function cloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) throw new AppError(503, 'Medical report storage is not configured');
  if (!/^[a-z0-9_-]+$/i.test(cloudName)) {
    throw new AppError(503, 'CLOUDINARY_CLOUD_NAME must be the API cloud name shown in Cloudinary settings, not an API-key label');
  }
  return { cloudName, apiKey, apiSecret };
}

export async function uploadMedicalReport(fileData, patientId) {
  const { cloudName, apiKey, apiSecret } = cloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `people-clinic/medical-reports/${patientId}`;
  const signature = crypto.createHash('sha1').update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`).digest('hex');
  const form = new FormData();
  form.append('file', fileData);
  form.append('api_key', apiKey);
  form.append('timestamp', String(timestamp));
  form.append('folder', folder);
  form.append('signature', signature);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, { method: 'POST', body: form });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new AppError(502, data.error?.message || 'Medical report storage rejected the upload');
    if (!data.public_id || !data.secure_url) throw new AppError(502, 'Medical report storage returned an incomplete response');
    return { publicId: data.public_id, fileUrl: data.secure_url, resourceType: data.resource_type || 'image' };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(502, 'Could not reach medical report storage. Please try again.');
  }
}

async function destroyByResourceType(publicId, resourceType) {
  const { cloudName, apiKey, apiSecret } = cloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto.createHash('sha1').update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`).digest('hex');
  const form = new FormData();
  form.append('public_id', publicId);
  form.append('api_key', apiKey);
  form.append('timestamp', String(timestamp));
  form.append('signature', signature);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`, { method: 'POST', body: form });
  const data = await response.json().catch(() => ({}));
  return response.ok && ['ok', 'not found'].includes(data.result);
}

export async function deleteMedicalReport(publicId, resourceType = 'image') {
  const candidates = [...new Set([resourceType, 'image', 'raw'])];
  for (const candidate of candidates) {
    if (await destroyByResourceType(publicId, candidate)) return;
  }
  throw new AppError(502, 'The uploaded document could not be removed from storage');
}
