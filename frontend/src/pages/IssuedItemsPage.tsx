import React, { useState } from 'react'
import { useGetMyRequestsQuery, useDeleteRequestMutation } from '../store/api/requestsApi'
import { useGetMyReturnRequestsQuery } from '../store/api/returnRequestsApi'
import { formatRelativeDate } from '../utils/dateUtils'
import { Package, Clock, User, Calendar, MapPin, ArrowLeft, PackageX, Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import ReturnAssetModal from '../components/requests/ReturnAssetModal'
import EditPendingRequestModal, { getRequestDocumentId } from '../components/requests/EditPendingRequestModal'
import { getInventoryItemIdFromRef, returnRequestMatchesInventoryItem } from '../utils/returnRequestUtils'

const IssuedItemsPage: React.FC = () => {
  const [returnModalOpen, setReturnModalOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<any>(null)
  const [editingRequest, setEditingRequest] = useState<any | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [requestStatusTab, setRequestStatusTab] = useState<'pending' | 'approved' | 'rejected'>('pending')

  const [deleteRequest] = useDeleteRequestMutation()

  // Fetch employee's requests
  const { data: myRequests, isLoading: requestsLoading, error: requestsError } = useGetMyRequestsQuery({
    page: 1,
    limit: 100, // Get all requests for this page
    sort: '-submittedat'
  })

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

  const handleDeleteRequest = async (req: any) => {
    if (req.status !== 'pending') return
    const id = getRequestDocumentId(req)
    if (!id) return
    if (!window.confirm('Delete this request? You cannot undo this action.')) return
    setDeletingId(id)
    try {
      await deleteRequest(id).unwrap()
      toast.success('Request deleted')
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || 'Could not delete request')
    } finally {
      setDeletingId(null)
    }
  }

  // Check if an asset has a pending return request
  const hasPendingReturnRequest = (assetId: string) => {
    return returnRequestsResponse?.data?.some(
      (req: any) => req.status === 'pending' && returnRequestMatchesInventoryItem(req, assetId)
    )
  }

  /** Return approved: inventory is back — original asset request stays `approved` in DB, so hide it here. */
  const hasApprovedReturnRequest = (assetId: string | undefined) => {
    if (!assetId) return false
    return returnRequestsResponse?.data?.some(
      (r: any) => r.status === 'approved' && returnRequestMatchesInventoryItem(r, assetId)
    )
  }

  const requestItems = myRequests?.data || []
  const pendingRequests = requestItems.filter((req: any) => req.status === 'pending')
  const approvedRequests = requestItems.filter((req: any) => {
    if (req.status !== 'approved') return false
    const invId = getInventoryItemIdFromRef(req.inventoryitemid ?? req.inventoryItemId)
    if (!invId) return true
    return !hasApprovedReturnRequest(invId)
  })
  const rejectedRequests = requestItems.filter((req: any) => req.status === 'rejected')

  const filteredRequestItems =
    requestStatusTab === 'pending'
      ? pendingRequests
      : requestStatusTab === 'approved'
        ? approvedRequests
        : rejectedRequests


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (requestsLoading) {
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

  if (requestsError) {
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

        {/* Content */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-6">
          <div className="p-6">
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Item Requests</h3>
                <p className="text-sm text-gray-600">
                  Track the status of your asset requests (pending, approved, rejected)
                </p>
              </div>

              <div className="mb-6 border border-gray-200 rounded-lg p-1 bg-gray-50">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
                  <button
                    type="button"
                    onClick={() => setRequestStatusTab('pending')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      requestStatusTab === 'pending'
                        ? 'bg-white text-[#0d559e] shadow-sm border border-blue-100'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Pending ({pendingRequests.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRequestStatusTab('approved')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      requestStatusTab === 'approved'
                        ? 'bg-white text-[#0d559e] shadow-sm border border-blue-100'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Approved ({approvedRequests.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRequestStatusTab('rejected')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      requestStatusTab === 'rejected'
                        ? 'bg-white text-[#0d559e] shadow-sm border border-blue-100'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Rejected ({rejectedRequests.length})
                  </button>
                </div>
              </div>

              {filteredRequestItems.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredRequestItems.map((request, index) => (
                    <div key={getRequestDocumentId(request) || index} className="bg-gray-50 border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        {/* Header - match issued-card layout */}
                        <div className="flex items-start justify-between mb-4 gap-3">
                          <div className="flex items-center space-x-3 min-w-0">
                            <div className="p-2 bg-blue-100 rounded-lg shrink-0">
                              <Package className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-semibold text-gray-900 truncate">
                                {request.itemtype} Request #{String(getRequestDocumentId(request)).slice(-8)}
                              </h4>
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
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <span className={`px-3 py-1 text-xs font-medium ${getStatusColor(request.status)} rounded-full`}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </span>
                            {request.status === 'pending' && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  title="Edit request"
                                  aria-label="Edit request"
                                  onClick={() => setEditingRequest(request)}
                                  className="p-2 text-gray-600 rounded-lg border border-gray-200 bg-white hover:bg-blue-50 hover:text-[#0d559e] hover:border-blue-200 transition-colors"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  title="Delete request"
                                  aria-label="Delete request"
                                  disabled={deletingId === getRequestDocumentId(request)}
                                  onClick={() => handleDeleteRequest(request)}
                                  className="p-2 text-gray-600 rounded-lg border border-gray-200 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
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

                        {/* Footer - purpose and remarks */}
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

                          {/* Return Asset Button */}
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
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    No {requestStatusTab} requests found
                  </h3>
                  <p className="text-gray-500 mb-4">
                    No requests are available in this status right now.
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
          </div>
        </div>

        {/* Footer Stats */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-6">
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

        <EditPendingRequestModal
          isOpen={!!editingRequest}
          onClose={() => setEditingRequest(null)}
          request={editingRequest}
        />
      </div>
    </div>
  )
}

export default IssuedItemsPage
