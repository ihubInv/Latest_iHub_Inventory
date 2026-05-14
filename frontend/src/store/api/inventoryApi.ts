import { baseApi } from './baseApi'
import type { InventoryItem, ApiResponse, PaginationParams } from '../../types/index'

export interface InventoryResponse extends ApiResponse<InventoryItem[]> {}

export interface InventoryItemResponse extends ApiResponse<InventoryItem> {}

export interface InventoryStats {
  totalItems: number
  totalValue: number
  availableItems: number
  issuedItems: number
  maintenanceItems: number
  retiredItems: number
  lowStockItems: number
  byCategory: Array<{
    category: string
    count: number
    value: number
  }>
  byLocation: Array<{
    location: string
    count: number
    value: number
  }>
  monthlyTrends: Array<{
    month: string
    added: number
    issued: number
    returned: number
  }>
}

export const inventoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInventoryItems: builder.query<
      InventoryResponse,
      PaginationParams & {
        category?: string
        location?: string
        status?: string
        condition?: string
        lowStock?: boolean
      }
    >({
      query: (params) => ({
        url: '/inventory',
        params,
      }),
      providesTags: ['InventoryItem'],
      keepUnusedDataFor: 0, // Don't cache - always fetch fresh data
    }),
    getInventoryItem: builder.query<InventoryItemResponse, string>({
      query: (id) => `/inventory/${id}`,
      providesTags: (_, __, id) => [{ type: 'InventoryItem', id }],
    }),
    createInventoryItem: builder.mutation<InventoryItemResponse, Partial<InventoryItem>>({
      query: (itemData) => ({
        url: '/inventory',
        method: 'POST',
        body: itemData,
      }),
      invalidatesTags: ['InventoryItem'],
    }),
    updateInventoryItem: builder.mutation<
      InventoryItemResponse,
      { id: string; data: Partial<InventoryItem> }
    >({
      query: ({ id, data }) => ({
        url: `/inventory/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'InventoryItem', id }, 'InventoryItem'],
    }),
    deleteInventoryItem: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/inventory/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['InventoryItem'],
    }),
    getAvailableInventoryItems: builder.query<InventoryResponse, PaginationParams>({
      query: (params) => ({
        url: '/inventory/available',
        params,
      }),
      providesTags: ['InventoryItem'],
    }),
    getAvailableAssetNames: builder.query<{ success: boolean; count: number; data: string[] }, void>({
      query: () => '/inventory/available-asset-names',
      providesTags: ['InventoryItem', 'Request'],
    }),
    getNextSerialPreview: builder.query<{ success: boolean; data: { currentSequence: number; nextSerial: number; nextSerialFormatted: string } }, void>({
      query: () => '/inventory/next-serial-preview',
      providesTags: ['InventoryItem'],
      keepUnusedDataFor: 0, // Don't cache - always fetch fresh data
    }),
    getLowStockItems: builder.query<InventoryResponse, PaginationParams>({
      query: (params) => ({
        url: '/inventory/low-stock',
        params,
      }),
      providesTags: ['InventoryItem'],
    }),
    getIssuedItems: builder.query<InventoryResponse, PaginationParams>({
      query: (params) => ({
        url: '/inventory/issued',
        params,
      }),
      providesTags: ['InventoryItem'],
    }),
    getInventoryStats: builder.query<{ success: boolean; data: InventoryStats }, void>({
      query: () => '/inventory/stats',
      providesTags: ['InventoryItem'],
    }),
    returnItem: builder.mutation<
      InventoryItemResponse,
      { id: string; condition?: string; notes?: string }
    >({
      query: ({ id, ...data }) => ({
        url: `/inventory/${id}/return`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['InventoryItem'],
    }),
    getItemTransactions: builder.query<
      { success: boolean; data: any[] },
      { id: string } & PaginationParams
    >({
      query: ({ id, ...params }) => ({
        url: `/inventory/${id}/transactions`,
        params,
      }),
      providesTags: (_, __, { id }) => [{ type: 'Transaction', id }],
    }),
    getInventoryAuditHistory: builder.query<
      {
        success: boolean
        data: {
          inventoryItemId: string
          uniqueid: string
          assetname: string
          events: any[]
        }
      },
      { id: string; uniqueId?: string }
    >({
      query: ({ id, uniqueId }) => ({
        url: `/inventory/${id}/audit-history`,
        params: uniqueId ? { uniqueId } : undefined,
      }),
      providesTags: (_, __, arg) => [{ type: 'InventoryItem', id: arg.id }],
    }),
    bulkUpdateInventory: builder.mutation<
      { success: boolean; data: { updatedCount: number; errorCount: number } },
      { itemIds: string[]; updates: Partial<InventoryItem> }
    >({
      query: (data) => ({
        url: '/inventory/bulk-update',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['InventoryItem'],
    }),
    uploadInventoryAttachment: builder.mutation<
      { success: boolean; data: { filePath: string; publicUrl: string } },
      { file: File; fileName?: string }
    >({
      query: ({ file, fileName }) => {
        const formData = new FormData()
        formData.append('file', file)
        if (fileName) {
          formData.append('fileName', fileName)
        }
        return {
          url: '/inventory/upload-attachment',
          method: 'POST',
          body: formData,
        }
      },
    }),
    getAttachmentUrl: builder.query<
      { success: boolean; data: { publicUrl: string } },
      { filePath: string }
    >({
      query: ({ filePath }) => ({
        url: `/inventory/attachment-url?filePath=${encodeURIComponent(filePath)}`,
      }),
    }),
  }),
})

export const {
  useGetInventoryItemsQuery,
  useGetInventoryItemQuery,
  useCreateInventoryItemMutation,
  useUpdateInventoryItemMutation,
  useDeleteInventoryItemMutation,
  useGetAvailableInventoryItemsQuery,
  useGetAvailableAssetNamesQuery,
  useGetLowStockItemsQuery,
  useGetIssuedItemsQuery,
  useGetInventoryStatsQuery,
  useReturnItemMutation,
  useGetItemTransactionsQuery,
  useGetInventoryAuditHistoryQuery,
  useBulkUpdateInventoryMutation,
  useUploadInventoryAttachmentMutation,
  useGetAttachmentUrlQuery,
  useGetNextSerialPreviewQuery,
} = inventoryApi
