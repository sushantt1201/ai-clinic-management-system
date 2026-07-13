import { HeartPulse, Mail, MapPin, Phone } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer" id="contact">
      <div className="section-shell footer__top">
        <div className="footer__brand">
          <div className="footer__brand-line"><HeartPulse size={40}/><strong>People’s Clinic</strong></div>
          <p>Thoughtful healthcare, made easier with secure technology and human compassion.</p>
        </div>
        <div className="footer__details">
          <h3>Visit us</h3>
          <p><MapPin size={18}/>Central Clinic Road<br/>Your City, India</p>
        </div>
        <div className="footer__map" id="location-map">
          <h3>Find us</h3>
          <div className="footer__map-window">
            <iframe title="People's Clinic location" src="https://www.google.com/maps?q=People%27s%20Clinic%2C%20India&z=15&output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </div>
        </div>
        <div className="footer__details">
          <h3>Contact</h3>
          <a href="tel:+911234567890"><Phone size={18}/>+91 12345 67890</a>
          <a href="mailto:care@peoplesclinic.com"><Mail size={18}/>care@peoplesclinic.com</a>
        </div>
        <a className="footer__cta" href="mailto:care@peoplesclinic.com?subject=Patient%20Complaint&body=Hello%20People%27s%20Clinic%2C%0A%0APlease%20describe%20your%20complaint%20here%3A%0A%0A">Have complaints?</a>
      </div>
      <div className="section-shell footer__bottom">
        <span>© 2026 People’s Clinic. All rights reserved.</span>
        <span>Privacy · Terms · Patient safety</span>
      </div>
    </footer>
  );
}
