import { useEffect, useState } from 'react';
import {
  CalendarDays,
  ChevronDown,
  Clock3,
  HeartPulse,
  MapPin,
  Menu,
  PhoneCall,
  ShieldCheck,
  Stethoscope,
  UserRound,
  X,
} from 'lucide-react';
import './Header.css';
import './HeaderBehavior.css';

const navigationItems = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'Doctors', href: '#doctors' },
  { label: 'AI Assistant', href: '#ai-assistant' },
  { label: 'Contact', href: '#contact' },
];

function LoginMenu({ isOpen, onClose, onToggle, variant }) {
  return (
    <div className={`login-menu login-menu--${variant}${isOpen ? ' login-menu--open' : ''}`}>
      <button
        className="login-button"
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        <UserRound aria-hidden="true" size={19} />
        <span>Login</span>
        <ChevronDown className="login-button__chevron" aria-hidden="true" size={16} />
      </button>

      <div className="login-dropdown" role="menu" aria-label="Choose login type">
        <a href="#patient-login" role="menuitem" onClick={onClose}>
          <span className="login-dropdown__icon login-dropdown__icon--patient" aria-hidden="true">
            <UserRound size={19} />
          </span>
          <span>
            <strong>Login as Patient</strong>
            <small>Appointments and health records</small>
          </span>
        </a>
        <a href="#doctor-login" role="menuitem" onClick={onClose}>
          <span className="login-dropdown__icon login-dropdown__icon--doctor" aria-hidden="true">
            <Stethoscope size={19} />
          </span>
          <span>
            <strong>Login as Doctor</strong>
            <small>Schedule and patient care</small>
          </span>
        </a>
        <a href="#admin-login" role="menuitem" onClick={onClose}>
          <span className="login-dropdown__icon login-dropdown__icon--admin" aria-hidden="true">
            <ShieldCheck size={19} />
          </span>
          <span>
            <strong>Login as Admin</strong>
            <small>Clinic management access</small>
          </span>
        </a>
      </div>
    </div>
  );
}

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginMenuOpen, setIsLoginMenuOpen] = useState(false);
  const [activeNavigation, setActiveNavigation] = useState('Home');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    function closeMenuOnEscape(event) {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
        setIsLoginMenuOpen(false);
      }
    }

    window.addEventListener('keydown', closeMenuOnEscape);
    return () => window.removeEventListener('keydown', closeMenuOnEscape);
  }, []);

  useEffect(() => {
    const updateHeader = () => setIsScrolled(window.scrollY > 24);
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
    return () => window.removeEventListener('scroll', updateHeader);
  }, []);

  function closeMenu() {
    setIsMenuOpen(false);
    setIsLoginMenuOpen(false);
  }

  function selectNavigation(label) {
    setActiveNavigation(label);
    closeMenu();
  }

  return (
    <header className={`site-header${isScrolled ? ' site-header--scrolled' : ''}`}>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <div className="site-header__utility">
        <div className="site-header__container site-header__utility-inner">
          <p className="site-header__hours">
            <Clock3 aria-hidden="true" size={16} />
            <span>Mon–Fri: 9:00 AM–12:00 PM &amp; 3:00 PM–5:00 PM · Sat–Sun: Closed</span>
          </p>

          <div className="site-header__quick-links" aria-label="Clinic quick information">
            <a href="tel:+15551234567" aria-label="Call People's Clinic">
              <PhoneCall aria-hidden="true" size={16} />
              <span>24/7 AI support</span>
            </a>
            <a href="#appointments" aria-label="Book an appointment">
              <CalendarDays aria-hidden="true" size={16} />
              <span>Book appointment</span>
            </a>
            <a href="#location-map" aria-label="View clinic location on the map">
              <MapPin aria-hidden="true" size={16} />
              <span>Find us</span>
            </a>
          </div>
        </div>
      </div>

      <div className="site-header__main">
        <div className="site-header__container site-header__main-inner">
          <a className="brand" href="#home" aria-label="People's Clinic home" onClick={closeMenu}>
            <span className="brand__mark" aria-hidden="true">
              <HeartPulse size={31} strokeWidth={2.2} />
            </span>
            <span className="brand__copy">
              <strong className="brand__name">
                <span>People&apos;s</span>
                <span className="brand__clinic-word">
                  CL
                  <Stethoscope className="brand__clinic-symbol" aria-label="i" role="img" />
                  NIC
                </span>
              </strong>
              <small>AI-Powered Healthcare</small>
            </span>
          </a>

          <nav
            id="primary-navigation"
            className={`primary-navigation${isMenuOpen ? ' primary-navigation--open' : ''}`}
            aria-label="Primary navigation"
          >
            <ul>
              {navigationItems.map((item) => (
                <li key={item.label}>
                  <a
                    className={item.label === activeNavigation ? 'primary-navigation__link--active' : undefined}
                    href={item.href}
                    aria-current={item.label === activeNavigation ? 'page' : undefined}
                    onClick={() => selectNavigation(item.label)}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>

            <LoginMenu
              variant="mobile"
              isOpen={isLoginMenuOpen}
              onClose={closeMenu}
              onToggle={() => setIsLoginMenuOpen((currentValue) => !currentValue)}
            />

            <p className="primary-navigation__trust">
              <ShieldCheck aria-hidden="true" size={16} />
              Secure access for patients, doctors, and admins
            </p>
          </nav>

          <div className="site-header__actions">
            <LoginMenu
              variant="desktop"
              isOpen={isLoginMenuOpen}
              onClose={() => setIsLoginMenuOpen(false)}
              onToggle={() => setIsLoginMenuOpen((currentValue) => !currentValue)}
            />

            <button
              className="menu-button"
              type="button"
              aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-controls="primary-navigation"
              aria-expanded={isMenuOpen}
              onClick={() => {
                if (isMenuOpen) setIsLoginMenuOpen(false);
                setIsMenuOpen((currentValue) => !currentValue);
              }}
            >
              {isMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
