import React, { useState, useEffect } from 'react';
import { 
  useGetInventoryItemsQuery,
  useGetCategoriesQuery,
  useUpdateInventoryItemMutation,
  useDeleteInventoryItemMutation,
  useGetUsersQuery
} from '../../store/api';
import { useAppSelector } from '../../store/hooks';
import { Save, X, Package, Calendar, DollarSign, Trash2, FileText, TrendingDown } from 'lucide-react';
import type { InventoryItem } from '../../types';
import { CRUDToasts } from '../../services/toastService';
import toast from 'react-hot-toast';
import CustomDatePicker from '../common/DatePicker';
import CategoryDropdown from '../common/CategoryDropdown';
import CategoryTypeDropdown from '../common/CategoryTypeDropdown';
import AssetNameDropdown from '../common/AssetNameDropdown';
import FinancialYearDropdown from '../common/FinancialYearDropdown';
import StatusDropdown from '../common/StatusDropdown';
import ConditionDropdown from '../common/ConditionDropdown';
import UnitDropdown from '../common/UnitDropdown';
import DepreciationMethodDropdown from '../common/DepreciationMethodDropdown';
import LocationDropdown from '../common/LocationDropdown';
import DepreciationCalculator from '../common/DepreciationCalculator';
import { getValidInventoryDate } from '../../constants/companyInfo';

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
  const { data: categoriesResponse, refetch: refetchCategories } = useGetCategoriesQuery({});
  const categories = categoriesResponse?.data || [];
  const { data: inventoryResponse } = useGetInventoryItemsQuery({});
  const inventoryItems = inventoryResponse?.data || [];
  const { data: usersResponse } = useGetUsersQuery({});
  const users = usersResponse?.data || [];
  const [updateInventoryItem] = useUpdateInventoryItemMutation();
  const [deleteInventoryItem] = useDeleteInventoryItemMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<InventoryItem & { categorytype?: string; assetnamefromcategory?: string }>>({});

  // Extract category type from category if available
  const getCategoryType = (item: InventoryItem): string => {
    if ((item as any).categorytype) return (item as any).categorytype;
    // Try to find category type from categories list
    const matchedCategory = categories.find((cat: any) => 
      cat.name === item.assetcategory || cat.id === item.assetcategoryid
    );
    return matchedCategory?.type || '';
  };

  // Extract serial number from unique ID
  const extractSerialNumberFromUniqueId = (uniqueId: string): string => {
    if (!uniqueId) return '';
    const parts = uniqueId.split('/');
    return parts.length > 0 ? parts[parts.length - 1] : '';
  };

  // Update unique ID when location changes
  // Format: IHUB/YEAR/ASSETCODE/LOCATION/SERIAL
  const updateUniqueIdWithNewLocation = (currentUniqueId: string, newLocation: string): string => {
    if (!currentUniqueId || !newLocation) return currentUniqueId;
    
    // Normalize to uppercase for consistency
    const normalizedId = currentUniqueId.toUpperCase();
    const parts = normalizedId.split('/');
    
    // Validate format: should have 5 parts (IHUB/YEAR/ASSETCODE/LOCATION/SERIAL)
    if (parts.length !== 5) {
      console.warn('Invalid unique ID format:', currentUniqueId);
      return currentUniqueId;
    }
    
    // Update location (index 3) while keeping everything else
    parts[3] = newLocation.toUpperCase().trim();
    
    return parts.join('/');
  };

  useEffect(() => {
    if (item) {
      const categoryType = getCategoryType(item);
      const assetNameFromCategory = item.assetname || '';
      
      setFormData({
        ...item,
        categorytype: categoryType,
        assetnamefromcategory: assetNameFromCategory,
        dateofinvoice: item.dateofinvoice ? new Date(item.dateofinvoice) : undefined,
        dateofentry: item.dateofentry ? new Date(item.dateofentry) : undefined,
        dateofissue: item.dateofissue ? new Date(item.dateofissue) : undefined,
        expectedreturndate: item.expectedreturndate ? new Date(item.expectedreturndate) : undefined,
        assetcategoryid: typeof item.assetcategoryid === 'object' ? (item.assetcategoryid as any)?.id || (item.assetcategoryid as any)?.name || '' : item.assetcategoryid || '',
        assetcategory: typeof item.assetcategory === 'object' ? (item.assetcategory as any)?.name || (item.assetcategory as any)?.id || '' : item.assetcategory || '',
      });
    }
  }, [item, categories]);

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
    setFormData(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      
      // If location is being updated, also update the unique ID
      if (field === 'locationofitem' && prev.uniqueid) {
        updated.uniqueid = updateUniqueIdWithNewLocation(prev.uniqueid, value);
      }
      
      return updated;
    });
  };

  const handleCategoryTypeChange = (categoryType: string) => {
    setFormData(prev => ({
      ...prev,
      categorytype: categoryType,
      assetcategory: '', // Reset category when type changes
      assetcategoryid: '', // Reset category ID when type changes
      assetnamefromcategory: '' // Reset asset name when type changes
    }));
  };

  const availableCategories = categories?.filter((cat: any) => cat.isactive);
  
  // Filter categories based on selected type
  const filteredCategories = formData?.categorytype 
    ? availableCategories?.filter((cat: any) => cat.type === formData.categorytype)
    : availableCategories;



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

      // Keep issuedto as is (it's already a name string from the form)
      // If needed, you can still convert ID to name here
      if (updateData.issuedto && updateData.issuedto !== '') {
        const issuedToUser = users.find((u: any) => u.id === updateData.issuedto || u.name === updateData.issuedto);
        if (issuedToUser && issuedToUser.id === updateData.issuedto) {
          updateData.issuedto = (issuedToUser as any).name;
        }
      }

      // Convert user ID to user name for issuedby field (database expects names, not IDs)
      if (updateData.issuedby && updateData.issuedby !== '') {
        const issuedByUser = users.find((u: any) => u.id === updateData.issuedby || u.name === updateData.issuedby);
        if (issuedByUser && issuedByUser.id === updateData.issuedby) {
          updateData.issuedby = (issuedByUser as any).name;
        }
      }

      // Ensure assetnamefromcategory is synced with assetname
      const updateDataWithExtras = updateData as any;
      if (updateDataWithExtras.assetnamefromcategory && !updateData.assetname) {
        updateData.assetname = updateDataWithExtras.assetnamefromcategory;
      } else if (updateData.assetname && !updateDataWithExtras.assetnamefromcategory) {
        updateDataWithExtras.assetnamefromcategory = updateData.assetname;
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
                className="w-full h-11 px-4 border border-gray-300 rounded-xl bg-gray-50 cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                readOnly
              />
            </div>

            <div>
              <FinancialYearDropdown
                label="Financial Year"
                value={formData.financialyear || ''}
                onChange={(value) => handleDropdownChange('financialyear', value)}
                placeholder="Select Financial Year"
              />
            </div>

            <div>
              <CategoryTypeDropdown
                label="Asset Type *"
                value={formData.categorytype || ''}
                onChange={handleCategoryTypeChange}
                placeholder="Choose Major or Minor"
              />
            </div>

            {formData.categorytype && (
              <div>
                <CategoryDropdown
                  label={`Asset Category * (${formData.categorytype === 'major' ? 'Major' : 'Minor'})`}
                  categories={filteredCategories}
                  value={formData.assetcategory || ''}
                  onChange={(value) => {
                    const category = filteredCategories?.find((cat: any) => cat.name === value);
                    setFormData(prev => ({
                      ...prev,
                      assetcategory: value,
                      assetcategoryid: category?.id || "",
                      assetnamefromcategory: '' // Reset asset name when category changes
                    }));
                  }}
                  placeholder={`Select ${formData.categorytype === 'major' ? 'Major' : 'Minor'} Category`}
                />
              </div>
            )}

            {formData.assetcategory && (
              <div>
                <AssetNameDropdown
                  label={`Asset Name * (${formData.categorytype === 'major' ? 'Major' : 'Minor'})`}
                  categories={filteredCategories || []}
                  categoryType={formData.categorytype || ''}
                  assetCategory={formData.assetcategory || ''}
                  value={formData.assetnamefromcategory || formData.assetname || ''}
                  onChange={(value) => {
                    setFormData(prev => ({
                      ...prev,
                      assetnamefromcategory: value,
                      assetname: value // Also update the main assetname field
                    }));
                  }}
                  placeholder="Select asset name from category"
                  searchable
                  inventoryItems={inventoryItems}
                  showAddButton={true}
                  showDeleteButton={true}
                  onCategoriesChange={refetchCategories}
                />
              </div>
            )}

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
                Rate (Inclusive Tax)
              </label>
              <input
                type="number"
                name="rateinclusivetax"
                value={formData.rateinclusivetax || 0}
                onChange={handleNumberChange}
                step="0.01"
                min="0"
                className="w-full h-11 px-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 1500.00"
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
                readOnly
                className="w-full h-11 px-4 text-gray-600 border border-gray-300 rounded-xl bg-gray-50"
                placeholder="Calculated automatically"
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
                className="w-full h-11 px-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Dell Inspiron 15"
              />
            </div>

            {/* Auto-generated Serial Number from Unique ID */}
            <div>
              <label className="flex items-center mb-2 text-sm font-medium text-gray-700">
                <span>Serial Number</span>
                <span className="px-2 py-1 ml-2 text-xs text-blue-800 bg-blue-100 rounded-full">Auto-Generated</span>
              </label>
              <input
                type="text"
                name="serialNumber"
                value={extractSerialNumberFromUniqueId(formData.uniqueid || '')}
                readOnly
                disabled
                className="w-full h-11 px-4 border border-gray-300 rounded-xl bg-gray-50 cursor-not-allowed text-gray-700 font-mono font-semibold"
                placeholder="Extracted from Unique ID"
              />
            </div>

            {/* Product Serial Number (optional, for manufacturer's serial number) */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Product Serial Number <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                name="productserialnumber"
                value={formData.productserialnumber || ''}
                onChange={handleInputChange}
                className="w-full h-11 px-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Manufacturer's serial number (if available)"
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
                className="w-full h-11 px-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Dell India"
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
                className="w-full h-11 px-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>


            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Specification
              </label>
              <textarea
                name="specification"
                value={formData.specification || ''}
                onChange={handleInputChange}
                rows={3}
                className="w-full min-h-[80px] px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                placeholder="Technical specifications..."
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
                className="w-full h-11 px-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full h-11 px-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full h-11 px-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Warranty Information
              </label>
              <input
                type="text"
                name="warrantyinformation"
                value={formData.warrantyinformation || ''}
                onChange={handleInputChange}
                className="w-full h-11 px-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 3 years"
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
                className="w-full h-11 px-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 5000.00"
              />
              <p className="mt-1 text-xs text-gray-500">
                💰 Annual management and maintenance charges
              </p>
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
                    Maintenance Schedule
                  </label>
                  <textarea
                    name="maintenanceschedule"
                    value={formData.maintenanceschedule || ''}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Enter maintenance schedule..."
                    className="w-full min-h-[80px] px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                  />
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
                  <DepreciationMethodDropdown
                    label="Depreciation Method"
                    value={formData.depreciationmethod || 'written-down-value'}
                    onChange={(value) => handleDropdownChange('depreciationmethod', value)}
                    placeholder="Select depreciation method"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Useful Life (Years)
                  </label>
                  <input
                    type="number"
                    name="expectedlifespan"
                    value={formData.expectedlifespan || ''}
                    onChange={handleInputChange}
                    min="1"
                    max="50"
                    className="w-full h-11 px-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 5"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Salvage Value (₹)
                  </label>
                  <input
                    type="number"
                    name="salvagevalue"
                    value={(formData as any).salvagevalue || ''}
                    onChange={handleNumberChange}
                    min="0"
                    step="0.01"
                    className="w-full h-11 px-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 1000.00"
                  />
                </div>
              </div>

              {formData.depreciationmethod && formData.expectedlifespan && formData.rateinclusivetax && formData.rateinclusivetax > 0 && (
                <div className="mt-6">
                  <DepreciationCalculator
                    assetValue={formData.rateinclusivetax}
                    salvageValue={(formData as any).salvagevalue || 0}
                    usefulLife={Number(formData.expectedlifespan)}
                    purchaseDate={formData.dateofinvoice || new Date()}
                    method={(formData.depreciationmethod || 'written-down-value') as 'written-down-value'}
                    onCalculate={(depreciation: any) => {
                      console.log('Depreciation calculated:', depreciation);
                    }}
                  />
                </div>
              )}
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
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Issued To
                    </label>
                    <input
                      type="text"
                      name="issuedto"
                      value={formData.issuedto || ''}
                      onChange={handleInputChange}
                      className="w-full h-11 px-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Rohit Kumar"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      👤 Enter the name of the person this item is issued to
                    </p>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Expected Return Date
                    </label>
                    <CustomDatePicker
                      selected={formData.expectedreturndate ? getValidInventoryDate(formData.expectedreturndate) : null}
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
                    selected={formData.dateofinvoice ? getValidInventoryDate(formData.dateofinvoice) : null}
                    onChange={(date) => handleDateChange('dateofinvoice', date || undefined)}
                    placeholder="Select invoice date"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Date of Entry
                  </label>
                  <CustomDatePicker
                    selected={formData.dateofentry ? getValidInventoryDate(formData.dateofentry) : null}
                    onChange={(date) => handleDateChange('dateofentry', date || undefined)}
                    placeholder="Select entry date"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Date of Issue
                  </label>
                  <CustomDatePicker
                    selected={formData.dateofissue ? getValidInventoryDate(formData.dateofissue) : null}
                    onChange={(date) => handleDateChange('dateofissue', date || undefined)}
                    placeholder="Select issue date"
                  />
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-6">
                <FileText className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Description/Purpose</h3>
              </div>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                rows={4}
                placeholder="Purpose and description..."
                className="w-full min-h-[100px] px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
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
