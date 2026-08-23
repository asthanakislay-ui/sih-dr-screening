import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'retina-sidebar-collapsed'
const SidebarContext = createContext(null)

function readInitialCollapsed() {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1'
  } catch (error) {
    return false
  }
}

export function SidebarProvider({ children }) {
  const [collapsed, setCollapsed] = useState(readInitialCollapsed)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0')
    } catch (error) {
      // localStorage may be unavailable — ignore
    }
  }, [collapsed])

  const toggleCollapsed = useCallback(() => {
    setCollapsed((current) => !current)
  }, [])

  const value = useMemo(() => ({ collapsed, setCollapsed, toggleCollapsed }), [collapsed, toggleCollapsed])

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}
