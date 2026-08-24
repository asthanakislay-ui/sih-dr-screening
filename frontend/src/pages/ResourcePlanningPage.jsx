import { AlertTriangle, Info } from 'lucide-react'

const scenarioData = [
  {
    scenario: 'Baseline',
    reviewers: 1,
    peakArrivalRate: '50/hr',
    maxQueueLength: 0,
    maxWaitTime: '0 min',
    reviewUtilization: '—',
  },
  {
    scenario: 'Peak Load',
    reviewers: 1,
    peakArrivalRate: '200/hr',
    maxQueueLength: 320,
    maxWaitTime: '160 min',
    reviewUtilization: '—',
    isViolation: true,
  },
  {
    scenario: 'Peak Load',
    reviewers: 2,
    peakArrivalRate: '200/hr',
    maxQueueLength: 0,
    maxWaitTime: '0 min',
    reviewUtilization: '—',
  },
  {
    scenario: 'Peak Load',
    reviewers: 3,
    peakArrivalRate: '200/hr',
    maxQueueLength: 0,
    maxWaitTime: '0 min',
    reviewUtilization: '—',
  },
]

const simulationCharts = [
  {
    filename: 'simulation_baseline_50_per_hr_1_reviewer.png',
    title: 'Baseline — 50/hr, 1 Reviewer',
    caption: 'Baseline — 50 images/hour with 1 reviewer; no meaningful queue develops.',
  },
  {
    filename: 'simulation_burst_500_per_hr_1_reviewer.png',
    title: 'Burst Load — 500/hr, 1 Reviewer',
    caption: 'Burst Load — 500 images/hour with 1 reviewer; demonstrates severe temporary reviewer overload.',
  },
  {
    filename: 'simulation_diurnal_pattern_2_reviewers.png',
    title: 'Diurnal Pattern — 2 Reviewers',
    caption: 'Diurnal Pattern — 2 reviewers handling changing arrival demand across the simulated period.',
  },
  {
    filename: 'simulation_high_load_100_per_hr_1_reviewer.png',
    title: 'High Load — 100/hr, 1 Reviewer',
    caption: 'High Load — 100 images/hour with 1 reviewer; demonstrates reviewer capacity under sustained higher demand.',
  },
  {
    filename: 'simulation_peak_200_per_hr_1_reviewer.png',
    title: 'Peak Load — 200/hr, 1 Reviewer',
    caption: 'Peak Load — 200 images/hour with 1 reviewer; severe queue and wait-time buildup, violating the 30-minute SLA.',
  },
  {
    filename: 'simulation_peak_200_per_hr_2_reviewers.png',
    title: 'Peak Load — 200/hr, 2 Reviewers',
    caption: 'Peak Load — 200 images/hour with 2 reviewers; queue is eliminated in the supplied simulation result.',
  },
  {
    filename: 'simulation_peak_200_per_hr_3_reviewers.png',
    title: 'Peak Load — 200/hr, 3 Reviewers',
    caption: 'Peak Load — 200 images/hour with 3 reviewers; queue is eliminated with additional reviewer capacity.',
  },
]

function ResourcePlanningPage() {
  return (
    <div className="mx-auto w-full max-w-[1280px]">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[26px] font-semibold tracking-[-0.025em] text-ink">Resource Planning</h2>
          <p className="mt-1 text-[14px] text-muted">
            Capacity planning analysis based on Simulink queueing simulations for DR screening.
          </p>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-warning bg-[#fff8e8] rounded-full">
          <Info size={12} strokeWidth={2} aria-hidden="true" />
          Precomputed Simulation Results
        </span>
      </header>

      {/* Key Finding Banner */}
      <section className="mt-8">
        <div
          className="border border-accent bg-accent-soft px-6 py-5 rounded-lg"
          role="alert"
        >
          <div className="flex items-start gap-4">
            <div className="shrink-0 flex size-10 items-center justify-center rounded-full bg-accent/20 text-accent">
              <AlertTriangle size={20} strokeWidth={1.8} aria-hidden="true" />
            </div>
            <div className="flex-1">
              <h3 className="text-[16px] font-semibold text-ink">
                Key Finding: AI processing throughput (3,600 images/hour) is significantly faster than human review capacity — human ophthalmologist review is the system bottleneck, not AI inference.
              </h3>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="mt-10">
        <h3 className="text-[18px] font-semibold tracking-[-0.015em] text-ink">Scenario Comparison</h3>
        <p className="mt-1 text-[14px] text-muted">
          Impact of reviewer staffing on system performance under various arrival rates.
        </p>

        <div className="mt-4 overflow-hidden border border-line bg-panel shadow-[0_1px_3px_rgba(32,42,49,0.04)] rounded-lg">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead className="border-b border-line bg-surface">
                <tr className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted">
                  <th className="px-6 py-3.5">Scenario</th>
                  <th className="px-6 py-3.5 text-center">Reviewers</th>
                  <th className="px-6 py-3.5 text-center">Peak Arrival Rate</th>
                  <th className="px-6 py-3.5 text-center">Max Queue Length</th>
                  <th className="px-6 py-3.5 text-center">Max Wait Time</th>
                  <th className="px-6 py-3.5 text-center">Review Utilization %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {scenarioData.map((row, index) => (
                  <tr
                    key={index}
                    className={`text-[14px] text-ink ${
                      row.isViolation ? 'bg-[#fdf0f0]' : ''
                    }`}
                  >
                    <td className="whitespace-nowrap px-6 py-4 font-medium">{row.scenario}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-center text-muted">{row.reviewers}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-center text-muted">{row.peakArrivalRate}</td>
                    <td className={`whitespace-nowrap px-6 py-4 text-center font-mono ${
                      row.maxQueueLength > 0 ? 'text-danger font-semibold' : 'text-success'
                    }`}>
                      {row.maxQueueLength}
                    </td>
                    <td className={`whitespace-nowrap px-6 py-4 text-center font-mono ${
                      row.maxWaitTime !== '0 min' ? 'text-danger font-semibold' : 'text-success'
                    }`}>
                      {row.maxWaitTime}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-center text-muted">{row.reviewUtilization}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SLA Note */}
        <div className="mt-4 flex items-start gap-3 px-1">
          <div className="shrink-0 flex size-8 items-center justify-center rounded-full bg-warning/15 text-warning">
            <Info size={15} strokeWidth={1.8} aria-hidden="true" />
          </div>
          <div className="pt-0.5">
            <p className="text-[14px] font-medium text-ink">
              30-minute wait time SLA (per PS 26038 human-in-the-loop requirement) is violated only in the single-reviewer peak scenario — demonstrating the need for adequate reviewer staffing at scale.
            </p>
          </div>
        </div>
      </section>

      {/* Chart Gallery */}
      <section className="mt-10">
        <h3 className="text-[18px] font-semibold tracking-[-0.015em] text-ink">Simulation Visualizations</h3>
        <p className="mt-1 text-[14px] text-muted">
          Precomputed Simulink charts showing queue length and wait time trends.
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {simulationCharts.map((chart, index) => (
            <article
              key={index}
              className="border border-line bg-panel rounded-lg overflow-hidden shadow-[0_1px_3px_rgba(32,42,49,0.04)]"
            >
              <div className="relative aspect-video bg-surface">
                <img
                  src={`/assets/${chart.filename}`}
                  alt={chart.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-4">
                <p className="text-[14px] font-semibold text-ink">{chart.title}</p>
                <p className="mt-1 text-[13px] text-muted">{chart.caption}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

export default ResourcePlanningPage
