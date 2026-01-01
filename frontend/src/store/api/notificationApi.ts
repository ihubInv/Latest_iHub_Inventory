import { baseApi } from './baseApi'

// Re-export users query for components that import from notificationApi
export { useGetUsersQuery } from './usersApi'

// Keep the notification-specific APIs
export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Add notification-specific endpoints here if needed
  }),
})

