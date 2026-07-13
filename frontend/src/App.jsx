import { useEffect, useState } from 'react';
import HomePage from './pages/HomePage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import AiAssistantPage from './pages/AiAssistantPage.jsx';

function App() {
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const updateRoute = () => setHash(window.location.hash);
    window.addEventListener('hashchange', updateRoute);
    return () => window.removeEventListener('hashchange', updateRoute);
  }, []);

  const authMatch = hash.match(/^#(patient|doctor|admin)-(login|register)$/);
  const dashboardMatch = hash.match(/^#(patient|doctor|admin)-dashboard$/);
  if (hash === '#forgot-password') return <ForgotPasswordPage />;
  if (hash === '#ai-assistant') return <AiAssistantPage />;
  if (dashboardMatch) return <DashboardPage expectedRole={dashboardMatch[1]} />;
  return authMatch ? <AuthPage key={`${authMatch[1]}-${authMatch[2]}`} role={authMatch[1]} initialMode={authMatch[2]} /> : <HomePage />;
}

export default App;
