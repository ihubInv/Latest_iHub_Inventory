import { baseApi } from './baseApi'
import type { User, ApiResponse, PaginationParams } from '../../types/index'

export interface UsersResponse extends ApiResponse<User[]> {}

export interface UserResponse extends ApiResponse<User> {}

export interface UserStats {
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  byRole: Array<{ _id: string; count: number }>
  byDepartment: Array<{ _id: string; count: number }>
}

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<UsersResponse, PaginationParams & { role?: string; isactive?: boolean }>({
      query: (params) => ({
        url: '/users',
        params,
      }),
      providesTags: ['User'],
    }),
    getUser: builder.query<UserResponse, string>({
      query: (id) => `/users/${id}`,
      providesTags: (_, __, id) => [{ type: 'User', id }],
    }),
    createUser: builder.mutation<UserResponse, Partial<User>>({
      query: (userData) => ({
        url: '/users',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),
    updateUser: builder.mutation<UserResponse, { id: string; data: Partial<User> }>({
      query: ({ id, data }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'User', id }, 'User'],
    }),
    deleteUser: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),
    deactivateUser: builder.mutation<UserResponse, string>({
      query: (id) => ({
        url: `/users/${id}/deactivate`,
        method: 'PUT',
      }),
      invalidatesTags: (_, __, id) => [{ type: 'User', id }, 'User'],
    }),
    activateUser: builder.mutation<UserResponse, string>({
      query: (id) => ({
        url: `/users/${id}/activate`,
        method: 'PUT',
      }),
      invalidatesTags: (_, __, id) => [{ type: 'User', id }, 'User'],
    }),
    getActiveUsers: builder.query<{ success: boolean; count: number; data: User[] }, void>({
      query: () => '/users/active',
      providesTags: ['User'],
    }),
    getUsersByRole: builder.query<{ success: boolean; count: number; data: User[] }, string>({
      query: (role) => `/users/role/${role}`,
      providesTags: ['User'],
    }),
    getUserStats: builder.query<{ success: boolean; data: UserStats }, void>({
      query: () => '/users/stats',
      providesTags: ['User'],
    }),
    uploadProfilePicture: builder.mutation<
      { success: boolean; data: { profilePicture: string } },
      { id: string; file: File }
    >({
      query: ({ id, file }) => {
        const formData = new FormData()
        formData.append('profilePicture', file)
        return {
          url: `/users/${id}/profile-picture`,
          method: 'POST',
          body: formData,
        }
      },
      invalidatesTags: (_, __, { id }) => [{ type: 'User', id }, 'User'],
    }),
  }),
})

export const {
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useDeactivateUserMutation,
  useActivateUserMutation,
  useGetActiveUsersQuery,
  useGetUsersByRoleQuery,
  useGetUserStatsQuery,
  useUploadProfilePictureMutation,
} = usersApi
