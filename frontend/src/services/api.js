const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: { 'content-type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await response.json().catch(() => ({ message: 'The server returned an invalid response' }));
  if (!response.ok) {
    const error = new Error(data.message || 'Request failed');
    error.details = data.errors;
    throw error;
  }
  return data;
}
