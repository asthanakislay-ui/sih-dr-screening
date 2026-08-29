import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import MetricCard from '../components/MetricCard'
import ScreeningsTable, { ViewAllLink } from '../components/ScreeningsTable'
import { dashboardMetrics, recentScreenings } from '../data/dashboardData'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from '../context/LanguageContext'

// Per-card delta hint (purely visual; no analytics logic invented).
const cardDeltas = {
  'dashboard.metrics.totalScreenings': { text: 'dashboard.metrics.thisWeek', trend: 'up' },
  'dashboard.metrics.referableCases': { text: 'dashboard.metrics.vsLastWeek', trend: 'up' },
  'dashboard.metrics.pendingReviews': { text: 'dashboard.metrics.cleared', trend: 'down' },
}

function DashboardPage() {
  const { session, activeRole } = useAuth()
  const { t } = useTranslation()
  const currentRole = activeRole || session?.role || 'clinician'

  return (
    <div className="dashboard-shell mx-auto w-full max-w-[1320px]">
      <section aria-labelledby="dashboard-introduction" className="dashboard-header">
        <p className="dashboard-eyebrow">
          <span className="dashboard-eyebrow-dot" aria-hidden="true" />
          {t('dashboard.overview')}
        </p>
        <h1
          id="dashboard-introduction"
          className="dashboard-headline"
        >
          <span className="dashboard-headline-soft">{t('dashboard.greeting')}</span>
          <span className="dashboard-headline-strong">Dr. Sharma</span>
        </h1>
        <p className="dashboard-lede">
          {t('dashboard.subtext')}
        </p>

        <div className="dashboard-header-meta">
          <span className="dashboard-meta-pill">
            <span className="dashboard-meta-dot" aria-hidden="true" />
            Live · 23 Aug 2026
          </span>
          <span className="dashboard-meta-sep" aria-hidden="true" />
          <span className="text-[12px] tracking-[0.005em] text-muted">
            {t('dashboard.clinic')}:{' '}
            <span className="font-semibold text-ink">Apollo Eye Care</span>
          </span>
        </div>
      </section>

      <section
        className="mt-9 grid gap-5 md:grid-cols-3"
        aria-label="Screening summary"
      >
        {dashboardMetrics.map((metric) => (
          <MetricCard
            key={metric.label}
            label={t(metric.label)}
            supportingText={t(metric.supportingText)}
            value={metric.value}
            delta={cardDeltas[metric.label] ? {
              text: t(cardDeltas[metric.label].text),
              trend: cardDeltas[metric.label].trend
            } : undefined}
          />
        ))}
      </section>

      <section className="mt-10" aria-labelledby="recent-screenings-heading">
        <div className="dashboard-section-head">
          <div>
            <p className="dashboard-section-eyebrow">{t('dashboard.recentActivity')}</p>
            <h2
              id="recent-screenings-heading"
              className="dashboard-section-title"
            >
              {t('dashboard.recentScreenings')}
            </h2>
          </div>
          <div className="dashboard-section-actions">
            <ViewAllLink to="/history" label={t('dashboard.viewAll')} />
            <Link
              to="/new-screening"
              className="dashboard-cta inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold tracking-[0.005em] text-white"
            >
              <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
              {t('dashboard.newScreeningBtn')}
            </Link>
          </div>
        </div>
        <ScreeningsTable screenings={recentScreenings} />
      </section>
    </div>
  )
}

export default DashboardPage
