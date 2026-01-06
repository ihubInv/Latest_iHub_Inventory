import React from 'react';
import { X, Package, Calendar, DollarSign, FileText, TrendingDown } from 'lucide-react';

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
    if (!value && value !== 0) return '—';
    if (typeof value === 'object') {
      return value?.name || value?.id || value?.assetname || String(value);
    }
    return String(value);
  };

  // Extract serial number from unique ID
  const extractSerialNumberFromUniqueId = (uniqueId: string): string => {
    if (!uniqueId) return '—';
    const parts = uniqueId.split('/');
    return parts.length > 0 ? parts[parts.length - 1] : '—';
  };

  // Format currency
  const formatCurrency = (value: any): string => {
    if (!value && value !== 0) return '—';
    const numValue = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(numValue)) return '—';
    return `₹${numValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
                <Package className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Unique ID</label>
                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 font-mono">
                    {getDisplayValue(item.uniqueid)}
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Financial Year</label>
                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900">
                    {getDisplayValue(item.financialyear)}
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Asset Type</label>
                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900">
                    {getDisplayValue((item as any).categorytype) || '—'}
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Asset Category</label>
                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900">
                    {getDisplayValue(item.assetcategory)}
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Asset Name</label>
                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900">
                    {getDisplayValue(item.assetname)}
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Location</label>
                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900">
                    {getDisplayValue(item.locationofitem || item.location)}
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Status</label>
                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getDisplayValue(item.status)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Condition</label>
                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {getDisplayValue(item.conditionofasset || item.condition)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Rate (Inclusive Tax)</label>
                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900">
                    {formatCurrency(item.rateinclusivetax)}
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Total Cost</label>
                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900">
                    {formatCurrency(item.totalcost)}
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Unit of Measurement</label>
                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900">
                    {getDisplayValue(item.unitofmeasurement)}
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Details Section */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-6">
                <FileText className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Additional Details</h3>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Make/Model</label>
                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900">
                    {getDisplayValue(item.makemodel)}
                  </div>
                </div>

                <div>
                  <label className="flex items-center mb-2 text-sm font-medium text-gray-700">
                    <span>Serial Number</span>
                    <span className="px-2 py-1 ml-2 text-xs text-blue-800 bg-blue-100 rounded-full">Auto-Generated</span>
                  </label>
                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 font-mono font-semibold">
                    {extractSerialNumberFromUniqueId(item.uniqueid)}
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Product Serial Number <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900">
                    {getDisplayValue(item.productserialnumber)}
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Vendor Name</label>
                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900">
                    {getDisplayValue(item.vendorname)}
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Invoice Number</label>
                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900">
                    {getDisplayValue(item.invoicenumber)}
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Purchase Order Number</label>
                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900">
                    {getDisplayValue(item.purchaseordernumber)}
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Specification</label>
                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 min-h-[80px]">
                    {getDisplayValue(item.specification)}
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Balance Quantity in Stock</label>
                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900">
                    {getDisplayValue(item.balancequantityinstock)}
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Minimum Stock Level</label>
                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900">
                    {getDisplayValue(item.minimumstocklevel)}
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Warranty Information</label>
                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900">
                    {getDisplayValue(item.warrantyinformation)}
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Annual Management Charge (AMS) (₹)</label>
                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900">
                    {formatCurrency(item.annualmanagementcharge)}
                  </div>
                </div>
              </div>
            </div>

            {/* Financial & Maintenance Section */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-6">
                <DollarSign className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Financial & Maintenance</h3>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Maintenance Schedule</label>
                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 min-h-[80px]">
                    {getDisplayValue(item.maintenanceschedule)}
                  </div>
                </div>
              </div>
            </div>

            {/* Depreciation Section */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-6">
                <TrendingDown className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Depreciation Information</h3>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Depreciation Method</label>
                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900">
                    {getDisplayValue(item.depreciationmethod)}
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Useful Life (Years)</label>
                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900">
                    {getDisplayValue(item.expectedlifespan)}
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Salvage Value (₹)</label>
                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900">
                    {formatCurrency((item as any).salvagevalue)}
                  </div>
                </div>
              </div>
            </div>

            {/* Issuance & Dates Section */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Calendar className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-semibold text-gray-900">Issuance & Dates</h3>
              </div>
              
              {/* Conditional fields for issued status */}
              {item.status === 'issued' && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mb-6">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Issued To</label>
                    <div className="px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900">
                      {getDisplayValue(item.issuedto)}
                    </div>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Expected Return Date</label>
                    <div className="px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900">
                      {formatDate(item.expectedreturndate)}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Dates Grid */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Date of Invoice</label>
                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900">
                    {formatDate(item.dateofinvoice)}
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Date of Entry</label>
                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900">
                    {formatDate(item.dateofentry)}
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Date of Issue</label>
                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900">
                    {formatDate(item.dateofissue)}
                  </div>
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-6">
                <FileText className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Description/Purpose</h3>
              </div>
              <div className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 min-h-[100px]">
                {getDisplayValue(item.description)}
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