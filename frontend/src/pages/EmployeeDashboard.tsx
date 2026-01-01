import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '../store'
import { useGetRequestOverviewQuery } from '../store/api/dashboardApi'
import { useGetUserActivityQuery } from '../store/api/dashboardApi'
import { useGetMyRequestsQuery, useGetRequestStatsQuery } from '../store/api/requestsApi'
import { useGetInventoryItemsQuery } from '../store/api/inventoryApi'
import { useGetTransactionsByUserQuery } from '../store/api/transactionsApi'
import { useGetMyReturnRequestsQuery } from '../store/api/returnRequestsApi'
import { formatRelativeDate } from '../utils/dateUtils'
import { Link } from 'react-router-dom'
import {
  RequestStatusChart,
  MonthlyActivityChart
} from '../components/charts/ChartComponents'
import {
  ClipboardCheck,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  BarChart3,
  TrendingUp,
  Users,
  AlertCircle,
  Calendar,
  RefreshCw,
  WifiOff,
  PackageX,
  User,
  MapPin
} from 'lucide-react'
import ReturnAssetModal from '../components/requests/ReturnAssetModal'

const EmployeeDashboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth)
  const [returnModalOpen, setReturnModalOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<any>(null)

  // Fetch only employee-specific data
  const { data: requestOverview, isLoading: requestLoading, error: requestError } = useGetRequestOverviewQuery()
  const { data: userActivity, isLoading: userActivityLoading, error: userActivityError } = useGetUserActivityQuery()
  const { data: requestStats, isLoading: requestStatsLoading, error: requestStatsError } = useGetRequestStatsQuery()

  // Fetch return requests
  const { data: returnRequestsResponse } = useGetMyReturnRequestsQuery({
    page: 1,
    limit: 100
  })

  const handleOpenReturnModal = (asset: any) => {
    setSelectedAsset(asset)
    setReturnModalOpen(true)
  }

  const handleCloseReturnModal = () => {
    setReturnModalOpen(false)
    setSelectedAsset(null)
  }

  // Check if an asset has a pending return request
  const hasPendingReturnRequest = (assetId: string) => {
    return returnRequestsResponse?.data?.some(
      (req: any) => req.inventoryitemid === assetId && req.status === 'pending'
    )
  }

  // Check if an asset has an approved return request (should be hidden)
  const hasApprovedReturnRequest = (assetId: string) => {
    return returnRequestsResponse?.data?.some(
      (req: any) => req.inventoryitemid === assetId && req.status === 'approved'
    )
  }
  
  // Employee's own requests and recent transactions
  const { data: myRequests, isLoading: requestsLoading, error: requestsError } = useGetMyRequestsQuery({ 
    page: 1, 
    limit: 5, // Show only 5 most recent requests
    sort: '-submittedat' // Sort by newest first
  })
  
  // Recent inventory transactions for user activity
  const { data: recentTransactions, isLoading: transactionsLoading, error: transactionsError } = useGetTransactionsByUserQuery({
    userId: user?.id || '', 
    page: 1, 
    limit: 3
  }, {
    skip: !user?.id
  })
  
  // Get issued items directly assigned to this employee
  const { data: inventoryItemsResponse, isLoading: inventoryItemsLoading } = useGetInventoryItemsQuery({})

  // Dynamic data calculation from employee-specific API sources
  const isLoading = requestLoading || userActivityLoading || 
                   requestStatsLoading || requestsLoading || transactionsLoading ||
                   inventoryItemsLoading

  const hasError = requestError || userActivityError || 
                  requestStatsError || requestsError || transactionsError

  // Use employee-specific stats from APIs (they auto-filter by employee in backend)
  const employeeRequestStats = React.useMemo(() => {
    // Priority: requestStats -> requestOverview -> fallback to myRequests calculation
    if (requestStats?.data) {
      return {
        pendingRequests: requestStats.data.pending || 0,
        approvedRequests: requestStats.data.approved || 0,
        rejectedRequests: requestStats.data.rejected || 0,
        totalRequests: requestStats.data.total || 0
      }
    } else if (requestOverview?.data?.byStatus) {
      const stats = { pending: 0, approved: 0, rejected: 0 }
      requestOverview.data.byStatus.forEach(status => {
        if (status._id === 'pending') stats.pending = status.count
        if (status._id === 'approved') stats.approved = status.count
        if (status._id === 'rejected') stats.rejected = status.count
      })
      return {
        pendingRequests: stats.pending,
        approvedRequests: stats.approved,
        rejectedRequests: stats.rejected,
        totalRequests: stats.pending + stats.approved + stats.rejected
      }
    } else {
      // Fallback: calculate from myRequests
      const myRequestsData = myRequests?.data || []
      const pending = myRequestsData.filter(req => req.status === 'pending').length
      const approved = myRequestsData.filter(req => req.status === 'approved').length
      const rejected = myRequestsData.filter(req => req.status === 'rejected').length
      
      return {
        pendingRequests: pending,
        approvedRequests: approved,
        rejectedRequests: rejected,
        totalRequests: myRequestsData.length
      }
    }
  }, [requestStats, requestOverview, myRequests])

  // Calculate recent activity from transactions
  const recentActivityData = React.useMemo(() => {
    const transactions = recentTransactions?.data || []
    return transactions.map(transaction => ({
      month: formatRelativeDate(transaction.transactionDate),
      count: transaction.quantity || 1,
      type: transaction.transactionType
    }))
  }, [recentTransactions])

  // Get issued items directly assigned to this employee
  const issuedToEmployee = React.useMemo(() => {
    const allItems = inventoryItemsResponse?.data || []
    return allItems.filter(item => 
      item.status === 'issued' && 
      (item.issuedto === user?.name || item.issuedto?.toLowerCase().includes(user?.name?.toLowerCase() || '')) &&
      !hasApprovedReturnRequest(item.id) // Hide items with approved return requests
    ).map(item => ({
      id: item.id,
      name: item.assetname,
      issuedDate: item.issued_date || item.dateofissue,
      issuedBy: item.issuedby,
      location: item.locationofitem,
      purpose: item.description?.includes('PURPOSE:') ? 
        item.description.match(/PURPOSE: (.+)/)?.[1] || 'Unknown' : 
        'Direct Issue',
      expectedReturn: item.expectedreturndate,
      value: item.totalcost
    }))
  }, [inventoryItemsResponse, user?.name, returnRequestsResponse])

  const StatCard = ({ title, value, subtitle, icon, color = 'blue', onClick, isSpecial = false }: {
    title: string
    value: string | number
    subtitle?: string
    icon: React.ReactNode
    color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo'
    onClick?: () => void
    isSpecial?: boolean
  }) => {
    const colorClasses = {
      blue: 'bg-blue-500 text-white',
      green: 'bg-green-500 text-white',
      yellow: 'bg-yellow-500 text-white',
      red: 'bg-red-500 text-white',
      purple: 'bg-purple-500 text-white',
      indigo: 'bg-indigo-500 text-white'
    }

    const CardComponent = ({ children }: { children: React.ReactNode }) => (
      <div className={`${onClick ? 'cursor-pointer hover:shadow-lg' : ''} bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 h-full flex flex-col transition-all duration-200 ${isSpecial ? 'ring-2 ring-[#0d559e] ring-opacity-20' : ''}`}>
        <div className="p-6 flex-1 flex flex-col">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <div className={`${colorClasses[color]} rounded-xl p-4 shadow-lg`}>
                {icon}
              </div>
            </div>
            <div className="ml-4 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate mb-1">
                  {title}
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-3xl font-bold text-gray-900">
                    {value}
                  </div>
                  {subtitle && (
                    <div className="ml-3 flex items-baseline text-sm font-medium text-gray-500">
                      {subtitle}
                    </div>
                  )}
                </dd>
              </dl>
            </div>
          </div>
          {isSpecial && (
            <div className="mt-auto">
              <div className="bg-gradient-to-r from-[#0d559e]/10 to-blue-500/10 rounded-lg p-3 border border-[#0d559e]/20">
                <p className="text-xs text-[#0d559e] font-medium">Quick Action Available</p>
              </div>
            </div>
          )}
        </div>
        {children}
      </div>
    )

    return onClick ? (
      <button onClick={onClick} className="w-full h-full">
        <CardComponent />
      </button>
    ) : (
      <CardComponent />
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* API Error Banner */}
      {hasError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <WifiOff className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800">Dashboard Data Unavailable</h3>
              <p className="text-sm text-yellow-700">
                Some dashboard statistics are currently unavailable. Charts are showing demo data. Please refresh or contact support if this persists.
              </p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="px-3 py-2 text-sm font-medium text-yellow-800 bg-yellow-100 hover:bg-yellow-200 rounded-lg transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      )}

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-[#0d559e] to-[#1a6bb8] shadow-lg rounded-lg p-6 text-white">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-white bg-opacity-20 rounded-xl">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-green-100 mt-1">
              Employee • {user?.department || 'No department assigned'} • Asset Request Portal
            </p>
            {/* Show current stats */}
            <p className="text-blue-100 mt-2 text-sm">
              Your Requests: {employeeRequestStats.totalRequests} Total • {employeeRequestStats.pendingRequests} Pending • {employeeRequestStats.approvedRequests} Approved • {employeeRequestStats.rejectedRequests} Rejected
            </p>
          </div>
        </div>
      </div>

      {/* API Status Debug Section - Only show when there are errors */}
      {hasError && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-3">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <h3 className="text-sm font-medium text-orange-800">Employee Data Connection Status</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className={`p-2 rounded ${requestStats?.data ? 'bg-green-100 text-green-800' : requestStatsError ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
              Request Stats: {requestStats?.data ? '✅ Live' : requestStatsError ? '❌ Error' : '⏳ Loading'}
            </div>
            <div className={`p-2 rounded ${requestOverview?.data ? 'bg-green-100 text-green-800' : requestError ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
              Request Overview: {requestOverview?.data ? '✅ Live' : requestError ? '❌ Error' : '⏳ Loading'}
            </div>
            <div className={`p-2 rounded ${issuedToEmployee.length > 0 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
              Issued Items: {issuedToEmployee.length > 0 ? `✅ ${issuedToEmployee.length} Items` : '📭 No Items'}
            </div>
            <div className={`p-2 rounded ${myRequests?.data ? 'bg-green-100 text-green-800' : requestsError ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
              My Requests: {myRequests?.data ? '✅ Live' : requestsError ? '❌ Error' : '⏳ Loading'}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Link to="/create-request" className="h-full">
          <StatCard
            title="Create New Request"
            value="+"
            subtitle="Request new asset"
            icon={<Package className="w-7 h-7" />}
            color="green"
            onClick={() => {}}
            isSpecial={true}
          />
        </Link>

        <Link to="/requests/pending" className="h-full">
          <StatCard
            title="Pending Requests"
            value={employeeRequestStats.pendingRequests}
            subtitle="Awaiting approval"
            icon={<Clock className="w-7 h-7" />}
            color="yellow"
          />
        </Link>

        <Link to="/requests/approved" className="h-full">
          <StatCard
            title="Approved Requests"
            value={employeeRequestStats.approvedRequests}
            subtitle="Ready for issue"
            icon={<CheckCircle className="w-7 h-7" />}
            color="green"
          />
        </Link>

        <Link to="/requests/rejected" className="h-full">
          <StatCard
            title="Rejected Requests"
            value={employeeRequestStats.rejectedRequests}
            subtitle="Need review"
            icon={<XCircle className="w-7 h-7" />}
            color="red"
          />
        </Link>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Request Status Chart */}
        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">My Request Status</h2>
            </div>
            {hasError && !requestStats?.data && (
              <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                Fallback Data
              </span>
            )}
            {requestStats?.data && (
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                Live API Data
              </span>
            )}
          </div>
          <div className="h-64">
            <RequestStatusChart 
              data={{
                pending: employeeRequestStats.pendingRequests,
                approved: employeeRequestStats.approvedRequests,
                rejected: employeeRequestStats.rejectedRequests
              }} 
            />
          </div>
          {hasError && !requestStats?.data ? (
            <p className="mt-2 text-sm text-gray-500">
              Data source: {requestOverview?.data ? 'Request Overview API' : 'My Requests API (calculated)'}
            </p>
          ) : (
            <p className="mt-2 text-sm text-gray-500">
              ✅ Data source: Request Stats API (employee-specific)
            </p>
          )}
        </div>

        {/* Activity Chart */}
        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">My Activity</h2>
            </div>
            {userActivity?.data?.activityOverTime ? (
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                Live API Data
              </span>
            ) : recentActivityData.length > 0 ? (
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                Transaction Data
              </span>
            ) : (
              <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                No Data Available
              </span>
            )}
          </div>
          <div className="h-64">
            <MonthlyActivityChart 
              data={userActivity?.data?.activityOverTime || recentActivityData} 
            />
          </div>
          {userActivity?.data?.activityOverTime ? (
            <p className="mt-2 text-sm text-gray-500">✅ Data source: User Activity API</p>
          ) : recentActivityData.length > 0 ? (
            <p className="mt-2 text-sm text-gray-500">📈 Data source: Recent Transactions API</p>
          ) : (
            <p className="mt-2 text-sm text-gray-500">⚠️ No activity data available yet</p>
          )}
        </div>
      </div>

      {/* Issued Items Section */}
      {issuedToEmployee.length > 0 && (
        <div className="bg-white shadow-lg rounded-xl border border-gray-100">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Issued Items Details</h2>
                  <p className="text-sm text-gray-500">{issuedToEmployee.length} items currently issued to you</p>
                </div>
              </div>
              <Link
                to="/issued-items"
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                View All →
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {issuedToEmployee.slice(0, 4).map((item, index) => (
                <div key={item.id || index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Package className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{item.name}</h4>
                        <p className="text-xs text-gray-500">₹{item.value?.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="flex items-center space-x-1 text-gray-600">
                      <User className="w-3 h-3" />
                      <span>By: {item.issuedBy || 'Admin'}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-gray-600">
                      <Calendar className="w-3 h-3" />
                      <span>{formatRelativeDate(item.issuedDate)}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 text-xs text-gray-600 mb-3">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{item.location}</span>
                  </div>

                  {item.expectedReturn && (
                    <div className={`text-xs mb-3 ${
                      new Date(item.expectedReturn) < new Date() ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      <Calendar className="w-3 h-3 inline mr-1" />
                      Due: {formatRelativeDate(item.expectedReturn)}
                    </div>
                  )}

                  {/* Return Button */}
                  {hasPendingReturnRequest(item.id) ? (
                    <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                      <p className="text-xs text-yellow-800 font-medium">Return Request Pending</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleOpenReturnModal(item)}
                      className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-lg transition-all duration-200 text-sm font-medium"
                    >
                      <PackageX size={14} />
                      <span>Return Asset</span>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {issuedToEmployee.length > 4 && (
              <div className="mt-4 text-center">
                <Link
                  to="/issued-items"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  View All {issuedToEmployee.length} Items →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Requests Preview */}
      <div className="bg-white shadow-lg rounded-xl border border-gray-100">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <ClipboardCheck className="w-6 h-6 text-indigo-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Recent Requests</h2>
            </div>
            <Link 
              to="/requests" 
              className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              View All →
            </Link>
          </div>

          {/* Scenario Explanation */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">📋 Request Status Guide</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p><span className="font-medium">⚡ Pending:</span> Awaiting approval from Admin/Stock Manager</p>
              <p><span className="font-medium">✅ Approved:</span> Your request approved - item will appear in "Issued Items"</p>
              <p><span className="font-medium">❌ Rejected:</span> Request declined (check remarks for details)</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Real recent requests from API */}
            {myRequests?.data && myRequests.data.length > 0 ? (
              myRequests.data.map((request: any) => {
                const getStatusIcon = (status: string) => {
                  switch (status) {
                    case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />
                    case 'approved': return <CheckCircle className="w-4 h-4 text-green-600" />
                    case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />
                   default: return <Clock className="w-4 h-4 text-gray-600" />
                  }
                }

                const getStatusColor = (status: string) => {
                  switch (status) {
                    case 'pending': return 'bg-yellow-100 text-yellow-800'
                    case 'approved': return 'bg-green-100 text-green-800'
                    case 'rejected': return 'bg-red-100 text-red-800'
                    default: return 'bg-gray-100 text-gray-800'
                  }
                }

                const getStatusBg = (status: string) => {
                  switch (status) {
                    case 'pending': return 'bg-yellow-100'
                    case 'approved': return 'bg-green-100'
                    case 'rejected': return 'bg-red-100'
                    default: return 'bg-gray-100'
                  }
                }

                return (
                  <div key={request.id || request._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 ${getStatusBg(request.status)} rounded-lg`}>
                          {getStatusIcon(request.status)}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{request.itemtype} Request #{request.id || request._id}</h3>
                          <p className="text-sm text-gray-500">
                            {request.itemtype} • 
                            {request.status === 'pending' && ' Submitted ' + formatRelativeDate(request.submittedat)}
                            {request.status === 'approved' && (
                              <>
                                {' Approved ' + formatRelativeDate(request.reviewedat)}
                                {request.inventoryitemid ? (
                                  <span className="ml-2 text-green-600 text-xs font-medium">• Item Issued 📦</span>
                                ) : (
                                  <span className="ml-2 text-blue-600 text-xs">• Ready to Issue</span>
                                )}
                              </>
                            )}
                            {request.status === 'rejected' && ' Rejected ' + formatRelativeDate(request.reviewedat)}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">{request.purpose}</p>
                          {request.status === 'rejected' && request.rejectionreason && (
                            <p className="text-xs text-red-600 mt-1">Reason: {request.rejectionreason}</p>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium ${getStatusColor(request.status)} rounded-full`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                    
                    {/* Show approval remarks if available */}
                    {request.remarks && request.status !== 'pending' && (
                      <div className={`mt-3 p-2 rounded text-xs ${request.status === 'approved' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        <strong>Remarks:</strong> {request.remarks}
                      </div>
                    )}

                    {/* Return Asset Button for Approved & Issued Items */}
                    {request.status === 'approved' && request.inventoryitemid && (
                      <div className="mt-3">
                        {hasPendingReturnRequest(request.inventoryitemid) ? (
                          <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                            <p className="text-xs text-yellow-800 font-medium">Return Request Pending</p>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenReturnModal({
                              id: request.inventoryitemid,
                              name: request.itemtype,
                              issuedDate: request.reviewedat,
                              expectedReturn: null
                            })}
                            className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-lg transition-all duration-200 text-sm font-medium"
                          >
                            <PackageX size={14} />
                            <span>Return Asset</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            ) : hasError ? (
              <div className="text-center py-8">
                <div className="p-3 bg-red-100 rounded-lg w-fit mx-auto mb-4">
                  <WifiOff className="w-6 h-6 text-red-600" />
                </div>
                <p className="text-sm text-gray-500">Unable to load requests from API</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-2 px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="p-3 bg-gray-100 rounded-lg w-fit mx-auto mb-4">
                  <ClipboardCheck className="w-6 h-6 text-gray-500" />
                </div>
                <p className="text-sm text-gray-500">No requests found</p>
                <Link 
                  to="/create-request" 
                  className="inline-block mt-2 px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                >
                  Create Your First Request
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Return Asset Modal */}
      {selectedAsset && (
        <ReturnAssetModal
          isOpen={returnModalOpen}
          onClose={handleCloseReturnModal}
          asset={selectedAsset}
        />
      )}
    </div>
  )
}

export default EmployeeDashboard