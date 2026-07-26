function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  })[character]);
}

function inlineMarkdown(value) {
  return escapeHtml(value).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

function formatSummary(value) {
  const lines = String(value || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const output = [];
  let listOpen = false;
  for (const line of lines) {
    const bullet = line.match(/^[-•]\s+(.+)/);
    if (bullet) {
      if (!listOpen) {
        output.push('<ul>');
        listOpen = true;
      }
      output.push(`<li>${inlineMarkdown(bullet[1])}</li>`);
      continue;
    }
    if (listOpen) {
      output.push('</ul>');
      listOpen = false;
    }
    const plain = line.replace(/^#{1,4}\s*/, '');
    const heading = /^#{1,4}\s/.test(line) || /^\*\*[^*]+:\*\*$/.test(line)
      || /^(report overview|important measurements and findings|abnormal or notable values|main findings|key findings|questions to ask|medical report summary):?$/i.test(plain.replace(/\*\*/g, ''));
    const notice = /informational|not a medical diagnosis|clinician review/i.test(plain);
    output.push(heading ? `<h3>${inlineMarkdown(plain)}</h3>` : `<p class="${notice ? 'notice' : ''}">${inlineMarkdown(plain)}</p>`);
  }
  if (listOpen) output.push('</ul>');
  return output.join('');
}

export function printMedicalSummary(report) {
  const popup = window.open('', '_blank', 'noopener,noreferrer');
  if (!popup) {
    window.alert('Allow pop-ups to download the AI summary PDF.');
    return;
  }
  const findings = (report.keyFindings || []).map(item => `<li>${escapeHtml(item)}</li>`).join('');
  popup.document.write(`<!doctype html><html><head><title>${escapeHtml(report.title)} - AI summary</title>
  <style>@page{size:A4;margin:18mm}body{font:14px/1.65 Arial,sans-serif;color:#173f50}header{display:flex;align-items:center;gap:12px;border-bottom:2px solid #1492ae;padding-bottom:14px;margin-bottom:22px}.mark{width:44px;height:44px;display:grid;place-items:center;border-radius:12px;background:#0b829f;color:#fff;font-weight:900}h1{font-size:22px;margin:0}header p,.meta{margin:2px 0;color:#66838f}.summary{display:grid;gap:8px}.summary h3{margin:10px 0 0;padding:8px 10px;border-left:4px solid #0d91ad;background:#e8f6f8;color:#0b536b;font-size:15px}.summary p{margin:0}.summary ul{display:grid;gap:6px;margin:0;padding-left:22px}.notice{margin-top:16px!important;padding:10px 12px;border-radius:9px;background:#fff6df;color:#71571d;font-weight:700}footer{margin-top:30px;border-top:1px solid #d6e5e9;padding-top:10px;color:#78909a;font-size:11px}@media print{button{display:none}}</style>
  </head><body><header><div class="mark">PC</div><div><h1>People's Clinic</h1><p>AI-assisted medical report summary</p></div></header>
  <h2>${escapeHtml(report.title)}</h2><p class="meta">${escapeHtml(report.originalName)} · ${escapeHtml(report.reportType?.replaceAll('-', ' '))} · ${new Date(report.createdAt).toLocaleDateString('en-IN')}</p>
  <div class="summary">${formatSummary(report.aiSummary)}</div>${findings ? `<h3>Key findings</h3><ul>${findings}</ul>` : ''}
  <p class="notice">This AI-generated summary is informational only. A qualified clinician must review the original report before any medical decision.</p>
  <footer>Generated from the patient-uploaded record. Always refer to the original document for exact values.</footer>
  <script>window.onload=()=>window.print()<\/script></body></html>`);
  popup.document.close();
}
