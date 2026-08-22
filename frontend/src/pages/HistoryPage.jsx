import { ArrowUpRight, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { historyStatusOptions, mockHistoryData } from '../data/historyData'

const statusStyles = {
  Normal: 'bg-[#edf7f1] text-success',
  Monitor: 'bg-[#fff8e8] text-warning',
  Refer: 'bg-[#fdf0f0] text-danger',
}

function HistoryPage() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const filteredScreenings = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return mockHistoryData.filter((screening) => {
      const matchesSearch = !normalizedSearch
        || screening.patientName.toLowerCase().includes(normalizedSearch)
        || screening.patientId.toLowerCase().includes(normalizedSearch)
      const matchesStatus = statusFilter === 'All' || screening.drGrade === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [searchTerm, statusFilter])

  return (
    <div className="mx-auto w-full max-w-[1280px]">
      <section>
        <h2 className="text-[26px] font-semibold tracking-[-0.025em] text-ink">Screening History</h2>
        <p className="mt-1 text-[14px] text-muted">Review previous diabetic retinopathy screening results.</p>
      </section>

      <section className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center" aria-label="History search and filter">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search by patient name or ID</span>
          <Search size={17} strokeWidth={1.8} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by patient name or ID"
            className="w-full border border-line bg-panel py-2.5 pl-10 pr-3 text-[13px] text-ink outline-none focus:border-accent"
          />
        </label>
        <label className="flex shrink-0 items-center gap-2 text-[13px] font-medium text-ink">
          <span>DR status</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="border border-line bg-panel px-3 py-2.5 text-[13px] text-ink outline-none focus:border-accent">
            {historyStatusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
      </section>

      <section className="mt-8" aria-labelledby="previous-screenings-heading">
        <h3 id="previous-screenings-heading" className="mb-4 text-[18px] font-semibold tracking-[-0.015em] text-ink">Previous Screenings</h3>
        <div className="overflow-hidden border border-line bg-panel shadow-[0_1px_3px_rgba(32,42,49,0.04)]">
          {mockHistoryData.length === 0 ? (
            <HistoryState title="No screening records yet" />
          ) : filteredScreenings.length === 0 ? (
            <HistoryState title="No screenings found" description="Try searching with a different patient name or ID." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead className="border-b border-line bg-surface">
                  <tr className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted">
                    <th className="px-6 py-3.5">Patient</th>
                    <th className="px-6 py-3.5">Patient ID</th>
                    <th className="px-6 py-3.5">Date</th>
                    <th className="px-6 py-3.5">DR Grade</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredScreenings.map((screening) => (
                    <tr key={screening.patientId} className="text-[14px] text-ink">
                      <td className="whitespace-nowrap px-6 py-4 font-medium">{screening.patientName}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-muted">{screening.patientId}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-muted">{screening.date}</td>
                      <td className="whitespace-nowrap px-6 py-4">{screening.drGrade}</td>
                      <td className="px-6 py-4"><span className={`inline-flex px-2 py-1 text-[12px] font-semibold ${statusStyles[screening.status]}`}>{screening.status}</span></td>
                      <td className="px-6 py-4 text-right">
                        <button type="button" onClick={() => navigate('/analysis-result')} className="inline-flex items-center gap-1 text-[13px] font-semibold text-accent hover:text-ink">
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
      </section>
    </div>
  )
}

function HistoryState({ title, description }) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="text-[15px] font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 text-[13px] text-muted">{description}</p>}
    </div>
  )
}

export default HistoryPage
