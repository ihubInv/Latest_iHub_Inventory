import { baseApi } from './baseApi'
import type { Category, ApiResponse, PaginationParams } from '../../types/index'

export interface CategoriesResponse extends ApiResponse<Category[]> {}

export interface CategoryResponse extends ApiResponse<Category> {}

export interface CategoryStats {
  totalCategories: number
  activeCategories: number
  majorCategories: number
  minorCategories: number
  categoriesWithInventory: number
  totalAssetNames: number
}

export const categoriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query<
      CategoriesResponse,
      PaginationParams & { type?: string; isactive?: boolean }
    >({
      query: (params) => ({
        url: '/categories',
        params,
      }),
      providesTags: ['Category'],
    }),
    getCategory: builder.query<CategoryResponse, string>({
      query: (id) => `/categories/${id}`,
      providesTags: (_, __, id) => [{ type: 'Category', id }],
    }),
    createCategory: builder.mutation<CategoryResponse, Partial<Category>>({
      query: (categoryData) => ({
        url: '/categories',
        method: 'POST',
        body: categoryData,
      }),
      invalidatesTags: ['Category'],
    }),
    updateCategory: builder.mutation<CategoryResponse, { id: string; data: Partial<Category> }>({
      query: ({ id, data }) => ({
        url: `/categories/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Category', id }, 'Category'],
    }),
    deleteCategory: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Category'],
    }),
    getActiveCategories: builder.query<{ success: boolean; count: number; data: Category[] }, void>({
      query: () => '/categories/active',
      providesTags: ['Category'],
    }),
    getCategoriesByType: builder.query<{ success: boolean; count: number; data: Category[] }, string>({
      query: (type) => `/categories/type/${type}`,
      providesTags: ['Category'],
    }),
    getMajorCategories: builder.query<{ success: boolean; count: number; data: Category[] }, void>({
      query: () => '/categories/major',
      providesTags: ['Category'],
    }),
    getMinorCategories: builder.query<{ success: boolean; count: number; data: Category[] }, void>({
      query: () => '/categories/minor',
      providesTags: ['Category'],
    }),
    getCategoriesWithInventory: builder.query<
      { success: boolean; count: number; data: (Category & { inventoryCount: number; totalValue: number })[] },
      void
    >({
      query: () => '/categories/with-inventory',
      providesTags: ['Category'],
    }),
    getCategoryStats: builder.query<{ success: boolean; data: CategoryStats }, void>({
      query: () => '/categories/stats',
      providesTags: ['Category'],
    }),
    addAssetName: builder.mutation<CategoryResponse, { id: string; assetName: string }>({
      query: ({ id, assetName }) => ({
        url: `/categories/${id}/assets`,
        method: 'POST',
        body: { assetName },
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Category', id }, 'Category'],
    }),
    removeAssetName: builder.mutation<CategoryResponse, { id: string; assetName: string }>({
      query: ({ id, assetName }) => ({
        url: `/categories/${id}/assets/${assetName}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Category', id }, 'Category'],
    }),
    toggleAssetName: builder.mutation<CategoryResponse, { id: string; assetName: string }>({
      query: ({ id, assetName }) => ({
        url: `/categories/${id}/assets/${assetName}/toggle`,
        method: 'PUT',
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Category', id }, 'Category'],
    }),
  }),
})

export const {
  useGetCategoriesQuery,
  useGetCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetActiveCategoriesQuery,
  useGetCategoriesByTypeQuery,
  useGetMajorCategoriesQuery,
  useGetMinorCategoriesQuery,
  useGetCategoriesWithInventoryQuery,
  useGetCategoryStatsQuery,
  useAddAssetNameMutation,
  useRemoveAssetNameMutation,
  useToggleAssetNameMutation,
} = categoriesApi
