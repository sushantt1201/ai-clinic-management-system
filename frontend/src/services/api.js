const configuredApiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
const isVercelDeployment =
  typeof window !== 'undefined' && window.location.hostname.endsWith('.vercel.app');

// Keep production API traffic on the same Vercel origin. Vercel proxies these
// requests to Render, preventing browsers and privacy extensions from blocking
// the cross-site request before it reaches the backend.
const API_URL = isVercelDeployment
  ? '/api/v1'
  : configuredApiUrl || 'http://localhost:5000/api/v1';

export async function apiRequest(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: { ...(isFormData ? {} : { 'content-type': 'application/json' }), ...options.headers },
    ...options,
  });
  const data = await response.json().catch(() => ({ message: 'The server returned an invalid response' }));
  if (!response.ok) {
    const error = new Error(data.message || 'Request failed');
    error.details = data.errors;
    error.data = data;
    throw error;
  }
  return data;
}
