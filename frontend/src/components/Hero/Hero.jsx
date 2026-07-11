import { ArrowRight, Bot, CalendarCheck2, CalendarDays, Check, Clock3, Phone, PhoneCall, Sparkles, UserRound, Volume2 } from 'lucide-react';
import { useState } from 'react';
import './Hero.css';
import './FormEnhancements.css';
import './TransparentForm.css';

const careHighlights = ['Experienced doctors', 'Secure patient portal', 'Instant confirmation'];

function Hero() {
  const [bookingMode, setBookingMode] = useState('form');
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
            <form className="booking-card__form" onSubmit={(event) => event.preventDefault()}>
              <div><label htmlFor="booking-name">Full name</label><span className="booking-field"><UserRound size={18}/><input id="booking-name" placeholder="Enter your name" required /></span></div>
              <div><label htmlFor="booking-phone">Phone number</label><span className="booking-field"><Phone size={18}/><input id="booking-phone" type="tel" placeholder="Your phone number" required /></span></div>
              <div className="booking-card__row"><div><label htmlFor="booking-date">Preferred date</label><span className="booking-field"><CalendarDays size={18}/><input id="booking-date" type="date" required /></span></div><div><label htmlFor="booking-time">Preferred time</label><span className="booking-field"><Clock3 size={18}/><input id="booking-time" type="time" required /></span></div></div>
              <button className="booking-card__submit" type="submit">Request appointment <ArrowRight size={17} /></button>
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
