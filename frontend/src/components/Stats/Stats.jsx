import './Stats.css';
const stats = [['500+', 'Consultations'], ['97%', 'Satisfied patients'], ['15+', 'Medical specialists'], ['10+', 'Years of care']];
export default function Stats() { return <section className="stats" id="about" aria-label="People's Clinic at a glance"><div className="section-shell stats__grid">{stats.map(([value,label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div></section>; }
