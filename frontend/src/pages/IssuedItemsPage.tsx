import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppSelector } from '../store/hooks'
import { useGetInventoryItemsQuery } from '../store/api/inventoryApi'
import { useGetMyReturnRequestsQuery } from '../store/api/returnRequestsApi'
import { formatRelativeDate } from '../utils/dateUtils'
import { returnRequestMatchesInventoryItem } from '../utils/returnRequestUtils'
import ReturnAssetModal from '../components/requests/ReturnAssetModal'
import {
  Package,
  User,
  Calendar,
  MapPin,
  ArrowLeft,
  PackageX,
  Search,
} from 'lucide-react'

const IssuedItemsPage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth)
  const [returnModalOpen, setReturnModalOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const { data: inventoryResponse, isLoading, error } = useGetInventoryItemsQuery({
    page: 1,
    limit: 1000,
    status: 'issued',
  })

  const { data: returnRequestsResponse } = useGetMyReturnRequestsQuery({
    page: 1,
    limit: 100,
  })

  const hasApprovedReturnRequest = (assetId: string | undefined) => {
    if (!assetId) return false
    return returnRequestsResponse?.data?.some(
      (r: any) => r.status === 'approved' && returnRequestMatchesInventoryItem(r, assetId)
    )
  }

  const hasPendingReturnRequest = (assetId: string) => {
    return returnRequestsResponse?.data?.some(
      (req: any) => req.status === 'pending' && returnRequestMatchesInventoryItem(req, assetId)
    )
  }

  const issuedToEmployee = useMemo(() => {
    const allItems = inventoryResponse?.data || []
    const userName = user?.name?.trim().toLowerCase() || ''

    return allItems
      .filter((item) => {
        if (item.status !== 'issued') return false
        const issuedTo = (item.issuedto || '').trim().toLowerCase()
        if (!userName || !issuedTo) return false
        if (issuedTo !== userName && !issuedTo.includes(userName)) return false
        return !hasApprovedReturnRequest(item.id)
      })
      .map((item) => ({
        id: item.id,
        name: item.assetname,
        uniqueId: item.uniqueid,
        issuedDate: item.issueddate || item.dateofissue,
        issuedBy: item.issuedby || 'Admin',
        location: item.locationofitem || '—',
        purpose: item.description?.includes('PURPOSE:')
          ? item.description.match(/PURPOSE: (.+)/)?.[1] || 'Issued assignment'
          : 'Issued assignment',
        expectedReturn: item.expectedreturndate,
        value: item.totalcost || 0,
      }))
  }, [inventoryResponse?.data, user?.name, returnRequestsResponse?.data])

  const filteredItems = issuedToEmployee.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.uniqueId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleOpenReturnModal = (asset: any) => {
    setSelectedAsset(asset)
    setReturnModalOpen(true)
  }

  const handleCloseReturnModal = () => {
    setReturnModalOpen(false)
    setSelectedAsset(null)
  }

  if (isLoading) {
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

  if (error) {
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
              <p className="text-gray-600 mt-1">Items currently in your possession</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-6">
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">My Issued Items</h3>
              <p className="text-sm text-gray-600">
                {issuedToEmployee.length} item{issuedToEmployee.length !== 1 ? 's' : ''} currently issued to you
              </p>
            </div>

            {issuedToEmployee.length > 0 && (
              <div className="relative mb-6 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, ID, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4 gap-3">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="p-2 bg-blue-100 rounded-lg shrink-0">
                          <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">{item.name}</h4>
                          <p className="text-sm text-gray-600">
                            {item.uniqueId ? `ID: ${item.uniqueId}` : 'Issued asset'}
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full shrink-0">
                        Issued
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <User className="w-4 h-4 shrink-0" />
                        <span className="truncate">By: {item.issuedBy}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Calendar className="w-4 h-4 shrink-0" />
                        <span>{item.issuedDate ? formatRelativeDate(item.issuedDate) : '—'}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600 col-span-2">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                        <span>Purpose: {item.purpose}</span>
                        {item.value > 0 && (
                          <span className="font-medium text-gray-900">₹{item.value.toLocaleString()}</span>
                        )}
                      </div>

                      {item.expectedReturn && (
                        <p
                          className={`text-xs mb-3 ${
                            new Date(item.expectedReturn) < new Date() ? 'text-red-600' : 'text-gray-600'
                          }`}
                        >
                          Expected return: {formatRelativeDate(item.expectedReturn)}
                        </p>
                      )}

                      {hasPendingReturnRequest(item.id) ? (
                        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                          <p className="text-xs text-yellow-800 font-medium">Return Request Pending</p>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenReturnModal({
                              id: item.id,
                              name: item.name,
                              issuedDate: item.issuedDate,
                              expectedReturn: item.expectedReturn,
                            })
                          }
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
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  {searchTerm ? 'No matching items found' : 'No issued items'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm
                    ? 'Try a different search term.'
                    : 'You do not have any items issued to you right now.'}
                </p>
                {!searchTerm && (
                  <Link
                    to="/create-request"
                    className="inline-flex items-center px-4 py-2 bg-[#0d559e] text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Request an Item
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Package className="w-4 h-4 text-gray-600" />
              <span>
                Currently issued: {issuedToEmployee.length} item{issuedToEmployee.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="text-xs text-gray-500">Last updated: {new Date().toLocaleString()}</div>
          </div>
        </div>

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
