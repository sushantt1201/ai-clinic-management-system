import './MedicalSummary.css';

function InlineText({ children }) {
  const parts = String(children || '').split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, index) => part.startsWith('**') && part.endsWith('**')
    ? <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>
    : <span key={`${part}-${index}`}>{part}</span>);
}

export default function MedicalSummary({ summary, compact = false }) {
  const lines = String(summary || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const content = [];
  let list = [];

  const flushList = () => {
    if (!list.length) return;
    content.push(<ul key={`list-${content.length}`}>{list.map((item, index) => <li key={`${item}-${index}`}><InlineText>{item}</InlineText></li>)}</ul>);
    list = [];
  };

  lines.forEach(line => {
    const bullet = line.match(/^[-•]\s+(.+)/);
    const numbered = line.match(/^\d+[.)]\s+(.+)/);
    if (bullet || numbered) {
      list.push((bullet || numbered)[1]);
      return;
    }
    flushList();
    const plain = line.replace(/^#{1,4}\s*/, '');
    const heading = /^#{1,4}\s/.test(line)
      || /^\*\*[^*]+:\*\*$/.test(line)
      || /^(report overview|important measurements and findings|abnormal or notable values|main findings|key findings|questions to ask|suggested questions|medical report summary):?$/i.test(plain.replace(/\*\*/g, ''));
    const notice = /informational|not a medical diagnosis|clinician review|qualified (doctor|clinician)/i.test(plain);
    if (heading) content.push(<h4 key={`heading-${content.length}`}><InlineText>{plain}</InlineText></h4>);
    else content.push(<p className={notice ? 'medical-summary__notice' : ''} key={`paragraph-${content.length}`}><InlineText>{plain}</InlineText></p>);
  });
  flushList();

  return <div className={`medical-summary ${compact ? 'medical-summary--compact' : ''}`}>{content}</div>;
}
