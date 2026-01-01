import React, { useState } from 'react'
import { useGetInventoryItemsQuery, useGetItemTransactionsQuery } from '../../store/api'
import { Package, MapPin, User, Clock, TrendingUp, Eye, Filter } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { formatDate } from '../../utils/dateUtils'

interface AssetTrackingProps {
  itemId?: string
  showAllAssets?: boolean
}

interface AssetLocation {
  id: string
  locationName: string
  status: 'available' | 'issued' | 'maintenance' | 'retired'
  issuedTo?: string
  issuedAt?: string
  expectedReturn?: string
  quantity: number
}

const AssetTracking: React.FC<AssetTrackingProps> = ({ itemId, showAllAssets = false }) => {
  const { data: inventoryItems = [], isLoading } = useGetInventoryItemsQuery()
  const { data: transactions = [] } = useGetItemTransactionsQuery({ 
    id: itemId || '', 
    page: 1, 
    limit: 10 
  }, {
    skip: !itemId || (typeof itemId === 'string' && itemId.trim() === '')
  })
  
  const [selectedAsset, setSelectedAsset] = useState<any>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Filter assets based on search term and status
  const assetItems = inventoryItems?.data || []
  const filteredAssets = assetItems.filter((item: any) => {
    const matchesSearch = item.assetname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.locationofitem?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'available' && item.balancequantityinstock > 0) ||
                         (filterStatus === 'issued' && item.issuedquantity > 0) ||
                         (filterStatus === 'low-stock' && item.balancequantityinstock <= item.minimumthreshold)
    
    return matchesSearch && matchesStatus
  })

  const getAssetStatusColor = (item: any) => {
    if (item.balancequantityinstock <= item.minimumthreshold) return 'text-red-600 bg-red-100'
    if (item.balancequantityinstock === 0) return 'text-orange-600 bg-orange-100'
    if (item.issuedquantity > 0) return 'text-blue-600 bg-blue-100'
    return 'text-green-600 bg-green-100'
  }

  const getAssetStatusText = (item: any) => {
    if (item.balancequantityinstock <= item.minimumthreshold) return 'Low Stock'
    if (item.balancequantityinstock === 0) return 'Out of Stock'
    if (item.issuedquantity > 0) return 'Partially Issued'
    return 'Available'
  }

  const AssetDetailsModal: React.FC<{ asset: any; isOpen: boolean; onClose: () => void }> = ({ asset, isOpen, onClose }) => {
    const transactionData = transactions?.data || []
    const assetTransactions = transactionData.filter((transaction: any) => 
      transaction.itemId === asset.id || transaction.itemName === asset.assetname
    )

    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="p-6 max-w-2xl w-full">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{asset.assetname}</h2>
              <p className="text-gray-600">Asset ID: {asset.id}</p>
            </div>
          </div>

          {/* Asset Information */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Asset Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Brand:</span>
                <span className="ml-2 font-medium">{asset.brand || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600">Model:</span>
                <span className="ml-2 font-medium">{asset.modelno || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600">Category:</span>
                <span className="ml-2 font-medium">{asset.assetcategory || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600">Location:</span>
                <span className="ml-2 font-medium">{asset.locationofitem || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600">Total Quantity:</span>
                <span className="ml-2 font-medium">{asset.totalquantity}</span>
              </div>
              <div>
                <span className="text-gray-600">Available:</span>
                <span className="ml-2 font-medium">{asset.balancequantityinstock}</span>
              </div>
              <div>
                <span className="text-gray-600">Issued:</span>
                <span className="ml-2 font-medium">{asset.issuedquantity || 0}</span>
              </div>
              <div>
                <span className="text-gray-600">Purchased:</span>
                <span className="ml-2 font-medium">{formatDate(asset.dateofentry)}</span>
              </div>
            </div>
          </div>

          {/* Current Status */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Current Status</h3>
            <div className="flex items-center justify-between">
              <div>
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getAssetStatusColor(asset)}`}>
                  {getAssetStatusText(asset)}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Last Updated: {formatDate(asset.updatedAt || asset.createdAt)}
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Transaction History</h3>
            {assetTransactions.length > 0 ? (
              <div className="space-y-3">
                {assetTransactions.map((transaction: any, index: number) => (
                  <div key={transaction.id || index} className="flex items-center justify-between p-3 bg-white rounded border">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded ${
                        transaction.transactionType === 'issue' ? 'bg-blue-100' :
                        transaction.transactionType === 'return' ? 'bg-green-100' :
                        'bg-gray-100'
                      }`}>
                        {transaction.transactionType === 'issue' ? (
                          <Package className="w-4 h-4 text-blue-600" />
                        ) : (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 capitalize">
                          {transaction.transactionType} ({transaction.quantity})
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatDate(transaction.transactionDate)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-600">
                      {transaction.issuedTo && `To: ${transaction.issuedTo}`}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No transaction history available</p>
            )}
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Asset Tracking</h2>
          <p className="text-gray-600">Monitor asset availability and location</p>
        </div>
        <div className="text-sm text-gray-600">
          <span className="font-medium">{filteredAssets.length}</span> assets tracked
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="issued">Issued</option>
            <option value="low-stock">Low Stock</option>
          </select>
        </div>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredAssets.map((asset: any) => (
          <div key={asset.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{asset.assetname}</h3>
                  <p className="text-sm text-gray-600">{asset.brand || 'No Brand'}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedAsset(asset)
                  setShowDetails(true)
                }}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${getAssetStatusColor(asset)} px-2 py-1 rounded text-xs`}>
                  {getAssetStatusText(asset)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Available:</span>
                <span className="font-medium">{asset.balancequantityinstock}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Issued:</span>
                <span className="font-medium">{asset.issuedquantity || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Location:</span>
                <span className="font-medium">{asset.locationofitem || 'Not specified'}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Updated</span>
                <span className="text-sm font-medium">
                  {formatDate(asset.updatedAt || asset.createdAt)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Asset Details Modal */}
      {selectedAsset && (
        <AssetDetailsModal
          asset={selectedAsset}
          isOpen={showDetails}
          onClose={() => {
            setShowDetails(false)
            setSelectedAsset(null)
          }}
        />
      )}
    </div>
  )
}

export default AssetTracking
