import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import MetricCard from '../components/MetricCard'
import ScreeningsTable, { ViewAllLink } from '../components/ScreeningsTable'
import { dashboardMetrics, recentScreenings } from '../data/dashboardData'

// Per-card delta hint (purely visual; no analytics logic invented).
const cardDeltas = {
  'Total Screenings': { text: '+12 this week', trend: 'up' },
  'Referable Cases': { text: '+3 vs last week', trend: 'up' },
  'Pending Reviews': { text: '−2 cleared', trend: 'down' },
}

function DashboardPage() {
  return (
    <div className="dashboard-shell mx-auto w-full max-w-[1320px]">
      <section aria-labelledby="dashboard-introduction" className="dashboard-header">
        <p className="dashboard-eyebrow">
          <span className="dashboard-eyebrow-dot" aria-hidden="true" />
          Screening Overview
        </p>
        <h1
          id="dashboard-introduction"
          className="dashboard-headline"
        >
          <span className="dashboard-headline-soft">Good morning,</span>
          <span className="dashboard-headline-strong">Dr. Sharma</span>
        </h1>
        <p className="dashboard-lede">
          Monitor diabetic retinopathy screening activity
          <br className="hidden sm:block" /> and manage patient outcomes.
        </p>

        <div className="dashboard-header-meta">
          <span className="dashboard-meta-pill">
            <span className="dashboard-meta-dot" aria-hidden="true" />
            Live · 23 Aug 2026
          </span>
          <span className="dashboard-meta-sep" aria-hidden="true" />
          <span className="text-[12px] tracking-[0.005em] text-muted">
            Clinic:{' '}
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
            {...metric}
            delta={cardDeltas[metric.label]}
          />
        ))}
      </section>

      <section className="mt-10" aria-labelledby="recent-screenings-heading">
        <div className="dashboard-section-head">
          <div>
            <p className="dashboard-section-eyebrow">Recent activity</p>
            <h2
              id="recent-screenings-heading"
              className="dashboard-section-title"
            >
              Recent Screenings
            </h2>
          </div>
          <div className="dashboard-section-actions">
            <ViewAllLink to="/history" label="View all" />
            <Link
              to="/new-screening"
              className="dashboard-cta inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold tracking-[0.005em] text-white"
            >
              <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
              New Screening
            </Link>
          </div>
        </div>
        <ScreeningsTable screenings={recentScreenings} />
      </section>
    </div>
  )
}

export default DashboardPage
