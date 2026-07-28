import { AppError } from '../utils/app-error.js';
import { extractReportText } from './report-text.service.js';

const DEFAULT_WEBHOOK = 'https://n8n-latest-0t91.onrender.com/webhook/medical-report-summary';
const TIMEOUT_MS = 45_000;
const CHUNK_SIZE = 9_000;
const MAX_COMBINED_SUMMARIES = 18_000;

function splitReportText(text) {
  if (text.length <= CHUNK_SIZE) return [text];
  const chunks = [];
  let cursor = 0;
  while (cursor < text.length) {
    let end = Math.min(cursor + CHUNK_SIZE, text.length);
    if (end < text.length) {
      const breakAt = Math.max(text.lastIndexOf('\n', end), text.lastIndexOf('. ', end));
      if (breakAt > cursor + Math.floor(CHUNK_SIZE * 0.65)) end = breakAt + 1;
    }
    chunks.push(text.slice(cursor, end).trim());
    cursor = end;
  }
  return chunks.filter(Boolean);
}

async function callSummaryWebhook(webhook, payload) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const result = await fetch(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const data = await result.json().catch(() => ({}));
    if (!result.ok || data.success === false) throw new AppError(502, data.message || `AI workflow returned HTTP ${result.status}`);
    const summary = String(data.summary || data.aiSummary || data.output || '').trim();
    if (!summary) throw new AppError(502, 'AI workflow returned an empty summary');
    return {
      summary: summary.slice(0, 6000),
      keyFindings: Array.isArray(data.keyFindings) ? data.keyFindings.map(String).filter(Boolean).slice(0, 12) : [],
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(502, error?.name === 'AbortError' ? 'AI summary timed out; retry when n8n is awake' : 'Could not reach the AI summary workflow');
  } finally {
    clearTimeout(timeout);
  }
}

async function summarizeSection(webhook, payload, text, depth = 0) {
  try {
    return await callSummaryWebhook(webhook, { ...payload, reportText: text });
  } catch (error) {
    const payloadTooLarge = /(?:too large|payload|maximum context|request entity|413)/i.test(error.message);
    if (!payloadTooLarge || depth >= 2 || text.length < 2_000) throw error;
    const splitAt = Math.floor(text.length / 2);
    const left = await summarizeSection(webhook, payload, text.slice(0, splitAt), depth + 1);
    const right = await summarizeSection(webhook, payload, text.slice(splitAt), depth + 1);
    return {
      summary: `${left.summary}\n\n${right.summary}`.slice(0, 6000),
      keyFindings: [...new Set([...left.keyFindings, ...right.keyFindings])].slice(0, 12),
    };
  }
}

export async function requestMedicalSummary(report, suppliedFileData = '') {
  const webhook = process.env.N8N_MEDICAL_SUMMARY_WEBHOOK_URL?.trim() || DEFAULT_WEBHOOK;
  const extracted = await extractReportText(report, suppliedFileData);
  const basePayload = {
    reportId: report._id.toString(),
    title: report.title,
    reportType: report.reportType,
    mimeType: report.mimeType,
    fileName: report.originalName,
    fileUrl: report.fileUrl,
    extractionMethod: extracted.extractionMethod,
    textWasShortened: extracted.truncated,
  };
  const chunks = splitReportText(extracted.text);
  if (chunks.length === 1) return summarizeSection(webhook, basePayload, chunks[0]);

  const sectionSummaries = [];
  const keyFindings = [];
  for (let index = 0; index < chunks.length; index += 1) {
    const section = await summarizeSection(webhook, {
      ...basePayload,
      title: `${report.title} — section ${index + 1} of ${chunks.length}`,
      sectionNumber: index + 1,
      totalSections: chunks.length,
    }, chunks[index]);
    sectionSummaries.push(`Section ${index + 1}\n${section.summary}`);
    keyFindings.push(...section.keyFindings);
  }

  const combinedText = sectionSummaries.join('\n\n').slice(0, MAX_COMBINED_SUMMARIES);
  try {
    const combined = await summarizeSection(webhook, {
      ...basePayload,
      title: `${report.title} — consolidated summary`,
    }, `Consolidate the following section summaries into one complete, non-repetitive medical report summary.\n\n${combinedText}`);
    return { summary: combined.summary, keyFindings: [...new Set([...keyFindings, ...combined.keyFindings])].slice(0, 12) };
  } catch {
    return { summary: combinedText.slice(0, 6000), keyFindings: [...new Set(keyFindings)].slice(0, 12) };
  }
}
