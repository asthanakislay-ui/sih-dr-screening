import { Activity, Bell, ClipboardPlus, HelpCircle, History, LayoutDashboard, LifeBuoy, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useSidebar } from '../context/SidebarContext'

const navigationItems = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard, end: true },
  { label: 'New Screening', to: '/new-screening', icon: ClipboardPlus },
  { label: 'History', to: '/history', icon: History },
]

function Sidebar() {
  const { collapsed, toggleCollapsed } = useSidebar()

  return (
    <aside
      className={`retina-sidebar flex h-full shrink-0 flex-col transition-[width] duration-200 ease-out ${
        collapsed ? 'w-[72px]' : 'w-[252px]'
      }`}
      aria-label="Primary"
    >
      {/* Brand */}
      <div
        className={`flex h-[76px] items-center gap-3 ${
          collapsed ? 'justify-center px-2' : 'px-6'
        }`}
      >
        <div
          className={`flex shrink-0 items-center justify-center rounded-lg bg-[rgba(18,199,200,0.12)] text-[#12C7C8] ${
            collapsed ? 'size-10' : 'size-9'
          }`}
        >
          <Activity size={19} strokeWidth={2} aria-hidden="true" />
        </div>
        {!collapsed && (
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#8FA3B2]">
              Retina
            </span>
            <span className="text-[14px] font-semibold tracking-[0.22em] text-white">
              DR SCREENING
            </span>
          </div>
        )}
      </div>

      {/* Collapse / expand control */}
      <div
        className={`flex ${
          collapsed ? 'justify-center px-2' : 'justify-end px-4'
        } pb-2`}
      >
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="retina-sidebar-toggle inline-flex size-8 items-center justify-center rounded-md text-[#8FA3B2] transition-colors duration-150 hover:bg-[rgba(255,255,255,0.05)] hover:text-white"
        >
          {collapsed ? (
            <PanelLeftOpen size={16} strokeWidth={1.8} aria-hidden="true" />
          ) : (
            <PanelLeftClose size={16} strokeWidth={1.8} aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Nav */}
      <nav
        className={`flex-1 pt-2 ${collapsed ? 'px-2' : 'px-4 pt-5'}`}
        aria-label="Main navigation"
      >
        {!collapsed && (
          <p className="mb-3 px-3 text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[#6E8294]">
            Workspace
          </p>
        )}
        <div className="space-y-1">
          {navigationItems.map(({ label, to, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `retina-nav-item flex items-center gap-3 text-[13.5px] font-medium ${
                  collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
                } ${isActive ? 'is-active' : ''}`
              }
            >
              <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
              {!collapsed && <span className="tracking-[0.005em]">{label}</span>}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Footer / clinician area */}
      <div className="border-t border-[rgba(255,255,255,0.06)] px-4 py-5">
        {!collapsed && (
          <p className="mb-2 px-3 text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[#6E8294]">
            Support
          </p>
        )}
        <div className="space-y-1">
          <a
            href="#help"
            title={collapsed ? 'Help & Guides' : undefined}
            className={`retina-nav-item flex items-center gap-3 py-2 text-[13px] font-medium text-[#B8C5CF] ${
              collapsed ? 'justify-center px-2' : 'px-3'
            }`}
          >
            <HelpCircle size={16} strokeWidth={1.8} aria-hidden="true" />
            {!collapsed && 'Help & Guides'}
          </a>
          <a
            href="#alerts"
            title={collapsed ? 'Notifications' : undefined}
            className={`retina-nav-item flex items-center gap-3 py-2 text-[13px] font-medium text-[#B8C5CF] ${
              collapsed ? 'justify-center px-2' : 'px-3'
            }`}
          >
            <Bell size={16} strokeWidth={1.8} aria-hidden="true" />
            {!collapsed && 'Notifications'}
          </a>
        </div>

        <div
          className={`mt-5 flex items-center gap-3 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] ${
            collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
          }`}
          title={collapsed ? 'Dr. Sharma · Clinician' : undefined}
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[rgba(18,199,200,0.14)] text-[11px] font-semibold text-[#12C7C8]">
            DS
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[12.5px] font-semibold text-white">
                Dr. Sharma
              </p>
              <p className="truncate text-[10.5px] uppercase tracking-[0.18em] text-[#6E8294]">
                Clinician
              </p>
            </div>
          )}
          {!collapsed && (
            <LifeBuoy size={14} strokeWidth={1.8} className="text-[#6E8294]" aria-hidden="true" />
          )}
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
