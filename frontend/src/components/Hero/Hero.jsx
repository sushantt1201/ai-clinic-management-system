import { ArrowRight, Bot, CalendarCheck2, CalendarDays, Check, Clock3, Phone, PhoneCall, Sparkles, UserRound, Volume2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import './Hero.css';
import './FormEnhancements.css';
import './TransparentForm.css';

const careHighlights = ['Experienced doctors', 'Secure patient portal', 'Instant confirmation'];

function Hero() {
  const [bookingMode, setBookingMode] = useState('form');
  const [bookingMessage, setBookingMessage] = useState('');
  const bookingFormRef = useRef(null);
  const skipOutsideBlurRef = useRef(false);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    function resetWhenClickingOutside(event) {
      if (!bookingFormRef.current?.contains(event.target)) {
        skipOutsideBlurRef.current = true;
        bookingFormRef.current?.querySelectorAll('input').forEach((field) => field.setCustomValidity(''));
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

  function submitBooking(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const date = new Date(`${data.get('date')}T12:00:00`);
    const day = date.getDay();
    const time = data.get('time');
    if (day === 0 || day === 6) {
      const dateField = event.currentTarget.elements.date;
      dateField.setCustomValidity('The clinic is closed on weekends. Choose a Monday–Friday date.');
      dateField.reportValidity();
      setBookingMessage('The clinic is closed on Saturday and Sunday. Please select a weekday.');
      return;
    }
    if (!((time >= '09:00' && time <= '12:00') || (time >= '15:00' && time <= '17:00'))) {
      const timeField = event.currentTarget.elements.time;
      timeField.setCustomValidity('Select 9:00–12:00 or 15:00–17:00 during clinic hours.');
      timeField.reportValidity();
      setBookingMessage('Choose a time between 9:00–12:00 or 15:00–17:00.');
      return;
    }
    setBookingMessage('Your appointment details are valid and ready to submit.');
  }

  function handleBookingInvalid(event) {
    const field = event.target;
    if (!(field instanceof HTMLInputElement)) return;
    if (field.validity.valueMissing) field.setCustomValidity(`${field.name.charAt(0).toUpperCase() + field.name.slice(1)} is required and cannot be empty.`);
    else if (field.name === 'name') field.setCustomValidity('Enter a valid full name using at least 3 letters.');
    else if (field.name === 'phone') field.setCustomValidity('Enter a valid phone number containing 10–15 digits.');
    else if (field.name === 'date') field.setCustomValidity('Choose today or a future weekday date.');
    else if (field.name === 'time') field.setCustomValidity('Choose a valid appointment time during clinic hours.');
  }

  function validateBookingOnBlur(event) {
    if (skipOutsideBlurRef.current) return;
    const field = event.target;
    if (!(field instanceof HTMLInputElement)) return;
    field.setCustomValidity('');
    if (!field.value.trim()) return;
    if (!field.validity.valid) {
      handleBookingInvalid({ target: field });
    } else if (field.name === 'date' && field.value) {
      const day = new Date(`${field.value}T12:00:00`).getDay();
      if (day === 0 || day === 6) field.setCustomValidity('The clinic is closed on weekends. Choose a Monday–Friday date.');
    } else if (field.name === 'time' && field.value && !((field.value >= '09:00' && field.value <= '12:00') || (field.value >= '15:00' && field.value <= '17:00'))) {
      field.setCustomValidity('Select 9:00–12:00 or 15:00–17:00 during clinic hours.');
    }
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
            <button className={bookingMode === 'ai' ? 'active' : ''} onClick={() => setBookingMode('ai')} type="button"><Bot size={18} /> Book by appointment</button>
          </div>
          {bookingMode === 'form' ? (
            <form ref={bookingFormRef} className="booking-card__form" onSubmit={submitBooking} onInvalid={handleBookingInvalid} onInput={(event) => event.target.setCustomValidity?.('')} onBlur={validateBookingOnBlur}>
              <div><label htmlFor="booking-name">Full name</label><span className="booking-field"><UserRound size={18}/><input id="booking-name" name="name" placeholder="Enter your full name" minLength="3" maxLength="60" pattern="[A-Za-z][A-Za-z .'-]{2,59}" title="Use 3–60 letters and normal name punctuation" required /></span></div>
              <div><label htmlFor="booking-phone">Phone number</label><span className="booking-field"><Phone size={18}/><input id="booking-phone" name="phone" type="tel" inputMode="tel" placeholder="10–15 digit phone number" pattern="\+?[0-9]{10,15}" title="Enter 10–15 digits, optionally beginning with +" required /></span></div>
              <div className="booking-card__row"><div><label htmlFor="booking-date">Preferred date</label><span className="booking-field"><CalendarDays size={18}/><input id="booking-date" name="date" type="date" min={today} required /></span></div><div><label htmlFor="booking-time">Preferred time</label><span className="booking-field"><Clock3 size={18}/><input id="booking-time" name="time" type="time" min="09:00" max="17:00" step="900" required /></span></div></div>
              <button className="booking-card__submit" type="submit">Request appointment <ArrowRight size={17} /></button>
              {bookingMessage && <p className={`booking-card__message${bookingMessage.includes('valid') ? ' success' : ''}`} role="status">{bookingMessage}</p>}
            </form>
          ) : (
            <div className="booking-card__ai" id="ai-assistant"><div className="ai-call-visual"><span className="ai-call-visual__bot"><Bot size={32}/></span><span className="ai-call-visual__waves"><i/><i/><i/></span><span className="ai-call-visual__phone"><PhoneCall size={27}/></span></div><h2>Book with our AI call agent</h2><p>Talk naturally while the assistant finds a suitable appointment and securely collects your details.</p><div className="ai-call-visual__status"><Volume2 size={16}/> Ready to speak with you</div><button type="button">Start AI call <PhoneCall size={17}/></button></div>
          )}
        </div>
      </div>
    </section>
  );
}

export default Hero;
