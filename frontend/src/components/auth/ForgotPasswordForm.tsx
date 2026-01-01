import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForgotPasswordMutation } from '../../store/api/authApi'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useToast } from '../../hooks/useToast'

const ForgotPasswordForm: React.FC = () => {
  const { success, error } = useToast()
  const [forgotPasswordMutation, { isLoading }] = useForgotPasswordMutation()
  const [emailSent, setEmailSent] = useState(false)

  const [formData, setFormData] = useState({
    email: '',
  })

  const [formErrors, setFormErrors] = useState({
    email: '',
  })

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
      email: '',
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address'
    }

    setFormErrors(errors)
    return !errors.email
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      const resultAction = await forgotPasswordMutation({
        email: formData.email.trim(),
      })

      if ('data' in resultAction && resultAction.data.success) {
        setEmailSent(true)
        success('Email sent!', 'Please check your inbox for password reset instructions.')
      } else {
        const errorMessage = 'error' in resultAction ? resultAction.error?.data?.message || 'Failed to send reset email' : 'Failed to send reset email'
        error('Failed to send email', errorMessage)
      }
    } catch (err: any) {
      const errorMessage = err?.message || err?.data || err?.error || 'Failed to send reset email'
      error('Failed to send email', errorMessage)
    }
  }

  if (emailSent) {
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
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-6 sm:p-8 md:p-10" role="main" aria-label="Email sent confirmation">
            {/* Success Icon */}
            <div className="text-center mb-6 sm:mb-8">
              <div className="mx-auto h-16 w-16 sm:h-20 sm:w-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <svg className="h-8 w-8 sm:h-10 sm:w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Check Your Email
              </h2>
              <p className="text-gray-600 text-sm px-2">
                We've sent password reset instructions to
              </p>
              <p className="text-[#0d559e] font-semibold text-sm mt-1">
                {formData.email}
              </p>
            </div>

            {/* Instructions */}
            <div className="space-y-4 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-blue-900">Next Steps</h3>
                    <ul className="text-xs text-blue-800 mt-1 space-y-1">
                      <li>• Check your email inbox (and spam folder)</li>
                      <li>• Click the reset link in the email</li>
                      <li>• Create a new password</li>
                      <li>• Link expires in 1 hour</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={() => setEmailSent(false)}
                className="w-full h-11 sm:h-12 bg-gradient-to-r from-[#0d559e] to-blue-700 hover:from-blue-700 hover:to-[#0d559e] text-white font-semibold rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#0d559e]/30 text-sm sm:text-base"
              >
                Send Another Email
              </Button>
              
              <Link
                to="/login"
                className="block w-full text-center text-sm text-[#0d559e] hover:text-blue-700 transition-colors duration-200 font-medium"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
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
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-6 sm:p-8 md:p-10" role="main" aria-label="Forgot password form">
          {/* Logo/Brand Section */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 bg-gradient-to-br from-[#0d559e] to-blue-700 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg">
              <svg className="h-6 w-6 sm:h-8 sm:w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Forgot Password?
            </h2>
            <p className="text-gray-600 text-xs sm:text-sm px-2">
              Enter your email address and we'll send you a link to reset your password
            </p>
          </div>

          {/* Form */}
          <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
            <div>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="Enter your email address"
                value={formData.email}
                onChange={handleChange}
                error={formErrors.email}
                className="h-11 sm:h-12 px-3 sm:px-4 text-sm sm:text-base border-2 border-gray-200 rounded-lg sm:rounded-xl focus:border-[#0d559e] focus:ring-2 focus:ring-[#0d559e]/20 transition-all duration-200"
              />
            </div>

            {/* Submit Button */}
            <div>
              <Button
                type="submit"
                className="w-full h-11 sm:h-12 bg-gradient-to-r from-[#0d559e] to-blue-700 hover:from-blue-700 hover:to-[#0d559e] text-white font-semibold rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#0d559e]/30 text-sm sm:text-base"
                disabled={!formData.email || isLoading}
                loading={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
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

export default ForgotPasswordForm
