import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BadgeCheck, BriefcaseMedical, Eye, EyeOff, HeartPulse, KeyRound, LockKeyhole, Mail, Phone, ShieldCheck, Stethoscope, UserRound } from 'lucide-react';
import './AuthPage.css';
import './AuthExtras.css';
import './AuthLayoutFixes.css';
import './AuthHeightFix.css';
import './AuthCompact.css';
import GoogleSignIn from '../components/Auth/GoogleSignIn.jsx';
import { apiRequest } from '../services/api.js';

const roleDetails = {
  patient: { title: 'Patient', greeting: 'Your care starts', accent: 'here.', copy: 'Book visits, view your health journey, and stay connected with People’s Clinic.', icon: UserRound },
  doctor: { title: 'Doctor', greeting: 'Welcome back,', accent: 'Doctor.', copy: 'Review your appointments and continue delivering thoughtful, connected care.', icon: Stethoscope },
  admin: { title: 'Administrator', greeting: 'Keep care running', accent: 'smoothly.', copy: 'Securely manage clinic operations, people, schedules, and daily activity.', icon: ShieldCheck },
};

function RoleIllustration({ role }) {
  const Icon = roleDetails[role].icon;
  return <div className={`role-art role-art--${role}`} aria-hidden="true"><span className="role-art__orb role-art__orb--one"/><span className="role-art__orb role-art__orb--two"/><div className="role-art__badge"><Icon size={25}/>{roleDetails[role].title} access</div><div className="role-character"><div className="role-character__hair"/><div className="role-character__head"><i/><i/><b/></div><div className="role-character__neck"/><div className="role-character__body"><span className="role-character__collar"/>{role === 'doctor' && <Stethoscope className="role-character__tool"/>}{role === 'admin' && <BriefcaseMedical className="role-character__tool"/>}{role === 'patient' && <HeartPulse className="role-character__tool"/>}</div></div></div>;
}

