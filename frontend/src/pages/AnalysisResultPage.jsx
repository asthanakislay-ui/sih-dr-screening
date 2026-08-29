import { useEffect, useState } from 'react'
import { AlertCircle, FileText, Info, Loader2, ArrowLeft } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  DR_CLASSES,
  REFERABLE_THRESHOLD,
  getScreeningById,
  UnauthorizedError,
} from '../services/screeningService'
import { openReportPrintDialog } from '../utils/generateReport'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from '../context/LanguageContext'

const visualizationTabs = [
  { label: 'Original', key: 'originalImage' },
  { label: 'Grad-CAM', key: 'gradCamImage' },
]

// Map backend class_name to UI-friendly grade and referable status
function mapDiagnosis(className, confidence, t) {
  const classIdx = DR_CLASSES.indexOf(className)
  const isReferable = classIdx >= REFERABLE_THRESHOLD

  const gradeMap = {
    'No DR': t('analysis.grades.noDr'),
    Mild: t('analysis.grades.mild'),
    Moderate: t('analysis.grades.moderate'),
    Severe: t('analysis.grades.severe'),
    Proliferative: t('analysis.grades.proliferative'),
  }

  return {
    grade: gradeMap[className] || className,
    label: isReferable ? t('analysis.labels.referable') : t('analysis.labels.nonReferable'),
    referable: isReferable,
    confidence: `${Math.round(confidence * 100)}%`,
    classIdx,
  }
}

