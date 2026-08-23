import { AlertTriangle, Users, Cpu, BarChart2, Info, ImageIcon } from 'lucide-react'

// Precomputed Simulink simulation data
const scenarioData = [
  {
    scenario: 'Baseline',
    reviewers: 1,
    peakArrivalRate: '50/hr',
    maxQueueLength: 0,
    maxWaitTime: '0 min',
    reviewUtilization: '14%',
  },
  {
    scenario: 'Peak Load',
    reviewers: 1,
    peakArrivalRate: '200/hr',
    maxQueueLength: 320,
    maxWaitTime: '160 min',
    reviewUtilization: '56%',
  },
  {
    scenario: 'Peak Load',
    reviewers: 2,
    peakArrivalRate: '200/hr',
    maxQueueLength: 0,
    maxWaitTime: '0 min',
    reviewUtilization: '28%',
  },
  {
    scenario: 'Peak Load',
    reviewers: 3,
    peakArrivalRate: '200/hr',
    maxQueueLength: 0,
    maxWaitTime: '0 min',
    reviewUtilization: '19%',
  },
]

const keyMetrics = [
  { label: 'AI Processing Throughput', value: '3,600 images/hr', icon: Cpu },
  { label: 'Single Reviewer Capacity', value: '~50 reviews/hr', icon: Users },
  { label: 'Bottleneck', value: 'Human Review', icon: AlertTriangle },
]

// Simulation chart images (copied to public/assets/)
const simulationCharts = [
  {
    filename: 'simulation_baseline_50_per_hr_1_reviewer.png',
    title: 'Baseline — 50/hr, 1 Reviewer',
    description: 'Steady-state operation with minimal queue buildup.',
  },
  {
    filename: 'simulation_peak_200_per_hr_1_reviewer.png',
    title: 'Peak Load — 200/hr, 1 Reviewer',
    description: 'Queue grows to 320, max wait 160 min — SLA violation.',
  },
  {
    filename: 'simulation_peak_200_per_hr_3_reviewers.png',
    title: 'Peak Load — 200/hr, 3 Reviewers',
    description: 'Zero queue with adequate staffing — SLA met.',
  },
]

