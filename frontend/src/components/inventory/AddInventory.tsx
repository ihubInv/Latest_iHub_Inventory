import React, { useState } from 'react';
import { 
  useCreateInventoryItemMutation,
  useGetCategoriesQuery,
  useGetInventoryItemsQuery,
  useUploadInventoryAttachmentMutation
} from '../../store/api';
import { useAppSelector } from '../../store/hooks';
import CustomDatePicker from '../common/DatePicker';
import { Save, X, Package, Calendar, DollarSign, MapPin, TrendingDown, CalendarIcon, Upload, Plus, List } from 'lucide-react';
import { usePersistedFormState } from '../../hooks/usePersistedState';

// import UploadDropzone from '../common/UploadDropzone';
import { COMPANY_INFO, getValidInventoryDate } from '../../constants/companyInfo';
import DepreciationCalculator from '../common/DepreciationCalculator';
import toast from 'react-hot-toast';
import CategoryDropdown from '../common/CategoryDropdown';
import CategoryTypeDropdown from '../common/CategoryTypeDropdown';
import AssetNameDropdown from '../common/AssetNameDropdown';
import LocationDropdown from '../common/LocationDropdown';
import StatusDropdown from '../common/StatusDropdown';
import ConditionDropdown from '../common/ConditionDropdown';
import UnitDropdown from '../common/UnitDropdown';
import DepreciationMethodDropdown from '../common/DepreciationMethodDropdown';
import BulkUpload from './BulkUpload';
import { bulkUploadInventory } from '../../services/bulkUploadService';

