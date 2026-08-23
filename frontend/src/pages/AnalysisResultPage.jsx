import { useEffect, useState } from 'react'
import { AlertCircle, FileText, Info, Loader2, ArrowLeft } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  DR_CLASSES,
  REFERABLE_THRESHOLD,
  getScreeningById,
} from '../services/screeningService'
import { openReportPrintDialog } from '../utils/generateReport'
import { useAuth } from '../context/AuthContext'

const visualizationTabs = [
  { label: 'Original', key: 'originalImage' },
  { label: 'Grad-CAM', key: 'gradCamImage' },
]

// Map backend class_name to UI-friendly grade and referable status
function mapDiagnosis(className, confidence) {
  const classIdx = DR_CLASSES.indexOf(className)
  const isReferable = classIdx >= REFERABLE_THRESHOLD

  const gradeMap = {
    'No DR': 'No DR',
    Mild: 'Mild NPDR',
    Moderate: 'Moderate NPDR',
    Severe: 'Severe NPDR',
    Proliferative: 'Proliferative DR',
  }

  return {
    grade: gradeMap[className] || className,
    label: isReferable ? 'Referable DR' : 'Non-referable DR',
    referable: isReferable,
    confidence: `${Math.round(confidence * 100)}%`,
    classIdx,
  }
}

// Generate recommendation based on referable status
function getRecommendation(referable) {
  if (referable) {
    return {
      title: 'Refer to ophthalmologist',
      text: 'Referable diabetic retinopathy was detected. Clinical evaluation by an ophthalmologist is recommended.',
    }
  }

  return {
    title: 'Routine follow-up',
    text: 'No referable diabetic retinopathy detected. Continue routine screening per clinical guidelines.',
  }
}

// Keep report generation compatible even if no detailed evidence helper exists.
function generateEvidence(classIdx) {
  return {
    classIdx,
    classes: DR_CLASSES,
  }
}

function AnalysisResultPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { session } = useAuth()

  const [activeVisualization, setActiveVisualization] =
    useState('originalImage')
  const [reportMessage, setReportMessage] = useState('')
  const [isReportError, setIsReportError] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)

  useEffect(() => {
    async function fetchScreening() {
      if (!id) {
        setError('No screening ID provided.')
        setIsLoading(false)
        return
      }

      try {
        const response = await getScreeningById(id, session?.token)
        const screening = response.data

        // Transform database record to match expected UI data shape
        setData({
          patient: screening.patient,
          result: {
            class_name: screening.screening.drClassName,
            confidence: screening.screening.confidence,
            all_probs: screening.screening.probabilities,
            processing_time_ms: screening.ai.processingTime,
          },
          screeningDate: new Date(screening.createdAt).toLocaleDateString(
            'en-GB',
            {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            },
          ),
          originalImageBase64: screening.images.originalPath,
          heatmap_base64: screening.images.gradCamPath,
        })
      } catch (err) {
        setError(err.message || 'Failed to load screening results.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchScreening()
  }, [id, session?.token])

  // Construct image URLs pointing to the backend static uploads folder
  const BACKEND_URL = 'http://localhost:5000'

  const explainability = data
    ? {
        originalImage: data.originalImageBase64
          ? `${BACKEND_URL}/uploads/${data.originalImageBase64
              .replace('uploads\\', '')
              .replace('uploads/', '')}`
          : null,

        gradCamImage: data.heatmap_base64
          ? `${BACKEND_URL}/uploads/${data.heatmap_base64
              .replace('uploads\\', '')
              .replace('uploads/', '')}`
          : null,
      }
    : {}

  async function handleGenerateReport() {
    if (isGeneratingReport || !data) return

    setIsGeneratingReport(true)
    setIsReportError(false)
    setReportMessage('Preparing report…')

    await new Promise((resolve) => requestAnimationFrame(resolve))

    try {
      const reportData = data
      const safePatient = reportData.patient || null
      const resultForReport = reportData.result

      const diagnosis = resultForReport
        ? mapDiagnosis(
            resultForReport.class_name,
            resultForReport.confidence,
          )
        : null

      const evidence = diagnosis
        ? generateEvidence(diagnosis.classIdx)
        : null

      const recommendation = diagnosis
        ? getRecommendation(diagnosis.referable)
        : null

      await openReportPrintDialog({
        data: {
          ...reportData,
          patient: safePatient,
        },
        diagnosis,
        evidence,
        recommendation,
        title: `DR Screening Report — ${safePatient?.id || 'Case'}`,
      })

      setReportMessage(
        'Report ready — use your browser’s “Save as PDF” option to download.',
      )
    } catch (err) {
      setIsReportError(true)

      setReportMessage(
        err && err.message
          ? `Could not generate report: ${err.message}`
          : 'Could not generate report. Please try again.',
      )
    } finally {
      setIsGeneratingReport(false)
    }
  }

  function handleNewScreening() {
    navigate('/new-screening')
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1280px] space-y-4">
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader2
            size={32}
            strokeWidth={2}
            className="animate-spin text-accent"
            aria-hidden="true"
          />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-[1280px] space-y-4">
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="text-center">
            <AlertCircle
              size={48}
              strokeWidth={1.5}
              className="mx-auto text-danger"
              aria-hidden="true"
            />

            <p className="mt-4 text-[16px] font-medium text-ink">
              {error}
            </p>

            <button
              onClick={handleNewScreening}
              className="mt-4 inline-flex items-center gap-2 bg-accent px-4 py-2 text-[14px] font-semibold text-white hover:bg-[#126b74]"
            >
              <ArrowLeft
                size={16}
                strokeWidth={1.8}
                aria-hidden="true"
              />
              New Screening
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const { result, patient, screeningDate } = data

  const diagnosis = mapDiagnosis(
    result.class_name,
    result.confidence,
  )

  const recommendation = getRecommendation(
    diagnosis.referable,
  )

  return (
    <div className="ar-shell mx-auto w-full max-w-[1280px] space-y-4">
      {/* Header */}
      <div className="ar-section--head flex items-center justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-semibold tracking-[-0.025em] text-ink">
            Analysis Result
          </h2>

          <p className="mt-0.5 text-[13px] text-muted">
            AI-assisted diabetic retinopathy screening result
          </p>
        </div>

        <span className="shrink-0 text-[13px] font-medium text-muted">
          Case #{patient.id}
        </span>
      </div>

      {/* Patient summary */}
      <section
        className="ar-section--summary border border-line bg-panel px-5 py-3.5 shadow-[0_1px_3px_rgba(32,42,49,0.04)]"
        aria-labelledby="patient-summary-heading"
      >
        <h3
          id="patient-summary-heading"
          className="sr-only"
        >
          Patient Information
        </h3>

        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <PatientDetail
            label="Patient ID"
            value={patient.id}
          />

          <PatientDetail
            label="Patient Name"
            value={patient.name}
          />

          <PatientDetail
            label="Age"
            value={patient.age}
          />

          <PatientDetail
            label="Gender"
            value={patient.gender}
          />

          <PatientDetail
            label="Screening Date"
            value={screeningDate}
          />
        </dl>
      </section>

      {/* Main analysis */}
      <section
        className="ar-section--viz grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.8fr)]"
        aria-label="Analysis result"
      >
        {/* Image viewer */}
        <div className="border border-line bg-panel p-4 shadow-[0_1px_3px_rgba(32,42,49,0.04)]">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-ink">
              Fundus Image
            </h3>

            <span className="text-[12px] text-muted">
              {activeVisualization === 'originalImage'
                ? 'Original fundus image'
                : 'Grad-CAM visualization'}
            </span>
          </div>

          <div className="flex h-[330px] w-full items-center justify-center overflow-hidden bg-[#160f18]">
            {explainability[activeVisualization] ? (
              <img
                key={activeVisualization}
                src={explainability[activeVisualization]}
                alt={`${activeVisualization} fundus visualization`}
                className="ar-viz-image size-full object-contain"
              />
            ) : (
              <p className="text-[13px] text-muted">
                No image available for this view
              </p>
            )}
          </div>

          {/* Visualization tabs */}
          <div
            className="mt-3 flex flex-wrap gap-2"
            role="tablist"
            aria-label="Fundus image views"
          >
            {visualizationTabs.map((tab) => {
              const isDisabled = tab.disabled
              const isActive =
                activeVisualization === tab.key
              const hasImage = explainability[tab.key]

              if (isDisabled) {
                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={false}
                    aria-disabled={true}
                    disabled
                    className="cursor-not-allowed border border-line px-3 py-1.5 text-[12px] font-semibold text-muted opacity-50"
                    title="Coming soon"
                  >
                    {tab.label}{' '}
                    <span className="ml-1 text-[10px] opacity-70">
                      (Coming soon)
                    </span>
                  </button>
                )
              }

              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() =>
                    hasImage &&
                    setActiveVisualization(tab.key)
                  }
                  disabled={!hasImage}
                  className={`border px-3 py-1.5 text-[12px] font-semibold ${
                    isActive
                      ? 'border-accent bg-accent-soft text-accent'
                      : hasImage
                        ? 'border-line text-muted hover:border-accent hover:text-accent'
                        : 'cursor-not-allowed border-line text-muted opacity-50'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Classification */}
        <div className="border border-line bg-panel p-5 shadow-[0_1px_3px_rgba(32,42,49,0.04)]">
          <p className="text-[12px] font-semibold uppercase tracking-[0.07em] text-muted">
            Classification
          </p>

          <h3 className="mt-2 text-[22px] font-semibold tracking-[-0.025em] text-ink">
            {diagnosis.grade}
          </h3>

          <span className="mt-2 inline-flex bg-[#fdf0f0] px-2.5 py-1 text-[12px] font-semibold text-danger">
            {diagnosis.label}
          </span>

          <div className="mt-5 border-t border-line pt-4">
            <p className="text-[12px] font-medium text-muted">
              Model confidence
            </p>

            <p className="mt-1 text-[21px] font-semibold text-ink">
              {diagnosis.confidence}
            </p>
          </div>

          <div className="mt-4 border-t border-line pt-4">
            <p className="text-[12px] font-medium text-muted">
              Inference time
            </p>

            <p className="mt-1 text-[14px] font-semibold text-ink">
              {result.processing_time_ms} ms
            </p>
          </div>

          <p className="mt-1.5 text-[12px] leading-4 text-muted">
            Confidence reflects the model output and should be
            considered alongside clinical review.
          </p>
        </div>
      </section>

      {/* Probability breakdown */}
      <section
        className="ar-section--probs border border-line bg-panel p-5 shadow-[0_1px_3px_rgba(32,42,49,0.04)]"
        aria-labelledby="probabilities-heading"
      >
        <h3
          id="probabilities-heading"
          className="text-[14px] font-semibold text-ink"
        >
          Class Probabilities
        </h3>

        <div className="mt-4 space-y-3">
          {result.all_probs.map((prob, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3"
            >
              <span className="w-[120px] text-[13px] font-medium text-ink">
                {DR_CLASSES[idx]}
              </span>

              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface">
                <div
                  className="ar-prob-fill h-full bg-accent transition-all duration-300"
                  style={{
                    width: `${prob * 100}%`,
                  }}
                />
              </div>

              <span className="w-[50px] text-right font-mono text-[13px] text-ink">
                {Math.round(prob * 100)}%
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Explainability */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div
          className="border border-line bg-panel p-6 shadow-[0_1px_3px_rgba(32,42,49,0.04)]"
          aria-labelledby="explainability-heading"
        >
          <h3
            id="explainability-heading"
            className="text-[16px] font-semibold text-ink"
          >
            Why this result?
          </h3>

          <p className="mt-2 text-[13px] leading-5 text-muted">
            The model's prediction is supported by visual
            attention analysis.
          </p>

          <div className="mt-5 border border-line bg-surface p-3">
            <p className="text-[13px] font-semibold text-ink">
              AI Attention (Grad-CAM)
            </p>

            <p className="mt-1 text-[12px] text-muted">
              The highlighted regions indicate areas that
              contributed most to the model's prediction. This is
              an explainability visualization, not a lesion
              detector.
            </p>
          </div>

          <p className="mt-4 flex gap-2 text-[12px] leading-5 text-muted">
            <Info
              size={15}
              className="mt-0.5 shrink-0 text-accent"
              aria-hidden="true"
            />

            Grad-CAM shows where the model focused its attention.
            It does not detect individual lesions.
          </p>
        </div>
      </section>

      {/* Recommendation + report */}
      <section
        className="ar-section--rec flex flex-col gap-5 border border-[#e8d6d6] bg-[#fffafa] p-6 sm:flex-row sm:items-center sm:justify-between"
        aria-labelledby="recommendation-heading"
      >
        <div>
          <h3
            id="recommendation-heading"
            className="text-[16px] font-semibold text-ink"
          >
            Recommendation
          </h3>

          <p className="mt-2 text-[15px] font-semibold text-danger">
            {recommendation.title}
          </p>

          <p className="mt-1 text-[13px] text-muted">
            {recommendation.text}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <button
            type="button"
            onClick={handleGenerateReport}
            disabled={isGeneratingReport}
            className="ar-report-btn inline-flex items-center gap-2 border border-line bg-panel px-4 py-2.5 text-[13px] font-semibold text-ink shadow-[0_1px_2px_rgba(32,42,49,0.06)] hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGeneratingReport ? (
              <Loader2
                size={16}
                strokeWidth={1.8}
                className="animate-spin"
                aria-hidden="true"
              />
            ) : (
              <FileText
                size={16}
                strokeWidth={1.8}
                aria-hidden="true"
              />
            )}

            {isGeneratingReport
              ? 'Generating…'
              : 'Generate Report'}
          </button>

          {reportMessage && (
            <p
              className={`text-[12px] ${
                isReportError
                  ? 'text-danger'
                  : 'text-muted'
              }`}
              role={isReportError ? 'alert' : 'status'}
            >
              {reportMessage}
            </p>
          )}
        </div>
      </section>
    </div>
  )
}

function PatientDetail({ label, value }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
        {label}
      </dt>

      <dd className="mt-1 text-[13px] font-medium text-ink">
        {value}
      </dd>
    </div>
  )
}

export default AnalysisResultPage