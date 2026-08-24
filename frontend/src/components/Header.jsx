import { Bell, CircleUserRound, LogOut, Moon, Search, Settings, Sun, User } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const demoNotifications = [
  {
    id: 'n-1',
    title: 'New screening completed',
    description: 'Patient P-1024 · Moderate NPDR flagged for review.',
    time: 'Just now',
  },
  {
    id: 'n-2',
    title: 'Pending review queue',
    description: '3 screenings are awaiting clinician sign-off.',
    time: '15 min ago',
  },
  {
    id: 'n-3',
    title: 'Weekly summary ready',
    description: '12 referrals detected across this week’s batch.',
    time: '2 hours ago',
  },
  {
    id: 'n-4',
    title: 'Model update available',
    description: 'DR grading model v2.4 is ready to install.',
    time: 'Yesterday',
  },
]

function Header() {
  const { theme, toggleTheme } = useTheme()
  const { signOut, session } = useAuth()
  const navigate = useNavigate()

  const [openPanel, setOpenPanel] = useState(null) // 'notifications' | 'profile' | null
  const headerRef = useRef(null)

  // Close any open popover on outside click or Escape.
  useEffect(() => {
    if (!openPanel) return undefined

    function handlePointer(event) {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setOpenPanel(null)
      }
    }
    function handleKey(event) {
      if (event.key === 'Escape') setOpenPanel(null)
    }
    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [openPanel])

  function toggle(panel) {
    setOpenPanel((current) => (current === panel ? null : panel))
  }

  function handleSignOut() {
    setOpenPanel(null)
    signOut()
    navigate('/login', { replace: true })
  }

  const isDark = theme === 'dark'

  return (
    <header
      ref={headerRef}
      className="retina-topbar z-10 flex min-h-[76px] shrink-0 items-center justify-between gap-6 px-8"
    >
      {/* Premium rounded search field */}
      <div className="retina-search relative flex h-11 min-w-0 max-w-[420px] flex-1 items-center gap-2.5 px-4">
        <Search size={16} strokeWidth={1.8} className="text-[#7C8B96]" aria-hidden="true" />
        <input
          type="search"
          placeholder="Search patients, screenings, records..."
          aria-label="Search"
          className="retina-search-input w-full bg-transparent text-[13px] tracking-[0.005em] text-ink placeholder:text-[#9AA8B2] focus:outline-none"
        />
        <span className="hidden items-center gap-1 rounded border border-line bg-panel px-1.5 py-0.5 text-[10px] font-semibold text-muted sm:inline-flex">
          ⌘K
        </span>
      </div>

      {/* Right cluster */}
      <div className="flex shrink-0 items-center gap-2">
        <div className="header-popover-anchor">
          <button
            type="button"
            aria-label="Notifications"
            aria-haspopup="true"
            aria-expanded={openPanel === 'notifications'}
            onClick={() => toggle('notifications')}
            className="retina-icon-btn relative flex size-10 items-center justify-center rounded-full"
          >
            <Bell size={17} strokeWidth={1.8} aria-hidden="true" />
            <span className="header-bell-dot" aria-hidden="true" />
          </button>
          {openPanel === 'notifications' && (
            <div className="header-popover header-popover--wide" role="dialog" aria-label="Notifications">
              <div className="header-popover-header">
                <h3 className="header-popover-title">Notifications</h3>
                <span className="header-popover-time">{demoNotifications.length} new</span>
              </div>
              <ul className="header-popover-list">
                {demoNotifications.map((notification) => (
                  <li key={notification.id} className="header-popover-notification">
                    <p className="header-popover-notification-title">{notification.title}</p>
                    <p className="header-popover-notification-desc">{notification.description}</p>
                    <span className="header-popover-time">{notification.time}</span>
                  </li>
                ))}
              </ul>
              <div className="header-popover-meta">
                <span>Recent updates</span>
                <span>Mark all as read</span>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          aria-pressed={isDark}
          onClick={toggleTheme}
          className="retina-icon-btn flex size-10 items-center justify-center rounded-full"
        >
          {isDark ? <Sun size={17} strokeWidth={1.8} aria-hidden="true" /> : <Moon size={17} strokeWidth={1.8} aria-hidden="true" />}
        </button>

        <div className="mx-1 h-6 w-px bg-line" aria-hidden="true" />

        <div className="header-popover-anchor">
          <button
            type="button"
            aria-label="Profile menu"
            aria-haspopup="true"
            aria-expanded={openPanel === 'profile'}
            onClick={() => toggle('profile')}
            className="flex h-10 items-center gap-2.5 rounded-full border border-line bg-panel pl-1.5 pr-3 transition-colors hover:border-[#BFD3DB]"
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-[rgba(18,199,200,0.12)] text-[11px] font-semibold text-[#0F7A7B]">
              DS
            </span>
            <span className="hidden text-[12.5px] font-semibold tracking-[-0.005em] text-ink sm:inline">
              Dr. Sharma
            </span>
            <CircleUserRound size={14} strokeWidth={1.8} className="text-muted" aria-hidden="true" />
          </button>
          {openPanel === 'profile' && (
            <div className="header-popover" role="menu" aria-label="Account menu">
              <div className="header-popover-header">
                <div>
                  <p className="header-popover-title" style={{ textTransform: 'none', letterSpacing: 0 }}>
                    Dr. Sharma
                  </p>
                  <p className="header-popover-time" style={{ marginTop: 2 }}>
                    {session?.email || 'demo@retina.local'}
                  </p>
                </div>
                <span className="dashboard-meta-pill" style={{ padding: '3px 8px', fontSize: 10.5 }}>
                  Clinician
                </span>
              </div>
              <button
                type="button"
                role="menuitem"
                className="header-popover-item"
                onClick={() => setOpenPanel(null)}
              >
                <User size={15} strokeWidth={1.8} aria-hidden="true" />
                <span>Profile</span>
              </button>
              <button
                type="button"
                role="menuitem"
                className="header-popover-item"
                onClick={() => setOpenPanel(null)}
              >
                <Settings size={15} strokeWidth={1.8} aria-hidden="true" />
                <span>Settings</span>
              </button>
              <div className="header-popover-divider" aria-hidden="true" />
              <button
                type="button"
                role="menuitem"
                className="header-popover-item header-popover-item--danger"
                onClick={handleSignOut}
              >
                <LogOut size={15} strokeWidth={1.8} aria-hidden="true" />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
