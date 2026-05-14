import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '../store'
import type { User } from '../types'
import { setUser } from '../store/slices/authSlice'
import { useUpdateProfileMutation } from '../store/api/authApi'
import { ArrowLeft, UserCircle, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { EMPLOYEE_DEPARTMENTS } from '../constants/departments'

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

const ProfilePage: React.FC = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((state: RootState) => state.auth)
  const [updateProfile, { isLoading }] = useUpdateProfileMutation()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [department, setDepartment] = useState('')

  const departmentOptions = useMemo(() => {
    const list = [...EMPLOYEE_DEPARTMENTS]
    const current = user?.department?.trim()
    if (current && !list.includes(current)) {
      list.unshift(current)
    }
    return list
  }, [user?.department])

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-[#0d559e] hover:text-blue-700 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to dashboard
          </Link>
          <div className="flex flex-col gap-2 mt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-[#0d559e] to-blue-700 rounded-xl shadow-md">
                <UserCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My profile</h1>
                <p className="text-gray-600 mt-1">
                  Update your name, email, and department. Changes apply across the app after you save.
                </p>
              </div>
            </div>
            <span className="inline-flex self-start px-3 py-1 text-sm font-medium capitalize rounded-full bg-blue-50 text-[#0d559e] border border-blue-100 sm:self-center">
              {user.role?.replace('-', ' ')}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-[#0d559e] via-[#1a6bb8] to-[#2c7bc7]" />
          <form onSubmit={handleSubmit} className="p-6 md:p-8 lg:p-10">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
              <div className="md:col-span-2">
                <label htmlFor="profile-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full name
                </label>
                <input
                  id="profile-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0d559e] focus:border-transparent text-gray-900"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={50}
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="profile-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email
                </label>
                <input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0d559e] focus:border-transparent text-gray-900"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="profile-department" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Department
                </label>
                <select
                  id="profile-department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0d559e] focus:border-transparent text-gray-900 bg-white"
                >
                  <option value="">Select department (optional)</option>
                  {departmentOptions.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-gray-500">
                  If your department is not listed, your current value is kept as an extra option until an admin updates the list.
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 pt-8 mt-2 border-t border-gray-100 sm:flex-row sm:justify-end">
              <Link
                to="/dashboard"
                className="inline-flex justify-center px-5 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 border border-gray-200 font-medium"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-white bg-gradient-to-r from-[#0d559e] to-[#1a6bb8] rounded-xl hover:opacity-95 disabled:opacity-50 font-medium shadow-md"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Save changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
