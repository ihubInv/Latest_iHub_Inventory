import React from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '../../store'
import AdminDashboard from '../../pages/AdminDashboard'
import StockManagerDashboard from '../../pages/StockManagerDashboard'
import EmployeeDashboard from '../../pages/EmployeeDashboard'

export const RoleBasedDashboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth)

  switch (user?.role) {
    case 'admin':
      return <AdminDashboard />
    case 'stock-manager':
      return <StockManagerDashboard />
    case 'employee':
      return <EmployeeDashboard />
    default:
      return <EmployeeDashboard /> // Default fallback
  }
}
