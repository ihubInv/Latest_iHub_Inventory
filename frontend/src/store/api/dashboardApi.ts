import { baseApi } from './baseApi'

export interface DashboardStats {
  totalUsers: number
  totalInventoryItems: number
  totalRequests: number
  totalTransactions: number
  totalLocations: number
  totalCategories: number
  totalAssets: number
  lowStockItems: number
  pendingRequests: number
  overdueTransactions: number
  totalInventoryValue: number
  monthlyGrowth: {
    users: number
    inventory: number
    requests: number
    transactions: number
  }
}

export interface InventoryOverview {
  totalItems: number
  totalValue: number
  availableItems: number
  issuedItems: number
  lowStockItems: number
  byStatus: Array<{ _id: string; count: number; value: number }>
  byCategory: Array<{ _id: string; categoryName: string; count: number; value: number }>
  byLocation: Array<{ _id: string; locationName: string; count: number; value: number }>
  recentAdditions: Array<{
    _id: string
    assetName: string
    quantity: number
    totalCost: number
    createdAt: string
  }>
  topItems: Array<{
    _id: string
    assetName: string
    totalQuantity: number
    totalValue: number
    issuedQuantity: number
  }>
}

export interface RequestOverview {
  totalRequests: number
  pendingRequests: number
  approvedRequests: number
  rejectedRequests: number
  byStatus: Array<{ _id: string; count: number }>
  byPriority: Array<{ _id: string; count: number }>
  byDepartment: Array<{ _id: string; count: number }>
  recentRequests: Array<{
    _id: string
    itemType: string
    quantity: number
    priority: string
    status: string
    requestedBy: string
    submittedAt: string
  }>
  topRequesters: Array<{
    _id: string
    userName: string
    requestCount: number
    approvedCount: number
  }>
}

export interface TransactionOverview {
  totalTransactions: number
  pendingTransactions: number
  completedTransactions: number
  overdueTransactions: number
  byType: Array<{ _id: string; count: number; totalQuantity: number }>
  byStatus: Array<{ _id: string; count: number }>
  recentTransactions: Array<{
    _id: string
    transactionType: string
    quantity: number
    status: string
    itemName: string
    issuedTo: string
    transactionDate: string
  }>
  topItems: Array<{
    _id: string
    itemName: string
    transactionCount: number
    totalQuantity: number
  }>
  monthlyTrends: Array<{
    month: string
    count: number
    totalQuantity: number
  }>
}

export interface UserActivity {
  recentLogins: Array<{
    _id: string
    userName: string
    email: string
    lastLogin: string
    loginCount: number
  }>
  activeUsers: Array<{
    _id: string
    userName: string
    email: string
    role: string
    department: string
    lastActivity: string
  }>
  userStats: {
    totalUsers: number
    activeUsers: number
    newUsersThisMonth: number
    byRole: Array<{ _id: string; count: number }>
    byDepartment: Array<{ _id: string; count: number }>
  }
  activityLogs: Array<{
    _id: string
    user: string
    action: string
    resource: string
    timestamp: string
    details: any
  }>
}

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query<{ success: boolean; data: DashboardStats }, void>({
      query: () => '/dashboard/stats',
      providesTags: ['Dashboard'],
    }),
    getInventoryOverview: builder.query<{ success: boolean; data: InventoryOverview }, void>({
      query: () => '/dashboard/inventory-overview',
      providesTags: ['Dashboard'],
    }),
    getRequestOverview: builder.query<{ success: boolean; data: RequestOverview }, void>({
      query: () => '/dashboard/request-overview',
      providesTags: ['Dashboard'],
    }),
    getTransactionOverview: builder.query<{ success: boolean; data: TransactionOverview }, void>({
      query: () => '/dashboard/transaction-overview',
      providesTags: ['Dashboard'],
    }),
    getUserActivity: builder.query<{ success: boolean; data: UserActivity }, void>({
      query: () => '/dashboard/user-activity',
      providesTags: ['Dashboard'],
    }),
  }),
})

export const {
  useGetDashboardStatsQuery,
  useGetInventoryOverviewQuery,
  useGetRequestOverviewQuery,
  useGetTransactionOverviewQuery,
  useGetUserActivityQuery,
} = dashboardApi
