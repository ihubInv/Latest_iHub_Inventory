import React from 'react'
import { 
  Package, 
  PlusCircle, 
  CheckCircle, 
  MapPin, 
  ClipboardList,
  Clock,
  XCircle,
  BarChart3
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import { useGetDashboardStatsQuery } from '../store/api/dashboardApi'
import { useGetInventoryStatsQuery, useGetInventoryItemsQuery } from '../store/api/inventoryApi'
import { buildAssetChartRows } from '../utils/buildAssetChartData'
import { useGetInventoryOverviewQuery, useGetRequestOverviewQuery, useGetTransactionOverviewQuery } from '../store/api/dashboardApi'
import { useGetActiveCategoriesQuery } from '../store/api/categoriesApi'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
)

const StockManagerDashboard: React.FC = () => {
  const { data: inventoryStats, isLoading: loadingInventoryStats } = useGetInventoryStatsQuery()
  const { data: dashboardStats, isLoading: loadingDashboardStats } = useGetDashboardStatsQuery()
  const { data: inventoryOverview, isLoading: loadingInventoryOverview } = useGetInventoryOverviewQuery()
  const { data: requestOverview, isLoading: loadingRequestOverview } = useGetRequestOverviewQuery()
  const { isLoading: loadingTransactionOverview } = useGetTransactionOverviewQuery()
  const { data: activeCategories } = useGetActiveCategoriesQuery()
  const { data: inventoryListResp, isLoading: loadingInventoryList } = useGetInventoryItemsQuery({
    page: 1,
    limit: 10000,
  })
  
  const totalItems = inventoryStats?.data?.totalItems ?? 0
  const totalValue = inventoryStats?.data?.totalValue ?? 0
  const issuedItems = (((inventoryStats?.data as any)?.byStatus) || []).find((s: any) => s._id === 'issued')?.count ?? 0
  const totalCategories = (dashboardStats?.data as any)?.overview?.totalCategories ?? (dashboardStats?.data as any)?.totalCategories ?? 0
  const currencyFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
  const requestTotals = {
    pending: requestOverview?.data?.pendingRequests || 0,
    approved: requestOverview?.data?.approvedRequests || 0,
    rejected: requestOverview?.data?.rejectedRequests || 0,
  }
  const totalRequests = requestTotals.pending + requestTotals.approved + requestTotals.rejected
  const dashboardLoading =
    loadingInventoryStats ||
    loadingDashboardStats ||
    loadingInventoryOverview ||
    loadingRequestOverview ||
    loadingTransactionOverview ||
    loadingInventoryList
  const categoryAssetNames: string[] = (activeCategories?.data || [])
    .flatMap((category: any) => category?.assetnames || [])
    .map((asset: any) => {
      if (!asset) return ''
      if (typeof asset === 'string') return asset.trim()
      if (asset.isactive === false) return ''
      return String(asset.name || asset.assetname || '').trim()
    })
    .filter((name: string) => Boolean(name))
  const uniqueCategoryAssetNames = Array.from(new Set(categoryAssetNames))
  const inventoryRows = inventoryListResp?.data || []
  const assetChartRows = buildAssetChartRows(inventoryRows as any[], uniqueCategoryAssetNames)
  const trendLabels = assetChartRows.map((row) => row.asset)
  const trendCounts = assetChartRows.map((row) => row.count)
  const categorySource = (inventoryOverview?.data?.byCategory && inventoryOverview.data.byCategory.length > 0)
    ? inventoryOverview.data.byCategory
    : (((dashboardStats?.data as any)?.inventory?.topCategories) || [])
  const categoryLabels = categorySource.map((row: any) => row.categoryName || row._id || 'Other')
  const categoryCounts = categorySource.map((row: any) => row.count || 0)
  const statusChartData = [requestTotals.pending, requestTotals.approved, requestTotals.rejected]
  
  return (
    <div className="space-y-6">
      {/* Key Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">Total Inventory</div>
            <div className="text-2xl font-bold text-gray-900">{dashboardLoading ? '—' : totalItems}</div>
          </div>
          <div className="p-3 rounded-lg bg-[#0d559e]/10">
            <Package className="w-6 h-6 text-[#0d559e]" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">Issued Items</div>
            <div className="text-2xl font-bold text-gray-900">{dashboardLoading ? '—' : issuedItems}</div>
          </div>
          <div className="p-3 rounded-lg bg-emerald-100">
            <CheckCircle className="w-6 h-6 text-emerald-600" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">Total Inventory Value</div>
            <div className="text-2xl font-bold text-gray-900">{dashboardLoading ? '—' : currencyFormatter.format(totalValue)}</div>
          </div>
          <div className="p-3 rounded-lg bg-amber-100">
            <BarChart3 className="w-6 h-6 text-amber-600" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">Total Categories</div>
            <div className="text-2xl font-bold text-gray-900">{dashboardLoading ? '—' : totalCategories}</div>
          </div>
          <div className="p-3 rounded-lg bg-indigo-100">
            <ClipboardList className="w-6 h-6 text-indigo-600" />
          </div>
        </div>
      </div>
      
      {/* Analytics Overview - Charts */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#0d559e]">Analytics Overview</h2>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
          <div className="p-4 rounded-lg border border-gray-200 bg-gradient-to-br from-[#0d559e]/5 to-[#1a6bb8]/5 h-72 sm:h-80 flex flex-col">
            <div className="text-sm font-medium text-gray-700 mb-2">
              Assets and quantity count
              {trendLabels.length > 0 && (
                <span className="ml-2 text-xs text-gray-500">({trendLabels.length} assets)</span>
              )}
            </div>
            <div className="w-full flex-1 overflow-y-auto">
              <div style={{ height: Math.max(220, trendLabels.length * 24) + 'px', minHeight: '100%' }}>
                <Bar
                  data={{
                    labels: trendLabels.length ? trendLabels : ['No Data'],
                    datasets: [{
                      label: 'Asset Count',
                      data: trendCounts.length ? trendCounts : [0],
                      backgroundColor: 'rgba(13,85,158,0.6)',
                      borderColor: '#0d559e',
                      borderWidth: 1,
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    plugins: {
                      legend: { display: true, position: 'bottom' },
                      tooltip: { enabled: true },
                    },
                    scales: {
                      x: {
                        beginAtZero: true,
                        suggestedMax: Math.max(...(trendCounts.length ? trendCounts : [0]), 1),
                        ticks: { precision: 0 },
                      },
                      y: {
                        ticks: {
                          autoSkip: false,
                          font: { size: 10 }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg border border-gray-200 bg-gradient-to-br from-[#0d559e]/5 to-[#1a6bb8]/5 h-64 sm:h-72">
            <div className="text-sm font-medium text-gray-700 mb-2">Category distribution</div>
            <div className="w-full h-[calc(100%-1.75rem)]">
              <Bar
                data={{
                  labels: categoryLabels.length ? categoryLabels : ['No Data'],
                  datasets: [{
                    label: 'Items by Category',
                    data: categoryCounts.length ? categoryCounts : [0],
                    backgroundColor: ['#0d559e', '#1a6bb8', '#2c7bc7', '#5fa4da', '#9bc5ea'],
                    borderRadius: 6,
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true } }
                }}
              />
            </div>
          </div>

          <div className="p-4 rounded-lg border border-gray-200 bg-gradient-to-br from-[#0d559e]/5 to-[#1a6bb8]/5 h-64 sm:h-72 flex flex-col">
            <div className="text-sm font-medium text-gray-700 mb-2">Request status distribution</div>
            <div className="flex-1 min-h-0">
              <Doughnut
                data={{
                  labels: ['Pending', 'Approved', 'Rejected'],
                  datasets: [{
                    data: statusChartData.some(v => v > 0) ? statusChartData : [1, 0, 0],
                    backgroundColor: ['#f59e0b', '#10b981', '#ef4444'],
                    borderWidth: 2,
                    borderColor: '#ffffff',
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom' } },
                  cutout: '60%',
                }}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Request Management Overview for Stock Managers */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-blue-100 rounded-xl">
            <ClipboardList className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-blue-800">Request Management</h2>
            <p className="text-blue-700">Approve or reject employee asset requests</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-gray-600">Pending</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{dashboardLoading ? '—' : requestTotals.pending}</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-600">Approved</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{dashboardLoading ? '—' : requestTotals.approved}</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-blue-200">  
            <div className="flex items-center space-x-2 mb-2">
              <XCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-gray-600">Rejected</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{dashboardLoading ? '—' : requestTotals.rejected}</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">Total</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{dashboardLoading ? '—' : totalRequests}</div>
          </div>
        </div>
        
        <Link 
          to="/requests" 
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ClipboardList className="w-4 h-4 mr-2" />
          Review Requests
        </Link>
      </div>
      
      
      {/* Stock Management Actions */}
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-emerald-100 rounded-xl">
            <Package className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-emerald-800">Stock Management</h2>
            <p className="text-emerald-700">Essential inventory management tools</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Link 
            to="/inventory" 
            className="bg-white p-6 rounded-lg border border-emerald-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Package className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Inventory</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Manage inventory items and stock levels</p>
            <div className="text-emerald-600 hover:text-emerald-800 text-sm font-medium">
              View Inventory →
            </div>
          </Link>
          
          <Link 
            to="/add-inventory" 
            className="bg-white p-6 rounded-lg border border-emerald-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <PlusCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Add Items</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Add new inventory items to the system</p>
            <div className="text-emerald-600 hover:text-emerald-800 text-sm font-medium">
              Add Inventory →
            </div>
          </Link>
          
          <Link 
            to="/issued-items" 
            className="bg-white p-6 rounded-lg border border-emerald-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Issued Items</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Track issued inventory items</p>
            <div className="text-emerald-600 hover:text-emerald-800 text-sm font-medium">
              View Issued Items →
            </div>
          </Link>
          
          <Link 
            to="/locations" 
            className="bg-white p-6 rounded-lg border border-emerald-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <MapPin className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Locations</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Manage storage locations</p>
            <div className="text-emerald-600 hover:text-emerald-800 text-sm font-medium">
              Manage Locations →
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default StockManagerDashboard