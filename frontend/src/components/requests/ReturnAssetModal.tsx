import React, { useState } from 'react';
import { useCreateReturnRequestMutation } from '../../store/api/returnRequestsApi';
import { X, PackageX, AlertCircle } from 'lucide-react';
import { CRUDToasts } from '../../services/toastService';
import toast from 'react-hot-toast';

interface ReturnAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: {
    id: string;
    name: string;
    issuedDate?: string;
    expectedReturn?: string;
  };
}

const ReturnAssetModal: React.FC<ReturnAssetModalProps> = ({
  isOpen,
  onClose,
  asset
}) => {
  const [createReturnRequest, { isLoading }] = useCreateReturnRequestMutation();
  const [formData, setFormData] = useState({
    returnreason: '',
    conditiononreturn: 'good' as 'excellent' | 'good' | 'fair' | 'poor' | 'damaged',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.returnreason.trim()) {
      toast.error('Please provide a reason for return');
      return;
    }

    const loadingToast = CRUDToasts.creating('return request');

    try {
      await createReturnRequest({
        inventoryitemid: asset.id,
        assetname: asset.name,
        returnreason: formData.returnreason,
        conditiononreturn: formData.conditiononreturn,
        notes: formData.notes
      }).unwrap();

      toast.dismiss(loadingToast);
      CRUDToasts.created('return request');

      // Reset form
      setFormData({
        returnreason: '',
        conditiononreturn: 'good',
        notes: ''
      });

      onClose();
    } catch (error: any) {
      toast.dismiss(loadingToast);
      const errorMessage = error?.data?.message || error?.message || 'Failed to create return request';
      CRUDToasts.createError('return request', errorMessage);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm bg-black/30 transition-all duration-300 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden my-4 sm:my-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-red-50">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <div className="p-1.5 sm:p-2 rounded-lg bg-orange-100 flex-shrink-0">
              <PackageX className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Return Asset</h3>
              <p className="text-xs sm:text-sm text-gray-600 truncate">{asset.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-gray-400 transition-colors rounded-lg hover:text-gray-600 hover:bg-gray-100 flex-shrink-0"
          >
            <X size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Asset Information */}
          <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="mb-2 text-sm font-medium text-blue-900">Asset Information</h4>
            <div className="text-xs sm:text-sm text-blue-800 space-y-1">
              <p className="break-words"><strong>Asset Name:</strong> {asset.name}</p>
              {asset.issuedDate && (
                <p><strong>Issued Date:</strong> {new Date(asset.issuedDate).toLocaleDateString()}</p>
              )}
              {asset.expectedReturn && (
                <p><strong>Expected Return:</strong> {new Date(asset.expectedReturn).toLocaleDateString()}</p>
              )}
            </div>
          </div>

          {/* Return Reason */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Return Reason *
            </label>
            <select
              value={formData.returnreason}
              onChange={(e) => setFormData(prev => ({ ...prev, returnreason: e.target.value }))}
              required
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Select reason...</option>
              <option value="Project Completed">Project Completed</option>
              <option value="No Longer Needed">No Longer Needed</option>
              <option value="Malfunctioning">Malfunctioning</option>
              <option value="Upgrade Required">Upgrade Required</option>
              <option value="Job Role Change">Job Role Change</option>
              <option value="Leaving Organization">Leaving Organization</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Condition on Return */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Asset Condition *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(['excellent', 'good', 'fair', 'poor', 'damaged'] as const).map((condition) => (
                <button
                  key={condition}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, conditiononreturn: condition }))}
                  className={`px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                    formData.conditiononreturn === condition
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {condition.charAt(0).toUpperCase() + condition.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Additional Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              placeholder="Any additional information about the return..."
            />
          </div>

          {/* Info Message */}
          <div className="p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-yellow-800">
                <p className="font-medium mb-1">Return Request Process:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Your return request will be reviewed by Admin/Stock Manager</li>
                  <li>Once approved, the asset will be marked as available</li>
                  <li>If rejected, you'll see the rejection reason in your dashboard</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end pt-4 space-y-2 sm:space-y-0 sm:space-x-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex items-center justify-center px-4 py-2.5 sm:py-2 space-x-2 text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <X size={16} />
              <span>Cancel</span>
            </button>
            <button
              type="submit"
              disabled={!formData.returnreason.trim() || isLoading}
              className="flex items-center justify-center px-4 py-2.5 sm:py-2 space-x-2 text-white transition-all duration-200 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PackageX size={16} />
              <span>{isLoading ? 'Submitting...' : 'Submit Return Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReturnAssetModal;
