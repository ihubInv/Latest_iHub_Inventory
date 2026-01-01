import { baseApi } from './baseApi'
import type { InventoryTransaction, ApiResponse, PaginationParams } from '../../types/index'

export interface TransactionsResponse extends ApiResponse<InventoryTransaction[]> {}

export interface TransactionResponse extends ApiResponse<InventoryTransaction> {}

export interface TransactionStats {
  totalTransactions: number
  pendingTransactions: number
  completedTransactions: number
  overdueTransactions: number
  byType: Array<{ _id: string; count: number; totalQuantity: number }>
  byStatus: Array<{ _id: string; count: number }>
  monthlyData: Array<{ month: string; count: number; totalQuantity: number }>
}

export interface MonthlyReport {
  month: string
  year: number
  totalTransactions: number
  totalQuantity: number
  byType: Array<{ type: string; count: number; quantity: number }>
  byStatus: Array<{ status: string; count: number }>
  topItems: Array<{ itemId: string; itemName: string; count: number; quantity: number }>
  topUsers: Array<{ userId: string; userName: string; count: number; quantity: number }>
}

export const transactionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTransactions: builder.query<
      TransactionsResponse,
      PaginationParams & { type?: string; status?: string; startDate?: string; endDate?: string }
    >({
      query: (params) => ({
        url: '/transactions',
        params,
      }),
      providesTags: ['Transaction'],
    }),
    getTransaction: builder.query<TransactionResponse, string>({
      query: (id) => `/transactions/${id}`,
      providesTags: (result, error, id) => [{ type: 'Transaction', id }],
    }),
    getTransactionStats: builder.query<{ success: boolean; data: TransactionStats }, void>({
      query: () => '/transactions/stats',
      providesTags: ['Transaction'],
    }),
    getAuditTrail: builder.query<
      { success: boolean; count: number; data: InventoryTransaction[] },
      PaginationParams & { startDate?: string; endDate?: string; type?: string }
    >({
      query: (params) => ({
        url: '/transactions/audit-trail',
        params,
      }),
      providesTags: ['Transaction'],
    }),
    getOverdueTransactions: builder.query<
      { success: boolean; count: number; data: InventoryTransaction[] },
      PaginationParams
    >({
      query: (params) => ({
        url: '/transactions/overdue',
        params,
      }),
      providesTags: ['Transaction'],
    }),
    getPendingTransactions: builder.query<
      { success: boolean; count: number; data: InventoryTransaction[] },
      PaginationParams
    >({
      query: (params) => ({
        url: '/transactions/pending',
        params,
      }),
      providesTags: ['Transaction'],
    }),
    getMonthlyReport: builder.query<
      { success: boolean; data: MonthlyReport },
      { month: number; year: number }
    >({
      query: ({ month, year }) => ({
        url: '/transactions/monthly-report',
        params: { month, year },
      }),
      providesTags: ['Transaction'],
    }),
    getTransactionsByItem: builder.query<
      { success: boolean; count: number; data: InventoryTransaction[] },
      { itemId: string } & PaginationParams
    >({
      query: ({ itemId, ...params }) => ({
        url: `/transactions/item/${itemId}`,
        params,
      }),
      providesTags: ['Transaction'],
    }),
    getTransactionsByUser: builder.query<
      { success: boolean; count: number; data: InventoryTransaction[] },
      { userId: string } & PaginationParams
    >({
      query: ({ userId, ...params }) => ({
        url: `/transactions/user/${userId}`,
        params,
      }),
      providesTags: ['Transaction'],
    }),
    approveTransaction: builder.mutation<TransactionResponse, string>({
      query: (id) => ({
        url: `/transactions/${id}/approve`,
        method: 'PUT',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Transaction', id }, 'Transaction'],
    }),
    cancelTransaction: builder.mutation<TransactionResponse, string>({
      query: (id) => ({
        url: `/transactions/${id}/cancel`,
        method: 'PUT',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Transaction', id }, 'Transaction'],
    }),
    completeTransaction: builder.mutation<TransactionResponse, string>({
      query: (id) => ({
        url: `/transactions/${id}/complete`,
        method: 'PUT',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Transaction', id }, 'Transaction'],
    }),
    returnTransaction: builder.mutation<
      TransactionResponse,
      { id: string; returnedBy: string; returnDate: string; condition?: string; notes?: string }
    >({
      query: ({ id, ...data }) => ({
        url: `/transactions/${id}/return`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Transaction', id }, 'Transaction'],
    }),
  }),
})

export const {
  useGetTransactionsQuery,
  useGetTransactionQuery,
  useGetTransactionStatsQuery,
  useGetAuditTrailQuery,
  useGetOverdueTransactionsQuery,
  useGetPendingTransactionsQuery,
  useGetMonthlyReportQuery,
  useGetTransactionsByItemQuery,
  useGetTransactionsByUserQuery,
  useApproveTransactionMutation,
  useCancelTransactionMutation,
  useCompleteTransactionMutation,
  useReturnTransactionMutation,
} = transactionsApi
