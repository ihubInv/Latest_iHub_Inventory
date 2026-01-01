import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import type { RootState } from '../../store'
import { logout } from '../../store/slices/authSlice'
import { performCompleteLogout } from '../../utils/logoutUtils'
import { useLogoutMutation } from '../../store/api/authApi'
import { Button } from '../ui/Button'
import { useToast } from '../../hooks/useToast'
import { Menu, PanelLeftClose, PanelLeftOpen, Bell } from 'lucide-react'

interface HeaderProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileToggle: () => void
}

const Header: React.FC<HeaderProps> = ({ collapsed, onToggle, mobileOpen, onMobileToggle }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state: RootState) => state.auth)
  const [logoutMutation] = useLogoutMutation()
  const { success, error } = useToast()

  const handleLogout = async () => {
    // Use comprehensive logout utility
    await performCompleteLogout(
      dispatch,
      () => logoutMutation().unwrap(), // API call
      navigate, // Navigation function
      (message: string, type = 'success') => type === 'error' ? error(message) : success(message) // Toast function
    )
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator'
      case 'stock-manager':
        return 'Stock Manager'
      case 'employee':
        return 'Employee'
      default:
        return role
    }
  }

  return (
    <header className="relative flex items-center justify-between w-full px-4 py-4 sm:px-6 lg:px-8 z-30">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-white/70 backdrop-blur-md" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#0d559e]/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#1a6bb8]/30 to-transparent" />
      </div>
      <div className="relative w-full flex items-center justify-between border border-gray-200/60 rounded-2xl shadow-sm bg-white/60 backdrop-blur-md px-3 sm:px-4 py-3">
      {/* Left Section - Mobile Menu & Logo */}
      <div className="flex items-center space-x-4">
        {/* Mobile Menu Button */}
        <button
          className="flex items-center justify-center p-3 text-gray-600 transition-all duration-200 rounded-xl lg:hidden hover:text-blue-600 hover:bg-blue-50 hover:scale-105 bg-white shadow-md border border-gray-200"
          onClick={onMobileToggle}
        >
          <Menu size={22} className="font-bold" />
        </button>

        {/* Desktop Sidebar Toggle Button */}
        {/* <button
          className="hidden lg:flex items-center justify-center p-3 text-gray-600 transition-all duration-200 rounded-xl hover:text-[#0d559e] hover:bg-blue-50 hover:scale-105 bg-white shadow-md border border-gray-200"
          onClick={onToggle}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <PanelLeftOpen size={22} /> : <PanelLeftClose size={22} />}
        </button> */}

        {/* Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0d559e] via-[#1a6bb8] to-[#2c7bc7] shadow-lg">
              <span className="text-lg font-bold text-white sm:text-xl">I</span>
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse sm:w-4 sm:h-4"></div>
          </div>
          <div className="hidden md:block">
            <h1 className="text-xl font-bold bg-gradient-to-r from-[#0d559e] to-[#1a6bb8] bg-clip-text text-transparent lg:text-2xl">
              iHub Inventory
            </h1>
            <p className="text-sm text-gray-500 font-medium">Management System</p>
          </div>
        </div>
      </div>

      {/* Center Section - User Info (Mobile) */}
      <div className="flex items-center space-x-2 lg:hidden">
        <div className="text-center">
          <p className="text-xs font-semibold text-gray-900 truncate max-w-[120px]">{user?.name}</p>
          <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
            {getRoleDisplayName(user?.role || '')}
          </span>
        </div>
      </div>

      {/* Right Section - Actions & Profile */}
      <div className="relative flex items-center space-x-2 sm:space-x-4">
        {/* Notifications → Asset Request Management (Admin/Stock Manager) */}
        {(user?.role === 'admin' || user?.role === 'stock-manager') && (
          <button
            type="button"
            aria-label="Open Asset Request Management"
            onClick={() => navigate('/requests')}
            className="relative flex items-center justify-center p-2.5 sm:p-3 text-gray-600 transition-all duration-200 rounded-xl hover:text-[#0d559e] hover:bg-blue-50 bg-white shadow-sm border border-gray-200"
            title="Asset Request Management"
          >
            <Bell size={18} />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#0d559e] to-[#1a6bb8] shadow ring-2 ring-white" />
          </button>
        )}

        {/* Desktop User Info */}
        <div className="hidden lg:flex items-center space-x-3 px-3 py-2 rounded-xl bg-white/80 shadow-sm border border-gray-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#0d559e] to-[#1a6bb8] flex items-center justify-center ring-2 ring-[#0d559e]/20">
            <span className="text-sm font-medium text-white">
              {user?.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
            </span>
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <span className="inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full bg-gradient-to-r from-[#0d559e]/10 to-[#1a6bb8]/10 text-[#0d559e] border border-[#0d559e]/20">
              {getRoleDisplayName(user?.role || '')}
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <Button variant="outline" size="sm" onClick={handleLogout} className="hidden md:block border-gray-300 hover:border-[#0d559e] hover:text-[#0d559e]">
          Logout
        </Button>
      </div>
      </div>
    </header>
  )
}

export { Header }
