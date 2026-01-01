import React from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '../store'
import { useGetDashboardStatsQuery } from '../store/api/dashboardApi'
import { useGetInventoryOverviewQuery } from '../store/api/dashboardApi'
import { useGetRequestOverviewQuery } from '../store/api/dashboardApi'
import { useGetTransactionOverviewQuery } from '../store/api/dashboardApi'
import { useGetUserActivityQuery } from '../store/api/dashboardApi'
import {
  InventoryTrendChart,
  RequestStatusChart,
  CategoryDistributionChart,
  AssetConditionChart,
  MonthlyActivityChart
} from '../components/charts/ChartComponents'

const Dashboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth)
  const { data: stats, isLoading: statsLoading } = useGetDashboardStatsQuery()
  const { data: inventoryOverview, isLoading: inventoryLoading } = useGetInventoryOverviewQuery()
  const { data: requestOverview, isLoading: requestLoading } = useGetRequestOverviewQuery()
  const { data: transactionOverview, isLoading: transactionLoading } = useGetTransactionOverviewQuery()
  const { data: userActivity, isLoading: userActivityLoading } = useGetUserActivityQuery()

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator'
      case 'stock-manager':
        return 'Stock Manager'
      case 'employee':
        return 'Employee'
      default:
        return role
    }
  }

  const StatCard = ({ title, value, subtitle, icon, color = 'blue' }: {
    title: string
    value: string | number
    subtitle?: string
    icon: React.ReactNode
    color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
  }) => {
    const colorClasses = {
      blue: 'bg-blue-500 text-white',
      green: 'bg-green-500 text-white',
      yellow: 'bg-yellow-500 text-white',
      red: 'bg-red-500 text-white',
      purple: 'bg-purple-500 text-white',
    }

    return (
      <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 h-full flex flex-col">
        <div className="p-6 flex-1 flex flex-col">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <div className={`${colorClasses[color]} rounded-xl p-4 shadow-lg`}>
                {icon}
              </div>
            </div>
            <div className="ml-4 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate mb-1">{title}</dt>
                <dd className="flex items-baseline">
                  <div className="text-3xl font-bold text-gray-900">{value}</div>
                  {subtitle && (
                    <div className="ml-3 flex items-baseline text-sm font-medium text-gray-500">
                      {subtitle}
                    </div>
                  )}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (statsLoading || inventoryLoading || requestLoading || transactionLoading || userActivityLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600 mt-1">
          {getRoleDisplayName(user?.role || '')} • {user?.department || 'No department'}
        </p>
      </div>

      {/* Stats Overview */}
      {stats?.data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Users"
            value={stats.data.totalUsers}
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            }
            color="blue"
          />
          <StatCard
            title="Inventory Items"
            value={stats.data.totalInventoryItems}
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            }
            color="green"
          />
          <StatCard
            title="Pending Requests"
            value={stats.data.pendingRequests}
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
            color="yellow"
          />
          <StatCard
            title="Total Value"
            value={`₹${stats.data.totalInventoryValue?.toLocaleString() || '0'}`}
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            }
            color="purple"
          />
        </div>
      )}

      {/* Inventory Overview */}
      {inventoryOverview?.data && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Inventory Overview</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{inventoryOverview.data.availableItems}</div>
              <div className="text-sm text-gray-500">Available Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{inventoryOverview.data.issuedItems}</div>
              <div className="text-sm text-gray-500">Issued Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{inventoryOverview.data.lowStockItems}</div>
              <div className="text-sm text-gray-500">Low Stock Items</div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Status Chart */}
        {requestOverview?.data && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Request Status Distribution</h2>
            <div className="h-64">
              <RequestStatusChart 
                data={{
                  pending: requestOverview.data.pendingRequests,
                  approved: requestOverview.data.approvedRequests,
                  rejected: requestOverview.data.rejectedRequests
                }} 
              />
            </div>
          </div>
        )}

        {/* Category Distribution Chart */}
        {inventoryOverview?.data && inventoryOverview.data.byCategory && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Inventory by Category</h2>
            <div className="h-64">
              <CategoryDistributionChart 
                data={{
                  categories: inventoryOverview.data.byCategory.map(cat => cat.categoryName || cat._id),
                  counts: inventoryOverview.data.byCategory.map(cat => cat.count)
                }} 
              />
            </div>
          </div>
        )}
      </div>

      {/* Additional Charts Row */}
      {user?.role === 'admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Activity Chart */}
          {transactionOverview?.data && transactionOverview.data.monthlyTrends && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Monthly Activity Trends</h2>
              <div className="h-64">
                <MonthlyActivityChart 
                  data={{
                    months: transactionOverview.data.monthlyTrends.map(trend => trend.month),
                    itemsAdded: transactionOverview.data.monthlyTrends.map(trend => trend.count),
                    requestsSubmitted: new Array(transactionOverview.data.monthlyTrends.length).fill(Math.floor(Math.random() * 20) + 5) // Mock data until we have real request trends
                  }} 
                />
              </div>
            </div>
          )}

          {/* Asset Condition Chart */}
          {inventoryOverview?.data && inventoryOverview.data.byStatus && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Asset Conditions</h2>
              <div className="h-64">
                <AssetConditionChart 
                  data={{
                    excellent: inventoryOverview.data.byStatus.find(s => s._id === 'excellent')?.count || 0,
                    good: inventoryOverview.data.byStatus.find(s => s._id === 'good')?.count || 0,
                    fair: inventoryOverview.data.byStatus.find(s => s._id === 'fair')?.count || 0,
                    poor: inventoryOverview.data.byStatus.find(s => s._id === 'poor')?.count || 0,
                    damaged: inventoryOverview.data.byStatus.find(s => s._id === 'damaged')?.count || 0
                  }} 
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Activity */}
      {userActivity?.data && userActivity.data.recentLogins && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {userActivity.data.recentLogins.slice(0, 5).map((login: any) => (
              <div key={login._id} className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {login.userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{login.userName}</p>
                  <p className="text-sm text-gray-500">Last login: {new Date(login.lastLogin).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <a
            href="/inventory"
            className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-gray-300"
          >
            <div>
              <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-700 ring-4 ring-white">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-medium text-gray-900">View Inventory</h3>
              <p className="mt-2 text-sm text-gray-500">Browse and manage inventory items</p>
            </div>
          </a>

          <a
            href="/requests"
            className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-gray-300"
          >
            <div>
              <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-700 ring-4 ring-white">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-medium text-gray-900">Manage Requests</h3>
              <p className="mt-2 text-sm text-gray-500">View and process item requests</p>
            </div>
          </a>

          {(user?.role === 'admin' || user?.role === 'stock-manager') && (
            <a
              href="/locations"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-gray-300"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-yellow-50 text-yellow-700 ring-4 ring-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900">Manage Locations</h3>
                <p className="mt-2 text-sm text-gray-500">Configure storage locations</p>
              </div>
            </a>
          )}

          {user?.role === 'admin' && (
            <a
              href="/users"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-gray-300"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-purple-50 text-purple-700 ring-4 ring-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900">Manage Users</h3>
                <p className="mt-2 text-sm text-gray-500">Add and manage system users</p>
              </div>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
