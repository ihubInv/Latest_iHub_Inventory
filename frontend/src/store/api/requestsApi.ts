import { baseApi } from './baseApi'
import type { Request, ApiResponse, PaginationParams } from '../../types/index'

export interface RequestsResponse extends ApiResponse<Request[]> {}

export interface RequestResponse extends ApiResponse<Request> {}

export interface RequestStats {
  totalRequests: number
  pendingRequests: number
  approvedRequests: number
  rejectedRequests: number
  byStatus: Array<{ _id: string; count: number }>
  byPriority: Array<{ _id: string; count: number }>
  byDepartment: Array<{ _id: string; count: number }>
}

export const requestsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRequests: builder.query<
      RequestsResponse,
      PaginationParams & {
        status?: string
        priority?: string
        department?: string
        startDate?: string
        endDate?: string
      }
    >({
      query: (params) => ({
        url: '/requests',
        params,
      }),
      providesTags: ['Request'],
    }),
    getRequest: builder.query<RequestResponse, string>({
      query: (id) => `/requests/${id}`,
      providesTags: (_, __, id) => [{ type: 'Request', id }],
    }),
    createRequest: builder.mutation<RequestResponse, Partial<Request>>({
      query: (requestData) => ({
        url: '/requests',
        method: 'POST',
        body: requestData,
      }),
      invalidatesTags: ['Request', 'InventoryItem'],
    }),
    updateRequest: builder.mutation<RequestResponse, { id: string; data: Partial<Request> }>({
      query: ({ id, data }) => ({
        url: `/requests/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Request', id }, 'Request'],
    }),
    deleteRequest: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/requests/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Request'],
    }),
    getMyRequests: builder.query<RequestsResponse, PaginationParams>({
      query: (params) => ({
        url: '/requests/my-requests',
        params,
      }),
      providesTags: ['Request'],
    }),
    getPendingRequests: builder.query<{ success: boolean; count: number; data: Request[] }, void>({
      query: () => '/requests/pending',
      providesTags: ['Request'],
    }),
    getOverdueRequests: builder.query<{ success: boolean; count: number; data: Request[] }, void>({
      query: () => '/requests/overdue',
      providesTags: ['Request'],
    }),
    getRequestsByEmployee: builder.query<
      { success: boolean; count: number; data: Request[] },
      { employeeId: string } & PaginationParams
    >({
      query: ({ employeeId, ...params }) => ({
        url: `/requests/employee/${employeeId}`,
        params,
      }),
      providesTags: ['Request'],
    }),
    approveRequest: builder.mutation<
      RequestResponse,
      {
        id: string
        remarks?: string
        approvedQuantity?: number
        inventoryItemId?: string
      }
    >({
      query: ({ id, ...data }) => ({
        url: `/requests/${id}/approve`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Request', id }, 'Request', 'InventoryItem'],
    }),
    rejectRequest: builder.mutation<
      RequestResponse,
      { id: string; rejectionReason: string; remarks?: string }
    >({
      query: ({ id, ...data }) => ({
        url: `/requests/${id}/reject`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Request', id }, 'Request', 'InventoryItem'],
    }),
    getRequestStats: builder.query<{ success: boolean; data: RequestStats }, void>({
      query: () => '/requests/stats',
      providesTags: ['Request'],
    }),
    getRequestAuditTrail: builder.query<
      { success: boolean; data: any[] },
      { requestId: string }
    >({
      query: ({ requestId }) => ({
        url: `/requests/${requestId}/audit-trail`,
      }),
      providesTags: (_, __, { requestId }) => [
        { type: 'Request', id: requestId },
        'AuditTrail'
      ],
    }),
  }),
})

export const {
  useGetRequestsQuery,
  useGetRequestQuery,
  useCreateRequestMutation,
  useUpdateRequestMutation,
  useDeleteRequestMutation,
  useGetMyRequestsQuery,
  useGetPendingRequestsQuery,
  useGetOverdueRequestsQuery,
  useGetRequestsByEmployeeQuery,
  useApproveRequestMutation,
  useRejectRequestMutation,
  useGetRequestStatsQuery,
  useGetRequestAuditTrailQuery,
} = requestsApi
