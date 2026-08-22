import { useState } from 'react'
import { AlertCircle, CheckCircle2, FileText, Info } from 'lucide-react'
import { mockAnalysisData } from '../data/analysisData'

const visualizationTabs = [
  { label: 'Original', key: 'originalImage' },
  { label: 'Grad-CAM', key: 'gradCamImage' },
  { label: 'Lesion Map', key: 'lesionMapImage' },
]

const evidenceLabels = {
  microaneurysms: 'Microaneurysms',
  hemorrhages: 'Hemorrhages',
  exudates: 'Exudates',
  neovascularization: 'Neovascularization',
}

function evidenceStatus(status) {
  return status === 'Detected'
    ? { icon: AlertCircle, className: 'text-danger' }
    : { icon: CheckCircle2, className: 'text-muted' }
}

function AnalysisResultPage() {
  const [activeVisualization, setActiveVisualization] = useState('originalImage')
  const [reportMessage, setReportMessage] = useState('')
  const { patient, diagnosis, evidence, explainability, recommendation } = mockAnalysisData

  function handleGenerateReport() {
    setReportMessage('Report generation will be available in a future release.')
  }

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-semibold tracking-[-0.025em] text-ink">Analysis Result</h2>
          <p className="mt-0.5 text-[13px] text-muted">AI-assisted diabetic retinopathy screening result</p>
        </div>
        <span className="shrink-0 text-[13px] font-medium text-muted">Case #{mockAnalysisData.caseId}</span>
      </div>

      <section className="border border-line bg-panel px-5 py-3.5 shadow-[0_1px_3px_rgba(32,42,49,0.04)]" aria-labelledby="patient-summary-heading">
        <h3 id="patient-summary-heading" className="sr-only">Patient Information</h3>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <PatientDetail label="Patient ID" value={patient.id} />
          <PatientDetail label="Patient Name" value={patient.name} />
          <PatientDetail label="Age" value={patient.age} />
          <PatientDetail label="Gender" value={patient.gender} />
          <PatientDetail label="Screening Date" value={mockAnalysisData.screeningDate} />
        </dl>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.8fr)]" aria-label="Analysis result">
        <div className="border border-line bg-panel p-4 shadow-[0_1px_3px_rgba(32,42,49,0.04)]">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-ink">Fundus Image</h3>
            <span className="text-[12px] text-muted">Mock visualization</span>
          </div>
          <div className="h-[330px] w-full overflow-hidden bg-[#160f18]">
            <img src={explainability[activeVisualization]} alt={`${activeVisualization} fundus visualization`} className="size-full object-contain" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Fundus image views">
            {visualizationTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeVisualization === tab.key}
                onClick={() => setActiveVisualization(tab.key)}
                className={`border px-3 py-1.5 text-[12px] font-semibold ${activeVisualization === tab.key ? 'border-accent bg-accent-soft text-accent' : 'border-line text-muted hover:border-accent hover:text-accent'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border border-line bg-panel p-5 shadow-[0_1px_3px_rgba(32,42,49,0.04)]">
          <p className="text-[12px] font-semibold uppercase tracking-[0.07em] text-muted">Classification</p>
          <h3 className="mt-2 text-[22px] font-semibold tracking-[-0.025em] text-ink">{diagnosis.grade}</h3>
          <span className="mt-2 inline-flex bg-[#fdf0f0] px-2.5 py-1 text-[12px] font-semibold text-danger">{diagnosis.label}</span>
          <div className="mt-5 border-t border-line pt-4">
            <p className="text-[12px] font-medium text-muted">Model confidence</p>
            <p className="mt-1 text-[21px] font-semibold text-ink">{diagnosis.confidence}</p>
          </div>
          <p className="mt-1.5 text-[12px] leading-4 text-muted">Confidence reflects the model output and should be considered alongside clinical review.</p>
          <div className="mt-4 border-t border-line pt-3" aria-labelledby="evidence-heading">
            <h3 id="evidence-heading" className="text-[14px] font-semibold text-ink">Detected Evidence</h3>
            <div className="mt-1 divide-y divide-line">
              {Object.entries(evidence).map(([key, status]) => {
                const { icon: Icon, className } = evidenceStatus(status)
                return (
                  <div key={key} className="flex items-center justify-between py-1.5 text-[12px]">
                    <span className="text-ink">{evidenceLabels[key]}</span>
                    <span className={`flex items-center gap-1.5 font-medium ${className}`}>
                      <Icon size={14} strokeWidth={1.8} aria-hidden="true" />
                      {status}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="border border-line bg-panel p-6 shadow-[0_1px_3px_rgba(32,42,49,0.04)]" aria-labelledby="explainability-heading">
          <h3 id="explainability-heading" className="text-[16px] font-semibold text-ink">Why this result?</h3>
          <p className="mt-2 text-[13px] leading-5 text-muted">The model's prediction is supported by visual evidence in the image.</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="border border-line bg-surface p-3">
              <p className="text-[13px] font-semibold text-ink">Attention areas</p>
              <p className="mt-1 text-[12px] text-muted">Grad-CAM visualization</p>
            </div>
            <div className="border border-line bg-surface p-3">
              <p className="text-[13px] font-semibold text-ink">Lesion evidence</p>
              <p className="mt-1 text-[12px] text-muted">Lesion map visualization</p>
            </div>
          </div>
          <p className="mt-4 flex gap-2 text-[12px] leading-5 text-muted"><Info size={15} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />The highlighted regions indicate areas that contributed to the model's prediction.</p>
        </div>
      </section>

      <section className="flex flex-col gap-5 border border-[#e8d6d6] bg-[#fffafa] p-6 sm:flex-row sm:items-center sm:justify-between" aria-labelledby="recommendation-heading">
        <div>
          <h3 id="recommendation-heading" className="text-[16px] font-semibold text-ink">Recommendation</h3>
          <p className="mt-2 text-[15px] font-semibold text-danger">{recommendation.title}</p>
          <p className="mt-1 text-[13px] text-muted">{recommendation.text}</p>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <button type="button" onClick={handleGenerateReport} className="inline-flex items-center gap-2 border border-line bg-panel px-4 py-2.5 text-[13px] font-semibold text-ink shadow-[0_1px_2px_rgba(32,42,49,0.06)] hover:border-accent hover:text-accent">
            <FileText size={16} strokeWidth={1.8} aria-hidden="true" />
            Generate Report
          </button>
          {reportMessage && <p className="text-[12px] text-muted" role="status">{reportMessage}</p>}
        </div>
      </section>
    </div>
  )
}

function PatientDetail({ label, value }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">{label}</dt>
      <dd className="mt-1 text-[13px] font-medium text-ink">{value}</dd>
    </div>
  )
}

export default AnalysisResultPage
