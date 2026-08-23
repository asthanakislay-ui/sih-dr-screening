// generateReport.js
//
// Builds a self-contained DOM report from the current screening result and
// triggers the browser's print dialog so the user can save it as PDF
// (Chrome/Edge/Firefox "Save as PDF" in the print dialog).
//
// Why print-to-PDF instead of a real PDF library:
//   The project intentionally keeps dependencies minimal (no jsPDF installed).
//   HTML print-to-PDF is a zero-dependency, accessible, faithful-to-the-UI
//   way to produce a report. The same DOM can be visually inspected before
//   the user commits to "Save as PDF".
//
// Guarantees:
//   - Only renders fields that exist in the input. Missing fields show
//     "Not available" — the report never invents medical data.
//   - Cleans up the DOM tree and the document title it may mutate, even
//     if the user cancels the print dialog.

import { DR_CLASSES } from '../services/screeningService'

const REPORT_MODE_ATTR = 'data-report-mode'

function escapeHtml(value) {
  if (value === null || value === undefined) return 'Not available'
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatPercent(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'Not available'
  return `${Math.round(value * 100)}%`
}

function formatMs(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'Not available'
  return `${value} ms`
}

function formatDate(value) {
  if (!value) return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  return value
}

const gradeMap = {
  'No DR': 'No DR',
  Mild: 'Mild NPDR',
  Moderate: 'Moderate NPDR',
  Severe: 'Severe NPDR',
  Proliferative: 'Proliferative DR',
}

const evidenceLabels = {
  microaneurysms: 'Microaneurysms',
  hemorrhages: 'Hemorrhages',
  exudates: 'Exudates',
  neovascularization: 'Neovascularization',
}

function buildReportHtml({ data, diagnosis, evidence, recommendation }) {
  const { result, patient, screeningDate, originalImageBase64 } = data
  const patientBlock = patient
    ? `
      <dl class="report-grid">
        <div><dt>Patient ID</dt><dd>${escapeHtml(patient.id)}</dd></div>
        <div><dt>Patient Name</dt><dd>${escapeHtml(patient.name)}</dd></div>
        <div><dt>Age</dt><dd>${escapeHtml(patient.age)}</dd></div>
        <div><dt>Gender</dt><dd>${escapeHtml(patient.gender)}</dd></div>
        <div><dt>Screening Date</dt><dd>${escapeHtml(formatDate(screeningDate))}</dd></div>
      </dl>`
    : '<p class="report-muted">Patient details were not captured for this screening.</p>'

  const diagnosisBlock = diagnosis
    ? `
      <div class="report-diagnosis">
        <p class="report-label">Classification</p>
        <p class="report-grade">${escapeHtml(diagnosis.grade)}</p>
        <span class="report-pill ${diagnosis.referable ? 'report-pill--refer' : 'report-pill--normal'}">${escapeHtml(diagnosis.label)}</span>
        <dl class="report-grid report-grid--two">
          <div><dt>Model confidence</dt><dd>${escapeHtml(diagnosis.confidence)}</dd></div>
          <div><dt>Inference time</dt><dd>${escapeHtml(formatMs(result?.processing_time_ms))}</dd></div>
        </dl>
      </div>`
    : '<p class="report-muted">Classification results are not available.</p>'

  const probabilities = Array.isArray(result?.all_probs)
    ? result.all_probs.map((prob, idx) => {
        const label = DR_CLASSES[idx] || `Class ${idx}`
        const pct = typeof prob === 'number' ? Math.round(prob * 100) : 0
        return `
          <tr>
            <td>${escapeHtml(label)}</td>
            <td>
              <div class="report-bar"><div class="report-bar-fill" style="width:${pct}%"></div></div>
            </td>
            <td class="report-num">${pct}%</td>
          </tr>`
      }).join('')
    : ''

  const probabilitiesBlock = probabilities
    ? `
      <table class="report-prob">
        <thead><tr><th>Class</th><th>Probability</th><th class="report-num">Value</th></tr></thead>
        <tbody>${probabilities}</tbody>
      </table>`
    : '<p class="report-muted">Class probabilities were not provided by the model.</p>'

  const evidenceBlock = evidence
    ? `
      <ul class="report-evidence">
        ${Object.entries(evidence).map(([key, status]) => `
          <li>
            <span>${escapeHtml(evidenceLabels[key] || key)}</span>
            <span class="${status === 'Detected' ? 'report-evidence--detected' : 'report-evidence--absent'}">${escapeHtml(status)}</span>
          </li>
        `).join('')}
      </ul>`
    : ''

  const originalImg = originalImageBase64
    ? `data:image/png;base64,${originalImageBase64}`
    : null
  const heatmapImg = result?.heatmap_base64
    ? `data:image/png;base64,${result.heatmap_base64}`
    : null

  const imagesBlock = `
    <div class="report-images">
      <figure>
        <figcaption>Original fundus image</figcaption>
        ${originalImg
          ? `<img src="${originalImg}" alt="Original fundus image" />`
          : '<p class="report-muted">Original image not available.</p>'}
      </figure>
      <figure>
        <figcaption>Grad-CAM visualization</figcaption>
        ${heatmapImg
          ? `<img src="${heatmapImg}" alt="Grad-CAM visualization" />`
          : '<p class="report-muted">Grad-CAM visualization not available.</p>'}
      </figure>
    </div>`

  return `
    <article class="report-root">
      <header class="report-head">
        <div>
          <p class="report-eyebrow">Retina</p>
          <h1>DR Screening Report</h1>
          <p class="report-sub">AI-assisted diabetic retinopathy screening result</p>
        </div>
        <div class="report-meta">
          <p><span>Case</span><strong>${escapeHtml(patient?.id || 'N/A')}</strong></p>
          <p><span>Generated</span><strong>${escapeHtml(new Date().toLocaleString())}</strong></p>
        </div>
      </header>

      <section class="report-section">
        <h2>Patient information</h2>
        ${patientBlock}
      </section>

      <section class="report-section">
        <h2>Screening result</h2>
        ${diagnosisBlock}
      </section>

      <section class="report-section">
        <h2>Class probabilities</h2>
        ${probabilitiesBlock}
      </section>

      <section class="report-section">
        <h2>Imaging</h2>
        ${imagesBlock}
      </section>

      <section class="report-section">
        <h2>Detected evidence</h2>
        ${evidenceBlock || '<p class="report-muted">Lesion evidence was not produced for this screening.</p>'}
      </section>

      <section class="report-section">
        <h2>Recommendation</h2>
        ${recommendation
          ? `<p class="report-rec-title">${escapeHtml(recommendation.title)}</p>
             <p>${escapeHtml(recommendation.text)}</p>`
          : '<p class="report-muted">No recommendation was produced.</p>'}
      </section>

      <footer class="report-foot">
        <p>
          This report is generated by a research / demonstration system and is intended
          for clinical decision support only. It is not a substitute for evaluation by a
          qualified ophthalmologist. All findings should be confirmed by a licensed clinician
          before any treatment decision is made.
        </p>
      </footer>
    </article>
  `
}

/**
 * Open the browser print dialog with the current screening result laid out
 * for paper. The user can pick "Save as PDF" in the dialog to download the
 * report without any new dependency.
 *
 * @param {object} args
 * @param {object} args.data        - Parsed sessionStorage.screeningResult.
 * @param {object} args.diagnosis   - Output of mapDiagnosis (grade, label, referable, confidence).
 * @param {object} args.evidence    - Object of evidence-label -> 'Detected' / 'Not detected'.
 * @param {object} args.recommendation - { title, text }.
 * @param {string} [args.title]     - Document title to show in the print dialog header.
 */
export function openReportPrintDialog({ data, diagnosis, evidence, recommendation, title }) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('Report generation requires a browser environment.')
  }
  if (!data) {
    throw new Error('No screening data available to generate the report.')
  }

  const container = document.createElement('div')
  container.id = 'screening-report-mount'
  container.setAttribute(REPORT_MODE_ATTR, 'true')
  container.innerHTML = buildReportHtml({ data, diagnosis, evidence, recommendation })
  document.body.appendChild(container)

  // Mark <html> so the print stylesheet can scope the page.
  const html = document.documentElement
  const hadAttr = html.hasAttribute(REPORT_MODE_ATTR)
  if (!hadAttr) html.setAttribute(REPORT_MODE_ATTR, 'true')

  const previousTitle = document.title
  if (title) document.title = title

  const cleanup = () => {
    if (container.parentNode) container.parentNode.removeChild(container)
    if (!hadAttr) html.removeAttribute(REPORT_MODE_ATTR)
    document.title = previousTitle
    window.removeEventListener('afterprint', cleanup)
  }
  window.addEventListener('afterprint', cleanup, { once: true })

  // Defer one frame so the DOM is laid out before the print dialog samples it.
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      try {
        window.print()
      } finally {
        // Some browsers (Firefox) don't fire afterprint if the user cancels.
        // Schedule a fallback cleanup just in case.
        setTimeout(cleanup, 500)
        resolve()
      }
    })
  })
}

export { gradeMap, evidenceLabels }
