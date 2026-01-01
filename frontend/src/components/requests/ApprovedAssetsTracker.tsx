import React, { useState } from 'react'
import { useGetRequestsQuery } from '../../store/api'
import { Package, ClipboardList, Eye, User, Calendar, CheckCircle } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

const ApprovedAssetsTracker: React.FC = () => {
  const { data: requests = [], isLoading } = useGetRequestsQuery()
  const [shownAsset, setShownAsset] = useState<any>(null)
  const [showDetails, setShowDetails] = useState(false)
  
  // Filter approved requests
  const requestItems = requests?.data || []
  const approvedRequests = requestItems.filter((req: any) => req.status === 'approved')

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const AssetDetailsModal: React.FC<{ asset: any; isOpen: boolean; onClose: () => void }> = ({ asset, isOpen, onClose }) => {
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="p-6 max-w-2xl w-full">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Approved Asset Details</h2>
              <p className="text-gray-600">Request ID: #{asset.id}</p>
            </div>
          </div>

          {/* Asset Information */}
          <div className="bg-green-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">✅ Approved Asset Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-green-700 font-medium">Asset Name:</span>
                <span className="ml-2 text-green-800 font-medium">{asset.itemtype}</span>
              </div>
              <div>
                <span className="text-green-700 font-medium">Asset ID:</span>
                <span className="ml-2 text-green-800 font-mono">{asset.assetid || asset.id}</span>
              </div>
              <div>
                <span className="text-green-700 font-medium">Quantity Approved:</span>
                <span className="ml-2 text-green-800 font-medium">{asset.approvedquantity || asset.quantity}</span>
              </div>
              <div>
                <span className="text-green-700 font-medium">Purpose:</span>
                <span className="ml-2 text-green-800">{asset.purpose}</span>
              </div>
              <div className="col-span-2">
                <span className="text-green-700 font-medium">Issued To:</span>
                <span className="ml-2 text-green-800">{asset.employeename}</span>
              </div>
              <div className="col-span-2">
                <span className="text-green-700 font-medium">Approved On:</span>
                <span className="ml-2 text-green-800">{formatDate(asset.reviewedat || asset.updatedat)}</span>
              </div>
            </div>
            
            {asset.approvalremarks && (
              <div className="mt-4">
                <span className="text-green-700 font-medium block mb-2">Approval Remarks:</span>
                <p className="text-green-800 bg-white p-3 rounded border">{asset.approvalremarks}</p>
              </div>
            )}
          </div>

          {/* Request Timeline */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">📋 Request Timeline</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Submitted:</span>
                <span className="text-gray-800">{formatDate(asset.submittedat)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Requested Quantity:</span>
                <span className="text-gray-800">{asset.quantity} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Approved Quantity:</span>
                <span className="text-green-700 font-medium">{asset.approvedquantity || asset.quantity} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Reviewer:</span>
                <span className="text-gray-800">{asset.reviewername || 'Admin/Stock Manager'}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </Modal>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">✅ Approved Assets</h2> 
          <p className="text-gray-600">View all assets you've approved and issued</p>
        </div>
        <div className="text-sm text-gray-600">
          <span className="font-medium">{approvedRequests.length}</span> approved assets
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="bg-white border border-green-200 shadow-sm rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Approved</p>
              <p className="text-2xl font-bold text-green-600">{approvedRequests.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-green-100">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-blue-200 shadow-sm rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Assets Issued</p>
              <p className="text-2xl font-bold text-blue-600">
                {approvedRequests.reduce((sum, req) => sum + (req.approvedquantity || req.quantity || 0), 0)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-blue-100">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-purple-200 shadow-sm rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Unique Assets</p>
              <p className="text-2xl font-bold text-purple-600">
                {new Set(approvedRequests.map(req => req.itemtype)).size}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-purple-100">
              <ClipboardList className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-orange-200 shadow-sm rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Recipients</p>
              <p className="text-2xl font-bold text-orange-600">
                {new Set(approvedRequests.map(req => req.employeename)).size}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-orange-100">
              <User className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Approved Assets List */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Recently Approved Assets
          </h2>
        </div>

        <div className="divide-y divide-gray-200">
          {approvedRequests.length > 0 ? (
            approvedRequests.map((request: any) => (
              <div key={request.id} className="p-6 transition-colors hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Package className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{request.itemtype}</h3>
                        <p className="text-sm text-gray-600">Asset ID: #{request.assetid || request.id}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3 text-sm">
                      <div>
                        <span className="text-gray-500">Issued to:</span>
                        <span className="ml-2 font-medium text-gray-900">{request.employeename}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Quantity:</span>
                        <span className="ml-2 font-medium text-green-600">{request.approvedquantity || request.quantity}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Purpose:</span>
                        <span className="ml-2 font-medium">{request.purpose}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Approved:</span>
                        <span className="ml-2 font-medium">{formatDate(request.reviewedat)}</span>
                      </div>
                    </div>

                    {request.approvalremarks && (
                      <div className="bg-green-50 p-3 rounded border">
                        <p className="text-sm text-green-700">
                          <span className="font-medium">Approval Note:</span> {request.approvalremarks}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2">
                    <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">
                      ✅ Approved & Issued
                    </span>
                    <Button
                      onClick={() => {
                        setShownAsset(request)
                        setShowDetails(true)
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 hover:text-gray-800"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="mb-2 text-lg font-medium text-gray-900">No approved assets</h3>
              <p className="text-gray-600">You haven't approved any asset requests yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Asset Details Modal */}
      {shownAsset && (
        <AssetDetailsModal
          asset={shownAsset}
          isOpen={showDetails}
          onClose={() => {
            setShowDetails(false)
            setShownAsset(null)
          }}
        />
      )}
    </div>
  )
}

export default ApprovedAssetsTracker
