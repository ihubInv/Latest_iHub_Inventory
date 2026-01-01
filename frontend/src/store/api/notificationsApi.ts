import { baseApi } from './baseApi'
import type { Notification, NotificationSettings, ApiResponse, PaginationParams } from '../../types/index'

export interface NotificationsResponse extends ApiResponse<Notification[]> {}

export interface NotificationResponse extends ApiResponse<Notification> {}

export interface NotificationSettingsResponse extends ApiResponse<NotificationSettings> {}

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<NotificationsResponse, PaginationParams & { isRead?: boolean; type?: string }>({
      query: (params) => ({
        url: '/notifications',
        params,
      }),
      providesTags: ['Notification'],
    }),
    getNotificationCount: builder.query<{ success: boolean; data: { unreadCount: number; totalCount: number } }, void>({
      query: () => '/notifications/count',
      providesTags: ['Notification'],
    }),
    getNotificationSettings: builder.query<NotificationSettingsResponse, void>({
      query: () => '/notifications/settings',
      providesTags: ['Notification'],
    }),
    updateNotificationSettings: builder.mutation<NotificationSettingsResponse, Partial<NotificationSettings>>({
      query: (settings) => ({
        url: '/notifications/settings',
        method: 'PUT',
        body: settings,
      }),
      invalidatesTags: ['Notification'],
    }),
    markAllAsRead: builder.mutation<{ success: boolean; message: string }, void>({
      query: () => ({
        url: '/notifications/read-all',
        method: 'PUT',
      }),
      invalidatesTags: ['Notification'],
    }),
    markAsRead: builder.mutation<NotificationResponse, string>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PUT',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Notification', id }, 'Notification'],
    }),
  }),
})

export const {
  useGetNotificationsQuery,
  useGetNotificationCountQuery,
  useGetNotificationSettingsQuery,
  useUpdateNotificationSettingsMutation,
  useMarkAllAsReadMutation,
  useMarkAsReadMutation,
} = notificationsApi
