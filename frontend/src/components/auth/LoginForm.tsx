import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { useLoginMutation } from '../../store/api/authApi'
import { setCredentials } from '../../store/slices/authSlice'
import { useToast } from '../../hooks/useToast'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'

const LoginForm: React.FC = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { success, error } = useToast()
  const [loginMutation, { isLoading }] = useLoginMutation()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const [formErrors, setFormErrors] = useState({
    email: '',
    password: '',
  })

  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
    // Clear error when user starts typing
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && formData.email && formData.password) {
      handleSubmit(e as any)
    }
  }

  const validateForm = () => {
    const errors = {
      email: '',
      password: '',
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address'
    }

    if (!formData.password) {
      errors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }

    setFormErrors(errors)
    return !errors.email && !errors.password
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      console.log('🔐 LoginForm: Attempting login for:', formData.email)
      console.log('🔐 LoginForm: Using login mutation directly...')
      
      const result = await loginMutation(formData).unwrap()
      
      console.log('✅ LoginForm: Login successful', result)
      
      // Update Redux auth state
      dispatch(setCredentials({
        user: result.data.user,
        token: result.data.token
      }))
      console.log('💾 LoginForm: Auth state updated in Redux')
      
      success('Login successful!')
      navigate('/dashboard')
    } catch (err: any) {
      console.log('❌ LoginForm: Login failed', err)
      console.log('❌ LoginForm: Error details:', {
        message: err?.message,
        status: err?.status,
        data: err?.data,
        originalStatus: err?.originalStatus,
        error: err?.error
      })
      const errorMessage = err?.message || err?.data || err?.error || 'Connection failed - check if backend server is running'
      error('Login failed', errorMessage)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-4 px-4">
      <div className="w-full max-w-md">
        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Logo/Brand Section */}
          <div className="text-center mb-8">
            {/* Logo */}
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
              <span className="text-white text-2xl font-bold">IM</span>
            </div>
            
            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              iHub & HCi Foundation
            </h1>
            
            {/* Subtitle */}
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Inventory Management System
            </h2>
            
            {/* Call to Action */}
            <p className="text-sm text-gray-600">
              Sign in to your Account
            </p>
          </div>

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit} onKeyPress={handleKeyPress}>
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.email ? 'border-red-500' : ''
                  }`}
                />
              </div>
              {formErrors.email && (
                <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.password ? 'border-red-500' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {formErrors.password && (
                <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={!formData.email || !formData.password || isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          </form>

          {/* Registration Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Register here
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Inventory Management System © 2025
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginForm