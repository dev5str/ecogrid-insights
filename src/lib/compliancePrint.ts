function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Strip markdown-style headings and bullet prefixes for cleaner PDF/print output. */
function stripNarrativeForPrint(narrative: string): string {
  return narrative
    .split("\n")
    .map((line) => {
      let s = line.replace(/^\s*#{2}\s+/, "");
      s = s.replace(/^\s*-\s+/, "");
      return s;
    })
    .join("\n");
}

/** Printable window with Ollama (local LLM) narrative (escaped; safe for print / Save as PDF). */
export function openComplianceReportWithGeminiNarrative(opts: {
  institutionName: string;
  reportMonth: string;
  narrative: string;
}) {
  const { institutionName, reportMonth, narrative } = opts;
  const body = escapeHtml(stripNarrativeForPrint(narrative));
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>EcoGrid Environmental Compliance - ${escapeHtml(institutionName)}</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 820px; margin: 0 auto; color: #111; }
    h1 { font-size: 1.35rem; margin-bottom: 0.25rem; }
    .meta { color: #444; font-size: 10pt; margin-bottom: 1.25rem; }
    .badge { font-size: 9pt; color: #555; margin-bottom: 1rem; }
    pre.narrative { white-space: pre-wrap; font-family: system-ui, "Segoe UI", sans-serif; font-size: 10.5pt; line-height: 1.5; margin: 0; }
    @media print { body { padding: 0.5in; } }
  </style>
</head>
<body>
  <h1>Environmental compliance draft (AI-assisted)</h1>
  <p class="meta"><strong>Institution:</strong> ${escapeHtml(institutionName)}<br/>
  <strong>Reporting period:</strong> ${escapeHtml(reportMonth)}</p>
  <p class="badge">Narrative below is model-generated from simulated dashboard metrics. Human review required.</p>
  <pre class="narrative">${body}</pre>
</body>
</html>`;
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
  return true;
}

/** Opens a print dialog with a NAAC / ISO 14001–style environmental audit draft (static template). */
export function openComplianceReportPrint(opts: { institutionName: string; reportMonth: string }) {
  const { institutionName, reportMonth } = opts;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>EcoGrid Environmental Compliance - ${institutionName}</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; color: #111; }
    h1 { font-size: 1.35rem; margin-bottom: 0.25rem; }
    h2 { font-size: 1rem; margin-top: 1.5rem; border-bottom: 1px solid #ccc; padding-bottom: 0.25rem; }
    p, li { font-size: 11pt; line-height: 1.45; }
    .meta { color: #444; font-size: 10pt; margin-bottom: 1.5rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; font-size: 10pt; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
    th { background: #f4f4f4; }
    @media print { body { padding: 0.5in; } }
  </style>
</head>
<body>
  <h1>Environmental Performance Summary</h1>
  <p class="meta"><strong>Institution:</strong> ${institutionName}<br/>
  <strong>Reporting period:</strong> ${reportMonth}<br/>
  <strong>System:</strong> EcoGrid Insights (automated draft - verify before NAAC / ISO 14001 / CSR submission)</p>

  <h2>1. Executive summary</h2>
  <p>Consolidated electricity, water, waste, and indoor air metrics were monitored across campus zones. This document is generated from live telemetry snapshots and is intended as a starting point for accreditation and compliance filings.</p>

  <h2>2. Resource indicators (representative)</h2>
  <table>
    <thead><tr><th>Indicator</th><th>Status</th><th>Notes</th></tr></thead>
    <tbody>
      <tr><td>Grid electricity</td><td>Within simulated baseline</td><td>Peak demand tracked by zone</td></tr>
      <tr><td>Potable water</td><td>Flow anomalies flagged</td><td>Wing-level attribution in dashboard</td></tr>
      <tr><td>Solid waste</td><td>Fill levels monitored</td><td>Bin-level export available as CSV</td></tr>
      <tr><td>Indoor air (AQI proxy)</td><td>Gas PPM tracked</td><td>Purifier correlation (simulation)</td></tr>
    </tbody>
  </table>

  <h2>3. Continuous improvement</h2>
  <ul>
    <li>Student-led campus reports (housekeeping / water / energy waste) logged for operations follow-up.</li>
    <li>Electricity anomaly engine tags context (e.g. unoccupied zone + after hours) for faster root-cause review.</li>
    <li>Unified EcoGrid Health Score supports inter-institution benchmarking (Chennai pilot).</li>
  </ul>

  <h2>4. Sign-off</h2>
  <p>Prepared automatically by EcoGrid Insights. Authorized signatory and institutional stamp required for official submission.</p>
</body>
</html>`;
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
  return true;
}
