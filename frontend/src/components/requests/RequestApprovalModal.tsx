import React, { useState, useEffect } from 'react';
import {
  useGetInventoryItemsQuery,
  useApproveRequestMutation,
  useRejectRequestMutation,
  useGetCategoriesQuery
} from '../../store/api';
import { useAppSelector } from '../../store/hooks';
// Removed Supabase - using backend API for all operations
import { 
  CheckCircle, 
  XCircle, 
  Package, 
  User, 
  Calendar,
  AlertCircle,
  ArrowRight,
  Search,
  Filter,
  ChevronDown
} from 'lucide-react';
import { CRUDToasts } from '../../services/toastService';
import toast from 'react-hot-toast';

interface RequestApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: any;
  action: 'approve' | 'reject';
}

const RequestApprovalModal: React.FC<RequestApprovalModalProps> = ({
  isOpen,
  onClose,
  request,
  action
}) => {
  const { data: inventoryResponse, isLoading: isLoadingInventory } = useGetInventoryItemsQuery({});
  const inventoryItems = inventoryResponse?.data || [];
  const { data: categoriesResponse } = useGetCategoriesQuery({});
  const categories = categoriesResponse?.data || [];
  const [approveRequest] = useApproveRequestMutation();
  const [rejectRequest] = useRejectRequestMutation();
  const { user } = useAppSelector((state) => state.auth);
  const [reason, setReason] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Filter available items that match the request
  const availableItems = inventoryItems?.filter((item: any) => {
    const matchesStatus = item.status === 'available';
    const matchesCategory = !selectedCategory || item.assetcategory === selectedCategory;
    // Show all available items, not just those matching the request category
    const matchesSearch = !searchTerm || 
                         item.assetname.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.assetcategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.uniqueid.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesCategory && matchesSearch;
  }) || [];

  // If no items found with current filters, show all available items
  const displayItems = availableItems.length > 0 ? availableItems : (inventoryItems?.filter((item: any) => item.status === 'available') || []);

  // Group items by category
  const itemsByCategory = displayItems.reduce((acc: Record<string, any[]>, item: any) => {
    const category = item.assetcategory || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});

  // Get categories that have available items
  const availableCategories = Object.keys(itemsByCategory).sort();

  // Debug logging
  console.log('🔍 RequestApprovalModal Debug:', {
    inventoryItems: inventoryItems?.length || 0,
    availableItems: availableItems?.length || 0,
    displayItems: displayItems?.length || 0,
    requestItemType: request?.itemtype,
    selectedCategory,
    searchTerm,
    availableCategories: availableCategories.length,
    itemsByCategory: Object.keys(itemsByCategory)
  });

  useEffect(() => {
    if (isOpen && request) {
      setReason('');
      setSelectedAsset(null);
      setSearchTerm('');
      setSelectedCategory(''); // Show all categories initially
      setExpandedCategories(new Set());
    }
  }, [isOpen, request]);

  const toggleCategoryExpansion = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const expandAllCategories = () => {
    setExpandedCategories(new Set(availableCategories));
  };

  const collapseAllCategories = () => {
    setExpandedCategories(new Set());
  };

  const handleApproval = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for approval');
      return;
    }

    if (!request || !request.id) {
      toast.error('Invalid request data. Please refresh and try again.');
      console.error('Request data is missing:', request);
      return;
    }

    if (action === 'approve' && !selectedAsset) {
      toast.error('Please select an asset to issue');
      return;
    }

    setIsProcessing(true);
    const loadingToast = CRUDToasts.updating('request');

    try {
      console.log('🚀 Starting approval process:', { action, request, selectedAsset, reason });

      // Use the backend API which handles everything (request update + inventory issue + transaction)
      if (action === 'approve') {
        const requestUpdateResult = await approveRequest({
          id: request.id,
          remarks: reason,
          inventoryItemId: selectedAsset?.id,
          approvedQuantity: request.quantity || 1
        }).unwrap();

        console.log('✅ Request approved and item issued successfully:', requestUpdateResult);

        // Create audit trail entry in localStorage for additional tracking
        try {
          const auditEntry = {
            action: 'issue',
            itemId: selectedAsset.id,
            itemName: selectedAsset.assetname,
            issuedTo: request.employeename,
            issuedBy: user?.name || 'Admin',
            issuedById: user?.id || 'unknown',
            issuedDate: new Date().toISOString(),
            requestId: request.id,
            purpose: request.purpose || 'Direct Issue',
            expectedReturnDate: request.expectedreturndate ? new Date(request.expectedreturndate).toISOString() : undefined,
            notes: reason,
            previousStatus: 'available',
            newStatus: 'issued',
            department: request.department || 'Unknown',
            location: selectedAsset.locationofitem,
            itemValue: selectedAsset.totalcost || 0,
            itemCategory: selectedAsset.assetcategory,
            uniqueId: selectedAsset.uniqueid
          };

          const existingAudit = JSON.parse(localStorage.getItem('issuanceAuditTrail') || '[]');
          existingAudit.push(auditEntry);
          localStorage.setItem('issuanceAuditTrail', JSON.stringify(existingAudit));
        } catch (auditError) {
          console.warn('Failed to create audit trail entry:', auditError);
        }

        toast.success(`✅ Request approved and "${selectedAsset.assetname}" issued to ${request.employeename}`, {
          duration: 5000,
          style: {
            background: '#10B981',
            color: 'white',
          },
        });
      } else {
        await rejectRequest({
          id: request.id,
          rejectionReason: reason,
          remarks: reason
        }).unwrap();

        toast.success(`✅ Request rejected: ${reason}`, {
          duration: 4000,
          style: {
            background: '#EF4444',
            color: 'white',
          },
        });
      }

      toast.dismiss(loadingToast);
      onClose();
    } catch (error: any) {
      console.error(`❌ Error ${action}ing request:`, error);
      toast.dismiss(loadingToast);

      // Provide more specific error messages
      const errorMessage = error?.data?.message || error?.message || 'Unknown error';
      if (errorMessage.includes('not found') || errorMessage.includes('Invalid')) {
        CRUDToasts.updateError('request', 'Asset or request not found. Please refresh and try again.');
      } else if (errorMessage.includes('out of stock') || errorMessage.includes('Insufficient stock')) {
        CRUDToasts.updateError('request', 'Selected asset is out of stock.');
      } else if (errorMessage.includes('already issued')) {
        CRUDToasts.updateError('request', 'Asset is already issued.');
      } else {
        CRUDToasts.updateError('request', `Failed to ${action} request: ${errorMessage}`);
      }
    }

    setIsProcessing(false);
  };

  if (!isOpen || !request) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm transition-all duration-300 overflow-y-auto">
      <div className="w-full max-w-4xl max-h-[95vh] bg-white rounded-2xl shadow-xl overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">
            {action === 'approve' ? 'Approve Request & Issue Asset' : 'Reject Request'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 transition-colors rounded-lg hover:text-gray-600 hover:bg-gray-100"
          >
            <XCircle size={20} className="text-red-500" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Request Details */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="mb-3 text-lg font-medium text-gray-900">Request Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Employee</label>
                <p className="text-sm text-gray-900">{request.employeename}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Item Type</label>
                <p className="text-sm text-gray-900">{request.itemtype}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                <p className="text-sm text-gray-900">{request.quantity}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Purpose</label>
                <p className="text-sm text-gray-900">{request.purpose}</p>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Justification</label>
                <p className="text-sm text-gray-900">{request.justification}</p>
              </div>
            </div>
          </div>

          {/* Asset Selection (only for approval) */}
          {action === 'approve' && (
            <div>
              <h4 className="mb-3 text-lg font-medium text-gray-900 flex items-center">
                <Package className="w-5 h-5 mr-2 text-blue-600" />
                Select Asset to Issue
              </h4>
              
              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" size={16} />
                  <input
                    type="text"
                    placeholder="Search available assets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Search and Filter Controls */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by asset name, category, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Categories</option>
                    {availableCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={expandAllCategories}
                      className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800"
                    >
                      Expand All
                    </button>
                    <button
                      onClick={collapseAllCategories}
                      className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                    >
                      Collapse All
                    </button>
                  </div>
                </div>
              </div>

              {/* Available Assets by Category */}
              <div className="max-h-64 sm:max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
                {isLoadingInventory ? (
                  <div className="p-8 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p>Loading inventory items...</p>
                  </div>
                ) : availableCategories.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {availableCategories.map((category) => {
                      const categoryItems = itemsByCategory[category];
                      const isExpanded = expandedCategories.has(category);
                      
                      return (
                        <div key={category} className="transition-all duration-200">
                          {/* Category Header */}
                          <div 
                            className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                            onClick={() => toggleCategoryExpansion(category)}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100">
                                <Package className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">{category}</h4>
                                <p className="text-sm text-gray-500">{categoryItems.length} available items</p>
                              </div>
                            </div>
                            <ChevronDown 
                              size={16}
                              className={`text-gray-400 transition-transform duration-200 ${
                                isExpanded ? 'rotate-180' : ''
                              }`} 
                            />
                          </div>

                          {/* Category Items */}
                          {isExpanded && (
                            <div className="bg-gray-50 border-t border-gray-200">
                              {categoryItems.map((item) => (
                                <div
                                  key={item.id}
                                  onClick={() => setSelectedAsset(item)}
                                  className={`p-3 cursor-pointer transition-colors border-b border-gray-200 last:border-b-0 ${
                                    selectedAsset?.id === item.id
                                      ? 'bg-blue-50 border-blue-200'
                                      : 'hover:bg-white'
                                  }`}
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                    <div className="flex-1">
                                      <h5 className="font-medium text-gray-900">{item.assetname}</h5>
                                      <p className="text-sm text-gray-600">ID: {item.uniqueid}</p>
                                      <p className="text-sm text-gray-500">
                                        Stock: {item.balancequantityinstock} | Location: {item.locationofitem}
                                      </p>
                                    </div>
                                    <div className="text-left sm:text-right">
                                      <p className="text-sm font-medium text-gray-900">₹{item.totalcost?.toLocaleString()}</p>
                                      <p className="text-xs text-gray-500">{item.status}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <AlertCircle className="mx-auto w-8 h-8 mb-2" />
                    <p>No available assets found</p>
                    <p className="text-sm">
                      {inventoryItems?.length === 0 
                        ? 'No inventory items found. Please add inventory items first.'
                        : `No available items found. Total inventory: ${inventoryItems?.length || 0} items, Available: ${inventoryItems?.filter((item: any) => item.status === 'available').length || 0} items`
                      }
                    </p>
                    <div className="mt-4 text-xs text-gray-400">
                      <p>Debug: Total inventory items: {inventoryItems?.length || 0}</p>
                      <p>Debug: Available items: {inventoryItems?.filter((item: any) => item.status === 'available').length || 0}</p>
                      <p>Debug: Display items: {displayItems?.length || 0}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Selected Asset Summary */}
              {selectedAsset && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-2">Selected Asset:</h5>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <p className="text-blue-800">{selectedAsset.assetname}</p>
                      <p className="text-sm text-blue-600">{selectedAsset.assetcategory}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-blue-800 font-medium">₹{selectedAsset.totalcost?.toLocaleString()}</p>
                      <p className="text-sm text-blue-600">Stock: {selectedAsset.balancequantityinstock}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reason/Remarks */}
          <div>
            <h4 className="mb-3 text-lg font-medium text-gray-900 flex items-center">
              <User className="w-5 h-5 mr-2 text-green-600" />
              {action === 'approve' ? 'Approval Remarks' : 'Rejection Reason'}
            </h4>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={`Enter ${action === 'approve' ? 'approval remarks' : 'rejection reason'}...`}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end pt-4 sm:pt-6 mt-4 sm:mt-6 space-y-2 sm:space-y-0 sm:space-x-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex items-center justify-center px-4 py-2 space-x-2 text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <XCircle size={16} className="text-red-500" />
            <span>Cancel</span>
          </button>
          <button
            onClick={handleApproval}
            disabled={!reason.trim() || (action === 'approve' && !selectedAsset) || isProcessing}
            className={`flex items-center justify-center px-4 py-2 space-x-2 text-white transition-all duration-200 rounded-lg ${
              action === 'approve' 
                ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {action === 'approve' ? <CheckCircle size={16} className="text-green-500" /> : <XCircle size={16} className="text-red-500" />}
            <span>
              {isProcessing 
                ? (action === 'approve' ? 'Approving & Issuing...' : 'Rejecting...') 
                : (action === 'approve' ? 'Approve & Issue Asset' : 'Reject Request')
              }
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestApprovalModal;
