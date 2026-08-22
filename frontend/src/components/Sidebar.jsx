import { Activity, ClipboardPlus, History, LayoutDashboard } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navigationItems = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard, end: true },
  { label: 'New Screening', to: '/new-screening', icon: ClipboardPlus },
  { label: 'History', to: '/history', icon: History },
]

function Sidebar() {
  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-line bg-panel">
      <div className="flex h-[72px] items-center gap-3 border-b border-line px-5">
        <div className="flex size-9 items-center justify-center rounded-md bg-accent-soft text-accent">
          <Activity size={19} strokeWidth={2} aria-hidden="true" />
        </div>
        <span className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
          DR Screening
        </span>
      </div>

      <nav className="flex-1 px-3 py-6" aria-label="Main navigation">
        <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
          Workspace
        </p>
        <div className="space-y-1">
          {navigationItems.map(({ label, to, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 border-l-2 px-3 py-2.5 text-[14px] font-medium transition-colors ${
                  isActive
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-transparent text-muted hover:bg-surface hover:text-ink'
                }`
              }
            >
              <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </aside>
  )
}

export default Sidebar