function ResourcePlanningPage() {
  return (
    <div className="mx-auto w-full max-w-[1280px]">
      <section aria-labelledby="resource-planning-introduction">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="resource-planning-introduction"
              className="text-[26px] font-semibold tracking-[-0.025em] text-ink"
            >
              Resource Planning
            </h2>
            <p className="mt-1 text-[14px] text-muted">
              System analytics from precomputed Simulink queueing simulations — identify staffing needs for DR screening at scale.
            </p>
          </div>
          <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-warning bg-[#fff8e8] rounded-full">
            <Info size={12} strokeWidth={2} aria-hidden="true" />
            Static Dashboard
          </span>
        </div>
      </section>

      {/* Key Finding Banner */}
      <section className="mt-8" aria-labelledby="key-finding-heading">
        <div
          className="border border-accent bg-accent-soft px-6 py-5 rounded-lg"
          role="alert"
        >
          <div className="flex items-start gap-4">
            <div className="shrink-0 flex size-10 items-center justify-center rounded-full bg-accent/20 text-accent">
              <AlertTriangle size={20} strokeWidth={1.8} aria-hidden="true" />
            </div>
            <div className="flex-1">
              <h3
                id="key-finding-heading"
                className="text-[16px] font-semibold text-ink"
              >
                Key Finding: AI processing throughput (3,600 images/hour) is significantly faster than human review capacity — human ophthalmologist review is the system bottleneck, not AI inference.
              </h3>
              <p className="mt-2 text-[14px] text-muted">
                Simulink queueing model demonstrates that without adequate reviewer staffing, peak arrival rates cause exponential queue growth and SLA violations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Metrics Row */}
      <section
        className="mt-8 grid gap-4 md:grid-cols-3"
        aria-label="System capacity summary"
      >
        {keyMetrics.map((metric) => (
          <article
            key={metric.label}
            className="border border-line bg-panel px-5 py-5 shadow-[0_1px_3px_rgba(32,42,49,0.04)]"
          >
            <div className="flex items-center gap-2">
              <metric.icon
                size={17}
                strokeWidth={1.8}
                className="text-muted"
                aria-hidden="true"
              />
              <p className="text-[13px] font-medium text-muted">{metric.label}</p>
            </div>
            <p className="mt-3 text-[28px] font-semibold leading-none tracking-[-0.03em] text-ink">
              {metric.value}
            </p>
          </article>
        ))}
      </section>

      {/* Comparison Table */}
      <section className="mt-10" aria-labelledby="scenario-comparison-heading">
        <h3
          id="scenario-comparison-heading"
          className="text-[18px] font-semibold tracking-[-0.015em] text-ink"
        >
          Scenario Comparison
        </h3>
        <p className="mt-1 text-[14px] text-muted">
          Queueing model results showing the impact of reviewer count on system performance under different arrival rates.
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
                      row.maxQueueLength > 0 ? 'bg-[#fdf0f0]' : ''
                    }`}
                  >
                    <td className="whitespace-nowrap px-6 py-4 font-medium">
                      {row.scenario}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-center text-muted">
                      {row.reviewers}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-center text-muted">
                      {row.peakArrivalRate}
                    </td>
                    <td
                      className={`whitespace-nowrap px-6 py-4 text-center font-mono ${
                        row.maxQueueLength > 0 ? 'text-danger font-semibold' : 'text-success'
                      }`}
                    >
                      {row.maxQueueLength}
                    </td>
                    <td
                      className={`whitespace-nowrap px-6 py-4 text-center font-mono ${
                        row.maxWaitTime !== '0 min' ? 'text-danger font-semibold' : 'text-success'
                      }`}
                    >
                      {row.maxWaitTime}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-center text-muted">
                      {row.reviewUtilization}
                    </td>
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
              30-minute wait time SLA (per PS 26038 human-in-the-loop requirement) is violated only in the single-reviewer peak scenario
            </p>
            <p className="mt-1 text-[13px] text-muted">
              — demonstrating the need for adequate reviewer staffing at scale.
            </p>
          </div>
        </div>
      </section>

      {/* Simulation Chart Images */}
      <section className="mt-10" aria-labelledby="simulation-charts-heading">
        <h3
          id="simulation-charts-heading"
          className="text-[18px] font-semibold tracking-[-0.015em] text-ink"
        >
          Simulation Visualizations
        </h3>
        <p className="mt-1 text-[14px] text-muted">
          Precomputed Simulink queueing model charts showing queue length and wait time over time for each scenario.
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {simulationCharts.map((chart, index) => (
            <article
              key={index}
              className="border border-line bg-panel rounded-lg overflow-hidden"
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
                <p className="text-[14px] font-medium text-ink">{chart.title}</p>
                <p className="mt-1 text-[13px] text-muted">{chart.description}</p>
              </div>
            </article>
          ))}
        </div>

        {/* Additional charts placeholder */}
        <div className="mt-6 p-4 border border-dashed border-line rounded-lg bg-surface">
          <div className="flex items-start gap-3">
            <ImageIcon size={18} strokeWidth={1.8} className="shrink-0 mt-0.5 text-muted" aria-hidden="true" />
            <div>
              <p className="text-[13px] font-medium text-ink">Additional charts available:</p>
              <p className="mt-1 text-[12px] text-muted">
                Copy remaining simulation PNGs from <code className="font-mono bg-surface px-1 rounded">simulink/</code> to
                <code className="font-mono bg-surface px-1 rounded">frontend/public/assets/</code> to include:
              </p>
              <ul className="mt-2 ml-4 space-y-1 text-[12px] text-muted list-disc">
                <li>simulation_burst_500_per_hr_1_reviewer.png</li>
                <li>simulation_diurnal_pattern_2_reviewers.png</li>
                <li>simulation_high_load_100_per_hr_1_reviewer.png</li>
                <li>simulation_peak_200_per_hr_2_reviewers.png</li>
              </ul>
              <p className="mt-2 text-[11px] font-mono text-warning">
                // TODO: Add <img src="/assets/..." /> cards to the grid above as needed
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ResourcePlanningPage