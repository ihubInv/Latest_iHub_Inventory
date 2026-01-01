import { baseApi } from './baseApi'
import type { Location, ApiResponse, PaginationParams } from '../../types/index'

export interface LocationsResponse extends ApiResponse<Location[]> {}

export interface LocationResponse extends ApiResponse<Location> {}

export interface LocationStats {
  overall: {
    totalLocations: number
    activeLocations: number
    totalCapacity: number
    totalOccupancy: number
    utilizationPercentage: number
  }
  byType: Array<{
    _id: string
    count: number
    totalCapacity: number
    totalOccupancy: number
    utilizationPercentage: number
  }>
  byBuilding: Array<{
    _id: string
    count: number
    totalCapacity: number
    totalOccupancy: number
    utilizationPercentage: number
  }>
}

export const locationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLocations: builder.query<
      LocationsResponse,
      PaginationParams & {
        isActive?: boolean
        locationType?: string
        building?: string
        floor?: string
        accessLevel?: string
        isDefault?: boolean
      }
    >({
      query: (params) => ({
        url: '/locations',
        params,
      }),
      providesTags: ['Location'],
    }),
    getLocation: builder.query<LocationResponse, string>({
      query: (id) => `/locations/${id}`,
      providesTags: (_, __, id) => [{ type: 'Location', id }],
    }),
    createLocation: builder.mutation<LocationResponse, Partial<Location>>({
      query: (locationData) => ({
        url: '/locations',
        method: 'POST',
        body: locationData,
      }),
      invalidatesTags: ['Location'],
    }),
    updateLocation: builder.mutation<LocationResponse, { id: string; data: Partial<Location> }>({
      query: ({ id, data }) => ({
        url: `/locations/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Location', id }, 'Location'],
    }),
    deleteLocation: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/locations/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Location'],
    }),
    toggleLocationStatus: builder.mutation<LocationResponse, string>({
      query: (id) => ({
        url: `/locations/${id}/toggle-status`,
        method: 'PATCH',
      }),
      invalidatesTags: (_, __, id) => [{ type: 'Location', id }, 'Location'],
    }),
    setDefaultLocation: builder.mutation<LocationResponse, string>({
      query: (id) => ({
        url: `/locations/${id}/set-default`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Location'],
    }),
    updateLocationOccupancy: builder.mutation<
      LocationResponse,
      { id: string; action: 'increment' | 'decrement'; quantity: number }
    >({
      query: ({ id, action, quantity }) => ({
        url: `/locations/${id}/occupancy`,
        method: 'PATCH',
        body: { action, quantity },
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Location', id }, 'Location'],
    }),
    getLocationStats: builder.query<{ success: boolean; data: LocationStats }, void>({
      query: () => '/locations/stats',
      providesTags: ['Location'],
    }),
    getActiveLocations: builder.query<{ success: boolean; count: number; data: Location[] }, void>({
      query: () => '/locations/active',
      providesTags: ['Location'],
    }),
    getDefaultLocation: builder.query<LocationResponse, void>({
      query: () => '/locations/default',
      providesTags: ['Location'],
    }),
    getLocationsByType: builder.query<{ success: boolean; count: number; data: Location[] }, string>({
      query: (type) => `/locations/type/${type}`,
      providesTags: ['Location'],
    }),
    getLocationsWithAvailableCapacity: builder.query<
      { success: boolean; count: number; data: Location[] },
      void
    >({
      query: () => '/locations/available-capacity',
      providesTags: ['Location'],
    }),
    bulkUpdateLocations: builder.mutation<
      { success: boolean; data: { updatedCount: number; errorCount: number; results: Location[] } },
      { locationIds: string[]; updates: Partial<Location> }
    >({
      query: (data) => ({
        url: '/locations/bulk-update',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Location'],
    }),
  }),
})

export const {
  useGetLocationsQuery,
  useGetLocationQuery,
  useCreateLocationMutation,
  useUpdateLocationMutation,
  useDeleteLocationMutation,
  useToggleLocationStatusMutation,
  useSetDefaultLocationMutation,
  useUpdateLocationOccupancyMutation,
  useGetLocationStatsQuery,
  useGetActiveLocationsQuery,
  useGetDefaultLocationQuery,
  useGetLocationsByTypeQuery,
  useGetLocationsWithAvailableCapacityQuery,
  useBulkUpdateLocationsMutation,
} = locationsApi
