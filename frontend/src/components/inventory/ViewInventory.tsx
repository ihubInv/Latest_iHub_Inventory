import React from 'react';
import { X, Edit, Package } from 'lucide-react';

interface ViewInventoryProps {
  item: any;
  onClose: () => void;
}

const ViewInventory: React.FC<ViewInventoryProps> = ({ item, onClose }) => {
  if (!item) return null;

  // Helper function to safely format dates
  const formatDate = (dateValue: any, includeTime: boolean = false): string => {
    if (!dateValue) return '—';
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return '—';
      return includeTime ? date.toLocaleString() : date.toLocaleDateString();
    } catch (e) {
      console.error('Date formatting error:', e, dateValue);
      return '—';
    }
  };

  // Parse attachments if they come as a JSON string from the database
  let attachments = item.attachments || [];
  if (typeof attachments === 'string') {
    try {
      attachments = JSON.parse(attachments);
    } catch (e) {
      console.error('Failed to parse attachments:', e);
      attachments = [];
    }
  }

  // Helper function to extract string values from objects
  const getDisplayValue = (value: any): string => {
    if (!value) return '—';
    if (typeof value === 'object') {
      return value?.name || value?.id || value?.assetname || String(value);
    }
    return String(value);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-300">
      <div className="w-full max-w-7xl max-h-[95vh] overflow-hidden bg-white rounded-3xl shadow-2xl border border-gray-100">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-[#0d559e] to-[#1a6bb8] px-8 py-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                <Package className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Asset Details</h2>
                <p className="text-green-100 text-sm">View complete item information</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-3 text-white hover:bg-white hover:bg-opacity-20 rounded-xl transition-all duration-200"
            >
              <X size={24} className="text-red-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-120px)] p-8">
          <div className="space-y-8">
            {/* Basic Information Section */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Package className="w-6 h-6 text-[#0d559e]" />
                <h3 className="text-xl font-semibold text-gray-900">Basic Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Asset Name</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">
                    {getDisplayValue(item.assetname)}
                  </div>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Unique ID</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">
                    {getDisplayValue(item.uniqueid)}
                  </div>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Category</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">
                    {getDisplayValue(item.assetcategory)}
                  </div>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Subcategory</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">
                    {getDisplayValue(item.subcategory)}
                  </div>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Asset Category ID</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">
                    {getDisplayValue(item.assetcategoryid)}
                  </div>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Brand/Model</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">
                    {getDisplayValue(item.brand)}
                  </div>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Serial Number</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">
                    {getDisplayValue(item.serialnumber)}
                  </div>
                </div>
            
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Status</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getDisplayValue(item.status)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Information Section */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-6 h-6 text-[#0d559e] bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 font-bold text-sm">$</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Financial Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Purchase Price</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">
                    {item.purchaseprice ? `$${item.purchaseprice}` : '—'}
                  </div>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Current Value</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">
                    {item.currentvalue ? `$${item.currentvalue}` : '—'}
                  </div>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Purchase Date</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">
                    {formatDate(item.purchasedate)}
                  </div>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Date of Invoice</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">
                    {formatDate(item.dateofinvoice)}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block mb-2 text-sm font-medium text-gray-700">Vendor</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">
                    {getDisplayValue(item.vendor)}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block mb-2 text-sm font-medium text-gray-700">Date of Entry</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">
                    {formatDate(item.dateofentry)}
                  </div>
                </div>
              </div>
            </div>

            {/* Location & Assignment Section */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-6 h-6 text-[#0d559e] bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">📍</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Location & Assignment</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Location</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">
                    {getDisplayValue(item.location)}
                  </div>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Department</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">
                    {getDisplayValue(item.department)}
                  </div>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Assigned To</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">
                    {getDisplayValue(item.assignedto)}
                  </div>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Condition</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {getDisplayValue(item.condition)}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Warranty Expiry</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">
                    {formatDate(item.warrantyexpiry)}
                  </div>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Date of Issue</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">
                    {formatDate(item.dateofissue)}
                  </div>
                </div>
              </div>
            </div>

            {/* Specifications Section */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-6 h-6 text-[#0d559e] bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 font-bold text-sm">⚙</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Specifications & Additional Info</h3>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Description</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 min-h-[100px]">
                    {getDisplayValue(item.description)}
                  </div>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Notes</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 min-h-[80px]">
                    {getDisplayValue(item.notes)}
                  </div>
                </div>
              </div>
            </div>

            {/* Attachments Section */}
            {attachments && attachments.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <div className="w-6 h-6 text-[#0d559e] bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-orange-600 font-bold text-sm">📎</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Attachments</h3>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {attachments.map((attachment: any, index: number) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="text-blue-600 font-bold text-sm">📄</span>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {attachment.name || `Attachment ${index + 1}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB` : 'Unknown size'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 px-8 py-4 rounded-b-3xl border-t border-gray-200">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-gray-300 border border-gray-400 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewInventory;