import { baseApi } from './baseApi'
import type { ApiResponse, PaginationParams } from '../../types/index'

export interface ReturnRequest {
  id: string
  employeeid: string
  employeename: string
  inventoryitemid: string
  assetname: string
  returnreason: string
  conditiononreturn: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged'
  status: 'pending' | 'approved' | 'rejected'
  requestedat: string
  reviewedat?: string
  reviewedby?: string
  reviewername?: string
  approvalremarks?: string
  rejectionreason?: string
  notes?: string
}

export interface ReturnRequestsResponse extends ApiResponse<ReturnRequest[]> {}

export interface ReturnRequestResponse extends ApiResponse<ReturnRequest> {}

export const returnRequestsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getReturnRequests: builder.query<
      ReturnRequestsResponse,
      PaginationParams & {
        status?: string
      }
    >({
      query: (params) => ({
        url: '/return-requests',
        params,
      }),
      providesTags: ['ReturnRequest'],
    }),
    getReturnRequest: builder.query<ReturnRequestResponse, string>({
      query: (id) => `/return-requests/${id}`,
      providesTags: (_, __, id) => [{ type: 'ReturnRequest', id }],
    }),
    createReturnRequest: builder.mutation<ReturnRequestResponse, Partial<ReturnRequest>>({
      query: (returnData) => ({
        url: '/return-requests',
        method: 'POST',
        body: returnData,
      }),
      invalidatesTags: ['ReturnRequest', 'InventoryItem'],
    }),
    approveReturnRequest: builder.mutation<
      ReturnRequestResponse,
      { id: string; remarks?: string }
    >({
      query: ({ id, ...data }) => ({
        url: `/return-requests/${id}/approve`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'ReturnRequest', id },
        'ReturnRequest',
        'InventoryItem',
      ],
    }),
    rejectReturnRequest: builder.mutation<
      ReturnRequestResponse,
      { id: string; rejectionreason: string }
    >({
      query: ({ id, ...data }) => ({
        url: `/return-requests/${id}/reject`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'ReturnRequest', id },
        'ReturnRequest',
      ],
    }),
    getPendingReturnRequests: builder.query<
      { success: boolean; count: number; data: ReturnRequest[] },
      void
    >({
      query: () => '/return-requests/pending',
      providesTags: ['ReturnRequest'],
    }),
    getMyReturnRequests: builder.query<ReturnRequestsResponse, PaginationParams>({
      query: (params) => ({
        url: '/return-requests/my-returns',
        params,
      }),
      providesTags: ['ReturnRequest'],
    }),
    deleteReturnRequest: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (id) => ({
        url: `/return-requests/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ReturnRequest'],
    }),
  }),
})

export const {
  useGetReturnRequestsQuery,
  useGetReturnRequestQuery,
  useCreateReturnRequestMutation,
  useApproveReturnRequestMutation,
  useRejectReturnRequestMutation,
  useGetPendingReturnRequestsQuery,
  useGetMyReturnRequestsQuery,
  useDeleteReturnRequestMutation,
} = returnRequestsApi
