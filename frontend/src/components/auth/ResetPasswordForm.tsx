import React, { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useResetPasswordMutation } from '../../store/api/authApi'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useToast } from '../../hooks/useToast'

const ResetPasswordForm: React.FC = () => {
  const { success, error } = useToast()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [resetPasswordMutation, { isLoading }] = useResetPasswordMutation()
  const [passwordReset, setPasswordReset] = useState(false)

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })

  const [formErrors, setFormErrors] = useState({
    password: '',
    confirmPassword: '',
  })

  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      error('Invalid Link', 'This password reset link is invalid or expired.')
      navigate('/forgot-password')
    }
  }, [token, error, navigate])

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

  const validateForm = () => {
    const errors = {
      password: '',
      confirmPassword: '',
    }

    if (!formData.password) {
      errors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    setFormErrors(errors)
    return !Object.values(errors).some(error => error !== '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !token) {
      return
    }

    try {
      const resultAction = await resetPasswordMutation({
        token,
        password: formData.password,
      })

      if ('data' in resultAction && resultAction.data.success) {
        setPasswordReset(true)
        success('Password Reset!', 'Your password has been successfully reset.')
      } else {
        const errorMessage = 'error' in resultAction ? resultAction.error?.data?.message || 'Failed to reset password' : 'Failed to reset password'
        error('Reset Failed', errorMessage)
      }
    } catch (err: any) {
      const errorMessage = err?.message || err?.data || err?.error || 'Failed to reset password'
      error('Reset Failed', errorMessage)
    }
  }

  if (passwordReset) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center py-4 px-4 sm:py-12 sm:px-6 lg:px-8">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#0d559e]/5 to-transparent"></div>
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #0d559e 0.5px, transparent 0.5px)`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>
        
        <div className="relative w-full max-w-sm sm:max-w-md">
          {/* Main Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-6 sm:p-8 md:p-10" role="main" aria-label="Password reset success">
            {/* Success Icon */}
            <div className="text-center mb-6 sm:mb-8">
              <div className="mx-auto h-16 w-16 sm:h-20 sm:w-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <svg className="h-8 w-8 sm:h-10 sm:w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Password Reset!
              </h2>
              <p className="text-gray-600 text-sm px-2">
                Your password has been successfully updated
              </p>
            </div>

            {/* Success Message */}
            <div className="space-y-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <svg className="h-5 w-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-green-900">Success!</h3>
                    <p className="text-xs text-green-800 mt-1">
                      You can now log in to your account using your new password.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Link
                to="/login"
                className="block w-full"
              >
                <Button
                  className="w-full h-11 sm:h-12 bg-gradient-to-r from-[#0d559e] to-blue-700 hover:from-blue-700 hover:to-[#0d559e] text-white font-semibold rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#0d559e]/30 text-sm sm:text-base"
                >
                  Continue to Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!token) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center py-4 px-4 sm:py-12 sm:px-6 lg:px-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#0d559e]/5 to-transparent"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #0d559e 0.5px, transparent 0.5px)`,
          backgroundSize: '60px 60px'
        }}></div>
      </div>
      
      <div className="relative w-full max-w-sm sm:max-w-md">
        {/* Main Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-6 sm:p-8 md:p-10" role="main" aria-label="Reset password form">
          {/* Logo/Brand Section */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 bg-gradient-to-br from-[#0d559e] to-blue-700 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg">
              <svg className="h-6 w-6 sm:h-8 sm:w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Reset Password
            </h2>
            <p className="text-gray-600 text-xs sm:text-sm px-2">
              Enter your new password below
            </p>
          </div>

          {/* Form */}
          <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="Enter new password"
                  value={formData.password}
                  onChange={handleChange}
                  error={formErrors.password}
                  className="h-11 sm:h-12 px-3 sm:px-4 text-sm sm:text-base border-2 border-gray-200 rounded-lg sm:rounded-xl focus:border-[#0d559e] focus:ring-2 focus:ring-[#0d559e]/20 transition-all duration-200"
                />
              </div>
              <div>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={formErrors.confirmPassword}
                  className="h-11 sm:h-12 px-3 sm:px-4 text-sm sm:text-base border-2 border-gray-200 rounded-lg sm:rounded-xl focus:border-[#0d559e] focus:ring-2 focus:ring-[#0d559e]/20 transition-all duration-200"
                />
              </div>
            </div>

            {/* Password Requirements */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-600 font-medium mb-2">Password Requirements:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li className="flex items-center space-x-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${formData.password.length >= 6 ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                  <span>At least 6 characters</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${formData.password === formData.confirmPassword && formData.confirmPassword ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                  <span>Passwords match</span>
                </li>
              </ul>
            </div>

            {/* Submit Button */}
            <div>
              <Button
                type="submit"
                className="w-full h-11 sm:h-12 bg-gradient-to-r from-[#0d559e] to-blue-700 hover:from-blue-700 hover:to-[#0d559e] text-white font-semibold rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#0d559e]/30 text-sm sm:text-base"
                disabled={!formData.password || !formData.confirmPassword || isLoading}
                loading={isLoading}
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-xs sm:text-sm text-gray-600 px-2">
              Remember your password?{' '}
              <Link
                to="/login"
                className="font-medium text-[#0d559e] hover:text-blue-700 transition-colors duration-200"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordForm
