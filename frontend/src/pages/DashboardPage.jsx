import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import MetricCard from '../components/MetricCard'
import ScreeningsTable from '../components/ScreeningsTable'
import { dashboardMetrics, recentScreenings } from '../data/dashboardData'

function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-[1280px]">
      <section aria-labelledby="dashboard-introduction">
        <h2
          id="dashboard-introduction"
          className="text-[26px] font-semibold tracking-[-0.025em] text-ink"
        >
          Dashboard
        </h2>
        <p className="mt-1 text-[14px] text-muted">
          Overview of diabetic retinopathy screening activity
        </p>
      </section>

      <section
        className="mt-8 grid gap-4 md:grid-cols-3"
        aria-label="Screening summary"
      >
        {dashboardMetrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="mt-10" aria-labelledby="recent-screenings-heading">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2
            id="recent-screenings-heading"
            className="text-[18px] font-semibold tracking-[-0.015em] text-ink"
          >
            Recent Screenings
          </h2>
          <Link
            to="/new-screening"
            className="inline-flex shrink-0 items-center gap-2 bg-accent px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(23,126,137,0.2)] transition-colors hover:bg-[#126b74]"
          >
            <Plus size={16} strokeWidth={2} aria-hidden="true" />
            New Screening
          </Link>
        </div>
        <ScreeningsTable screenings={recentScreenings} />
      </section>
    </div>
  )
}

export default DashboardPage