export default function AuthPage({ role, initialMode }) {
  const [mode, setMode] = useState(role === 'admin' ? 'login' : initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otp, setOtp] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const formRef = useRef(null);
  const details = roleDetails[role];

  function switchMode(nextMode) {
    if (role === 'admin' && nextMode === 'register') return;
    setMode(nextMode);
    setOtpSent(false);
    setOtpVerified(false);
    setOtp('');
    setFormMessage('');
    setVerificationToken('');
    window.location.hash = `${role}-${nextMode}`;
  }

  async function submitAuth(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (mode === 'register' && data.get('password') !== data.get('confirmPassword')) {
      const confirmation = event.currentTarget.elements.confirmPassword;
      confirmation.setCustomValidity('Passwords do not match. Enter the same password in both fields.');
      confirmation.reportValidity();
      setFormMessage('Passwords do not match. Please enter them again.');
      return;
    }
    if (mode === 'register' && !otpVerified) {
      setFormMessage('Verify your email or phone with the six-digit OTP first.');
      return;
    }
    try {
      setIsLoading(true); setFormMessage('');
      const enteredIdentifier = data.get('identifier')?.trim();
      const payload = mode === 'login'
        ? { identifier: /^\d{10}$/.test(enteredIdentifier) ? `+91${enteredIdentifier}` : enteredIdentifier, password: data.get('password'), expectedRole: role }
        : { fullName: data.get('fullName'), email: data.get('email'), phone: `+91${data.get('phone')}`, password: data.get('password'), role, verificationToken };
      const result = await apiRequest(`/auth/${mode}`, { method: 'POST', body: JSON.stringify(payload) });
      setFormMessage(result.message);
      if (mode === 'login' || result.user?.isActive) window.setTimeout(() => { window.location.hash = `${result.user.role}-dashboard`; }, 700);
    } catch (error) {
      setFormMessage(error.details?.[0]?.message || error.message);
    } finally { setIsLoading(false); }
  }

  function handleAuthInvalid(event) {
    const field = event.target;
    if (!(field instanceof HTMLInputElement)) return;
    if (field.validity.valueMissing) field.setCustomValidity(`${field.name === 'identifier' ? 'Email or phone' : field.name.replace(/([A-Z])/g, ' $1')} is required and cannot be empty.`);
    else if (field.name === 'fullName') field.setCustomValidity('Enter a valid full name using at least 3 letters.');
    else if (field.type === 'email') field.setCustomValidity('Enter a valid email address, for example name@example.com.');
    else if (field.name === 'phone') field.setCustomValidity('Enter your 10-digit phone number.');
    else if (field.name === 'identifier') field.setCustomValidity('Enter a valid email address or 10-digit phone number.');
    else if (field.name === 'password' && mode === 'register') field.setCustomValidity('Password needs 8+ characters, one uppercase letter, one lowercase letter, one number, and one special symbol.');
    else field.setCustomValidity('Please enter a valid value for this field.');
  }

  function clearFieldError(event) {
    if (event.target instanceof HTMLInputElement) event.target.setCustomValidity('');
  }

  function validateAuthOnBlur(event) {
    const field = event.target;
    if (!(field instanceof HTMLInputElement) || field.type === 'checkbox') return;
    field.setCustomValidity('');
    if (!field.value.trim()) return;
    if (field.name === 'confirmPassword' && field.value !== field.form?.elements.password?.value) {
      field.setCustomValidity('Passwords do not match. Enter the same password in both fields.');
    } else if (field.name === 'otp' && !/^\d{6}$/.test(field.value)) {
      field.setCustomValidity('OTP must contain exactly 6 numbers and cannot be empty.');
    } else if (!field.validity.valid) {
      handleAuthInvalid({ target: field });
    }
    if (!field.validity.valid) field.reportValidity();
  }

  async function sendOtp() {
    const emailField = formRef.current?.elements.email;
    if (!emailField?.value || !emailField.checkValidity()) { emailField?.reportValidity(); return; }
    try {
      setIsLoading(true);
      const result = await apiRequest('/auth/otp/send', { method: 'POST', body: JSON.stringify({ email: emailField.value }) });
      setOtpSent(true); setFormMessage(result.message);
    } catch (error) { setFormMessage(error.message); }
    finally { setIsLoading(false); }
  }

  async function verifyOtp(event) {
    if (!/^\d{6}$/.test(otp)) {
      const otpField = event.currentTarget.previousElementSibling;
      otpField.setCustomValidity('OTP must contain exactly 6 numbers and cannot be empty.');
      otpField.reportValidity();
      setFormMessage('Enter a valid six-digit OTP.');
      return;
    }
    try {
      setIsLoading(true);
      const email = formRef.current?.elements.email?.value;
      const result = await apiRequest('/auth/otp/verify', { method: 'POST', body: JSON.stringify({ email, code: otp }) });
      setVerificationToken(result.verificationToken); setOtpVerified(true); setFormMessage(result.message);
    } catch (error) { setFormMessage(error.message); }
    finally { setIsLoading(false); }
  }

  return <main className={`auth-page auth-page--${role}`}>
    <section className="auth-shell" aria-labelledby="auth-heading">
      <div className="auth-welcome">
        <a className="auth-brand" href="#home"><HeartPulse/><span><strong>People’s Clinic</strong><small>AI-Powered Healthcare</small></span></a>
        <div className="auth-welcome__copy"><p>{role} portal</p><h1>{details.greeting} <em>{details.accent}</em></h1><span>{details.copy}</span></div>
        <RoleIllustration role={role}/>
      </div>

      <div className={`auth-panel auth-panel--${mode}`}>
        <a className="auth-back" href="#home"><ArrowLeft size={17}/> Back to clinic</a>
        <div className="auth-panel__heading"><span className="auth-panel__icon"><details.icon size={24}/></span><div><p>{details.title} portal</p><h2 id="auth-heading">{mode === 'login' ? `${details.title} login` : 'Create your account'}</h2></div></div>
        {role !== 'admin' && <div className="auth-switch" role="tablist" aria-label="Authentication mode"><button className={mode === 'login' ? 'active' : ''} onClick={() => switchMode('login')} type="button">Login</button><button className={mode === 'register' ? 'active' : ''} onClick={() => switchMode('register')} type="button">Register</button></div>}

        {mode === 'login' && <><GoogleSignIn role={role} onStatus={(message, loading, success) => { setFormMessage(message); setIsLoading(Boolean(loading)); if (success) window.setTimeout(() => { window.location.hash = `${role}-dashboard`; }, 700); }}/><div className="auth-divider"><span>or continue with details</span></div></>}

        <form ref={formRef} className="auth-form" onSubmit={submitAuth} onInvalid={handleAuthInvalid} onInput={clearFieldError} onBlur={validateAuthOnBlur}>
          {mode === 'register' && <><label>Full name<span><UserRound/><input name="fullName" placeholder="Enter your full name" autoComplete="name" minLength="3" maxLength="60" pattern="[A-Za-z][A-Za-z .'-]{2,59}" title="Use 3–60 letters and normal name punctuation" required/></span></label><div className="auth-form__row"><label>Email address<span><Mail/><input name="email" type="email" placeholder="you@example.com" autoComplete="email" maxLength="120" required/></span></label><label>Phone number<span><Phone/><strong className="phone-prefix">+91</strong><input name="phone" type="tel" placeholder="Enter phone number" autoComplete="tel-national" inputMode="numeric" pattern="[0-9]{10}" maxLength="10" title="Enter your 10-digit phone number" required/></span></label></div></>}
          {mode === 'login' && <label>Email or phone<span><Mail/><input name="identifier" placeholder="Enter email or phone number" autoComplete="username" pattern="([^\s@]+@[^\s@]+\.[^\s@]+)|([0-9]{10})|(\+91[0-9]{10})" title="Enter a valid email address or 10-digit phone number" required/></span></label>}
          <label>Password<span><LockKeyhole/><input name="password" type={showPassword ? 'text' : 'password'} placeholder="Enter password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength="8" maxLength="64" pattern={mode === 'register' ? "(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,64}" : undefined} title={mode === 'register' ? 'Use at least 8 characters with uppercase, lowercase, number, and symbol' : undefined} required/><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff/> : <Eye/>}</button></span></label>
          {mode === 'register' && <label>Confirm password<span><LockKeyhole/><input name="confirmPassword" type={showPassword ? 'text' : 'password'} placeholder="Confirm password" autoComplete="new-password" minLength="8" maxLength="64" required/></span></label>}
          {mode === 'register' && <div className="auth-otp"><div className="auth-otp__title"><span><KeyRound size={17}/>Email OTP verification</span>{otpVerified && <b><BadgeCheck size={16}/>Verified</b>}</div>{!otpSent ? <button type="button" disabled={isLoading} onClick={sendOtp}>Send OTP to email</button> : !otpVerified ? <div className="auth-otp__entry"><input name="otp" inputMode="numeric" value={otp} onChange={(event) => { event.target.setCustomValidity(''); setOtp(event.target.value.replace(/\D/g, '').slice(0, 6)); }} pattern="[0-9]{6}" maxLength="6" placeholder="Enter 6-digit OTP" aria-label="Enter six digit OTP"/><button type="button" disabled={isLoading} onClick={verifyOtp}>Verify OTP</button></div> : <p>Your email has been verified.</p>}</div>}
          {mode === 'login' && <div className="auth-options"><label><input type="checkbox"/> Remember me</label><a href="#forgot-password">Forgot password?</a></div>}
          <button className="auth-submit" type="submit" disabled={isLoading || (mode === 'register' && !otpVerified)}>{isLoading ? 'Please wait…' : mode === 'login' ? `Login as ${details.title}` : otpVerified ? 'Create your account' : 'Verify OTP first'}<ArrowRight size={18}/></button>
          {formMessage && <p className={`auth-form__message${formMessage.includes('valid') || formMessage.includes('success') ? ' success' : ''}`} role="status">{formMessage}</p>}
        </form>
        {role !== 'admin' && <p className="auth-alternate">{mode === 'login' ? 'New to People’s Clinic?' : 'Already have an account?'} <button type="button" onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Create account' : 'Login instead'}</button></p>}
        {role !== 'patient' && mode === 'register' && <p className="auth-approval"><ShieldCheck size={16}/> {details.title} accounts require clinic verification before access is activated.</p>}
      </div>
    </section>
  </main>;
}
