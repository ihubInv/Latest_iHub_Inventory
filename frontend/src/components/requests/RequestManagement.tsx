import React, { useState } from 'react'
import { useGetRequestsQuery, useApproveRequestMutation, useRejectRequestMutation } from '../../store/api'
import { useGetInventoryItemQuery, useGetInventoryItemsQuery } from '../../store/api/inventoryApi'
import { useGetMyReturnRequestsQuery } from '../../store/api/returnRequestsApi'
import { useAppSelector } from '../../store/hooks'
import { Clock, CheckCircle, XCircle, FileText, Search, Eye, PackageX } from 'lucide-react'
import FilterDropdown from '../common/FilterDropdown'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import ReturnAssetModal from './ReturnAssetModal'
import RequestApprovalModal from './RequestApprovalModal'

interface RequestActionModalProps {
  isOpen: boolean
  onClose: () => void
  request: any
  action: 'approve' | 'reject' | 'view'
  onSubmit: (data: any) => void
  isLoading: boolean
}

const RequestActionModal: React.FC<RequestActionModalProps> = ({ 
  isOpen, onClose, request, action, onSubmit, isLoading 
}) => {
  const { user } = useAppSelector((state) => state.auth)
  const { data: inventoryItemResponse } = useGetInventoryItemQuery(request?.inventoryitemid as string, {
    skip: !request?.inventoryitemid
  })
  const { data: allInventoryResponse } = useGetInventoryItemsQuery({}, {
    skip: !!request?.inventoryitemid
  })
  const inferredCategory = (() => {
    if ((inventoryItemResponse?.data as any)?.assetcategoryid?.name) {
      return (inventoryItemResponse?.data as any)?.assetcategoryid?.name
    }
    const items = (allInventoryResponse?.data as any[]) || []
    const match = items.find((it: any) => {
      const n = it?.assetname || it?.asset?.name
      return n && request?.itemtype && n.toString().trim().toLowerCase() === request.itemtype.toString().trim().toLowerCase()
    })
    return match?.assetcategoryid?.name || match?.assetcategory || undefined
  })()
  const [formData, setFormData] = useState({
    remarks: '',
    rejectionReason: '',
    quantityToIssue: request?.quantity || 0
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ ...formData, requestId: request?.id })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (!request) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className={`p-3 rounded-xl ${
              action === 'approve' ? 'bg-green-100' : 
              action === 'reject' ? 'bg-red-100' : 'bg-blue-100'
            }`}>
            {action === 'approve' && <CheckCircle className="w-6 h-6 text-green-600" />}
            {action === 'reject' && <XCircle className="w-6 h-6 text-red-600" />}
            {action === 'view' && <Eye className="w-6 h-6 text-blue-600" />}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {action === 'approve' && 'Approve Request'}
              {action === 'reject' && 'Reject Request'}
              {action === 'view' && 'View Request'}
            </h2>
            <p className="text-gray-600">#{request?.id}</p>
          </div>
        </div>
        {(action === 'view' || action === 'approve' || action === 'reject') && (
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <div className="text-xs text-gray-500">Requested Asset</div>
              <div className="text-sm font-medium text-gray-900">{request?.itemtype || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Requested By</div>
              <div className="text-sm font-medium text-gray-900">{request?.employeename || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Asset Category</div>
              <div className="text-sm font-medium text-gray-900">{inferredCategory || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Purpose</div>
              <div className="text-sm font-medium text-gray-900">{request?.purpose || '—'}</div>
            </div>
            <div className="sm:col-span-2">
              <div className="text-xs text-gray-500">Justification</div>
              <div className="text-sm whitespace-pre-wrap text-gray-900">{request?.justification || '—'}</div>
            </div>
          </div>
        )}

        {action === 'approve' && (
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-700">Reason of approval</label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add approval remarks"
            />
          </div>
        )}

        {action === 'reject' && (
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-700">Reason of rejection</label>
            <textarea
              name="rejectionReason"
              value={formData.rejectionReason}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Add rejection reason"
            />
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          {user?.role !== 'employee' && action !== 'view' && (
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className={`${
                action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 
                action === 'reject' ? 'bg-red-600 hover:bg-red-700' : 
                'bg-blue-600 hover:bg-blue-700'
              } text-white`}
            >
              {isLoading ? 'Processing...' : (
                action === 'approve' ? '✅ Approve' :
                action === 'reject' ? '❌ Reject' : ''
              )}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}

const RequestManagement: React.FC = () => {
  const { data: requests = [], isLoading, refetch } = useGetRequestsQuery({})
  const [approveRequest] = useApproveRequestMutation()
  const [rejectRequest] = useRejectRequestMutation()
  const { user } = useAppSelector((state) => state.auth)

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [actionModal, setActionModal] = useState<'approve' | 'reject' | 'view' | null>(null)
  const [approvalModalOpen, setApprovalModalOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Return asset modal state
  const [returnModalOpen, setReturnModalOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<any>(null)

  // Fetch return requests to check pending status
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

  // Check if current user can manage requests
  const canManageRequests = user?.role === 'admin' || user?.role === 'stock-manager'

  // Filter requests for current user (if employee) or all requests (if admin/stock-manager)
  const requestItems = Array.isArray(requests) ? requests : (requests?.data || [])
  const userRequests = user?.role === 'employee' 
    ? requestItems.filter((req: any) => req.employeeid === user.id)
    : requestItems

  const filteredRequests = userRequests.filter((request: any) => {
    const matchesSearch = request.itemtype?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.employeename?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus
    
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: filteredRequests.length,
    pending: filteredRequests.filter((req: any) => req.status === 'pending').length,
    approved: filteredRequests.filter((req: any) => req.status === 'approved').length,
    rejected: filteredRequests.filter((req: any) => req.status === 'rejected').length
  }

  const handleApprove = async (data: any) => {
    setIsProcessing(true)
    try {
      const assetName = selectedRequest?.itemtype || 'Unknown Asset'
      const requestId = data.requestId

      console.log('✅ APPROVAL ACTION:', {
        assetName,
        quantityApproved: data.quantityToIssue,
        employee: selectedRequest?.employeename,
        requestId
      })

      // Backend's approveRequest handles everything: request approval + item issuance + transaction
      // No need to call issueItem separately
      await approveRequest({
        id: requestId,
        remarks: data.remarks,
        approvedQuantity: data.quantityToIssue,
        inventoryItemId: undefined // Let backend auto-allocate based on itemtype
      }).unwrap()

      console.log(`✅ Request approved and asset issued: ${assetName} to ${selectedRequest?.employeename}`)

      await refetch()
      setActionModal(null)
      setSelectedRequest(null)
    } catch (error: any) {
      console.error('❌ Error in approval process:', error)
      // Show user-friendly error message
      const errorMessage = error?.data?.message || error?.message || 'Failed to approve request'
      alert(`Error: ${errorMessage}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async (data: any) => {
    setIsProcessing(true)
    try {
      await rejectRequest({
        id: data.requestId,
        rejectionReason: data.rejectionReason,
        remarks: data.remarks || data.rejectionReason
      }).unwrap()

      console.log(`✅ Request rejected: ${selectedRequest?.itemtype}`)

      await refetch()
      setActionModal(null)
      setSelectedRequest(null)
    } catch (error: any) {
      console.error('❌ Error rejecting request:', error)
      const errorMessage = error?.data?.message || error?.message || 'Failed to reject request'
      alert(`Error: ${errorMessage}`)
    } finally {
      setIsProcessing(false)
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Asset Request Management</h1>
          <p className="mt-1 text-gray-600">
            {canManageRequests ? 'Manage employee inventory requests' : 'Track your inventory requests'}
          </p>
        </div>
        {canManageRequests && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">{stats.pending}</span> pending requests
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600">
              <XCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="relative rounded-lg bg-gray-50 py-2 px-3">
            <Search className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" size={16} />
            <input
              type="text"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <FilterDropdown
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' }
            ]}
          />
        </div>
      </div>

      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {canManageRequests ? 'All Employee Requests' : 'My Requests'}
          </h2>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredRequests.length > 0 ? (
            filteredRequests.map((request: any) => (
              <div key={request.id} className="p-6 transition-colors hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{request.itemtype}</h3>
                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <span className="ml-2 font-medium">{request.status}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Quantity:</span>
                        <span className="ml-2 font-medium">{request.quantity}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Purpose:</span>
                        <span className="ml-2 font-medium">{request.purpose}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Requested by:</span>
                        <span className="ml-2 font-medium">{request.employeename || 'You'}</span>
                      </div>
                    </div>

                    {/* Return Asset Button for Approved & Issued Items (Employee Only) */}
                    {!canManageRequests && request.status === 'approved' && request.inventoryitemid && !hasApprovedReturnRequest(request.inventoryitemid) && (
                      <div className="mt-4">
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
                            <PackageX size={16} />
                            <span>Return Asset</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      request.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                    <Button
                      onClick={() => {
                        setSelectedRequest(request)
                        setActionModal('view')
                      }}
                      variant="ghost"
                      size="sm"
                    >
                      👁️ View
                    </Button>
                    {canManageRequests && request.status === 'pending' && (
                      <>
                        <Button
                          onClick={() => {
                            setSelectedRequest(request)
                            setApprovalModalOpen(true)
                          }}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          ✅ Approve
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedRequest(request)
                            setActionModal('reject')
                          }}
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          ❌ Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="mb-2 text-lg font-medium text-gray-900">No requests found</h3>
              <p className="text-gray-600">
                {user?.role === 'employee' 
                  ? "You haven't submitted any requests yet"
                  : "No employee requests match your search criteria"
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {selectedRequest && (
        <RequestActionModal
          isOpen={actionModal !== null}
          onClose={() => {
            setActionModal(null)
            setSelectedRequest(null)
          }}
          request={selectedRequest}
          action={actionModal!}
          onSubmit={actionModal === 'approve' ? handleApprove : handleReject}
          isLoading={isProcessing}
        />
      )}

      {/* Return Asset Modal */}
      {selectedAsset && (
        <ReturnAssetModal
          isOpen={returnModalOpen}
          onClose={handleCloseReturnModal}
          asset={selectedAsset}
        />
      )}

      {/* Request Approval Modal with Inventory Selection */}
      {selectedRequest && (
        <RequestApprovalModal
          isOpen={approvalModalOpen}
          onClose={() => {
            setApprovalModalOpen(false)
            setSelectedRequest(null)
          }}
          request={selectedRequest}
          action="approve"
        />
      )}
    </div>
  )
}

export default RequestManagement