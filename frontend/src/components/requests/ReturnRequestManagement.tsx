import React, { useState } from 'react'
import {
  useGetReturnRequestsQuery,
  useApproveReturnRequestMutation,
  useRejectReturnRequestMutation
} from '../../store/api/returnRequestsApi'
import { useAppSelector } from '../../store/hooks'
import {
  Clock,
  CheckCircle,
  XCircle,
  PackageX,
  Search,
  Filter,
  Eye,
  User,
  Calendar,
  AlertTriangle,
  Package
} from 'lucide-react'
import FilterDropdown from '../common/FilterDropdown'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import toast from 'react-hot-toast'

interface ReturnActionModalProps {
  isOpen: boolean
  onClose: () => void
  returnRequest: any
  action: 'approve' | 'reject' | 'view'
  onSubmit: (data: any) => void
  isLoading: boolean
}

const ReturnActionModal: React.FC<ReturnActionModalProps> = ({
  isOpen, onClose, returnRequest, action, onSubmit, isLoading
}) => {
  const [formData, setFormData] = useState({
    remarks: '',
    rejectionReason: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (action === 'reject' && !formData.rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }
    onSubmit({ ...formData, returnRequestId: returnRequest?._id || returnRequest?.id })
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (!returnRequest) return null

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'text-green-600 bg-green-50'
      case 'good': return 'text-blue-600 bg-blue-50'
      case 'fair': return 'text-yellow-600 bg-yellow-50'
      case 'poor': return 'text-orange-600 bg-orange-50'
      case 'damaged': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

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
              {action === 'approve' && 'Approve Return Request'}
              {action === 'reject' && 'Reject Return Request'}
              {action === 'view' && 'View Return Request'}
            </h2>
            <p className="text-gray-600">#{(returnRequest?._id || returnRequest?.id)?.substring(0, 8)}</p>
          </div>
        </div>

        {/* Return Request Details */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <div className="text-xs text-gray-500">Asset Name</div>
            <div className="text-sm font-medium text-gray-900">{returnRequest?.assetname || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Returned By</div>
            <div className="text-sm font-medium text-gray-900">{returnRequest?.employeename || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Return Reason</div>
            <div className="text-sm font-medium text-gray-900">{returnRequest?.returnreason || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Asset Condition</div>
            <div className={`text-sm font-medium px-2 py-1 rounded inline-block ${getConditionColor(returnRequest?.conditiononreturn)}`}>
              {returnRequest?.conditiononreturn?.charAt(0).toUpperCase() + returnRequest?.conditiononreturn?.slice(1) || '—'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Requested At</div>
            <div className="text-sm font-medium text-gray-900">
              {returnRequest?.requestedat ? new Date(returnRequest.requestedat).toLocaleString() : '—'}
            </div>
          </div>
          {returnRequest?.notes && (
            <div className="sm:col-span-2">
              <div className="text-xs text-gray-500">Additional Notes</div>
              <div className="text-sm whitespace-pre-wrap text-gray-900 bg-gray-50 p-3 rounded-lg">
                {returnRequest.notes}
              </div>
            </div>
          )}
        </div>

        {/* Status Information for View Mode */}
        {action === 'view' && returnRequest?.status !== 'pending' && (
          <div className={`mb-6 p-4 rounded-lg border ${
            returnRequest?.status === 'approved'
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="text-xs text-gray-500 mb-2">Review Details</div>
            <div className="space-y-2">
              {returnRequest?.reviewername && (
                <div>
                  <span className="text-xs text-gray-600">Reviewed By: </span>
                  <span className="text-sm font-medium">{returnRequest.reviewername}</span>
                </div>
              )}
              {returnRequest?.reviewedat && (
                <div>
                  <span className="text-xs text-gray-600">Reviewed At: </span>
                  <span className="text-sm font-medium">
                    {new Date(returnRequest.reviewedat).toLocaleString()}
                  </span>
                </div>
              )}
              {returnRequest?.approvalremarks && (
                <div>
                  <span className="text-xs text-gray-600">Approval Remarks: </span>
                  <div className="text-sm whitespace-pre-wrap mt-1">{returnRequest.approvalremarks}</div>
                </div>
              )}
              {returnRequest?.rejectionreason && (
                <div>
                  <span className="text-xs text-gray-600">Rejection Reason: </span>
                  <div className="text-sm whitespace-pre-wrap mt-1">{returnRequest.rejectionreason}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Approval Remarks Form */}
        {action === 'approve' && (
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Approval Remarks (Optional)
            </label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Add any remarks about the approval..."
            />
            <p className="mt-2 text-xs text-gray-500">
              The asset will be marked as available in inventory once approved.
            </p>
          </div>
        )}

        {/* Rejection Reason Form */}
        {action === 'reject' && (
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Rejection Reason *
            </label>
            <textarea
              name="rejectionReason"
              value={formData.rejectionReason}
              onChange={handleChange}
              rows={3}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Explain why this return request is being rejected..."
            />
            <p className="mt-2 text-xs text-gray-500">
              The employee will see this reason in their dashboard.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          {action !== 'view' && (
            <Button
              onClick={handleSubmit}
              disabled={isLoading || (action === 'reject' && !formData.rejectionReason.trim())}
              className={`${
                action === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                'bg-red-600 hover:bg-red-700'
              } text-white`}
            >
              {isLoading ? 'Processing...' : (
                action === 'approve' ? '✅ Approve Return' : '❌ Reject Return'
              )}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}

const ReturnRequestManagement: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth)
  const { data: returnRequestsResponse, isLoading, refetch } = useGetReturnRequestsQuery({
    page: 1,
    limit: 100
  })
  const [approveReturnRequest] = useApproveReturnRequestMutation()
  const [rejectReturnRequest] = useRejectReturnRequestMutation()

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [actionModal, setActionModal] = useState<'approve' | 'reject' | 'view' | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Check if current user can manage return requests
  const canManageReturns = user?.role === 'admin' || user?.role === 'stock-manager'

  // Get return requests
  const returnRequests = returnRequestsResponse?.data || []

  // Filter by role
  const userReturnRequests = user?.role === 'employee'
    ? returnRequests.filter((req: any) => req.employeeid === user.id)
    : returnRequests

  const filteredRequests = userReturnRequests.filter((request: any) => {
    const matchesSearch =
      request.assetname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.returnreason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
    const loadingToast = toast.loading('Approving return request...')

    try {
      await approveReturnRequest({
        id: data.returnRequestId,
        remarks: data.remarks
      }).unwrap()

      toast.dismiss(loadingToast)
      toast.success('Return request approved successfully!')

      await refetch()
      setActionModal(null)
      setSelectedRequest(null)
    } catch (error: any) {
      toast.dismiss(loadingToast)
      const errorMessage = error?.data?.message || error?.message || 'Failed to approve return request'
      toast.error(`Error: ${errorMessage}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async (data: any) => {
    setIsProcessing(true)
    const loadingToast = toast.loading('Rejecting return request...')

    try {
      await rejectReturnRequest({
        id: data.returnRequestId,
        rejectionreason: data.rejectionReason
      }).unwrap()

      toast.dismiss(loadingToast)
      toast.success('Return request rejected')

      await refetch()
      setActionModal(null)
      setSelectedRequest(null)
    } catch (error: any) {
      toast.dismiss(loadingToast)
      const errorMessage = error?.data?.message || error?.message || 'Failed to reject return request'
      toast.error(`Error: ${errorMessage}`)
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Return Request Management</h1>
          <p className="mt-1 text-gray-600">
            {canManageReturns ? 'Manage employee asset return requests' : 'Track your asset return requests'}
          </p>
        </div>
        {canManageReturns && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">{stats.pending}</span> pending returns
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Returns</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-600">
              <PackageX className="w-6 h-6 text-white" />
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

      {/* Search and Filter */}
      <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="relative rounded-lg bg-gray-50 py-2 px-3">
            <Search className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" size={16} />
            <input
              type="text"
              placeholder="Search returns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
            icon={<Filter size={16} />}
          />
        </div>
      </div>

      {/* Return Requests List */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {canManageReturns ? 'All Return Requests' : 'My Return Requests'}
          </h2>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredRequests.length > 0 ? (
            filteredRequests.map((request: any) => (
              <div key={request._id || request.id} className="p-6 transition-colors hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <PackageX className="w-5 h-5 text-orange-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{request.assetname}</h3>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">Employee:</span>
                        <span className="ml-2 font-medium">{request.employeename}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Return Reason:</span>
                        <span className="ml-2 font-medium">{request.returnreason}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Condition:</span>
                        <span className={`ml-2 font-medium px-2 py-0.5 rounded text-xs ${
                          request.conditiononreturn === 'excellent' ? 'bg-green-100 text-green-800' :
                          request.conditiononreturn === 'good' ? 'bg-blue-100 text-blue-800' :
                          request.conditiononreturn === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                          request.conditiononreturn === 'poor' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {request.conditiononreturn?.charAt(0).toUpperCase() + request.conditiononreturn?.slice(1)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Requested:</span>
                        <span className="ml-2 font-medium">
                          {new Date(request.requestedat).toLocaleDateString()}
                        </span>
                      </div>
                      {request.rejectionreason && (
                        <div className="col-span-2 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-medium text-red-800">Rejection Reason:</p>
                              <p className="text-sm text-red-700 mt-1">{request.rejectionreason}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
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
                    {canManageReturns && request.status === 'pending' && (
                      <>
                        <Button
                          onClick={() => {
                            setSelectedRequest(request)
                            setActionModal('approve')
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
              <PackageX className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="mb-2 text-lg font-medium text-gray-900">No return requests found</h3>
              <p className="text-gray-600">
                {user?.role === 'employee'
                  ? "You haven't submitted any return requests yet"
                  : "No return requests match your search criteria"
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action Modal */}
      {selectedRequest && (
        <ReturnActionModal
          isOpen={actionModal !== null}
          onClose={() => {
            setActionModal(null)
            setSelectedRequest(null)
          }}
          returnRequest={selectedRequest}
          action={actionModal!}
          onSubmit={actionModal === 'approve' ? handleApprove : handleReject}
          isLoading={isProcessing}
        />
      )}
    </div>
  )
}

export default ReturnRequestManagement
