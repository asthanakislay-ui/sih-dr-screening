import { ArrowUpRight } from 'lucide-react'

const statusStyles = {
  Normal: 'bg-[#edf7f1] text-success',
  Monitor: 'bg-[#fff8e8] text-warning',
  Refer: 'bg-[#fdf0f0] text-danger',
}

function TableState({ children }) {
  return (
    <div className="px-6 py-12 text-center text-[14px] text-muted">{children}</div>
  )
}

function ScreeningsTable({ screenings = [], loading = false }) {
  return (
    <div className="overflow-hidden border border-line bg-panel shadow-[0_1px_3px_rgba(32,42,49,0.04)]">
      {loading ? (
        <TableState>Loading recent screenings...</TableState>
      ) : screenings.length === 0 ? (
        <TableState>No recent screenings to display.</TableState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-left">
            <thead className="border-b border-line bg-surface">
              <tr className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted">
                <th className="px-6 py-3.5">Patient</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">DR Grade</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {screenings.map((screening) => (
                <tr key={screening.id} className="text-[14px] text-ink">
                  <td className="whitespace-nowrap px-6 py-4 font-medium">{screening.patient}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-muted">{screening.date}</td>
                  <td className="whitespace-nowrap px-6 py-4">{screening.grade}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 text-[12px] font-semibold ${statusStyles[screening.status]}`}
                    >
                      {screening.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-[13px] font-semibold text-accent hover:text-ink"
                    >
                      View
                      <ArrowUpRight size={14} strokeWidth={1.8} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default ScreeningsTable
