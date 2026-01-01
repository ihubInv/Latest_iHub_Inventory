import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '../store'
import { useGetMyRequestsQuery } from '../store/api/requestsApi'
import { useGetInventoryItemsQuery } from '../store/api/inventoryApi'
import { useGetMyReturnRequestsQuery } from '../store/api/returnRequestsApi'
import { formatRelativeDate } from '../utils/dateUtils'
import { Package, Clock, User, Calendar, MapPin, ArrowLeft, PackageX } from 'lucide-react'
import { Link } from 'react-router-dom'
import ReturnAssetModal from '../components/requests/ReturnAssetModal'

const IssuedItemsPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth)
  const [activeTab, setActiveTab] = useState<'direct' | 'requested'>('direct')
  const [returnModalOpen, setReturnModalOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<any>(null)

  // Fetch employee's requests
  const { data: myRequests, isLoading: requestsLoading, error: requestsError } = useGetMyRequestsQuery({
    page: 1,
    limit: 100, // Get all requests for this page
    sort: '-submittedat'
  })

  // Fetch all inventory items to filter issued items for this employee
  const { data: inventoryItemsResponse, isLoading: inventoryItemsLoading, error: inventoryItemsError } = useGetInventoryItemsQuery({})

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

  // Get issued items directly assigned to this employee (same logic as EmployeeDashboard)
  const issuedItems = React.useMemo(() => {
    const allItems = inventoryItemsResponse?.data || []
    return allItems.filter(item => 
      item.status === 'issued' && 
      (item.issuedto === user?.name || item.issuedto?.toLowerCase().includes(user?.name?.toLowerCase() || '')) &&
      !hasApprovedReturnRequest(item.id) // Hide items with approved return requests
    ).map(item => ({
      id: item.id,
      name: item.assetname,
      issuedDate: item.issueddate || item.dateofissue,
      issuedBy: item.issuedby,
      location: item.locationofitem,
      purpose: item.description?.includes('PURPOSE:') ? 
        item.description.match(/PURPOSE: (.+)/)?.[1] || 'Unknown' : 
        'Direct Issue',
      expectedReturn: item.expectedreturndate,
      value: item.totalcost
    }))
  }, [inventoryItemsResponse, user?.name, returnRequestsResponse])

  const requestItems = myRequests?.data || []


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (requestsLoading || inventoryItemsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0d559e]"></div>
          </div>
        </div>
      </div>
    )
  }

  if (requestsError || inventoryItemsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-red-800">Error Loading Data</h3>
            <p className="text-red-600">Please try refreshing the page.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Link 
              to="/employee/dashboard" 
              className="flex items-center space-x-2 text-[#0d559e] hover:text-blue-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Dashboard</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-[#0d559e] to-blue-700 rounded-xl">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Issued Items Details</h1>
              <p className="text-gray-600 mt-1">Track your assets and requests</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('direct')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'direct'
                  ? 'text-[#0d559e] border-b-2 border-[#0d559e] bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Package className="w-5 h-5" />
                <span>Direct Issued ({issuedItems.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('requested')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'requested'
                  ? 'text-[#0d559e] border-b-2 border-[#0d559e] bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Item Requested  ({requestItems.length})</span>
              </div>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'direct' ? (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Direct Issued Items</h3>
                  <p className="text-sm text-gray-600">
                    Items directly issued to you by Admin or Stock Manager
                  </p>
                </div>

                {issuedItems.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {issuedItems.map((item, index) => (
                      <div key={item.id || index} className="bg-gray-50 border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Package className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{item.name}</h4>
                              <p className="text-sm text-gray-600">Direct Issue</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">₹{item.value?.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">{item.location}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                          <div className="flex items-center space-x-2 text-gray-600">
                            <User className="w-4 h-4" />
                            <span>Issued by: {item.issuedBy || 'Admin'}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{formatRelativeDate(item.issuedDate)}</span>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-gray-200">
                          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                            <MapPin className="w-4 h-4" />
                            <span>Purpose: {item.purpose || 'Work Assignment'}</span>
                          </div>
                          {item.expectedReturn && (
                            <div className={`text-sm mb-3 ${
                              new Date(item.expectedReturn) < new Date() ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              <Calendar className="w-4 h-4 inline mr-1" />
                              Return Due: {formatRelativeDate(item.expectedReturn)}
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
                              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-lg transition-all duration-200 font-medium"
                            >
                              <PackageX size={16} />
                              <span>Return Asset</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No Direct Issued Items</h3>
                    <p className="text-gray-500">
                      You don't have any items directly issued to you yet.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Item Requests</h3>
                  <p className="text-sm text-gray-600">
                    Track the status of your asset requests
                  </p>
                </div>

                {requestItems.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {requestItems.map((request, index) => (
                      <div key={request.id || index} className="bg-gray-50 border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        {/* Header - match direct issued card layout */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Package className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{request.itemtype} Request #{request.id?.slice(-8)}</h4>
                              <p className="text-sm text-gray-600">
                                {request.status === 'pending' && `Submitted ${formatRelativeDate(request.submittedat)}`}
                                {request.status === 'approved' && (
                                  <>
                                    Approved {formatRelativeDate(request.reviewedat || request.submittedat)}
                                    {(() => {
                                      const rawField = request.inventoryItemId || request.inventoryitemid
                                      const hasInventoryId = rawField && (typeof rawField === 'string' || (typeof rawField === 'object' && ((rawField as any)._id || (rawField as any).id)))
                                      return hasInventoryId ? (
                                        <span className="ml-2 text-green-600 text-xs font-medium">• Item Issued 📦</span>
                                      ) : (
                                        <span className="ml-2 text-blue-600 text-xs">• Ready to Issue</span>
                                      )
                                    })()}
                                  </>
                                )}
                                {request.status === 'rejected' && `Rejected ${formatRelativeDate(request.reviewedat || request.submittedat)}`}
                              </p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 text-xs font-medium ${getStatusColor(request.status)} rounded-full`}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </div>

                        {/* Details grid to mirror direct card spacing */}
                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                          <div className="flex items-center space-x-2 text-gray-600">
                            <User className="w-4 h-4" />
                            <span>Quantity: {request.quantity}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{request.status === 'pending' ? `Submitted ${formatRelativeDate(request.submittedat)}` : `Updated ${formatRelativeDate(request.reviewedat || request.submittedat)}`}</span>
                          </div>
                          
                        </div>

                        {/* Footer - purpose and remarks similar to direct footer */}
                        <div className="pt-4 border-t border-gray-200">
                          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                            <MapPin className="w-4 h-4" />
                            <span>Purpose: {request.purpose}</span>
                          </div>
                          {request.remarks && request.status !== 'pending' && (
                            <div className={`p-3 rounded-lg text-sm mb-3 ${
                              request.status === 'approved' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                            }`}>
                              <strong>Remarks:</strong> {request.remarks}
                            </div>
                          )}
                          {request.rejectionReason && (
                            <div className="p-3 bg-red-50 rounded-lg text-sm text-red-700 mb-3">
                              <strong>Rejection Reason:</strong> {request.rejectionReason}
                            </div>
                          )}

                          {/* Return Asset Button - Same as Direct Issued Items */}
                          {request.status === 'approved' && (
                            <div className="mt-3">
                              {(() => {
                                // Backend populates inventoryitemid as an object {_id, uniqueid, assetname}
                                // Extract the actual ID from the populated object or use the string directly
                                const rawInventoryField = request.inventoryitemid || request.inventoryItemId
                                const inventoryId = typeof rawInventoryField === 'object' && rawInventoryField !== null
                                  ? (rawInventoryField as any)._id || (rawInventoryField as any).id
                                  : rawInventoryField

                                if (!inventoryId) {
                                  return (
                                    <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-center">
                                      <p className="text-xs text-blue-800 font-medium">⚠️ Item Not Yet Issued by Admin</p>
                                    </div>
                                  )
                                }

                                if (hasPendingReturnRequest(inventoryId)) {
                                  return (
                                    <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                                      <p className="text-xs text-yellow-800 font-medium">Return Request Pending</p>
                                    </div>
                                  )
                                }

                                return (
                                  <button
                                    onClick={() => handleOpenReturnModal({
                                      id: inventoryId,
                                      name: typeof rawInventoryField === 'object' ? (rawInventoryField as any).assetname || request.itemtype : request.itemtype,
                                      issuedDate: request.reviewedat,
                                      expectedReturn: null
                                    })}
                                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-lg transition-all duration-200 font-medium"
                                  >
                                    <PackageX size={16} />
                                    <span>Return Asset</span>
                                  </button>
                                )
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No Requests Found</h3>
                    <p className="text-gray-500 mb-4">
                      You haven't made any asset requests yet.
                    </p>
                    <Link 
                      to="/create-request"
                      className="inline-flex items-center px-4 py-2 bg-[#0d559e] text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Create Your First Request
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Stats */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Package className="w-4 h-4 text-blue-600" />
                <span>Direct Issued: {issuedItems.length}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-600" />
                <span>Total Requests: {requestItems.length}</span>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Last updated: {new Date().toLocaleString()}
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
    </div>
  )
}

export default IssuedItemsPage