const AddInventory: React.FC = () => {
  const [createInventoryItem] = useCreateInventoryItemMutation();
  const [uploadAttachment] = useUploadInventoryAttachmentMutation();
  const { data: categoriesResponse } = useGetCategoriesQuery({});
  const categories = categoriesResponse?.data || [];
  const { data: inventoryResponse } = useGetInventoryItemsQuery({});
  const inventoryItems = inventoryResponse?.data || [];
  const { user } = useAppSelector((state) => state.auth);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showFinancialYearPicker, setShowFinancialYearPicker] = useState(false);
  const [activeTab, setActiveTab] = useState<'single' | 'multi' | 'bulk'>('single');
  const [showAddRowsModal, setShowAddRowsModal] = useState(false);
  const [rowsToAdd, setRowsToAdd] = useState<string>('1');
  const [distributeRateAcrossRows, setDistributeRateAcrossRows] = useState<boolean>(true);
  const [multipleItems, setMultipleItems] = useState<Array<{
    uniqueid: string;
    assetname: string;
    assetnamefromcategory: string;
    categorytype: string;
    assetcategory: string;
    assetcategoryid: string;
    makemodel: string;
    productserialnumber?: string;
    vendorname: string;
    rateinclusivetax: number;
    totalcost: number;
    quantity: number;
    status: 'available' | 'issued' | 'maintenance' | 'retired';
    conditionofasset: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
    depreciationmethod: string;
    expectedlifespan: string;
    salvagevalue: number;
    dateofinvoice: Date | null;
    dateofentry: Date | null;
  }>>([
    { uniqueid: '', assetname: '', assetnamefromcategory: '', categorytype: '', assetcategory: '', assetcategoryid: '', makemodel: '', productserialnumber: '', vendorname: '', rateinclusivetax: 0, totalcost: 0, quantity: 1, status: 'available', conditionofasset: 'excellent', depreciationmethod: 'written-down-value', expectedlifespan: '', salvagevalue: 0, dateofinvoice: new Date(), dateofentry: new Date() }
  ]);

  // Function to convert date to financial year format (e.g., 2025-26)
  const getFinancialYearFromDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-11
    
    // Financial year typically runs from April to March
    // If month is April (3) or later, it's the start of financial year
    // If month is before April (0-2), it's the end of previous financial year
    if (month >= 3) { // April to December
      return `${year}-${(year + 1).toString().slice(-2)}`;
    } else { // January to March
      return `${year - 1}-${year.toString().slice(-2)}`;
    }
  };

  // Initialize form data with persistent state
  const defaultFormData = {
    uniqueid: '',
    financialyear: '2024-25',
    dateofinvoice: new Date(), // Default to current date
    dateofentry: new Date(),
    invoicenumber: '',
    categorytype: '',
    assetcategory: '',
    assetcategoryid: "",
    assetname: '',
    assetnamefromcategory: '',
    specification: '',
    makemodel: '',
    productserialnumber: '',
    vendorname: '',
    quantityperitem: 1,
    rateinclusivetax: 0,
    totalcost: 0,
    locationofitem: 'Storage Room A',
    issuedto: '',
    dateofissue: null as Date | null,
    expectedreturndate: null as Date | null,
    balancequantityinstock: 0,
    description: '',
    unitofmeasurement: 'Pieces',
    depreciationmethod: 'written-down-value',
    warrantyinformation: '',
    maintenanceschedule: '',
    conditionofasset: 'excellent' as const,
    status: 'available' as 'available' | 'issued' | 'maintenance' | 'retired',
    minimumstocklevel: 5,
    purchaseordernumber: '',
    expectedlifespan: '',
    salvagevalue: 0,
    annualmanagementcharge: 0,
    attachments: [] as File[],
  };

  const [formData, setFormData] = usePersistedFormState('addInventoryFormData', defaultFormData);

  // Function to clear saved form data
  const clearSavedFormData = () => {
    setFormData(defaultFormData);
  };

  // Auto-generate unique ID functions
  const generateAssetCode = (assetName: string): string => {
    if (!assetName) return '';
    // Take first 3 letters and convert to uppercase
    return assetName.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();
  };

  const generateUniqueId = async (): Promise<string> => {
    const { financialyear, assetnamefromcategory, assetname, locationofitem } = formData;
    const currentAssetName = assetnamefromcategory || assetname;
    
    // Always start with ihub prefix
    let uniqueId = 'ihub/';
    
    // Add financial year or placeholder
    if (financialyear) {
      uniqueId += financialyear;
    } else {
      uniqueId += '--';
    }
    uniqueId += '/';
    
    // Add asset code or placeholder
    if (currentAssetName) {
      uniqueId += generateAssetCode(currentAssetName);
    } else {
      uniqueId += '--';
    }
    uniqueId += '/';
    
    // Add location or placeholder
    if (locationofitem) {
      uniqueId += locationofitem;
    } else {
      uniqueId += '--';
    }
    uniqueId += '/';
    
    // Add serial number only if all required fields are present
    if (financialyear && currentAssetName && locationofitem) {
      const prefix = `ihub/${financialyear}/${generateAssetCode(currentAssetName)}/${locationofitem}/`;
      const nextSerialNumber = getNextSerialNumberForPrefix(prefix);
      const serialNumber = nextSerialNumber.toString().padStart(3, '0');
      uniqueId += serialNumber;
    } else {
      uniqueId += '--';
    }
    
    return uniqueId;
  };

  // Enhanced unique ID validation
  const validateUniqueId = async (uniqueId: string): Promise<{ isValid: boolean; error?: string }> => {
    try {
      // Check if unique ID follows the correct format
      const parts = uniqueId.split('/');
      if (parts.length !== 5 || parts[0] !== 'ihub') {
        return { isValid: false, error: 'Invalid unique ID format. Must be: ihub/year/category/location/serial' };
      }

      // Check for placeholders
      if (parts.some(part => part === '--')) {
        return { isValid: false, error: 'Unique ID contains placeholders. Please fill all required fields.' };
      }

      // Check if unique ID already exists in the inventory items
      const existingItem = inventoryItems.find(item => item.uniqueid === uniqueId);

      if (existingItem) {
        return { isValid: false, error: `Unique ID "${uniqueId}" already exists in database` };
      }

      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  };

  // Function to get the next available serial number for a given prefix pattern
  const getNextSerialNumberForPrefix = (prefix: string): number => {
    // Find all existing items that match the prefix pattern
    const matchingItems = inventoryItems.filter(item => 
      item.uniqueid.startsWith(prefix)
    );
    
    if (matchingItems.length === 0) {
      return 1; // Start with 001 if no items exist
    }
    
    // Extract serial numbers from existing items
    const serialNumbers = matchingItems
      .map(item => {
        const parts = item.uniqueid.split('/');
        const serialPart = parts[parts.length - 1];
        return parseInt(serialPart, 10);
      })
      .filter(num => !isNaN(num))
      .sort((a, b) => a - b);
    
    // Find the next available number
    let nextNumber = 1;
    for (const num of serialNumbers) {
      if (num === nextNumber) {
        nextNumber++;
      } else {
        break;
      }
    }
    
    return nextNumber;
  };

  // Generate unique ID for multiple items
  const generateMultipleItemUniqueId = async (assetName: string, category: string, location: string, index: number): Promise<string> => {
    const { financialyear } = formData;
    
    // Always start with ihub prefix
    let uniqueId = 'ihub/';
    
    // Add financial year or placeholder
    if (financialyear) {
      uniqueId += financialyear;
    } else {
      uniqueId += '--';
    }
    uniqueId += '/';
    
    // Add asset code or placeholder
    if (assetName) {
      uniqueId += generateAssetCode(assetName);
    } else {
      uniqueId += '--';
    }
    uniqueId += '/';
    
    // Add location or placeholder
    if (location) {
      uniqueId += location;
    } else {
      uniqueId += '--';
    }
    uniqueId += '/';
    
    // Add serial number with proper database checking (allow serials even if asset name is blank)
    if (financialyear && location) {
      const codeOrPlaceholder = assetName ? generateAssetCode(assetName) : '--';
      const prefix = `ihub/${financialyear}/${codeOrPlaceholder}/${location}/`;
      const nextSerialNumber = getNextSerialNumberForPrefix(prefix);
      const serialNumber = (nextSerialNumber + index).toString().padStart(3, '0');
      uniqueId += serialNumber;
    } else {
      uniqueId += '--';
    }
    
    return uniqueId;
  };

  // Generate initial unique ID when component mounts
  React.useEffect(() => {
    const generateInitialId = async () => {
      if (!formData.uniqueid) {
        const initialId = await generateUniqueId();
        setFormData(prev => ({
          ...prev,
          uniqueid: initialId
        }));
      }
    };
    
    generateInitialId();
  }, []);

  // Update unique ID whenever relevant fields change
  React.useEffect(() => {
    const updateUniqueId = async () => {
      const newUniqueId = await generateUniqueId();
      if (newUniqueId !== formData.uniqueid) {
        setFormData(prev => ({
          ...prev,
          uniqueid: newUniqueId
        }));
      }
    };
    
    updateUniqueId();
  }, [formData.financialyear, formData.assetnamefromcategory, formData.assetname, formData.locationofitem, inventoryItems]);

  // Handle bulk upload
  const handleBulkUpload = async (data: any[]) => {
    try {
      const loadingToast = toast.loading(`Uploading ${data.length} items...`);
      const result = await bulkUploadInventory(data);
      toast.dismiss(loadingToast);
      
      if (result.success) {
        // Show success message
        toast.success(`Successfully uploaded ${result.successCount} items!`);
        
        // Refresh the inventory items (assuming you have a refresh function in context)
        // You might want to call a refresh function here to update the inventory list
        
        setActiveTab('single');
      } else {
        // Show error message with details
        let errorMessage = result.message;
        if (result.errors.length > 0) {
          errorMessage += '\n\nErrors:\n' + result.errors.map(err => `Row ${err.row}: ${err.error}`).join('\n');
        }
        toast.error(`Upload failed: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Bulk upload error:', error);
      toast.error('An unexpected error occurred during bulk upload. Please try again.');
    }
  };

  // Close financial year picker when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showFinancialYearPicker) {
        const target = event.target as HTMLElement;
        if (!target.closest('.financial-year-picker-container')) {
          setShowFinancialYearPicker(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFinancialYearPicker]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : parseFloat(value)) : value
    }));

    // Auto-calculate total cost
    if (name === 'rateinclusivetax') {
      const quantity = 1; // Fixed quantity since quantity field is removed
      const rate = value === '' ? 0 : parseFloat(value);
      
      const calculatedTotalCost = quantity * rate;
      const calculatedBalanceQuantityInStock = quantity;

      setFormData(prev => ({
        ...prev,
        totalcost: calculatedTotalCost,
        balancequantityinstock: calculatedBalanceQuantityInStock,
        quantityperitem: quantity // Keep quantityperitem in form data but fixed at 1
      }));
    }
  };

  // const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  //   
  //   const assetcategory = e.target.value;
  //   setFormData(prev => ({
  //     ...prev,
  //     assetcategory: assetcategory // Make sure this matches your form schema
  //   }));
  // };
const handleFile = (file?: File) => {
  if (file) {
    setFormData(prev => ({
      ...prev,
      attachments: [...(prev?.attachments || []), file],
    }));
    setUploadSuccess(true);
  }
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

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    
    const selectedName = e.target.value;

    // Find the full category object by name from available categories
    const selectedCategory = availableCategories.find(cat => cat.name === selectedName);

    if (selectedCategory) {
      setFormData(prev => ({
        ...prev,
        assetcategoryid: selectedCategory.id,  // ✅ store the ID
        assetcategory: selectedCategory.name,   // optional if needed for display
        assetnamefromcategory: '' // Reset asset name when category changes
      }));
    }
  };



  // const handleSubmit = async (e: React.FormEvent) => {
  //   
  //   e.preventDefault();
  //   setIsSubmitting(true);
  //   const payload: any = {
  //     ...formData,
  //     assetcategoryid: formData.assetcategoryid, // ✅ explicitly include ID
  //     dateofinvoice: formData.dateofinvoice || new Date(),
  //     dateofentry: formData.dateofentry,
  //     dateofissue: formData.dateofissue,
  //     expectedreturndate: formData.expectedreturndate,
  //     lastmodifiedby: user?.id || 'unknown',
  //     attachments: []
  //   };
  //   try {
  //     await addInventoryItem(payload);

  //     // Reset form
  //     setFormData({
  //       uniqueid: '',
  //       financialyear: '2024-25',
  //       dateofinvoice: null,
  //       dateofentry: new Date(),
  //       invoicenumber: '',
  //       assetcategory: '',
  //       assetcategoryid: '', // ✅ reset ID too
  //       assetname: '',
  //       specification: '',
  //       makemodel: '',
  //       productserialnumber: '',
  //       vendorname: '',
  //       quantityperitem: 1,
  //       rateinclusivetax: 0,
  //       totalcost: 0,
  //       locationofitem: 'Storage Room A',
  //       issuedto: '',
  //       dateofissue: null,
  //       expectedreturndate: null,
  //       balancequantityinstock: 0,
  //       description: '',
  //       unitofmeasurement: 'Pieces',
  //       depreciationmethod: 'written-down-value',
  //       warrantyinformation: '',
  //       maintenanceschedule: '',
  //       conditionofasset: 'excellent',
  //       status: 'available' as 'available' | 'issued' | 'maintenance' | 'retired',
  //       minimumstocklevel: 5,
  //       purchaseordernumber: '',
  //       expectedlifespan: '',
  //       annualmanagementcharge: 0
  //     });

  //     alert('Inventory item added successfully!');
  //   } catch (error) {
  //     alert('Error adding inventory item. Please try again.');
  //   }

  //   setIsSubmitting(false);
  // };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that unique ID is complete (no placeholders)
    if (formData.uniqueid.includes('--')) {
      toast.error('Please fill in all required fields (Financial Year, Asset Name, and Location) to generate a complete unique ID.');
      return;
    }
    
    // Validate unique ID format and uniqueness
    const validation = await validateUniqueId(formData.uniqueid);
    if (!validation.isValid) {
      toast.error(validation.error || 'Invalid unique ID');
      return;
    }
    
    setIsSubmitting(true);

  // Function to sanitize file names for storage
  const sanitizeFileName = (fileName: string): string => {
    // Remove or replace invalid characters for storage keys
    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscores
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .replace(/^_|_$/g, '') // Remove leading/trailing underscores
      .toLowerCase(); // Convert to lowercase for consistency
  };

  // Function to validate file types
  const validateFileType = (file: File): boolean => {
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff',
      'application/pdf',
      'text/plain', 'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint',
      'application/zip',
      'application/x-rar-compressed'
    ];
    return allowedTypes.includes(file.type);
  };

  // 1. Upload files to backend API
  const uploadedFiles: { name: string; url: string }[] = [];

  for (const file of formData.attachments || []) {
    // Validate file type
    if (!validateFileType(file)) {
      toast.error(`File type not supported: ${file.name}. Please upload images, PDFs, or documents.`);
      setIsSubmitting(false);
      return;
    }

    const sanitizedFileName = sanitizeFileName(file.name);
    
    console.log(`Uploading file: ${file.name}`);
    
    try {
      const uploadResult = await uploadAttachment({
        file: file,
        fileName: sanitizedFileName
      }).unwrap();

      if (uploadResult.success && uploadResult.data) {
        uploadedFiles.push({
          name: file.name,
          url: uploadResult.data.publicUrl,
        });
        console.log(`File uploaded successfully: ${file.name}`);
      } else {
        toast.error(`Failed to upload file: ${file.name}`);
        setIsSubmitting(false);
        return;
      }
    } catch (error) {
      console.error('File upload error:', error);
      toast.error(`Failed to upload file: ${file.name}`);
      setIsSubmitting(false);
      return;
    }
  }

  // 2. Build the payload
  const payload: any = {
    ...formData,
    assetcategoryid: formData.assetcategoryid,
    dateofinvoice: formData.dateofinvoice || new Date(),
    dateofentry: formData.dateofentry,
    dateofissue: formData.dateofissue,
    expectedreturndate: formData.expectedreturndate,
    lastmodifiedby: user?.id || 'unknown',
    attachments: uploadedFiles, // ✅ use uploaded URLs instead of raw files
  };

  let loadingToast: string | undefined;
  try {
    loadingToast = toast.loading('Creating inventory item...');
    await createInventoryItem(payload).unwrap();
    toast.dismiss(loadingToast);

    // 3. Reset form
    setFormData({
      uniqueid: '',
      financialyear: '2024-25',
      dateofinvoice: new Date(COMPANY_INFO.foundingYear, 0, 1),
      dateofentry: new Date(),
      invoicenumber: '',
      categorytype: '',
      assetcategory: '',
      assetcategoryid: "",
      assetname: '',
      assetnamefromcategory: '',
      specification: '',
      makemodel: '',
      productserialnumber: '',
      vendorname: '',
      quantityperitem: 1,
      rateinclusivetax: 0,
      totalcost: 0,
      locationofitem: 'Storage Room A',
      issuedto: '',
      dateofissue: null as Date | null,
      expectedreturndate: null as Date | null,
      balancequantityinstock: 0,
      description: '',
      unitofmeasurement: 'Pieces',
      depreciationmethod: 'written-down-value',
      warrantyinformation: '',
      maintenanceschedule: '',
      conditionofasset: 'excellent' as const,
      status: 'available' as 'available' | 'issued' | 'maintenance' | 'retired',
      minimumstocklevel: 5,
      purchaseordernumber: '',
      expectedlifespan: '',
                      salvagevalue: 0,
                      annualmanagementcharge: 0,
                      attachments: [] as File[],
    });

    toast.success('Inventory item created successfully!');
    
    // Clear saved form data after successful submission
    clearSavedFormData();
  } catch (error) {
    console.error(error);
    toast.dismiss(loadingToast);
    toast.error('Failed to create inventory item. Please try again.');
  }

  setIsSubmitting(false);
};


  


  const availableCategories = categories?.filter((cat: any) => cat.isactive);
  
  // Filter categories based on selected type
  const filteredCategories = formData?.categorytype 
    ? availableCategories?.filter((cat: any) => cat.type === formData.categorytype)
    : availableCategories;
  
  const units = ['Pieces', 'Kg', 'Liters', 'Meters', 'Sets', 'Boxes'];
  const conditions = ['excellent', 'good', 'fair', 'poor', 'damaged'];
  const statuses = ['available', 'issued', 'maintenance', 'retired'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add Inventory</h1>
          <p className="mt-1 text-gray-600">Add new assets to your inventory system</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl">
        <div className="border-b border-gray-200">
          <nav className="flex px-6 space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('single')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'single'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Plus className="w-4 h-4 text-green-500" />
                <span>Add Single Item</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('multi')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'multi'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <List className="w-4 h-4 text-indigo-500" />
                <span>Add Multiple Items</span>
              </div>
            </button>
            {(user?.role === 'admin' || user?.role === 'stock-manager') && (
              <button
                onClick={() => setActiveTab('bulk')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'bulk'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Upload className="w-4 h-4 text-blue-500" />
                  <span>Bulk Upload</span>
                </div>
              </button>
            )}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'single' ? (
            /* Single Item Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Asset Information Section */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-[#0d559e] to-[#1a6bb8]">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Asset Information</h2>
                  </div>
                </div>

                <div className="p-6 space-y-8">
          {/* Basic Information */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="flex items-center mb-2 text-sm font-medium text-gray-700">
                <span>Unique ID *</span>
                <span className="px-2 py-1 ml-2 text-xs text-blue-800 bg-blue-100 rounded-full">Auto-Generated</span>
              </label>
              <p className="mb-2 text-xs text-gray-500">
                Sequential numbering: 001, 002, 003... (Total items: {inventoryItems.length + 1})
              </p>
              <div className="relative">
                <input
                  type="text"
                  name="uniqueid"
                  value={formData.uniqueid}
                  readOnly
                  required
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg cursor-not-allowed bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Will be generated automatically..."
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <Package className="w-4 h-4 text-gray-400" />
                </div>
              </div>
              {formData.uniqueid && (
                <div className="p-2 mt-2 border border-blue-200 rounded-md bg-gradient-to-r from-[#0d559e]/10 to-[#1a6bb8]/10">
                  <div className="mb-2 text-xs font-medium text-blue-600">🔄 Real-time ID Generation:</div>
                  <div className="mt-1 space-y-1 text-xs text-gray-700">
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="px-2 py-1 font-mono font-semibold text-blue-600 bg-white border border-gray-200 rounded">ihub</span>
                      <span className="text-gray-400">/</span>
                      <span className={`font-mono px-2 py-1 rounded border ${
                        formData.financialyear 
                          ? 'bg-green-100 border-green-300 text-green-700' 
                          : 'bg-red-100 border-red-300 text-red-500'
                      }`}>
                        {formData.financialyear || '--'}
                      </span>
                      <span className="text-gray-400">/</span>
                      <span className={`font-mono px-2 py-1 rounded border ${
                        (formData.assetnamefromcategory || formData.assetname)
                          ? 'bg-green-100 border-green-300 text-green-700' 
                          : 'bg-red-100 border-red-300 text-red-500'
                      }`}>
                        {generateAssetCode(formData.assetnamefromcategory || formData.assetname) || '--'}
                      </span>
                      <span className="text-gray-400">/</span>
                      <span className={`font-mono px-2 py-1 rounded border ${
                        formData.locationofitem 
                          ? 'bg-green-100 border-green-300 text-green-700' 
                          : 'bg-red-100 border-red-300 text-red-500'
                      }`}>
                        {formData.locationofitem || '--'}
                      </span>
                      <span className="text-gray-400">/</span>
                      <span className={`font-mono px-2 py-1 rounded border ${
                        formData.financialyear && formData.assetname && formData.locationofitem
                          ? 'bg-green-100 border-green-300 text-green-700' 
                          : 'bg-red-100 border-red-300 text-red-500'
                      }`}>
                        {formData.uniqueid.split('/').pop()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Progress indicator */}
                  <div className="flex items-center mt-2 space-x-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-2 transition-all duration-300 rounded-full bg-gradient-to-r from-[#0d559e] to-[#1a6bb8]"
                        style={{ 
                          width: `${[
                            formData.financialyear,
                            formData.assetnamefromcategory || formData.assetname,
                            formData.locationofitem
                          ].filter(Boolean).length * 25 + 25}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium text-gray-500">
                      {[formData.financialyear, formData.assetnamefromcategory || formData.assetname, formData.locationofitem].filter(Boolean).length + 1}/4 Complete
                    </span>
                  </div>
                  
                  {/* Missing fields reminder */}
                  {(!formData.financialyear || !(formData.assetnamefromcategory || formData.assetname) || !formData.locationofitem) && (
                    <div className="mt-2 text-xs text-amber-600">
                      ⚠️ Missing: {[
                        !formData.financialyear && 'Financial Year',
                        !(formData.assetnamefromcategory || formData.assetname) && 'Asset Name',
                        !formData.locationofitem && 'Location'
                      ].filter(Boolean).join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Financial Year *
              </label>
              <div className="relative financial-year-picker-container">
                <input
                  type="text"
                  name="financialyear"
                  value={formData.financialyear}
                  onClick={() => setShowFinancialYearPicker(true)}
                  readOnly
                  required
                  className="w-full px-4 py-2 pr-10 bg-white border border-gray-300 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Select Financial Year"
                />
                <div 
                  className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                  onClick={() => setShowFinancialYearPicker(true)}
                >
                  <CalendarIcon className="w-4 h-4 text-gray-400" />
                </div>
                
                {/* Financial Year Picker Dropdown */}
                {showFinancialYearPicker && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                    <div className="p-4">
                      <div className="mb-3 text-sm font-medium text-gray-700">Select a date to determine Financial Year</div>
                      <div className="p-2 border border-gray-200 rounded-md">
                        <CustomDatePicker
                          selected={new Date()}
                          onChange={(date: Date | null) => {
                            if (date) {
                              const financialYear = getFinancialYearFromDate(date);
                              setFormData(prev => ({
                                ...prev,
                                financialyear: financialYear
                              }));
                              setShowFinancialYearPicker(false);
                            }
                          }}
                        />
                      </div>
                      <div className="pt-3 mt-3 border-t border-gray-200">
                        <div className="mb-2 text-xs text-gray-600">Or choose from recent years:</div>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            '2024-25',
                            '2025-26',
                            '2026-27',
                            '2027-28'
                          ].map(year => (
                            <button
                              key={year}
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  financialyear: year
                                }));
                                setShowFinancialYearPicker(false);
                              }}
                              className="px-3 py-2 text-sm transition-colors border border-gray-300 rounded-md hover:bg-blue-50 hover:border-blue-300"
                            >
                              {year}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-end pt-3 mt-3 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() => setShowFinancialYearPicker(false)}
                          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                📅 Click to select date or choose from preset years • Currently: <span className="font-semibold text-blue-600">{formData.financialyear}</span>
              </p>
            </div>

            <div>
              <CategoryTypeDropdown
                label="  Asset Type *"
                value={formData.categorytype}
                onChange={handleCategoryTypeChange}
                required
                placeholder="Choose Major or Minor"
              />
            </div>

            {formData.categorytype && (
              <div>
                <CategoryDropdown
                  label={`Category Type *  (${formData.categorytype === 'major' ? 'Major' : 'Minor'})`}
                  categories={filteredCategories}
                  value={formData.assetcategory}
                  onChange={(value) => {
                    const category = filteredCategories.find(cat => cat.name === value);
                    setFormData(prev => ({
                      ...prev,
                      assetcategory: value,
                      assetcategoryid: category?.id || ""
                    }));
                  }}
                  required
                  placeholder={`Select ${formData.categorytype === 'major' ? 'Major' : 'Minor'} Category`}
                  searchable
                />
              </div>
            )}



            {formData.assetcategory && (
              <div>
                <AssetNameDropdown
                  label={`Asset Name * (${formData.categorytype === 'major' ? 'Major' : 'Minor'})`}
                  categories={filteredCategories}
                  categoryType={formData.categorytype}
                  assetCategory={formData.assetcategory}
                  value={formData.assetnamefromcategory}
                  onChange={(value) => {
                    setFormData(prev => ({
                      ...prev,
                      assetnamefromcategory: value,
                      assetname: value // Also update the main assetname field
                    }));
                  }}
                  required
                  placeholder="Select asset name from category"
                  searchable
                />
                <p className="mt-1 text-xs text-gray-500">
                  🔤 First 3 letters will be used as asset code: <span className="font-mono font-semibold text-blue-600">{generateAssetCode(formData.assetnamefromcategory || formData.assetname) || 'XXX'}</span>
                </p>
                {/* Debug info */}
                <div className="mt-2 text-xs text-gray-400">
                  Debug: Category Type: {formData.categorytype}, Asset Category: {formData.assetcategory}, 
                  Filtered Categories: {filteredCategories.length}
                </div>
              </div>
            )}

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Make/Model
              </label>
              <input
                type="text"
                name="makemodel"
                value={formData.makemodel}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Dell Inspiron 15"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Serial Number
              </label>
              <input
                type="text"
                name="productserialnumber"
                value={formData.productserialnumber}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Invoice Information */}
          <div className="pt-6 border-t border-gray-200">
            <div className="flex items-center mb-4 space-x-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-[#0d559e] to-[#1a6bb8]">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Invoice Details</h3>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Invoice Number
                </label>
                <input
                  type="text"
                  name="invoicenumber"
                  value={formData.invoicenumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Date of Invoice
                </label>
                <CustomDatePicker
                  selected={formData.dateofinvoice}
                  onChange={(date) => setFormData(prev => ({ ...prev, dateofinvoice: getValidInventoryDate(date || undefined) }))}
                  placeholder="Select invoice date"
                  minDate={new Date(COMPANY_INFO.foundingYear, 0, 1)}
                  maxDate={new Date()}
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Date of Entry
                </label>
                <CustomDatePicker
                  selected={formData.dateofentry}
                  onChange={(date) => setFormData(prev => ({ ...prev, dateofentry: getValidInventoryDate(date || undefined) || new Date() }))}
                  placeholder="Select entry date"
                  minDate={new Date(COMPANY_INFO.foundingYear, 0, 1)}
                  maxDate={new Date()}
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Vendor Name
                </label>
                <input
                  type="text"
                  name="vendorname"
                  value={formData.vendorname}
                  onChange={handleInputChange}
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
                  value={formData.purchaseordernumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="pt-6 border-t border-gray-200">
            <div className="flex items-center mb-4 space-x-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-[#0d559e] to-[#1a6bb8]">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Financial Details</h3>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">

              <div>
                <UnitDropdown
                  label="Unit of Measurement"
                  value={formData.unitofmeasurement}
                  onChange={(value) => setFormData(prev => ({
                    ...prev,
                    unitofmeasurement: value
                  }))}
                  placeholder="Select unit"
                  searchable
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Rate (Inclusive Tax)
                </label>
                <input
                  type="number"
                  name="rateinclusivetax"
                  value={formData.rateinclusivetax}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  value={formData.totalcost}
                  readOnly
                  className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg bg-gray-50"
                  placeholder="Calculated automatically"
                />
              </div>
            </div>
          </div>

          {/* Location and Status */}
          <div className="pt-6 border-t border-gray-200">
            <div className="flex items-center mb-4 space-x-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-[#0d559e] to-[#1a6bb8]">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Location & Status</h3>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <LocationDropdown
                  label="Location *"
                  inventoryItems={inventoryItems}
                  value={formData.locationofitem}
                  onChange={(value) => setFormData(prev => ({
                    ...prev,
                    locationofitem: value
                  }))}
                  required
                  placeholder="Storage Room A"
                  searchable
                  disabled
                />
                <p className="mt-1 text-xs text-gray-500">
                  📍 Used as-is in unique ID (Default: Storage Room A)
                </p>
              </div>

              <div>
                <ConditionDropdown
                  label="Condition"
                  value={formData.conditionofasset}
                  onChange={(value) => setFormData(prev => ({
                    ...prev,
                    conditionofasset: value as any
                  }))}
                  placeholder="Select condition"
                  disabled
                />
                <p className="mt-1 text-xs text-gray-500">
                  ✅ Default: Excellent condition
                </p>
              </div>

              {/* Status Dropdown */}
              <div>
                <StatusDropdown
                  label="Status"
                  value={formData.status}
                  onChange={(value) => setFormData(prev => ({
                    ...prev,
                    status: value as any
                  }))}
                  type="inventory"
                  placeholder="Select status"
                  disabled
                />
                <p className="mt-1 text-xs text-gray-500">
                  ✅ Default: Available for use
                </p>
              </div>
              {/* <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Minimum Stock Level
                </label>
                <input
                  type="number"
                  name="minimumstocklevel"
                  value={formData.minimumstocklevel}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 5"
                />
              </div> */}

              {formData.status === "issued" && (         <>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Issued To
                  </label>
                  <input
                    type="text"
                    name="issuedto"
                    value={formData.issuedto || ""}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Rohit Kumar"
                  />
                </div>
               
                 <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                 Date of Issue
                </label>
                <CustomDatePicker
                  selected={formData.dateofissue}
                  onChange={(date) => setFormData(prev => ({ ...prev, dateofissue: date || new Date() }))}
                  placeholder="Select issue date"
                  maxDate={new Date()}
                />
              </div>

               <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Expected Return Date
                  </label>
                  <CustomDatePicker
                    selected={formData.expectedreturndate}
                    onChange={(date) => setFormData(prev => ({ ...prev, expectedreturndate: date || new Date() }))}
                    placeholder="Select return date"
                    minDate={new Date()}
                  />
                  </div>
     </>)}



            </div>
          </div>

          {/* Additional Information */}
          <div className="pt-6 border-t border-gray-200">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Additional Information</h3>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Specification
                </label>
                <textarea
                  name="specification"
                  value={formData.specification}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Technical specifications..."
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Description/Purpose
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Purpose and description..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mt-6 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Warranty Information
                </label>
                <input
                  type="text"
                  name="warrantyinformation"
                  value={formData.warrantyinformation}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 3 years"
                />
              </div>

              {/* <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Expected Lifespan
                </label>
                <input
                  type="text"
                  name="expectedlifespan"
                  value={formData.expectedlifespan}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 5 years"
                />
              </div> */}

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

            </div>

            {/* Depreciation Section */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex items-center mb-4 space-x-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-[#0d559e] to-[#1a6bb8]">
                  <TrendingDown className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Depreciation Information</h3>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
                <div>
                  <DepreciationMethodDropdown
                    label="Depreciation Method"
                    value={formData.depreciationmethod}
                    onChange={(value) => setFormData(prev => ({
                      ...prev,
                      depreciationmethod: value
                    }))}
                    placeholder="Select depreciation method"
                    disabled
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    📊 Default: Written-Down Value (WDV) method
                  </p>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Useful Life (Years)
                  </label>
                  <input
                    type="number"
                    name="expectedlifespan"
                    value={formData.expectedlifespan}
                    onChange={handleInputChange}
                    min="1"
                    max="50"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    value={formData.salvagevalue || ''}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 1000.00"
                  />
                </div>
              </div>

             
              {formData.depreciationmethod && formData.expectedlifespan && formData.rateinclusivetax > 0 && (
                <div className="mt-6">
                  <DepreciationCalculator
                    assetValue={formData.rateinclusivetax}
                    salvageValue={formData.salvagevalue || 0}
                    usefulLife={Number(formData.expectedlifespan)}
                    purchaseDate={formData.dateofinvoice || new Date()}
                    method={formData.depreciationmethod as 'written-down-value'}
                    onCalculate={(depreciation: any) => {
                      console.log('Depreciation calculated:', depreciation);
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* <div className="pt-6 border-t border-gray-200">
            <div className="flex items-center mb-4 space-x-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-[#0d559e] to-[#1a6bb8]">
                <Image className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Upload Your File</h3>
            </div>
            <div className="pt-6 border-t border-gray-200">
             
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Upload Your File
              </label>

              <UploadDropzone
                label="Upload Files"
                subtext="Accepted: Images, PDFs, Documents, Archives"
                acceptedTypes="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.ppt,.pptx,.zip,.rar"
                height="h-20"
                onFileChange={handleFile}
              />
            </div>
          </div> */}
        </div>
      </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end pt-6 space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      uniqueid: '',
                      financialyear: '2024-25',
                      dateofinvoice: new Date(COMPANY_INFO.foundingYear, 0, 1),
                      dateofentry: new Date(),
                      invoicenumber: '',
                      categorytype: '',
                      assetcategory: '',
                      assetcategoryid: "",
                      assetname: '',
                      assetnamefromcategory: '',
                      specification: '',
                      makemodel: '',
                      productserialnumber: '',
                      vendorname: '',
                      quantityperitem: 1,
                      rateinclusivetax: 0,
                      totalcost: 0,
                      locationofitem: 'Storage Room A',
                      issuedto: '',
                      dateofissue: null,
                      expectedreturndate: null,
                      balancequantityinstock: 0,
                      description: '',
                      unitofmeasurement: 'Pieces',
                      depreciationmethod: 'written-down-value',
                      warrantyinformation: '',
                      maintenanceschedule: '',
                      conditionofasset: 'excellent',
                      status: 'available',
                      minimumstocklevel: 5,
                      purchaseordernumber: '',
                      expectedlifespan: '',
                      salvagevalue: 0,
                      annualmanagementcharge: 0,
                      attachments: [],
                    });
                    clearSavedFormData();
                  }}
                  className="flex items-center px-6 py-2 space-x-2 text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <X size={16} className="text-red-500" />
                  <span>Clear Form</span>
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center px-6 py-2 space-x-2 text-white transition-all duration-200 rounded-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={16} className="text-green-500" />
                  <span>{isSubmitting ? 'Adding...' : 'Add Item'}</span>
                </button>
              </div>
            </form>
          ) : activeTab === 'multi' ? (
            /* Multiple Items Form */
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-[#0d559e] to-[#1a6bb8]">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Add Multiple Items</h2>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {multipleItems.map((it, idx) => (
                    <div key={idx} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-700">Item #{idx + 1}</h4>
                        {multipleItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setMultipleItems(prev => prev.filter((_, i) => i !== idx))}
                            className="px-3 py-1.5 text-sm border border-red-300 rounded-md text-red-700 hover:bg-red-50"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      
                      {/* Asset Type Selection */}
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center mb-2 space-x-2">
                          <Package className="w-4 h-4 text-blue-600" />
                          <h4 className="text-sm font-semibold text-blue-800">Asset Classification</h4>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                          <div>
                            <CategoryTypeDropdown
                              label="Asset Type *"
                              value={it.categorytype}
                              onChange={(value) => {
                                setMultipleItems(prev => prev.map((row, i) => i === idx ? { 
                                  ...row, 
                                  categorytype: value,
                                  assetcategory: '', // Reset category when type changes
                                  assetcategoryid: '', // Reset category ID when type changes
                                  assetnamefromcategory: '', // Reset asset name when type changes
                                  assetname: '', // Reset asset name when type changes
                                  uniqueid: '' // Reset unique ID when type changes
                                } : row));
                              }}
                              required
                              placeholder="Choose Major or Minor"
                            />
                          </div>

                          {it.categorytype && (
                            <div>
                              <CategoryDropdown
                                label={`Category * (${it.categorytype === 'major' ? 'Major' : 'Minor'})`}
                                categories={availableCategories?.filter((cat: any) => cat.type === it.categorytype) || []}
                                value={it.assetcategory}
                                onChange={async (value) => {
                                  const category = availableCategories?.find(cat => cat.name === value);
                                  setMultipleItems(prev => prev.map((row, i) => i === idx ? { 
                                    ...row, 
                                    assetcategory: value, 
                                    assetcategoryid: category?.id || '',
                                    assetnamefromcategory: '', // Reset asset name when category changes
                                    assetname: '', // Reset asset name when category changes
                                    uniqueid: '' // Reset unique ID when category changes
                                  } : row));
                                }}
                                required
                                placeholder={`Select ${it.categorytype === 'major' ? 'Major' : 'Minor'} Category`}
                                searchable
                              />
                            </div>
                          )}

                          {it.assetcategory && (
                            <div>
                              <AssetNameDropdown
                                label={`Asset Name * (${it.categorytype === 'major' ? 'Major' : 'Minor'})`}
                                categories={availableCategories || []}
                                categoryType={it.categorytype}
                                assetCategory={it.assetcategory}
                                value={it.assetnamefromcategory}
                                onChange={async (value) => {
                                  setMultipleItems(prev => prev.map((row, i) => i === idx ? { 
                                    ...row, 
                                    assetnamefromcategory: value,
                                    assetname: value // Set assetname from dropdown selection
                                  } : row));
                                  
                                  // Update unique ID when asset name changes
                                  if (value && it.assetcategory && formData.locationofitem) {
                                    const newUniqueId = await generateMultipleItemUniqueId(value, it.assetcategory, formData.locationofitem, idx);
                                    setMultipleItems(prev => prev.map((row, i) => i === idx ? { ...row, uniqueid: newUniqueId } : row));
                                  }
                                }}
                                required
                                placeholder={`Select ${it.categorytype === 'major' ? 'Major' : 'Minor'} Asset Name`}
                                searchable
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Basic Information */}
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <label className="flex items-center mb-1 text-sm font-medium text-gray-700">
                            <span>Unique ID *</span>
                            <span className="px-2 py-1 ml-2 text-xs text-blue-800 bg-blue-100 rounded-full">Auto-Generated</span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={it.uniqueid}
                              readOnly
                              required
                              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg cursor-not-allowed bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Will be generated automatically..."
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                              <Package className="w-4 h-4 text-gray-400" />
                            </div>
                          </div>
                          {it.uniqueid && (
                            <div className="p-2 mt-2 border border-blue-200 rounded-md bg-gradient-to-r from-[#0d559e]/10 to-[#1a6bb8]/10">
                              <div className="text-xs font-mono text-blue-600">{it.uniqueid}</div>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block mb-1 text-sm font-medium text-gray-700">Make/Model</label>
                          <input
                            type="text"
                            value={it.makemodel}
                            onChange={(e) => {
                              const v = e.target.value;
                              setMultipleItems(prev => prev.map((row, i) => i === idx ? { ...row, makemodel: v } : row));
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., Dell Inspiron 15"
                          />
                        </div>

                        <div>
                          <label className="block mb-1 text-sm font-medium text-gray-700">Serial Number</label>
                          <input
                            type="text"
                            value={it.productserialnumber}
                            onChange={(e) => {
                              const v = e.target.value;
                              setMultipleItems(prev => prev.map((row, i) => i === idx ? { ...row, productserialnumber: v } : row));
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., ABC123456"
                          />
                        </div>

                        <div>
                          <label className="block mb-1 text-sm font-medium text-gray-700">Vendor Name</label>
                          <input
                            type="text"
                            value={it.vendorname}
                            onChange={(e) => {
                              const v = e.target.value;
                              setMultipleItems(prev => prev.map((row, i) => i === idx ? { ...row, vendorname: v } : row));
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., Dell India"
                          />
                        </div>
                      </div>

                      {/* Financial Information */}
                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex items-center mb-3 space-x-2">
                          <DollarSign className="w-4 h-4 text-gray-600" />
                          <h4 className="text-sm font-semibold text-gray-700">Financial Details</h4>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                          <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Rate (Incl. Tax) *</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={it.rateinclusivetax}
                              onChange={(e) => {
                                const rate = parseFloat(e.target.value || '0');
                                const quantity = it.quantity || 1;
                                setMultipleItems(prev => prev.map((row, i) => i === idx ? { ...row, rateinclusivetax: rate, totalcost: rate * quantity } : row));
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="e.g., 1500.00"
                              required
                            />
                          </div>

                       

                          <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Total Cost</label>
                            <input
                              type="number"
                              value={it.totalcost}
                              readOnly
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Additional Information */}
                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex items-center mb-3 space-x-2">
                          <Package className="w-4 h-4 text-gray-600" />
                          <h4 className="text-sm font-semibold text-gray-700">Additional Details</h4>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Expected Lifespan (Years)</label>
                            <input
                              type="number"
                              min="1"
                              max="50"
                              value={it.expectedlifespan}
                              onChange={(e) => {
                                const v = e.target.value;
                                setMultipleItems(prev => prev.map((row, i) => i === idx ? { ...row, expectedlifespan: v } : row));
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="e.g., 5"
                            />
                          </div>

                          <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Salvage Value (₹)</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={it.salvagevalue}
                              onChange={(e) => {
                                const v = parseFloat(e.target.value || '0');
                                setMultipleItems(prev => prev.map((row, i) => i === idx ? { ...row, salvagevalue: v } : row));
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="e.g., 1000.00"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setRowsToAdd('1');
                        setDistributeRateAcrossRows(true);
                        setShowAddRowsModal(true);
                      }}
                      className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
                    >
                      + Add Row
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (multipleItems.some(mi => !mi.assetname || !mi.assetcategoryid || mi.rateinclusivetax <= 0 || !mi.uniqueid)) {
                          toast.error('Please complete all rows and ensure unique IDs are generated before submitting.');
                          return;
                        }
                        
                        const loadingToast = toast.loading('Creating items...');
                        try {
                          // Create all items (each row is now an individual item)
                          await Promise.all(multipleItems.map(async (mi) => {
                            const payload: any = {
                              ...formData,
                              uniqueid: mi.uniqueid,
                              assetname: mi.assetname,
                              assetcategory: mi.assetcategory,
                              assetcategoryid: mi.assetcategoryid,
                              makemodel: mi.makemodel,
                              productserialnumber: mi.productserialnumber,
                              vendorname: mi.vendorname,
                              rateinclusivetax: mi.rateinclusivetax,
                              totalcost: mi.totalcost,
                              balancequantityinstock: 1,
                              status: mi.status,
                              conditionofasset: mi.conditionofasset,
                              depreciationmethod: mi.depreciationmethod,
                              expectedlifespan: mi.expectedlifespan,
                              salvagevalue: mi.salvagevalue,
                              dateofinvoice: mi.dateofinvoice,
                              dateofentry: mi.dateofentry,
                              attachments: [],
                            };
                            await createInventoryItem(payload).unwrap();
                          }));
                          
                          toast.dismiss(loadingToast);
                          toast.success(`Successfully created ${multipleItems.length} items!`);
                          
                          // Reset form
                        setMultipleItems([{ 
                          uniqueid: '', 
                          assetname: '', 
                          assetnamefromcategory: '',
                          categorytype: formData.categorytype, 
                          assetcategory: '', 
                          assetcategoryid: '', 
                          makemodel: '',
                            productserialnumber: '', 
                            vendorname: '', 
                            rateinclusivetax: 0, 
                            totalcost: 0, 
                            quantity: 1, 
                            status: 'available', 
                            conditionofasset: 'excellent', 
                            depreciationmethod: 'written-down-value', 
                            expectedlifespan: '', 
                            salvagevalue: 0, 
                            dateofinvoice: new Date(), 
                            dateofentry: new Date() 
                          }]);
                        } catch (err) {
                          console.error(err);
                          toast.dismiss(loadingToast);
                          toast.error('Failed to create one or more items');
                        }
                      }}
                      className="px-4 py-2 text-sm rounded-lg text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                    >
                      Create Items
                    </button>
                  </div>
                </div>
              {showAddRowsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                  <div className="w-full max-w-md p-5 bg-white border border-gray-200 rounded-xl shadow-xl">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">Add Multiple Rows</h3>
                      <button
                        type="button"
                        onClick={() => setShowAddRowsModal(false)}
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">How many rows to add?</label>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={rowsToAdd}
                          onChange={(e) => setRowsToAdd(e.target.value.replace(/[^0-9]/g, ''))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., 4"
                        />
                        <p className="mt-1 text-xs text-gray-500">Adds this many new rows using the last row as a template.</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          id="distributeRate"
                          type="checkbox"
                          checked={distributeRateAcrossRows}
                          onChange={(e) => setDistributeRateAcrossRows(e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                        />
                        <label htmlFor="distributeRate" className="text-sm text-gray-700">
                          Divide last row's Rate (Inclusive Tax) equally across current + new rows
                        </label>
                      </div>
                    </div>
                    <div className="flex items-center justify-end mt-5 space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowAddRowsModal(false)}
                        className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const count = Math.max(1, Math.min(100, parseInt(rowsToAdd || '1', 10)));
                          if (multipleItems.length === 0) {
                            // If no rows exist, just add count rows of empty templates
                            const newRows = Array.from({ length: count }).map(() => ({
                              uniqueid: '',
                              assetname: '',
                              assetnamefromcategory: '',
                              categorytype: formData.categorytype,
                              assetcategory: '',
                              assetcategoryid: '',
                              makemodel: '',
                              productserialnumber: '',
                              vendorname: '',
                              rateinclusivetax: 0,
                              totalcost: 0,
                              quantity: 1,
                              status: 'available' as 'available',
                              conditionofasset: 'excellent' as 'excellent',
                              depreciationmethod: 'written-down-value',
                              expectedlifespan: '',
                              salvagevalue: 0,
                              dateofinvoice: new Date(),
                              dateofentry: new Date()
                            }));
                            setMultipleItems(newRows);
                            setShowAddRowsModal(false);
                            return;
                          }
                          const template = multipleItems[multipleItems.length - 1];
                          const divisor = distributeRateAcrossRows ? (count + 1) : 1;
                          const baseRate = template.rateinclusivetax || 0;
                          // Helper to distribute cents exactly
                          const distributeRates = (total: number, parts: number): number[] => {
                            if (parts <= 0) return [];
                            const totalCents = Math.round(total * 100);
                            const base = Math.floor(totalCents / parts);
                            let remainder = totalCents - base * parts;
                            const arr = Array(parts).fill(base);
                            for (let i = 0; i < arr.length && remainder > 0; i++) {
                              arr[i] += 1;
                              remainder -= 1;
                            }
                            return arr.map(c => c / 100);
                          };
                          let perRates: number[] = [];
                          if (distributeRateAcrossRows && baseRate > 0) {
                            perRates = distributeRates(baseRate, divisor);
                          }
                          (async () => {
                            const asset = template.assetname;
                            const category = template.assetcategory;
                            const loc = formData.locationofitem;
                            const updated = [...multipleItems];
                            // Ensure template has a unique ID first
                            if (!template.uniqueid) {
                              const newId = await generateMultipleItemUniqueId(asset, category, loc, 0);
                              updated[updated.length - 1] = { ...template, uniqueid: newId };
                            }
                            // Build new rows with generated unique IDs in sequence
                            const newRows = await Promise.all(
                              Array.from({ length: count }).map(async (_v, i) => {
                                const newId = await generateMultipleItemUniqueId(asset, category, loc, i + 1);
                                const rate = (distributeRateAcrossRows && baseRate > 0) ? perRates[i + 1] : template.rateinclusivetax;
                                return {
                                  uniqueid: newId,
                                  assetname: template.assetname,
                                  assetnamefromcategory: template.assetnamefromcategory,
                                  categorytype: template.categorytype || formData.categorytype,
                                  assetcategory: template.assetcategory,
                                  assetcategoryid: template.assetcategoryid,
                                  makemodel: template.makemodel,
                                  productserialnumber: '',
                                  vendorname: template.vendorname,
                                  rateinclusivetax: rate,
                                  totalcost: rate,
                                  quantity: 1,
                                  status: template.status,
                                  conditionofasset: template.conditionofasset,
                                  depreciationmethod: template.depreciationmethod,
                                  expectedlifespan: template.expectedlifespan,
                                  salvagevalue: template.salvagevalue,
                                  dateofinvoice: template.dateofinvoice || new Date(),
                                  dateofentry: template.dateofentry || new Date()
                                };
                              })
                            );
                            if (distributeRateAcrossRows && baseRate > 0) {
                              const newTemplateRate = perRates[0];
                              const currentTemplate = updated[updated.length - 1];
                              updated[updated.length - 1] = {
                                ...currentTemplate,
                                rateinclusivetax: newTemplateRate,
                                totalcost: newTemplateRate
                              };
                            }
                            setMultipleItems([...updated, ...newRows]);
                            setShowAddRowsModal(false);
                          })();
                        }}
                        className="px-4 py-2 text-sm text-white rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}
              </div>
            </div>
          ) : (
            /* Bulk Upload Tab */
            <BulkUpload
              onUpload={handleBulkUpload}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AddInventory;