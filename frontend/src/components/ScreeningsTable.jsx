import { ArrowRight, ArrowUpRight } from 'lucide-react'

const statusStyles = {
  Normal: 'dashboard-pill dashboard-pill--normal',
  Monitor: 'dashboard-pill dashboard-pill--monitor',
  Refer: 'dashboard-pill dashboard-pill--refer',
}

const statusDot = {
  Normal: '#2F855A',
  Monitor: '#B7791F',
  Refer: '#C53030',
}

const statusDotSurface = {
  Normal: 'rgba(47, 133, 90, 0.18)',
  Monitor: 'rgba(183, 121, 31, 0.22)',
  Refer: 'rgba(197, 48, 48, 0.20)',
}

function TableState({ children }) {
  return (
    <div className="px-6 py-14 text-center text-[13.5px] text-muted">{children}</div>
  )
}

function getInitials(name) {
  return String(name || '')
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function ScreeningsTable({ screenings = [], loading = false }) {
  return (
    <div className="dashboard-table-wrap">
      {loading ? (
        <TableState>Loading recent screenings...</TableState>
      ) : screenings.length === 0 ? (
        <TableState>No recent screenings to display.</TableState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="dashboard-table-head-row">
                <th className="dashboard-table-th">Patient</th>
                <th className="dashboard-table-th">Date</th>
                <th className="dashboard-table-th">DR Grade</th>
                <th className="dashboard-table-th">Status</th>
                <th className="dashboard-table-th dashboard-table-th--right">Action</th>
              </tr>
            </thead>
            <tbody>
              {screenings.map((screening, index) => {
                const initials = getInitials(screening.patient)
                const isLast = index === screenings.length - 1
                return (
                  <tr
                    key={screening.id}
                    className={`dashboard-table-row ${isLast ? 'dashboard-table-row--last' : ''}`}
                  >
                    {/* Patient */}
                    <td className="dashboard-table-td">
                      <div className="flex items-center gap-3">
                        <span className="dashboard-table-avatar" aria-hidden="true">
                          {initials}
                        </span>
                        <div className="flex min-w-0 flex-col leading-tight">
                          <span className="dashboard-table-name">
                            {screening.patient}
                          </span>
                          <span className="dashboard-table-sub">
                            ID · #{String(screening.id).padStart(4, '0')}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="dashboard-table-td">
                      <div className="flex flex-col leading-tight">
                        <span className="dashboard-table-name text-ink">
                          {screening.date}
                        </span>
                        <span className="dashboard-table-sub">Recent</span>
                      </div>
                    </td>

                    {/* DR Grade with semantic dot */}
                    <td className="dashboard-table-td">
                      <div className="dashboard-grade">
                        <span
                          className="dashboard-grade-dot"
                          style={{
                            background: statusDot[screening.status],
                            boxShadow: `0 0 0 4px ${statusDotSurface[screening.status]}`,
                          }}
                          aria-hidden="true"
                        />
                        <span>{screening.grade}</span>
                      </div>
                    </td>

                    {/* Status pill */}
                    <td className="dashboard-table-td">
                      <span className={statusStyles[screening.status]}>
                        <span className="dashboard-pill-dot" aria-hidden="true" />
                        {screening.status}
                      </span>
                    </td>

                    {/* View */}
                    <td className="dashboard-table-td dashboard-table-td--right">
                      <button type="button" className="dashboard-row-action">
                        View
                        <ArrowUpRight size={14} strokeWidth={2} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// Re-exported for use elsewhere (e.g., Dashboard "View all" affordance).
export function ViewAllLink({ to = '/history', label = 'View all' }) {
  return (
    <a href={to} className="dashboard-view-all">
      {label}
      <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
    </a>
  )
}

export default ScreeningsTable
