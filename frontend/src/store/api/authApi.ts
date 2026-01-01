import { baseApi } from './baseApi'
import type { User } from '../../types/index'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  role: 'admin' | 'stock-manager' | 'employee'
  department?: string
  phone?: string
  address?: string
  bio?: string
  location?: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  password: string
}

export interface AuthResponse {
  user: User
  token: string
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<{ success: boolean; data: AuthResponse }, LoginRequest>({
      query: (credentials) => {
        console.log('🌐 AuthApi: Making login request to /auth/login with credentials:', credentials)
        return {
          url: '/auth/login',
          method: 'POST',
          body: credentials,
        }
      },
      invalidatesTags: ['User'],
    }),
    register: builder.mutation<{ success: boolean; data: AuthResponse }, RegisterRequest>({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),
    getProfile: builder.query<{ success: boolean; data: User }, void>({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),
    updateProfile: builder.mutation<{ success: boolean; data: User }, Partial<User>>({
      query: (userData) => ({
        url: '/auth/profile',
        method: 'PUT',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),
    changePassword: builder.mutation<
      { success: boolean; message: string },
      { currentPassword: string; newPassword: string }
    >({
      query: (passwords) => ({
        url: '/auth/change-password',
        method: 'PUT',
        body: passwords,
      }),
    }),
    logout: builder.mutation<{ success: boolean; message: string }, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),
    refreshToken: builder.mutation<{ success: boolean; data: { token: string } }, void>({
      query: () => ({
        url: '/auth/refresh',
        method: 'POST',
      }),
    }),
    forgotPassword: builder.mutation<{ success: boolean; message: string }, ForgotPasswordRequest>({
      query: (emailData) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body: emailData,
      }),
    }),
    resetPassword: builder.mutation<{ success: boolean; message: string }, ResetPasswordRequest>({
      query: (resetData) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body: resetData,
      }),
    }),
  }),
})

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi
