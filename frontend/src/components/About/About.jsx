import { ArrowRight, Bot, HeartHandshake, ShieldCheck, Stethoscope } from 'lucide-react';
import './About.css';

const values = [
  [Stethoscope, 'Connected care', 'Your appointments, doctors, and medical information stay connected in one simple experience.'],
  [ShieldCheck, 'Private and secure', 'Role-based access helps protect patient information while keeping care teams informed.'],
  [Bot, 'Helpful AI support', 'Book appointments by form or conversation and get assistance whenever the clinic is closed.'],
];

export default function About() {
  return (
    <section className="about section-pad" id="about" aria-labelledby="about-title">
      <div className="section-shell about__layout">
        <div className="about__intro">
          <p className="about__eyebrow"><HeartHandshake size={18}/> About People&apos;s Clinic</p>
          <h2 id="about-title">Healthcare built around people, not paperwork.</h2>
          <p>People&apos;s Clinic combines compassionate medical care with a secure digital portal. Patients can manage appointments and records, doctors can coordinate daily care, and administrators can keep the clinic running smoothly.</p>
          <a href="#services">Explore our care <ArrowRight size={18}/></a>
        </div>
        <div className="about__values">
          {values.map(([Icon, title, copy], index) => (
            <article key={title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <Icon size={30}/>
              <div><h3>{title}</h3><p>{copy}</p></div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
