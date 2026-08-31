import { Bell, CircleUserRound, LogOut, Moon, Search, Settings, Sun, User, Languages } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useTranslation } from '../context/LanguageContext'
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../services/notificationService'

function Header() {
  const { theme, toggleTheme } = useTheme()
  const { signOut, session, activeRole, setRole } = useAuth()
  const { language, setLanguage, t } = useTranslation()
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [openPanel, setOpenPanel] = useState(null) // 'notifications' | 'profile' | 'language' | null
  const headerRef = useRef(null)

  // Fetch notifications and unread count from the backend
  async function updateNotifications() {
    if (!session?.token) return
    try {
      const [notifsRes, countRes] = await Promise.all([
        fetchNotifications(session.token),
        fetchUnreadCount(session.token),
      ])
      setNotifications(notifsRes.data || [])
      setUnreadCount(countRes.count || 0)
    } catch (err) {
      console.error('Failed to update notifications:', err)
    }
  }

  useEffect(() => {
    updateNotifications()
  }, [session?.token])

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

  async function handleMarkAllRead() {
    if (!session?.token) return
    try {
      await markAllNotificationsAsRead(session.token)
      setUnreadCount(0)
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  async function handleNotificationClick(notification) {
    if (!session?.token) return
    try {
      if (!notification.isRead) {
        await markNotificationAsRead(notification._id, session.token)
        setUnreadCount((prev) => Math.max(0, prev - 1))
        setNotifications((prev) =>
          prev.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n))
        )
      }
      if (notification.screeningId) {
        navigate(`/analysis-result/${notification.screeningId}`)
      }
      setOpenPanel(null)
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
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
          placeholder={t('header.searchPlaceholder')}
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
            {unreadCount > 0 && (
              <span className="header-bell-dot" aria-hidden="true" />
            )}
          </button>
          {openPanel === 'notifications' && (
            <div className="header-popover header-popover--wide" role="dialog" aria-label="Notifications">
              <div className="header-popover-header">
                <h3 className="header-popover-title">{t('header.notificationsTitle')}</h3>
                <span className="header-popover-time">{t('header.notificationsNew', { count: unreadCount })}</span>
              </div>
              <ul className="header-popover-list">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <li
                      key={notification._id}
                      className={`header-popover-notification ${notification.isRead ? 'is-read' : ''}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <p className="header-popover-notification-title">{notification.title}</p>
                      <p className="header-popover-notification-desc">{notification.description}</p>
                      <span className="header-popover-time">
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                    </li>
                  ))
                ) : (
                  <li className="p-4 text-center text-sm text-muted">
                    {t('header.notifications.empty')}
                  </li>
                )}
              </ul>
              <div className="header-popover-meta">
                <span className="cursor-default">{t('header.recentUpdates')}</span>
                <span
                  className="cursor-pointer hover:text-ink transition-colors"
                  onClick={handleMarkAllRead}
                >
                  {t('header.markAllRead')}
                </span>
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

        <div className="header-popover-anchor">
          <button
            type="button"
            aria-label="Change language"
            aria-haspopup="true"
            aria-expanded={openPanel === 'language'}
            onClick={() => toggle('language')}
            className="retina-icon-btn flex size-10 items-center justify-center rounded-full"
          >
            <Languages size={17} strokeWidth={1.8} aria-hidden="true" />
          </button>
          {openPanel === 'language' && (
            <div className="header-popover" role="menu" aria-label="Language selector">
              <div className="header-popover-header">
                <h3 className="header-popover-title">Language</h3>
              </div>
              <button
                type="button"
                role="menuitem"
                className={`header-popover-item ${language === 'en' ? 'is-active' : ''}`}
                onClick={() => {
                  setLanguage('en')
                  setOpenPanel(null)
                }}
              >
                <span className="font-medium">English (EN)</span>
              </button>
              <button
                type="button"
                role="menuitem"
                className={`header-popover-item ${language === 'hi' ? 'is-active' : ''}`}
                onClick={() => {
                  setLanguage('hi')
                  setOpenPanel(null)
                }}
              >
                <span className="font-medium">हिन्दी (HI)</span>
              </button>
            </div>
          )}
        </div>

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
              {session?.user?.name ? session.user.name.split(' ').map(n => n[0]).join('') : 'US'}
            </span>
            <span className="hidden text-[12.5px] font-semibold tracking-[-0.005em] text-ink sm:inline">
              {session?.user?.name || 'User'}
            </span>
            <CircleUserRound size={14} strokeWidth={1.8} className="text-muted" aria-hidden="true" />
          </button>
          {openPanel === 'profile' && (
            <div className="header-popover" role="menu" aria-label="Account menu">
              <div className="header-popover-header">
                <div>
                  <p className="header-popover-title" style={{ textTransform: 'none', letterSpacing: 0 }}>
                    {session?.user?.name || 'User'}
                  </p>
                  <p className="header-popover-time" style={{ marginTop: 2 }}>
                    {session?.email || 'user@retina.local'}
                  </p>
                </div>
                <span className="dashboard-meta-pill" style={{ padding: '3px 8px', fontSize: 10.5 }}>
                  {t('header.roles.' + (activeRole || 'clinician'))}
                </span>
              </div>
              <button
                type="button"
                role="menuitem"
                className="header-popover-item"
                onClick={() => {
                  setRole(activeRole === 'clinician' ? 'technician' : 'clinician')
                  setOpenPanel(null)
                }}
              >
                <Settings size={15} strokeWidth={1.8} aria-hidden="true" />
                <span style={{ fontSize: '12px' }}>
                  {t('header.switchView', { role: t('header.roles.' + (activeRole === 'clinician' ? 'technician' : 'clinician')) })}
                </span>
              </button>
              <button
                type="button"
                role="menuitem"
                className="header-popover-item"
                onClick={() => setOpenPanel(null)}
              >
                <User size={15} strokeWidth={1.8} aria-hidden="true" />
                <span>{t('header.profile')}</span>
              </button>
              <div className="header-popover-divider" aria-hidden="true" />
              <button
                type="button"
                role="menuitem"
                className="header-popover-item header-popover-item--danger"
                onClick={handleSignOut}
              >
                <LogOut size={15} strokeWidth={1.8} aria-hidden="true" />
                <span>{t('header.signOut')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
