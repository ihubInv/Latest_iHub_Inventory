import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { initializeAuth } from '../../store/slices/authSlice'
import type { RootState, AppDispatch } from '../../store'

interface AuthInitializerProps {
  children: React.ReactNode
}

const AuthInitializer: React.FC<AuthInitializerProps> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>()
  const { isLoading } = useSelector((state: RootState) => state.auth)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const initialize = async () => {
      const hasToken = !!localStorage.getItem('token')
      const hasUser = !!localStorage.getItem('user')
      
      console.log('🔍 AuthInitializer: Checking stored auth data:', { hasToken, hasUser })
      
      // If we have stored auth data, try to initialize
      if (hasToken) {
        try {
          console.log('🔄 AuthInitializer: Initializing auth with stored token...')
          await dispatch(initializeAuth()).unwrap()
          console.log('✅ AuthInitializer: Auth initialization successful')
        } catch (error) {
          console.log('❌ AuthInitializer: Auth initialization failed:', error)
        }
      } else {
        console.log('ℹ️ AuthInitializer: No stored token found, skipping initialization')
      }
      
      setInitialized(true)
    }

    initialize()
  }, [dispatch])

  // Show loading spinner while initializing auth (only if we have a token)
  const shouldShowLoading = !initialized && localStorage.getItem('token')
  
  if (shouldShowLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your session...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default AuthInitializer