// Generate recommendation based on referable status
function getRecommendation(referable, t) {
  if (referable) {
    return {
      title: t('analysis.recommendation.referTitle'),
      text: t('analysis.recommendation.referText'),
    }
  }

  return {
    title: t('analysis.recommendation.routineTitle'),
    text: t('analysis.recommendation.routineText'),
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
  const { session, signOut } = useAuth()
  const { t, language } = useTranslation()
  const isTechnician = session?.role === 'technician'

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
        setError(t('analysis.errors.noId'))
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
            modelVersion: screening.ai.modelVersion,
          },
          screeningDate: new Date(screening.createdAt).toLocaleDateString(
            language === 'hi' ? 'hi-IN' : 'en-GB',
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
        if (err instanceof UnauthorizedError) {
          signOut()
          navigate('/login', { replace: true })
          return
        }
        setError(err.message || t('analysis.errors.generic'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchScreening()
  }, [id, session?.token, navigate, signOut])

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
        t('analysis.reportReady'),
      )
    } catch (err) {
      setIsReportError(true)

      setReportMessage(
        err && err.message
          ? t('analysis.reportError', { error: err.message })
          : t('analysis.reportGenericError'),
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

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => navigate('/history')}
                className="inline-flex items-center gap-2 bg-panel px-4 py-2 text-[14px] font-semibold text-ink border border-line hover:bg-surface"
              >
                <ArrowLeft
                  size={16}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
                {t('common.backToHistory')}
              </button>

              <button
                onClick={handleNewScreening}
                className="inline-flex items-center gap-2 bg-accent px-4 py-2 text-[14px] font-semibold text-white hover:bg-[#126b74]"
              >
                <ArrowLeft
                  size={16}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
                {t('common.newScreening')}
              </button>
            </div>
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
            {t('analysis.title')}
          </h2>

          <p className="mt-0.5 text-[13px] text-muted">
            {t('analysis.subtitle')}
          </p>
        </div>

        <span className="shrink-0 text-[13px] font-medium text-muted">
          {t('analysis.case')}#{patient.id}
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
          {t('analysis.patientInfo')}
        </h3>

        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <PatientDetail
            label={t('analysis.labels.patientId')}
            value={patient.id}
          />

          <PatientDetail
            label={t('analysis.labels.patientName')}
            value={patient.name}
          />

          <PatientDetail
            label={t('analysis.labels.age')}
            value={patient.age}
          />

          <PatientDetail
            label={t('analysis.labels.gender')}
            value={patient.gender}
          />

          <PatientDetail
            label={t('analysis.labels.date')}
            value={screeningDate}
          />
        </dl>
      </section>

      {/* Main analysis */}
      <section
        className="ar-section--viz grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.8fr)]"
        aria-label="Analysis result"
      >
        {isTechnician && (
          <div
            className={`col-span-full border-l-4 p-4 shadow-sm ${
              diagnosis.referable
                ? 'bg-danger-soft border-danger'
                : 'bg-success-soft border-success'
            }`}
          >
            <div className="flex items-center gap-3">
              <AlertCircle
                size={24}
                className={diagnosis.referable ? 'text-danger' : 'text-success'}
              />
              <div>
                <h3 className={`text-lg font-bold ${diagnosis.referable ? 'text-danger' : 'text-success'}`}>
                  {diagnosis.referable ? t('analysis.drDetected') : t('analysis.noReferable')}
                </h3>
                <p className="text-ink font-medium">
                  {diagnosis.referable ? t('analysis.referOpthal') : t('analysis.routineFollow')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Image viewer */}
        <div className="border border-line bg-panel p-4 shadow-[0_1px_3px_rgba(32,42,49,0.04)]">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-ink">
              {t('analysis.fundusImage')}
            </h3>

            <span className="text-[12px] text-muted">
              {activeVisualization === 'originalImage'
                ? t('analysis.originalImage')
                : t('analysis.gradCam')}
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

              if (isTechnician && tab.key === 'gradCamImage') return null

             

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
            {t('analysis.classification')}
          </p>

          <h3 className="mt-2 text-[22px] font-semibold tracking-[-0.025em] text-ink">
            {diagnosis.grade}
          </h3>

          <span className="mt-2 inline-flex bg-[#fdf0f0] px-2.5 py-1 text-[12px] font-semibold text-danger">
            {diagnosis.label}
          </span>

          <div className="mt-5 border-t border-line pt-4">
            <p className="text-[12px] font-medium text-muted">
              {t('analysis.confidence')}
            </p>

            <p className="mt-1 text-[21px] font-semibold text-ink">
              {diagnosis.confidence}
            </p>
          </div>

          <div className="mt-4 border-t border-line pt-4">
            {!isTechnician && (
              <>
                <p className="text-[12px] font-medium text-muted">
                  {t('analysis.inferenceTime')}
                </p>

                <p className="mt-1 text-[14px] font-semibold text-ink">
                  {result.processing_time_ms} ms
                </p>
              </>
            )}
          </div>

          <p className="mt-1.5 text-[12px] leading-4 text-muted">
            {t('analysis.confidenceDisclaimer')}
          </p>
        </div>
      </section>

      {/* Probability breakdown */}
      {!isTechnician && (
        <section
          className="ar-section--probs border border-line bg-panel p-5 shadow-[0_1px_3px_rgba(32,42,49,0.04)]"
          aria-labelledby="probabilities-heading"
        >
          <h3
            id="probabilities-heading"
            className="text-[14px] font-semibold text-ink"
          >
            {t('analysis.probabilities')}
          </h3>

          <div className="mt-4 space-y-3">
            {result.all_probs.map((prob, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3"
              >
                <span className="w-[120px] text-[13px] font-medium text-ink">
                  {t('history.grades.' + DR_CLASSES[idx])}
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
      )}

      {/* Explainability */}
      {!isTechnician && (
        <section className="grid gap-6 lg:grid-cols-2">
          <div
            className="border border-line bg-panel p-6 shadow-[0_1px_3px_rgba(32,42,49,0.04)]"
            aria-labelledby="explainability-heading"
          >
            <h3
              id="explainability-heading"
              className="text-[16px] font-semibold text-ink"
            >
              {t('analysis.whyThisResult')}
            </h3>

            <p className="mt-2 text-[13px] leading-5 text-muted">
              {t('analysis.explainabilityText')}
            </p>

            <div className="mt-5 border border-line bg-surface p-3">
              <p className="text-[13px] font-semibold text-ink">
                {t('analysis.attentionBoxTitle')}
              </p>

              <p className="mt-1 text-[12px] text-muted">
                {t('analysis.attentionBoxText')}
              </p>
            </div>

            <p className="mt-4 flex gap-2 text-[12px] leading-5 text-muted">
              <Info
                size={15}
                className="mt-0.5 shrink-0 text-accent"
                aria-hidden="true"
              />

              {t('analysis.attentionNote')}
            </p>
          </div>
        </section>
      )}

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
            {t('analysis.recommendation')}
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
              ? t('analysis.generating')
              : t('analysis.generateReport')}
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