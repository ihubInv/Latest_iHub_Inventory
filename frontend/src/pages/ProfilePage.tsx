import React, { useEffect, useMemo, useState } from 'react'
import DepartmentDropdown from '../components/common/DepartmentDropdown'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '../store'
import type { User } from '../types'
import { setUser } from '../store/slices/authSlice'
import { useUpdateProfileMutation } from '../store/api/authApi'
import { ArrowLeft, UserCircle, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
function mapApiUserToUser(u: Record<string, unknown>): User {
  return {
    id: String(u.id ?? u._id ?? ''),
    email: String(u.email ?? ''),
    name: String(u.name ?? ''),
    role: (u.role as User['role']) || 'employee',
    department: (u.department as string | null | undefined) ?? null,
    isactive: Boolean(u.isactive ?? true),
    createdat: (u.createdAt as Date) || new Date(),
    lastlogin: (u.lastlogin as Date | null | undefined) ?? null,
    profilepicture: (u.profilepicture as string | null | undefined) ?? null,
    phone: (u.phone as string | null | undefined) ?? null,
    address: (u.address as string | null | undefined) ?? null,
    location: (u.location as string | null | undefined) ?? null,
    bio: (u.bio as string | null | undefined) ?? null,
  }
}

function getDashboardPath(
  user: User | null,
  useEmployeeNavigation: boolean
): string {
  if (!user) return '/dashboard'
  const mgmt = user.role === 'admin' || user.role === 'stock-manager'
  if (useEmployeeNavigation && mgmt) return '/employee/dashboard'
  if (user.role === 'employee') return '/employee/dashboard'
  if (user.role === 'admin') return '/admin/dashboard'
  if (user.role === 'stock-manager') return '/stock-manager/dashboard'
  return '/dashboard'
}

const ProfilePage: React.FC = () => {
  const dispatch = useDispatch()
  const { user, useEmployeeNavigation } = useSelector((state: RootState) => state.auth)
  const [updateProfile, { isLoading }] = useUpdateProfileMutation()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [department, setDepartment] = useState('')

  const dashboardPath = useMemo(
    () => getDashboardPath(user, useEmployeeNavigation),
    [user, useEmployeeNavigation]
  )

  const profileDepartmentExtras = useMemo(
    () => (user?.department?.trim() ? [user.department.trim()] : []),
    [user?.department]
  )

  useEffect(() => {
    if (!user) return
    setName(user.name || '')
    setEmail(user.email || '')
    setDepartment(user.department || '')
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    const trimmedName = name.trim()
    if (trimmedName.length < 2) {
      toast.error('Name must be at least 2 characters')
      return
    }
    try {
      const res = await updateProfile({
        name: trimmedName,
        email: email.trim().toLowerCase(),
        department: department.trim() || undefined,
      }).unwrap()

      const next = mapApiUserToUser(res.data.user as Record<string, unknown>)
      dispatch(setUser(next))
      toast.success(res.message || 'Profile updated')
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } }
      toast.error(e?.data?.message || 'Could not update profile')
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6">
      <div className="flex items-center space-x-4 mb-2">
        <Link
          to={dashboardPath}
          className="flex items-center space-x-2 text-[#0d559e] hover:text-blue-700 transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to dashboard</span>
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-r from-[#0d559e] to-blue-700 rounded-xl shadow-md">
            <UserCircle className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My profile</h1>
            <p className="text-gray-600 mt-1">
              Update your name, email, and department. Changes apply after you save.
            </p>
          </div>
        </div>
        <span className="inline-flex self-start px-3 py-1 text-sm font-medium capitalize rounded-full bg-blue-50 text-[#0d559e] border border-blue-100 sm:self-center shrink-0">
          {user.role?.replace('-', ' ')}
        </span>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-visible"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-[#0d559e] to-[#1a6bb8]">
              <UserCircle className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Account details</h2>
          </div>
        </div>

        <div className="p-6 space-y-6 relative z-10">
          <div>
            <label htmlFor="profile-name" className="block text-sm font-medium text-gray-700 mb-2">
              Full name
            </label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d559e] focus:border-transparent text-gray-900"
              autoComplete="name"
              required
              minLength={2}
              maxLength={50}
            />
          </div>

          <div>
            <label htmlFor="profile-email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="profile-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d559e] focus:border-transparent text-gray-900"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <DepartmentDropdown
              value={department}
              onChange={setDepartment}
              includeEmpty
              emptyLabel="None (optional)"
              extraNames={profileDepartmentExtras}
              placeholder="Select department (optional)"
              size="sm"
              variant="bordered"
            />
            <p className="mt-2 text-xs text-gray-500">
              Unlisted departments still appear if already saved on your account.
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50/80 sm:flex-row sm:justify-end">
          <Link
            to={dashboardPath}
            className="inline-flex justify-center px-5 py-2.5 text-gray-700 bg-white rounded-lg hover:bg-gray-50 border border-gray-200 font-medium text-sm"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-white text-sm font-medium rounded-lg bg-gradient-to-r from-[#0d559e] to-[#1a6bb8] hover:opacity-95 disabled:opacity-50 shadow-sm"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Save changes
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProfilePage
