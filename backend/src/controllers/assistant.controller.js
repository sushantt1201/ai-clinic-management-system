import { AppError } from '../utils/app-error.js';

const ASSISTANT_TIMEOUT_MS = 35_000;
const DEFAULT_ASSISTANT_WEBHOOK = 'https://n8n-latest-0t91.onrender.com/webhook/clinic-ai-assistant';

export async function chatWithAssistant(request, response) {
  const message = String(request.body.message || '').trim();
  const sessionId = String(request.body.sessionId || '').trim();
  if (message.length < 2 || message.length > 800) throw new AppError(422, 'Enter a clinic question between 2 and 800 characters');
  if (!/^[a-zA-Z0-9_-]{8,100}$/.test(sessionId)) throw new AppError(422, 'The chat session is invalid');

  const webhook = process.env.N8N_AI_ASSISTANT_WEBHOOK_URL?.trim() || DEFAULT_ASSISTANT_WEBHOOK;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ASSISTANT_TIMEOUT_MS);
  try {
    const result = await fetch(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message, sessionId, source: 'peoples-clinic-web' }),
      signal: controller.signal,
    });
    const data = await result.json().catch(() => ({}));
    const answer = data.answer || data.output || data.response || data.text;
    if (!result.ok || typeof answer !== 'string' || !answer.trim()) throw new AppError(502, data.message || 'The clinic assistant returned an invalid response');
    response.json({ success: true, answer: answer.trim() });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(502, error?.name === 'AbortError' ? 'The clinic assistant took too long to respond' : 'The clinic assistant is temporarily unavailable');
  } finally {
    clearTimeout(timeout);
  }
}
