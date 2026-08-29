import { ArrowUpRight, Search, Loader2, AlertCircle } from 'lucide-react'
import { useMemo, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { historyStatusOptions } from '../data/historyData'
import { getScreenings, UnauthorizedError } from '../services/screeningService'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from '../context/LanguageContext'

const statusStyles = {
  Normal: 'bg-[#edf7f1] text-success',
  Monitor: 'bg-[#fff8e8] text-warning',
  Refer: 'bg-[#fdf0f0] text-danger',
}

function HistoryPage() {
  const navigate = useNavigate()
  const { session, signOut } = useAuth()
  const { t, language } = useTranslation()
  const isTechnician = session?.role === 'technician'
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [screenings, setScreenings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchHistory = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await getScreenings(session?.token)
      setScreenings(response.data || [])
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        signOut()
        navigate('/login', { replace: true })
        return
      }
      setError(err.message || 'Failed to load screening history.')
    } finally {
      setIsLoading(false)
    }
  }, [session?.token, navigate, signOut])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const filteredScreenings = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return screenings.filter((screening) => {
      const matchesSearch = !normalizedSearch
        || screening.patient.name.toLowerCase().includes(normalizedSearch)
        || screening.patient.id.toLowerCase().includes(normalizedSearch)

      // Map DR Grade to a simple status for filtering
      const grade = screening.screening.drClassName
      const isReferable = screening.screening.referable
      const status = isReferable ? 'Refer' : (grade === 'No DR' ? 'Normal' : 'Monitor')

      const matchesStatus = statusFilter === 'All' || status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [searchTerm, statusFilter, screenings])

  return (
    <div className="mx-auto w-full max-w-[1280px]">
      <section>
        <h2 className="text-[26px] font-semibold tracking-[-0.025em] text-ink">{t('history.title')}</h2>
        <p className="mt-1 text-[14px] text-muted">{t('history.subtitle')}</p>
      </section>

      <section className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center" aria-label="History search and filter">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search by patient name or ID</span>
          <Search size={17} strokeWidth={1.8} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={t('history.searchPlaceholder')}
            className="w-full border border-line bg-panel py-2.5 pl-10 pr-3 text-[13px] text-ink outline-none focus:border-accent"
          />
        </label>
        <label className="flex shrink-0 items-center gap-2 text-[13px] font-medium text-ink">
          <span>{t('history.statusLabel')}</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="border border-line bg-panel px-3 py-2.5 text-[13px] text-ink outline-none focus:border-accent">
            {historyStatusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
      </section>

      <section className="mt-8" aria-labelledby="previous-screenings-heading">
        <h3 id="previous-screenings-heading" className="mb-4 text-[18px] font-semibold tracking-[-0.015em] text-ink">{t('history.previousScreenings')}</h3>
        <div className="overflow-hidden border border-line bg-panel shadow-[0_1px_3px_rgba(32,42,49,0.04)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-14">
              <Loader2 size={24} className="animate-spin text-accent" />
            </div>
          ) : error ? (
            <div className="px-6 py-14 text-center">
              <AlertCircle size={32} className="mx-auto text-danger mb-2" />
              <p className="text-[15px] font-semibold text-ink">{error}</p>
              <button
                type="button"
                onClick={fetchHistory}
                className="mt-4 inline-flex items-center gap-2 bg-accent px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#126b74]"
              >
                Retry
              </button>
            </div>
          ) : screenings.length === 0 ? (
            <HistoryState
              title={t('history.emptyTitle')}
              onAction={() => navigate('/new-screening')}
            />
          ) : filteredScreenings.length === 0 ? (
            <HistoryState
              title={t('history.noFoundTitle')}
              description={t('history.noFoundDesc')}
              onAction={() => navigate('/new-screening')}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead className="border-b border-line bg-surface">
                  <tr className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted">
                    <th className="px-6 py-3.5">{t('history.tableHeaders.patient')}</th>
                    <th className="px-6 py-3.5">{t('history.tableHeaders.patientId')}</th>
                    <th className="px-6 py-3.5">{t('history.tableHeaders.date')}</th>
                    {!isTechnician && <th className="px-6 py-3.5">{t('history.tableHeaders.grade')}</th>}
                    <th className="px-6 py-3.5">{t('history.tableHeaders.status')}</th>
                    <th className="px-6 py-3.5 text-right">{t('history.tableHeaders.action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredScreenings.map((screening) => {
                    const grade = screening.screening.drClassName
                    const isReferable = screening.screening.referable
                    const status = isReferable ? 'Refer' : (grade === 'No DR' ? 'Normal' : 'Monitor')
                    const date = new Date(screening.createdAt).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

                    return (
                      <tr key={screening._id} className="text-[14px] text-ink">
                        <td className="whitespace-nowrap px-6 py-4 font-medium">{screening.patient.name}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-muted">{screening.patient.id}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-muted">{date}</td>
                        {!isTechnician && <td className="whitespace-nowrap px-6 py-4">{t('history.grades.' + grade)}</td>}
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-[12px] font-semibold ${statusStyles[status]}`}>
                            {t('history.statuses.' + status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => navigate(`/analysis-result/${screening._id}`)}
                            className="inline-flex items-center gap-1 text-[13px] font-semibold text-accent hover:text-ink"
                          >
                            {t('history.view')}
                            <ArrowUpRight size={14} strokeWidth={1.8} aria-hidden="true" />
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
      </section>
    </div>
  )
}

function HistoryState({ title, description, onAction }) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="text-[15px] font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 text-[13px] text-muted">{description}</p>}
      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 inline-flex items-center gap-2 bg-accent px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#126b74]"
        >
          {onAction.label || t('history.startNewBtn')}
        </button>
      )}
    </div>
  )
}

export default HistoryPage
