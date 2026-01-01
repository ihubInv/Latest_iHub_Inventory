import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../../store/slices/authSlice'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useToast } from '../../hooks/useToast'

const RegisterForm: React.FC = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { success, error } = useToast()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'employee',
    department: '',
  })

  const [formErrors, setFormErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
  })

  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
    if (e.key === 'Enter' && formData.name && formData.email && formData.password && formData.confirmPassword) {
      handleSubmit(e as any)
    }
  }

  const validateForm = () => {
    const errors = {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      department: '',
    }

    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters'
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

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    if (!formData.department.trim()) {
      errors.department = 'Department is required'
    }

    setFormErrors(errors)
    return !Object.values(errors).some(error => error !== '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const resultAction = await dispatch(register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role as 'admin' | 'stock-manager' | 'employee',
        department: formData.department.trim(),
      }) as any)

      if (register.fulfilled.match(resultAction)) {
        success('Registration successful!', 'Your account has been created successfully.')
        navigate('/login')
      } else {
        const errorMessage = resultAction.payload || 'Registration failed'
        error('Registration failed', errorMessage)
      }
    } catch (err: any) {
      const errorMessage = err?.message || err?.data || err?.error || 'Registration failed'
      error('Registration failed', errorMessage)
    } finally {
      setIsLoading(false)
    }
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
      
      <div className="relative w-full max-w-md sm:max-w-lg">
        {/* Main Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-6 sm:p-8 md:p-10" role="main" aria-label="Registration form">
          {/* Logo/Brand Section */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 bg-gradient-to-br from-[#0d559e] to-blue-700 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg">
              <svg className="h-6 w-6 sm:h-8 sm:w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Create Account
            </h2>
            <p className="text-gray-600 text-xs sm:text-sm px-2">
              Join our inventory management system
            </p>
          </div>

          {/* Form */}
          <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit} onKeyPress={handleKeyPress}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="sm:col-span-2">
                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  placeholder="Full name"
                  value={formData.name}
                  onChange={handleChange}
                  error={formErrors.name}
                  className="h-11 sm:h-12 px-3 sm:px-4 text-sm sm:text-base border-2 border-gray-200 rounded-lg sm:rounded-xl focus:border-[#0d559e] focus:ring-2 focus:ring-[#0d559e]/20 transition-all duration-200"
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                  error={formErrors.email}
                  className="h-11 sm:h-12 px-3 sm:px-4 text-sm sm:text-base border-2 border-gray-200 rounded-lg sm:rounded-xl focus:border-[#0d559e] focus:ring-2 focus:ring-[#0d559e]/20 transition-all duration-200"
                />
              </div>
              <div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="Password"
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
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={formErrors.confirmPassword}
                  className="h-11 sm:h-12 px-3 sm:px-4 text-sm sm:text-base border-2 border-gray-200 rounded-lg sm:rounded-xl focus:border-[#0d559e] focus:ring-2 focus:ring-[#0d559e]/20 transition-all duration-200"
                />
              </div>
              <div>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="h-11 sm:h-12 px-3 sm:px-4 text-sm sm:text-base border-2 border-gray-200 rounded-lg sm:rounded-xl focus:border-[#0d559e] focus:ring-2 focus:ring-[#0d559e]/20 transition-all duration-200 w-full bg-white"
                >
                  <option value="employee">Employee</option>
                  <option value="stock-manager">Stock Manager</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div>
                <Input
                  id="department"
                  name="department"
                  type="text"
                  required
                  placeholder="Department"
                  value={formData.department}
                  onChange={handleChange}
                  error={formErrors.department}
                  className="h-11 sm:h-12 px-3 sm:px-4 text-sm sm:text-base border-2 border-gray-200 rounded-lg sm:rounded-xl focus:border-[#0d559e] focus:ring-2 focus:ring-[#0d559e]/20 transition-all duration-200"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <Button
                type="submit"
                className="w-full h-11 sm:h-12 bg-gradient-to-r from-[#0d559e] to-blue-700 hover:from-blue-700 hover:to-[#0d559e] text-white font-semibold rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#0d559e]/30 text-sm sm:text-base"
                disabled={!formData.name || !formData.email || !formData.password || !formData.confirmPassword || !formData.department || isLoading}
                loading={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-xs sm:text-sm text-gray-600 px-2">
              Already have an account?{' '}
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

export default RegisterForm
