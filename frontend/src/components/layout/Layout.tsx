import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import type { RootState } from '../../store'
import { Header } from './Header'
import Sidebar from './Sidebar'
import { ToastContainer } from '../ui/ToastContainer'
import { useToast } from '../../hooks/useToast'

/** Paths allowed while admin/stock-manager is in employee navigation mode */
function isPathAllowedForMgmtEmployeeNav(pathname: string): boolean {
  if (pathname === '/dashboard') return true
  if (pathname.startsWith('/employee')) return true
  if (pathname.startsWith('/create-request')) return true
  if (pathname.startsWith('/notifications')) return true
  if (pathname === '/profile') return true
  return false
}

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { toasts, removeToast } = useToast()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, useEmployeeNavigation } = useSelector((state: RootState) => state.auth)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return
    const isMgmt = user.role === 'admin' || user.role === 'stock-manager'
    if (isMgmt && useEmployeeNavigation && !isPathAllowedForMgmtEmployeeNav(location.pathname)) {
      navigate('/employee/dashboard', { replace: true })
    }
  }, [user, useEmployeeNavigation, location.pathname, navigate])

  return (
    <div className="relative flex h-screen bg-gray-50">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 backdrop-blur-sm transition-all duration-300 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar 
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={sidebarOpen}
        onMobileToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <div className={`flex-1 flex flex-col overflow-hidden min-w-0 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
      }`}>
        <Header 
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          mobileOpen={sidebarOpen}
          onMobileToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 p-3 overflow-y-auto bg-gray-50 sm:p-4 lg:p-6">
          {children}
        </main>
      </div>

      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  )
}

export { Layout }
