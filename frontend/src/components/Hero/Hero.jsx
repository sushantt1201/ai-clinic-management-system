import { ArrowRight, Bot, CalendarCheck2, CalendarDays, Check, Clock3, Mail, Phone, PhoneCall, Sparkles, Stethoscope, UserRound, Volume2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import './Hero.css';
import './FormEnhancements.css';
import './TransparentForm.css';
import { apiRequest } from '../../services/api.js';
import BookingCheckout from '../Booking/BookingCheckout.jsx';

const careHighlights = ['Experienced doctors', 'Secure patient portal', 'Instant confirmation'];

function Hero() {
  const [bookingMode, setBookingMode] = useState('form');
  const [bookingMessage, setBookingMessage] = useState('');
  const [bookingFlow, setBookingFlow] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const bookingFormRef = useRef(null);
  const skipOutsideBlurRef = useRef(false);
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

  useEffect(() => {
    function resetWhenClickingOutside(event) {
      if (!bookingFormRef.current?.contains(event.target)) {
        skipOutsideBlurRef.current = true;
        bookingFormRef.current?.querySelectorAll('input, select').forEach((field) => field.setCustomValidity(''));
        if (document.activeElement instanceof HTMLElement && bookingFormRef.current?.contains(document.activeElement)) {
          document.activeElement.blur();
        }
        bookingFormRef.current?.reset();
        setBookingMessage('');
        window.requestAnimationFrame(() => { skipOutsideBlurRef.current = false; });
      }
    }

    document.addEventListener('pointerdown', resetWhenClickingOutside, true);
    return () => document.removeEventListener('pointerdown', resetWhenClickingOutside, true);
  }, []);

  async function submitBooking(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const selectedDate = data.get('date');
    if (selectedDate < today) {
      const dateField = event.currentTarget.elements.date;
      dateField.setCustomValidity('Choose today or a future date.');
      dateField.reportValidity();
      setBookingMessage('Past dates cannot be used for an appointment request.');
      return;
    }

    const appointmentRequest = {
      name: data.get('name').trim(),
      email: data.get('email').trim().toLowerCase(),
      phone: `+91${data.get('phone')}`,
      doctor: data.get('doctor'),
      appointmentDate: selectedDate,
      appointmentTime: data.get('time'),
      source: 'website-booking-form',
    };
    try {
      setBookingMessage('Checking the selected slot…'); setAvailableSlots([]);
      const result = await apiRequest('/appointments/request', { method:'POST', body:JSON.stringify(appointmentRequest) });
      setBookingFlow({ ...result, request:appointmentRequest }); setBookingMessage('');
    } catch (error) {
      setBookingMessage(error.message);
      setAvailableSlots(error.data?.availableSlots || []);
    }
  }

  function handleBookingInvalid(event) {
    const field = event.target;
    if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement)) return;
    if (field.validity.valueMissing) field.setCustomValidity(`${field.name.charAt(0).toUpperCase() + field.name.slice(1)} is required and cannot be empty.`);
    else if (field.name === 'name') field.setCustomValidity('Enter a valid full name using at least 3 letters.');
    else if (field.name === 'email') field.setCustomValidity('Enter a valid email address, such as name@example.com.');
    else if (field.name === 'phone') field.setCustomValidity('Enter your 10-digit phone number.');
    else if (field.name === 'doctor') field.setCustomValidity('Select your preferred doctor.');
    else if (field.name === 'date') field.setCustomValidity('Choose today or a future date.');
    else if (field.name === 'time') field.setCustomValidity('Choose your preferred appointment time.');
  }

  function validateBookingOnBlur(event) {
    if (skipOutsideBlurRef.current) return;
    const field = event.target;
    if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement)) return;
    field.setCustomValidity('');
    const nextField = event.relatedTarget;
    if (!nextField || !bookingFormRef.current?.contains(nextField)) return;
    if (!field.value.trim()) return;
    if (!field.validity.valid) {
      handleBookingInvalid({ target: field });
    } else if (field.name === 'date' && field.value < today) field.setCustomValidity('Choose today or a future date.');
    if (!field.validity.valid) field.reportValidity();
  }
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__glow hero__glow--one" aria-hidden="true" />
      <div className="hero__glow hero__glow--two" aria-hidden="true" />

      <div className="hero__container">
        <div className="hero__content">
          <p className="hero__eyebrow">
            <Sparkles aria-hidden="true" size={17} />
            Smarter care, closer to home
          </p>

          <h1 id="hero-title">Your journey<br />to better health.</h1>

          <p className="hero__description">
            Personal care, trusted doctors, and intelligent support—together in one secure clinic experience.
          </p>

          <div className="hero__actions" aria-label="Primary clinic actions">
            <a className="hero__button hero__button--primary" href="#about">
              Learn More
              <ArrowRight aria-hidden="true" size={18} />
            </a>
            <a className="hero__button hero__button--secondary" href="#ai-assistant">
              <Bot aria-hidden="true" size={20} />
              Talk to AI Assistant
            </a>
          </div>

          <ul className="hero__highlights" aria-label="People's Clinic care benefits">
            {careHighlights.map((highlight) => (
              <li key={highlight}>
                <span aria-hidden="true">
                  <Check size={14} strokeWidth={3} />
                </span>
                {highlight}
              </li>
            ))}
          </ul>
        </div>

        <div className="booking-card" id="appointments">
          <div className="booking-card__tabs" role="tablist" aria-label="Booking method">
            <button className={bookingMode === 'form' ? 'active' : ''} onClick={() => setBookingMode('form')} type="button"><CalendarCheck2 size={18} /> Book by form</button>
            <button className={bookingMode === 'ai' ? 'active' : ''} onClick={() => setBookingMode('ai')} type="button"><Bot size={18} /> Book by AI agent</button>
          </div>
          {bookingMode === 'form' ? (
            <form ref={bookingFormRef} className="booking-card__form" onSubmit={submitBooking} onInvalid={handleBookingInvalid} onInput={(event) => event.target.setCustomValidity?.('')} onBlur={validateBookingOnBlur}>
              <div><label htmlFor="booking-name">Full name</label><span className="booking-field"><UserRound size={18}/><input id="booking-name" name="name" placeholder="Enter your full name" minLength="3" maxLength="60" pattern="[A-Za-z][A-Za-z .'-]{2,59}" title="Use 3–60 letters and normal name punctuation" required /></span></div>
              <div className="booking-card__row"><div><label htmlFor="booking-email">Email address</label><span className="booking-field"><Mail size={18}/><input id="booking-email" name="email" type="email" inputMode="email" autoComplete="email" placeholder="Enter email address" maxLength="120" required /></span></div><div><label htmlFor="booking-phone">Phone number</label><span className="booking-field"><Phone size={18}/><strong className="phone-prefix">+91</strong><input id="booking-phone" name="phone" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="Enter phone number" pattern="[0-9]{10}" maxLength="10" title="Enter your 10-digit phone number" required /></span></div></div>
              <div className="booking-card__row"><div><label htmlFor="booking-date">Preferred date</label><span className="booking-field"><CalendarDays size={18}/><input id="booking-date" name="date" type="date" min={today} required /></span></div><div><label htmlFor="booking-time">Preferred time</label><span className="booking-field"><Clock3 size={18}/><input id="booking-time" name="time" type="time" required /></span></div></div>
              <div><label htmlFor="booking-doctor">Preferred doctor</label><span className="booking-field"><Stethoscope size={18}/><select id="booking-doctor" name="doctor" defaultValue="" required><option value="" disabled>Select a doctor</option><option value="dr-ananya-sharma">Dr. Ananya Sharma — General Medicine</option><option value="dr-rahul-mehta">Dr. Rahul Mehta — Dental Care</option><option value="dr-priya-verma">Dr. Priya Verma — Cardiology</option></select></span></div>
              <button className="booking-card__submit" type="submit">Request appointment <ArrowRight size={17} /></button>
              {availableSlots.length>0&&<div className="booking-card__slots"><b>Available times that day</b><div>{availableSlots.map(slot=><button type="button" key={slot} onClick={()=>{bookingFormRef.current.elements.time.value=slot;setAvailableSlots([]);setBookingMessage('Selected '+slot+'. Submit again to continue.')}}>{slot}</button>)}</div></div>}
              {bookingMessage && <p className={`booking-card__message${bookingMessage.includes('valid') || bookingMessage.includes('sent') ? ' success' : ''}`} role="status">{bookingMessage}</p>}
            </form>
          ) : (
            <div className="booking-card__ai" id="ai-assistant"><div className="ai-call-visual"><span className="ai-call-visual__bot"><Bot size={32}/></span><span className="ai-call-visual__waves"><i/><i/><i/></span><span className="ai-call-visual__phone"><PhoneCall size={27}/></span></div><h2>Book with our AI call agent</h2><p>Talk naturally while the assistant finds a suitable appointment and securely collects your details.</p><div className="ai-call-visual__status"><Volume2 size={16}/> Ready to speak with you</div><button type="button">Start AI call <PhoneCall size={17}/></button></div>
          )}
        </div>
      </div>
      {bookingFlow&&<BookingCheckout booking={bookingFlow} onClose={()=>setBookingFlow(null)}/>}
    </section>
  );
}

export default Hero;
