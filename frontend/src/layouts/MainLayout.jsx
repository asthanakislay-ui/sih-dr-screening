import { Outlet } from 'react-router-dom'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'

function MainLayout() {
  return (
    <div className="retina-shell flex min-h-screen">
      <Sidebar />
      <div className="dashboard-canvas relative flex min-w-0 flex-1 flex-col">
        {/* Subtle retinal visual treatment — stays behind content, fades into the white background. */}
        <div className="retina-bg" aria-hidden="true">
          <div className="retina-bg-reticle retina-bg-reticle--a" />
          <div className="retina-bg-reticle retina-bg-reticle--b" />
          <div className="retina-bg-arc retina-bg-arc--vessels" />
        </div>

        <Header />
        <main className="dashboard-main relative min-h-0 flex-1" aria-label="Main content">
          <div className="dashboard-main-inner px-8 py-9 lg:px-10 lg:py-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default MainLayout
