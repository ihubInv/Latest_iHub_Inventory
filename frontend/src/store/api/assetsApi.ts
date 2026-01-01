import { baseApi } from './baseApi'
import type { Asset, ApiResponse, PaginationParams } from '../../types/index'

export interface AssetsResponse extends ApiResponse<Asset[]> {}

export interface AssetResponse extends ApiResponse<Asset> {}

export interface AssetStats {
  totalAssets: number
  activeAssets: number
  assetsWithInventory: number
  byCategory: Array<{ _id: string; categoryName: string; count: number }>
  byManufacturer: Array<{ _id: string; count: number }>
}

export interface AssetInventorySummary {
  asset: Asset
  inventorySummary: {
    totalItems: number
    totalQuantity: number
    availableQuantity: number
    issuedQuantity: number
    totalValue: number
    averageCost: number
    byStatus: Array<{
      _id: string
      count: number
      quantity: number
      value: number
    }>
  }
}

export const assetsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAssets: builder.query<
      AssetsResponse,
      PaginationParams & { category?: string; isactive?: boolean }
    >({
      query: (params) => ({
        url: '/assets',
        params,
      }),
      providesTags: ['Asset'],
    }),
    getAsset: builder.query<AssetResponse, string>({
      query: (id) => `/assets/${id}`,
      providesTags: (_, __, id) => [{ type: 'Asset', id }],
    }),
    createAsset: builder.mutation<AssetResponse, Partial<Asset>>({
      query: (assetData) => ({
        url: '/assets',
        method: 'POST',
        body: assetData,
      }),
      invalidatesTags: ['Asset'],
    }),
    updateAsset: builder.mutation<AssetResponse, { id: string; data: Partial<Asset> }>({
      query: ({ id, data }) => ({
        url: `/assets/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Asset', id }, 'Asset'],
    }),
    deleteAsset: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/assets/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Asset'],
    }),
    getActiveAssets: builder.query<{ success: boolean; count: number; data: Asset[] }, void>({
      query: () => '/assets/active',
      providesTags: ['Asset'],
    }),
    getAssetsWithInventory: builder.query<
      { success: boolean; count: number; data: (Asset & { inventoryCount: number; totalQuantity: number; totalValue: number })[] },
      void
    >({
      query: () => '/assets/with-inventory',
      providesTags: ['Asset'],
    }),
    searchAssets: builder.query<
      { success: boolean; count: number; data: Asset[] },
      { q: string; category?: string; limit?: number }
    >({
      query: (params) => ({
        url: '/assets/search',
        params,
      }),
      providesTags: ['Asset'],
    }),
    getAssetStats: builder.query<{ success: boolean; data: AssetStats }, void>({
      query: () => '/assets/stats',
      providesTags: ['Asset'],
    }),
    getAssetsByCategory: builder.query<{ success: boolean; count: number; data: Asset[] }, string>({
      query: (categoryId) => `/assets/category/${categoryId}`,
      providesTags: ['Asset'],
    }),
    getAssetInventorySummary: builder.query<
      { success: boolean; data: AssetInventorySummary },
      string
    >({
      query: (id) => `/assets/${id}/inventory-summary`,
      providesTags: (_, __, id) => [{ type: 'Asset', id }],
    }),
    toggleAssetActive: builder.mutation<AssetResponse, string>({
      query: (id) => ({
        url: `/assets/${id}/toggle-active`,
        method: 'PUT',
      }),
      invalidatesTags: (_, __, id) => [{ type: 'Asset', id }, 'Asset'],
    }),
    addTag: builder.mutation<AssetResponse, { id: string; tag: string }>({
      query: ({ id, tag }) => ({
        url: `/assets/${id}/tags`,
        method: 'POST',
        body: { tag },
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Asset', id }, 'Asset'],
    }),
    removeTag: builder.mutation<AssetResponse, { id: string; tag: string }>({
      query: ({ id, tag }) => ({
        url: `/assets/${id}/tags/${tag}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Asset', id }, 'Asset'],
    }),
  }),
})

export const {
  useGetAssetsQuery,
  useGetAssetQuery,
  useCreateAssetMutation,
  useUpdateAssetMutation,
  useDeleteAssetMutation,
  useGetActiveAssetsQuery,
  useGetAssetsWithInventoryQuery,
  useSearchAssetsQuery,
  useGetAssetStatsQuery,
  useGetAssetsByCategoryQuery,
  useGetAssetInventorySummaryQuery,
  useToggleAssetActiveMutation,
  useAddTagMutation,
  useRemoveTagMutation,
} = assetsApi
