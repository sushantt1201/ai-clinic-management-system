import { useEffect, useRef } from 'react';
import { apiRequest } from '../../services/api.js';
import './GoogleSignIn.css';

let googleScriptPromise;
function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!googleScriptPromise) googleScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true; script.defer = true; script.onload = resolve; script.onerror = reject;
    document.head.appendChild(script);
  });
  return googleScriptPromise;
}

export default function GoogleSignIn({ role, onStatus }) {
  const containerRef = useRef(null);
  const statusRef = useRef(onStatus);
  useEffect(() => { statusRef.current = onStatus; }, [onStatus]);
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) { statusRef.current('Google Client ID is missing from frontend/.env', false); return; }
    loadGoogleScript().then(() => {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          try {
            statusRef.current('Verifying Google account…', true);
            const result = await apiRequest('/auth/google', { method: 'POST', body: JSON.stringify({ credential, expectedRole: role }) });
            statusRef.current(result.message, false, true);
          } catch (error) { statusRef.current(error.message, false); }
        },
      });
      containerRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(containerRef.current, { type: 'standard', theme: 'outline', size: 'large', shape: 'pill', width: 320, text: 'signin_with' });
    }).catch(() => statusRef.current('Google sign-in could not load. Check your connection.', false));
  }, [role]);
  return <div className="auth-google-official" ref={containerRef} aria-label="Sign in with Google"/>;
}
