import { PDFParse } from 'pdf-parse';
import { createWorker } from 'tesseract.js';
import { tmpdir } from 'node:os';
import { AppError } from '../utils/app-error.js';

const MAX_REPORT_TEXT = 55_000;
const MAX_OCR_PDF_PAGES = 20;
const MIN_USEFUL_PDF_TEXT = 120;
const REPORT_DOWNLOAD_TIMEOUT_MS = 30_000;
const OCR_TIMEOUT_MS = 90_000;

let ocrQueue = Promise.resolve();

function normalizeText(value) {
  return String(value || '')
    .replace(/\u0000/g, '')
    .normalize('NFKD')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}

function limitText(value) {
  const text = normalizeText(value);
  if (text.length <= MAX_REPORT_TEXT) return text;
  const headLength = Math.floor(MAX_REPORT_TEXT * 0.78);
  const tailLength = MAX_REPORT_TEXT - headLength;
  return `${text.slice(0, headLength)}\n\n[Middle section shortened for AI processing]\n\n${text.slice(-tailLength)}`;
}

function decodeDataUrl(fileData, expectedMimeType) {
  const match = String(fileData || '').match(/^data:([^;,]+);base64,([A-Za-z0-9+/=\s]+)$/);
  if (!match || match[1] !== expectedMimeType) throw new AppError(400, 'Medical report data is invalid');
  return Buffer.from(match[2], 'base64');
}

async function recognizeImage(image) {
  const previous = ocrQueue;
  let release;
  ocrQueue = new Promise((resolve) => {
    release = resolve;
  });
  await previous;

  let worker;
  try {
    worker = await Promise.race([
      createWorker('eng', undefined, { cachePath: tmpdir() }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('OCR worker timed out')), OCR_TIMEOUT_MS)),
    ]);
    const result = await Promise.race([
      worker.recognize(image),
      new Promise((_, reject) => setTimeout(() => reject(new Error('OCR recognition timed out')), OCR_TIMEOUT_MS)),
    ]);
    return normalizeText(result.data.text);
  } catch {
    throw new AppError(422, 'Text could not be read from this image. Try a clearer, well-lit scan.');
  } finally {
    if (worker) await worker.terminate().catch(() => {});
    release();
  }
}

async function extractPdfText(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const embeddedText = normalizeText(result.text);
    if (embeddedText.length >= MIN_USEFUL_PDF_TEXT) {
      return { text: limitText(embeddedText), extractionMethod: 'pdf-text', truncated: embeddedText.length > MAX_REPORT_TEXT };
    }

    const screenshots = await parser.getScreenshot({
      desiredWidth: 1600,
      first: MAX_OCR_PDF_PAGES,
      imageBuffer: true,
      imageDataUrl: false,
    });
    const pages = [];
    for (const page of screenshots.pages.slice(0, MAX_OCR_PDF_PAGES)) {
      const pageText = await recognizeImage(Buffer.from(page.data));
      if (pageText) pages.push(`Page ${page.pageNumber}\n${pageText}`);
    }
    const ocrText = normalizeText(pages.join('\n\n'));
    if (!ocrText) throw new AppError(422, 'No readable text was found in this PDF');
    return {
      text: limitText(ocrText),
      extractionMethod: 'pdf-ocr',
      truncated: screenshots.total > MAX_OCR_PDF_PAGES || ocrText.length > MAX_REPORT_TEXT,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(422, 'This PDF could not be read. Check that it is not password protected or damaged.');
  } finally {
    await parser.destroy().catch(() => {});
  }
}

async function loadReportBuffer(report, suppliedFileData) {
  if (suppliedFileData) return decodeDataUrl(suppliedFileData, report.mimeType);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REPORT_DOWNLOAD_TIMEOUT_MS);
  try {
    const response = await fetch(report.fileUrl, { signal: controller.signal });
    if (!response.ok) throw new AppError(502, 'Could not download the medical report for summarization');
    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(502, error?.name === 'AbortError'
      ? 'Downloading the medical report timed out. Select Retry summary to try again.'
      : 'Could not download the medical report for summarization');
  } finally {
    clearTimeout(timeout);
  }
}

export async function extractReportText(report, suppliedFileData = '') {
  const buffer = await loadReportBuffer(report, suppliedFileData);
  if (report.mimeType === 'application/pdf') return extractPdfText(buffer);
  if (['image/jpeg', 'image/png', 'image/webp'].includes(report.mimeType)) {
    const text = await recognizeImage(buffer);
    if (!text) throw new AppError(422, 'No readable text was found in this image');
    return { text: limitText(text), extractionMethod: 'image-ocr', truncated: text.length > MAX_REPORT_TEXT };
  }
  throw new AppError(400, 'Only PDF, JPG, PNG and WEBP medical reports can be summarized');
}
