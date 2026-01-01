import React from 'react'
import { useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'
import type { RootState } from '../../store'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, token, isAuthenticated } = useSelector((state: RootState) => state.auth)
  const location = useLocation()

  // Debug logging
  console.log('🔐 ProtectedRoute: Auth state check:', { 
    hasUser: !!user, 
    hasToken: !!token, 
    isAuthenticated,
    userRole: user?.role 
  })

  // Check if user is authenticated
  if (!token || !user) {
    console.log('🚫 ProtectedRoute: Not authenticated, redirecting to login')
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check if user has required role
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}

export { ProtectedRoute }