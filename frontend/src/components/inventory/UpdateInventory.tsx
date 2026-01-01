import React, { useState, useEffect } from 'react';
import { 
  useGetInventoryItemsQuery,
  useGetCategoriesQuery,
  useUpdateInventoryItemMutation,
  useDeleteInventoryItemMutation,
  useGetUsersQuery
} from '../../store/api';
import { useAppSelector } from '../../store/hooks';
import { Save, X, Package, Calendar, DollarSign, MapPin, Image, Upload, Trash2, FileText } from 'lucide-react';
import type { InventoryItem } from '../../types';
import { CRUDToasts } from '../../services/toastService';
import toast from 'react-hot-toast';
import CustomDatePicker from '../common/DatePicker';
import CategoryDropdown from '../common/CategoryDropdown';
import StatusDropdown from '../common/StatusDropdown';
import ConditionDropdown from '../common/ConditionDropdown';
import UserDropdown from '../common/UserDropdown';
import UnitDropdown from '../common/UnitDropdown';
import DepartmentDropdown from '../common/DepartmentDropdown';
import DepreciationMethodDropdown from '../common/DepreciationMethodDropdown';
import LocationDropdown from '../common/LocationDropdown';

interface UpdateInventoryProps {
  item: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedItem: InventoryItem) => void;
}

const UpdateInventory: React.FC<UpdateInventoryProps> = ({
  item,
  isOpen,
  onClose,
  onUpdate
}) => {
  const { user } = useAppSelector((state) => state.auth);
  const { data: categoriesResponse } = useGetCategoriesQuery({});
  const categories = categoriesResponse?.data || [];
  const { data: inventoryResponse } = useGetInventoryItemsQuery({});
  const inventoryItems = inventoryResponse?.data || [];
  const { data: usersResponse } = useGetUsersQuery({});
  const users = usersResponse?.data || [];
  const [updateInventoryItem] = useUpdateInventoryItemMutation();
  const [deleteInventoryItem] = useDeleteInventoryItemMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<InventoryItem>>({});
  const [newAttachments, setNewAttachments] = useState<File[]>([]);
  const [removedAttachments, setRemovedAttachments] = useState<string[]>([]);

  useEffect(() => {
    if (item) {
      setFormData({
        ...item,
        dateofinvoice: item.dateofinvoice ? new Date(item.dateofinvoice) : undefined,
        dateofentry: item.dateofentry ? new Date(item.dateofentry) : undefined,
        dateofissue: item.dateofissue ? new Date(item.dateofissue) : undefined,
        expectedreturndate: item.expectedreturndate ? new Date(item.expectedreturndate) : undefined,
        assetcategoryid: typeof item.assetcategoryid === 'object' ? item.assetcategoryid?.id || item.assetcategoryid?.name || '' : item.assetcategoryid || '',
        assetcategory: typeof item.assetcategory === 'object' ? item.assetcategory?.name || item.assetcategory?.id || '' : item.assetcategory || '',
        subcategory: typeof item.subcategory === 'object' ? item.subcategory?.name || item.subcategory?.id || '' : item.subcategory || '',
        vendor: typeof item.vendor === 'object' ? item.vendor?.name || item.vendor?.id || '' : item.vendor || '',
        location: typeof item.location === 'object' ? item.location?.name || item.location?.id || '' : item.location || '',
        department: typeof item.department === 'object' ? item.department?.name || item.department?.id || '' : item.department || '',
        assignedto: typeof item.assignedto === 'object' ? item.assignedto?.name || item.assignedto?.id || '' : item.assignedto || '',
      });
      setNewAttachments([]);
      setRemovedAttachments([]);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const handleDateChange = (field: string, date: Date | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: date || null
    }));
  };

  const handleDropdownChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setNewAttachments(prev => [...prev, ...files]);
  };

  const removeNewAttachment = (index: number) => {
    setNewAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingAttachment = (attachmentUrl: string) => {
    setRemovedAttachments(prev => [...prev, attachmentUrl]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !item) return;

    setIsSubmitting(true);
    const loadingToast = CRUDToasts.updating('inventory item');

    try {
      // Prepare update data - keep dates as Date objects for the interface
      const updateData: Partial<InventoryItem> = {
        ...formData,
        lastmodifiedby: user.id,
        lastmodifieddate: new Date(),
      };

      // Convert user ID to user name for issuedto field (database expects names, not IDs)
      if (updateData.issuedto && updateData.issuedto !== '') {
        const issuedToUser = users.find((u: any) => u.id === updateData.issuedto);
        if (issuedToUser) {
          updateData.issuedto = (issuedToUser as any).name;
        }
      }

      // Convert user ID to user name for issuedby field (database expects names, not IDs)
      if (updateData.issuedby && updateData.issuedby !== '') {
        const issuedByUser = users.find((u: any) => u.id === updateData.issuedby);
        if (issuedByUser) {
          updateData.issuedby = (issuedByUser as any).name;
        }
      }

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof typeof updateData] === undefined) {
          delete updateData[key as keyof typeof updateData];
        }
      });

      // Update using context method
      await updateInventoryItem({ id: item.id, data: updateData });

      // Call the onUpdate callback with updated data
      const updatedItem: InventoryItem = {
        ...item,
        ...updateData
      } as InventoryItem;
      onUpdate(updatedItem);

      toast.dismiss(loadingToast);
      CRUDToasts.updated('inventory item');
      onClose();
    } catch (error: any) {
      console.error('Update error:', error);
      toast.dismiss(loadingToast);
      CRUDToasts.updateError('inventory item', error.message || 'Update failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!item || !confirm('Are you sure you want to delete this inventory item? This action cannot be undone.')) {
      return;
    }

    setIsSubmitting(true);
    const loadingToast = CRUDToasts.deleting('inventory item');

    try {
      await deleteInventoryItem(item.id);
      
      toast.dismiss(loadingToast);
      CRUDToasts.deleted('inventory item');
      onClose();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.dismiss(loadingToast);
      CRUDToasts.deleteError('inventory item', error.message || 'Delete failed');
    } finally {
      setIsSubmitting(false);
    }
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
                <h2 className="text-2xl font-bold text-white">Edit Asset</h2>
                <p className="text-green-100 text-sm">Update inventory information</p>
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
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information Section */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Package className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Unique ID
              </label>
              <input
                type="text"
                name="uniqueid"
                value={formData.uniqueid || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                readOnly
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Financial Year
              </label>
              <input
                type="text"
                name="financialyear"
                value={formData.financialyear || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Asset Name
              </label>
              <input
                type="text"
                name="assetname"
                value={formData.assetname || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Asset Category
              </label>
              <CategoryDropdown
                value={formData.assetcategory || ''}
                onChange={(value) => handleDropdownChange('assetcategory', value)}
                categories={categories}
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Location
              </label>
              <LocationDropdown
                inventoryItems={inventoryItems}
                value={formData.locationofitem || ''}
                onChange={(value) => handleDropdownChange('locationofitem', value)}
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Status
              </label>
              <StatusDropdown
                value={formData.status || 'available'}
                onChange={(value) => handleDropdownChange('status', value)}
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Condition
              </label>
              <ConditionDropdown
                value={formData.conditionofasset || 'excellent'}
                onChange={(value) => handleDropdownChange('conditionofasset', value)}
              />
            </div>

            

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Unit Price
              </label>
              <input
                type="number"
                name="rateinclusivetax"
                value={formData.rateinclusivetax || 0}
                onChange={handleNumberChange}
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Total Cost
              </label>
              <input
                type="number"
                name="totalcost"
                value={formData.totalcost || 0}
                onChange={handleNumberChange}
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Unit of Measurement
              </label>
              <UnitDropdown
                value={formData.unitofmeasurement || 'Pieces'}
                onChange={(value) => handleDropdownChange('unitofmeasurement', value)}
              />
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
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Make/Model
              </label>
              <input
                type="text"
                name="makemodel"
                value={formData.makemodel || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Serial Number
              </label>
              <input
                type="text"
                name="productserialnumber"
                value={formData.productserialnumber || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Vendor Name
              </label>
              <input
                type="text"
                name="vendorname"
                value={formData.vendorname || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Invoice Number
              </label>
              <input
                type="text"
                name="invoicenumber"
                value={formData.invoicenumber || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Asset Category ID
              </label>
              <input
                type="text"
                name="assetcategoryid"
                value={formData.assetcategoryid || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Specification
              </label>
              <input
                type="text"
                name="specification"
                value={formData.specification || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Balance Quantity in Stock
              </label>
              <input
                type="number"
                name="balancequantityinstock"
                value={formData.balancequantityinstock || 0}
                onChange={handleNumberChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Minimum Stock Level
              </label>
              <input
                type="number"
                name="minimumstocklevel"
                value={formData.minimumstocklevel || 0}
                onChange={handleNumberChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Purchase Order Number
              </label>
              <input
                type="text"
                name="purchaseordernumber"
                value={formData.purchaseordernumber || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Expected Lifespan
              </label>
              <input
                type="text"
                name="expectedlifespan"
                value={formData.expectedlifespan || ''}
                onChange={handleInputChange}
                placeholder="e.g., 5 years"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Annual Management Charge (AMS) (₹)
              </label>
              <input
                type="number"
                name="annualmanagementcharge"
                value={formData.annualmanagementcharge || ''}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 5000.00"
              />
              <p className="mt-1 text-xs text-gray-500">
                💰 Annual management and maintenance charges
              </p>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Salvage Value
              </label>
              <input
                type="number"
                name="salvagevalue"
                value={(formData as any).salvagevalue || 0}
                onChange={handleNumberChange}
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Depreciation Method
              </label>
              <DepreciationMethodDropdown
                value={formData.depreciationmethod || 'straight-line'}
                onChange={(value) => handleDropdownChange('depreciationmethod', value)}
              />
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
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Warranty Information
              </label>
              <textarea
                name="warrantyinformation"
                value={formData.warrantyinformation || ''}
                onChange={handleInputChange}
                rows={3}
                placeholder="Enter warranty details..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Maintenance Schedule
              </label>
              <textarea
                name="maintenanceschedule"
                value={formData.maintenanceschedule || ''}
                onChange={handleInputChange}
                rows={3}
                placeholder="Enter maintenance schedule..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
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
              {formData.status === 'issued' && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mb-6">
                  <div>
                    <UserDropdown
                      label="Issued To"
                      value={formData.issuedto || ''}
                      onChange={(value) => handleDropdownChange('issuedto', value)}
                      placeholder="Select employee, manager, or admin"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      👤 Select the person this item is issued to
                    </p>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Expected Return Date
                    </label>
                    <CustomDatePicker
                      selected={formData.expectedreturndate || null}
                      onChange={(date) => handleDateChange('expectedreturndate', date || undefined)}
                      placeholder="Select expected return date"
                      minDate={new Date()}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      📅 When is this item expected to be returned?
                    </p>
                  </div>
                </div>
              )}
              
              {/* Dates Grid */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Date of Invoice
                  </label>
                  <CustomDatePicker
                    selected={formData.dateofinvoice || null}
                    onChange={(date) => handleDateChange('dateofinvoice', date || undefined)}
                    placeholder="Select date"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Date of Entry
                  </label>
                  <CustomDatePicker
                    selected={formData.dateofentry || null}
                    onChange={(date) => handleDateChange('dateofentry', date || undefined)}
                    placeholder="Select date"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Date of Issue
                  </label>
                  <CustomDatePicker
                    selected={formData.dateofissue || null}
                    onChange={(date) => handleDateChange('dateofissue', date || undefined)}
                    placeholder="Select date"
                  />
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-6">
                <FileText className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Description</h3>
              </div>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                rows={4}
                placeholder="Enter detailed description of the asset..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="mt-8 bg-white rounded-2xl border border-gray-200 p-6"></div>
            {/* Attachments Section */}
            {/* <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Image className="w-5 h-5 text-pink-600" />
                <h3 className="text-lg font-semibold text-gray-900">Attachments</h3>
              </div>
              
              {item.attachments && item.attachments.length > 0 && (
                <div className="mb-6">
                  <h4 className="mb-4 text-sm font-medium text-gray-700">Current Attachments:</h4>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {item.attachments.map((attachment, index) => (
                      <div key={index} className="relative group">
                        {attachment instanceof File ? (
                          <img
                            src={URL.createObjectURL(attachment)}
                            alt={attachment.name}
                            className="object-cover w-full h-24 border border-gray-200 rounded-lg"
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-24 bg-gray-100 border border-gray-200 rounded-lg">
                            <span className="text-sm text-gray-500">File</span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeExistingAttachment(attachment instanceof File ? attachment.name : String(attachment))}
                          className="absolute p-1 text-white transition-opacity bg-red-500 rounded-full opacity-0 top-1 right-1 group-hover:opacity-100"
                          title="Remove attachment"
                        >
                          <X size={12} className="text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

           
              <div className="mb-6">
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="flex items-center justify-center w-full px-6 py-4 transition-colors border-2 border-gray-300 border-dashed rounded-xl cursor-pointer hover:border-gray-400 hover:bg-gray-50"
                >
                  <Upload size={20} className="mr-2 text-blue-500" />
                  <span className="text-gray-600 font-medium">Add new attachments</span>
                </label>
              </div>

             
              {newAttachments.length > 0 && (
                <div>
                  <h4 className="mb-4 text-sm font-medium text-gray-700">New Attachments:</h4>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {newAttachments.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="object-cover w-full h-24 border border-gray-200 rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeNewAttachment(index)}
                          className="absolute p-1 text-white transition-opacity bg-red-500 rounded-full opacity-0 top-1 right-1 group-hover:opacity-100"
                          title="Remove attachment"
                        >
                          <X size={12} className="text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div> */}

            {/* Footer Actions */}
            <div className="mt-8 bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="flex items-center px-6 py-3 space-x-2 text-white transition-all duration-200 bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  <Trash2 size={16} className="text-red-500" />
                  <span>Delete Item</span>
                </button>

                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="px-6 py-3 text-gray-700 transition-all duration-200 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center px-6 py-3 space-x-2 text-white transition-all duration-200 bg-gradient-to-r from-green-500 to-green-600 rounded-xl hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg"
                  >
                    <Save size={16} className="text-green-500" />
                    <span>{isSubmitting ? 'Updating...' : 'Update Item'}</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdateInventory;
