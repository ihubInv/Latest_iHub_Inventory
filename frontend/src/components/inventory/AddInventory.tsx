import React, { useState } from 'react';
import { 
  useCreateInventoryItemMutation,
  useGetCategoriesQuery,
  useGetInventoryItemsQuery,
  useUploadInventoryAttachmentMutation,
  useGetNextSerialPreviewQuery
} from '../../store/api';
import { useAppSelector } from '../../store/hooks';
import CustomDatePicker from '../common/DatePicker';
import { Save, X, Package, Calendar, DollarSign, MapPin, TrendingDown, Upload, Plus, List } from 'lucide-react';
import { usePersistedFormState } from '../../hooks/usePersistedState';

// import UploadDropzone from '../common/UploadDropzone';
import { COMPANY_INFO, getValidInventoryDate, getCurrentFinancialYear } from '../../constants/companyInfo';
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
import FinancialYearDropdown from '../common/FinancialYearDropdown';
import BulkUpload from './BulkUpload';
import { bulkUploadInventory } from '../../services/bulkUploadService';

const AddInventory: React.FC = () => {
  const [createInventoryItem] = useCreateInventoryItemMutation();
  const [uploadAttachment] = useUploadInventoryAttachmentMutation();
  const { data: categoriesResponse, refetch: refetchCategories } = useGetCategoriesQuery({});
  const categories = categoriesResponse?.data || [];
  // Fetch all inventory items (no pagination) for accurate prefix-based counting
  const { data: inventoryResponse, refetch: refetchInventoryItems } = useGetInventoryItemsQuery({ 
    limit: 10000, // Fetch all items to ensure accurate prefix-based serial number calculation
    page: 1 
  });
  const inventoryItems = inventoryResponse?.data || [];
  const totalItemsCount = inventoryResponse?.total || inventoryItems.length;
  
  // Get next serial number preview - refetch when inventory items change
  const { data: serialPreviewResponse, refetch: refetchSerialPreview } = useGetNextSerialPreviewQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });
  const nextSerialNumber = serialPreviewResponse?.data?.nextSerialFormatted || '001';
  
  // Track if we need to refetch (only after successful submission)
  const [shouldRefetch, setShouldRefetch] = React.useState(false);
  const { user } = useAppSelector((state) => state.auth);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
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
    specification: string;
    description: string;
    dateofinvoice: Date | null;
    dateofentry: Date | null;
  }>>([
    { uniqueid: '', assetname: '', assetnamefromcategory: '', categorytype: '', assetcategory: '', assetcategoryid: '', makemodel: '', productserialnumber: '', vendorname: '', rateinclusivetax: 0, totalcost: 0, quantity: 1, status: 'available', conditionofasset: 'excellent', depreciationmethod: 'written-down-value', expectedlifespan: '', salvagevalue: 0, specification: '', description: '', dateofinvoice: new Date(), dateofentry: new Date() }
  ]);

  // Get current financial year
  const currentFY = getCurrentFinancialYear();

  // Initialize form data with persistent state
  const defaultFormData = {
    uniqueid: '',
    financialyear: currentFY,
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

  // Extract serial number from unique ID (last segment after the last '/')
  // This is used to auto-populate the Serial Number field from the Unique ID
  const extractSerialNumberFromUniqueId = (uniqueId: string): string => {
    if (!uniqueId) return '';
    const parts = uniqueId.split('/');
    return parts.length > 0 ? parts[parts.length - 1] : '';
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
    
    // Serial number will be generated by backend with global counter
    // Show the next expected serial number (total count + 1) as preview
    uniqueId += nextSerialNumber;
    
    return uniqueId.toUpperCase();
  };

  // Enhanced unique ID validation
  const validateUniqueId = async (uniqueId: string): Promise<{ isValid: boolean; error?: string }> => {
    try {
      if (!uniqueId || typeof uniqueId !== 'string') {
        return { isValid: false, error: 'Unique ID is required' };
      }

      // Normalize to uppercase for comparison
      const normalizedId = uniqueId.toUpperCase().trim();
      
      // Check if unique ID follows the correct format
      const parts = normalizedId.split('/');
      if (parts.length !== 5 || parts[0] !== 'IHUB') {
        return { isValid: false, error: 'Invalid unique ID format. Must be: iHUB/year/category/location/serial' };
      }

      // Check for placeholders (serial number should be a valid 3-digit number)
      const hasPlaceholders = parts.some(part => part === '--');
      const serialPart = parts[parts.length - 1];
      const isValidSerial = /^\d{3}$/.test(serialPart); // Should be 3 digits
      const hasAutoSerial = serialPart === 'AUTO' || serialPart === '???';
      
      if (hasPlaceholders) {
        return { isValid: false, error: 'Unique ID contains placeholders. Please fill all required fields.' };
      }
      // Valid serial number (3 digits) or AUTO/??? placeholder is valid - backend will generate/verify it
      if (isValidSerial || hasAutoSerial) {
        return { isValid: true };
      }

      // Check if unique ID already exists in the inventory items (normalize comparison)
      const existingItem = inventoryItems.find(item => 
        (item.uniqueid || '').toUpperCase().trim() === normalizedId
      );

      if (existingItem) {
        return { isValid: false, error: `Unique ID "${normalizedId}" already exists in database` };
      }

      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  };

  // Removed getNextSerialNumberForPrefix - serial numbers are now generated globally by the backend

  // Generate unique ID for multiple items with sequential serial numbers
  const generateMultipleItemUniqueId = async (
    assetName: string, 
    location: string,
    index: number = 0 // Index to increment serial number for each row
  ): Promise<string> => {
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
      uniqueId += location.trim();
    } else {
      uniqueId += '--';
    }
    uniqueId += '/';
    
    // Calculate serial number: base serial number + index
    // Parse the base serial number and add the index
    const baseSerial = parseInt(nextSerialNumber, 10) || 1;
    const serialNumber = baseSerial + index;
    const serialFormatted = serialNumber.toString().padStart(3, '0');
    uniqueId += serialFormatted;
    
    return uniqueId.toUpperCase();
  };

  // Generate initial unique ID when component mounts
  React.useEffect(() => {
    const generateInitialId = async () => {
      if (!formData.uniqueid) {
        // Refetch serial preview to get latest counter value
        await refetchSerialPreview();
        const initialId = await generateUniqueId();
        setFormData(prev => ({
          ...prev,
          uniqueid: initialId
        }));
      }
    };
    
    generateInitialId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update unique ID whenever relevant fields change or serial preview updates
  React.useEffect(() => {
    const updateUniqueId = async () => {
      // Refetch serial preview to get latest counter value
      await refetchSerialPreview();
      const newUniqueId = await generateUniqueId();
      if (newUniqueId !== formData.uniqueid) {
        setFormData(prev => ({
          ...prev,
          uniqueid: newUniqueId
        }));
      }
    };
    
    updateUniqueId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.financialyear, formData.assetnamefromcategory, formData.assetname, formData.locationofitem, nextSerialNumber]);

  // Update unique IDs for all multiple items when serial number or relevant fields change
  // Only update if items already have asset names (to avoid overwriting empty rows)
  React.useEffect(() => {
    const updateMultipleItemsIds = async () => {
      if (multipleItems.length > 0 && formData.locationofitem) {
        let hasChanges = false;
        const updatedItems = await Promise.all(
          multipleItems.map(async (item, idx) => {
            if (item.assetname && item.assetcategory && formData.locationofitem) {
              const newUniqueId = await generateMultipleItemUniqueId(
                item.assetname,
                formData.locationofitem,
                idx
              );
              if (item.uniqueid !== newUniqueId) {
                hasChanges = true;
              }
              return { ...item, uniqueid: newUniqueId };
            }
            return item;
          })
        );
        // Only update state if there are actual changes to avoid infinite loops
        if (hasChanges) {
          setMultipleItems(updatedItems);
        }
      }
    };
    
    updateMultipleItemsIds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextSerialNumber, formData.financialyear, formData.locationofitem]);

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



  // Validation function to check all required fields
  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Check Financial Year
    if (!formData.financialyear || formData.financialyear.trim() === '') {
      errors.push('Financial Year');
    }

    // Check Category Type
    if (!formData.categorytype || formData.categorytype.trim() === '') {
      errors.push('Asset Type (Major/Minor)');
    }

    // Check Asset Category
    if (!formData.assetcategory || formData.assetcategory.trim() === '') {
      errors.push('Asset Category');
    }

    // Check Asset Name
    if ((!formData.assetnamefromcategory || formData.assetnamefromcategory.trim() === '') && 
        (!formData.assetname || formData.assetname.trim() === '')) {
      errors.push('Asset Name');
    }

    // Check Location
    if (!formData.locationofitem || formData.locationofitem.trim() === '') {
      errors.push('Location');
    }

    // Check Vendor Name
    if (!formData.vendorname || formData.vendorname.trim() === '') {
      errors.push('Vendor Name');
    }

    // Check Rate (Inclusive Tax)
    if (!formData.rateinclusivetax || formData.rateinclusivetax <= 0) {
      errors.push('Rate (Inclusive Tax)');
    }

    // Check if unique ID is complete (no placeholders, but ??? is allowed for serial number)
    const parts = formData.uniqueid.split('/');
    const hasPlaceholders = parts.some(part => part === '--');
    const hasAutoSerial = parts.length > 0 && (parts[parts.length - 1] === 'AUTO' || parts[parts.length - 1] === '???');
    if (hasPlaceholders) {
      errors.push('Unique ID (complete all required fields to generate)');
    }
    // ??? serial number is valid - backend will generate it automatically

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all required fields
    const validation = validateForm();
    if (!validation.isValid) {
      const errorMessage = validation.errors.length === 1
        ? `Please fill in the required field: ${validation.errors[0]}`
        : `Please fill in the following required fields: ${validation.errors.join(', ')}`;
      toast.error(errorMessage, {
        duration: 5000,
      });
      return;
    }
    
    // Validate unique ID format and uniqueness
    // Note: We use cached inventoryItems data for validation to avoid unnecessary refetches
    const uniqueIdValidation = await validateUniqueId(formData.uniqueid);
    if (!uniqueIdValidation.isValid) {
      // Check if the error is about duplicate unique ID
      if (uniqueIdValidation.error?.includes('already exists')) {
        // Regenerate the unique ID with fresh data
        const regeneratedId = await generateUniqueId();
        setFormData(prev => ({ ...prev, uniqueid: regeneratedId }));
        toast.error(`Unique ID conflict detected. New ID generated: ${regeneratedId}. Please review and submit again.`, {
          duration: 6000,
        });
      } else {
        toast.error(uniqueIdValidation.error || 'Invalid unique ID');
      }
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
  // ALWAYS let backend generate uniqueid automatically
  // Serial numbers are system-generated based on asset count - no manual input allowed
  // The preview shown is just for display - backend will generate the actual unique ID with correct serial number
  const uniqueIdToSend = undefined; // Backend will automatically generate it with atomic counter
  
  const payload: any = {
    ...formData,
    assetcategoryid: formData.assetcategoryid,
    dateofinvoice: formData.dateofinvoice || new Date(),
    dateofentry: formData.dateofentry,
    dateofissue: formData.dateofissue,
    expectedreturndate: formData.expectedreturndate,
    lastmodifiedby: user?.id || 'unknown',
    attachments: uploadedFiles, // ✅ use uploaded URLs instead of raw files
    // Convert empty productserialnumber to undefined
    productserialnumber: formData.productserialnumber?.trim() || undefined,
  };
  
  // Only include uniqueid if it's a valid value (not AUTO/??? and not empty)
  if (uniqueIdToSend) {
    payload.uniqueid = uniqueIdToSend;
  }
  // If uniqueIdToSend is undefined, don't include uniqueid at all - backend will generate it

  let loadingToast: string | undefined;
  try {
    loadingToast = toast.loading('Creating inventory item...');
    await createInventoryItem(payload).unwrap();
    toast.dismiss(loadingToast);

    // 3. Reset form
    setFormData({
      uniqueid: '',
      financialyear: currentFY,
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
    // Set flag to refetch on next unique ID generation
    setShouldRefetch(true);
    // Refetch inventory to update the count
    await refetchInventoryItems();
    // Refetch serial preview to get updated counter
    await refetchSerialPreview();
    
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
              <div className="relative">
                <div className="relative w-full h-11 border border-gray-300 rounded-xl cursor-not-allowed bg-gray-50 flex items-center overflow-hidden">
                  {/* Real-time ID Generation Display Inside Field */}
                  <div 
                    className="flex items-center gap-0.5 flex-1 min-w-0 px-3 overflow-x-auto"
                    style={{ 
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none'
                    } as React.CSSProperties}
                  >
                    <style>{`
                      .unique-id-scroll::-webkit-scrollbar {
                        display: none;
                      }
                    `}</style>
                    <div className="flex items-center gap-0.5 flex-shrink-0 unique-id-scroll">
                      <span className="text-[10px] font-medium text-blue-600 whitespace-nowrap">🔄</span>
                      <span className="px-1 py-0.5 text-[10px] font-mono font-semibold text-blue-600 bg-white border border-gray-200 rounded whitespace-nowrap">ihub</span>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">/</span>
                      <span className={`text-[10px] font-mono px-1 py-0.5 rounded border whitespace-nowrap ${
                        formData.financialyear 
                          ? 'bg-green-100 border-green-300 text-green-700' 
                          : 'bg-red-100 border-red-300 text-red-500'
                      }`}>
                        {formData.financialyear || '--'}
                      </span>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">/</span>
                      <span className={`text-[10px] font-mono px-1 py-0.5 rounded border whitespace-nowrap ${
                        (formData.assetnamefromcategory || formData.assetname)
                          ? 'bg-green-100 border-green-300 text-green-700' 
                          : 'bg-red-100 border-red-300 text-red-500'
                      }`}>
                        {generateAssetCode(formData.assetnamefromcategory || formData.assetname) || '--'}
                      </span>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">/</span>
                      <span className={`text-[10px] font-mono px-1 py-0.5 rounded border whitespace-nowrap ${
                        formData.locationofitem 
                          ? 'bg-green-100 border-green-300 text-green-700' 
                          : 'bg-red-100 border-red-300 text-red-500'
                      }`}>
                        {formData.locationofitem || '--'}
                      </span>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">/</span>
                      <span className={`text-[10px] font-mono px-1 py-0.5 rounded border whitespace-nowrap ${
                        formData.financialyear && formData.assetname && formData.locationofitem
                          ? 'bg-green-100 border-green-300 text-green-700' 
                          : 'bg-red-100 border-red-300 text-red-500'
                      }`}>
                        {formData.uniqueid.split('/').pop() || '001'}
                      </span>
                    </div>
                  </div>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none bg-gray-50 z-10">
                    <Package className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                
                {/* Progress indicator below field */}
                {formData.uniqueid && (
                  <div className="flex items-center mt-2 space-x-2">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full">
                      <div 
                        className="h-1.5 transition-all duration-300 rounded-full bg-gradient-to-r from-[#0d559e] to-[#1a6bb8]"
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
                )}
                
                {/* Missing fields reminder */}
                {(!formData.financialyear || !(formData.assetnamefromcategory || formData.assetname) || !formData.locationofitem) && (
                  <div className="mt-1 text-xs text-amber-600">
                    ⚠️ Missing: {[
                      !formData.financialyear && 'Financial Year',
                      !(formData.assetnamefromcategory || formData.assetname) && 'Asset Name',
                      !formData.locationofitem && 'Location'
                    ].filter(Boolean).join(', ')}
                  </div>
                )}
              </div>
            </div>

            <div>
              <FinancialYearDropdown
                label="Financial Year"
                value={formData.financialyear}
                onChange={(value) => {
                  setFormData(prev => ({
                    ...prev,
                    financialyear: value
                  }));
                }}
                required
                placeholder="Select Financial Year"
              />
              <p className="mt-1 text-xs text-gray-500">
                Financial Year runs from 1st April to 31st March • Currently: <span className="font-semibold text-blue-600">{formData.financialyear || 'Not selected'}</span>
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
                  inventoryItems={inventoryItems}
                  showAddButton={true}
                  showDeleteButton={true}
                  onCategoriesChange={refetchCategories}
                />
                <p className="mt-1 text-xs text-gray-500">
                  🔤 First 3 letters will be used as asset code: <span className="font-mono font-semibold text-blue-600">{generateAssetCode(formData.assetnamefromcategory || formData.assetname) || 'XXX'}</span>
                </p>
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
                  className="w-full h-11 px-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Dell Inspiron 15"
              />
            </div>

            {/* Auto-generated Serial Number from Unique ID */}
            <div>
              <label className="flex items-center mb-2 text-sm font-medium text-gray-700">
                <span>Serial Number *</span>
                <span className="px-2 py-1 ml-2 text-xs text-blue-800 bg-blue-100 rounded-full">Auto-Generated</span>
              </label>
              <input
                type="text"
                name="serialNumber"
                value={extractSerialNumberFromUniqueId(formData.uniqueid)}
                readOnly
                disabled
                className="w-full h-11 px-4 border border-gray-300 rounded-xl bg-gray-50 cursor-not-allowed text-gray-700 font-mono font-semibold"
                placeholder="Will be generated from Unique ID"
              />
              <p className="mt-1 text-xs text-gray-500">
                Automatically extracted from Unique ID. Updates when Unique ID changes.
              </p>
            </div>

            {/* Product Serial Number (optional, for manufacturer's serial number) */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Product Serial Number <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                name="productserialnumber"
                value={formData.productserialnumber}
                onChange={handleInputChange}
                className="w-full h-11 px-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Manufacturer's serial number (if available)"
              />
              <p className="mt-1 text-xs text-gray-500">
                Optional: Manufacturer's product serial number (different from system serial number)
              </p>
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
                  className="w-full h-11 px-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  value={formData.purchaseordernumber}
                  onChange={handleInputChange}
                  className="w-full h-11 px-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  value={formData.totalcost}
                  readOnly
                  className="w-full h-11 px-4 text-gray-600 border border-gray-300 rounded-xl bg-gray-50"
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
                />
                <p className="mt-1 text-xs text-gray-500">
                  📍 Select location - will be used in unique ID generation
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
                    className="w-full h-11 px-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full h-11 px-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full min-h-[80px] px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
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
                  className="w-full min-h-[80px] px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                  placeholder="Purpose and description..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 mt-6 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Warranty Information
                </label>
                <input
                  type="text"
                  name="warrantyinformation"
                  value={formData.warrantyinformation}
                  onChange={handleInputChange}
                  className="w-full h-11 px-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full h-11 px-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                      financialyear: currentFY,
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
                                    // Generate unique ID with index to ensure sequential numbering
                                    const newUniqueId = await generateMultipleItemUniqueId(value, formData.locationofitem, idx);
                                    setMultipleItems(prev => prev.map((row, i) => i === idx ? { ...row, uniqueid: newUniqueId } : row));
                                  }
                                }}
                                required
                                placeholder={`Select ${it.categorytype === 'major' ? 'Major' : 'Minor'} Asset Name`}
                                searchable
                                inventoryItems={inventoryItems}
                                showAddButton={true}
                                showDeleteButton={true}
                                onCategoriesChange={refetchCategories}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Basic Information */}
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <label className="flex items-center mb-2 text-sm font-medium text-gray-700">
                            <span>Unique ID *</span>
                            <span className="px-2 py-1 ml-2 text-xs text-blue-800 bg-blue-100 rounded-full">Auto-Generated</span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={it.uniqueid}
                              readOnly
                              required
                              className="w-full h-11 px-4 pr-10 border border-gray-300 rounded-lg cursor-not-allowed bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                          <label className="block mb-2 text-sm font-medium text-gray-700">Make/Model</label>
                          <input
                            type="text"
                            value={it.makemodel}
                            onChange={(e) => {
                              const v = e.target.value;
                              setMultipleItems(prev => prev.map((row, i) => i === idx ? { ...row, makemodel: v } : row));
                            }}
                            className="w-full h-11 px-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., Dell Inspiron 15"
                          />
                        </div>

                        {/* Auto-generated Serial Number from Unique ID */}
                        <div>
                          <label className="flex items-center mb-2 text-sm font-medium text-gray-700">
                            <span>Serial Number *</span>
                            <span className="px-2 py-1 ml-2 text-xs text-blue-800 bg-blue-100 rounded-full">Auto-Generated</span>
                          </label>
                          <input
                            type="text"
                            value={extractSerialNumberFromUniqueId(it.uniqueid)}
                            readOnly
                            disabled
                            className="w-full h-11 px-4 border border-gray-300 rounded-xl bg-gray-50 cursor-not-allowed text-gray-700 font-mono font-semibold"
                            placeholder="Will be generated from Unique ID"
                          />
                        </div>

                        {/* Product Serial Number (optional, for manufacturer's serial number) */}
                        <div>
                          <label className="block mb-2 text-sm font-medium text-gray-700">
                            Product Serial Number <span className="text-gray-400 font-normal">(Optional)</span>
                          </label>
                          <input
                            type="text"
                            value={it.productserialnumber || ''}
                            onChange={(e) => {
                              const v = e.target.value;
                              setMultipleItems(prev => prev.map((row, i) => i === idx ? { ...row, productserialnumber: v } : row));
                            }}
                            className="w-full h-11 px-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Manufacturer's serial number (if available)"
                          />
                        </div>

                        <div>
                          <label className="block mb-2 text-sm font-medium text-gray-700">Vendor Name</label>
                          <input
                            type="text"
                            value={it.vendorname}
                            onChange={(e) => {
                              const v = e.target.value;
                              setMultipleItems(prev => prev.map((row, i) => i === idx ? { ...row, vendorname: v } : row));
                            }}
                            className="w-full h-11 px-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                          <div>
                            <label className="block mb-2 text-sm font-medium text-gray-700">Rate (Incl. Tax) *</label>
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
                              className="w-full h-11 px-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="e.g., 1500.00"
                              required
                            />
                          </div>

                       

                          <div>
                            <label className="block mb-2 text-sm font-medium text-gray-700">Total Cost</label>
                            <input
                              type="number"
                              value={it.totalcost}
                              readOnly
                              className="w-full h-10 px-4 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
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
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                          <div>
                            <label className="block mb-2 text-sm font-medium text-gray-700">Expected Lifespan (Years)</label>
                            <input
                              type="number"
                              min="1"
                              max="50"
                              value={it.expectedlifespan}
                              onChange={(e) => {
                                const v = e.target.value;
                                setMultipleItems(prev => prev.map((row, i) => i === idx ? { ...row, expectedlifespan: v } : row));
                              }}
                              className="w-full h-11 px-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="e.g., 5"
                            />
                          </div>

                          <div>
                            <label className="block mb-2 text-sm font-medium text-gray-700">Salvage Value (₹)</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={it.salvagevalue}
                              onChange={(e) => {
                                const v = parseFloat(e.target.value || '0');
                                setMultipleItems(prev => prev.map((row, i) => i === idx ? { ...row, salvagevalue: v } : row));
                              }}
                              className="w-full h-11 px-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="e.g., 1000.00"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-6 mt-6 md:grid-cols-2">
                          <div>
                            <label className="block mb-2 text-sm font-medium text-gray-700">
                              Specification
                            </label>
                            <textarea
                              value={it.specification || ''}
                              onChange={(e) => {
                                const v = e.target.value;
                                setMultipleItems(prev => prev.map((row, i) => i === idx ? { ...row, specification: v } : row));
                              }}
                              rows={3}
                              className="w-full min-h-[80px] px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                              placeholder="Technical specifications..."
                            />
                          </div>

                          <div>
                            <label className="block mb-2 text-sm font-medium text-gray-700">
                              Description / Purpose
                            </label>
                            <textarea
                              value={it.description || ''}
                              onChange={(e) => {
                                const v = e.target.value;
                                setMultipleItems(prev => prev.map((row, i) => i === idx ? { ...row, description: v } : row));
                              }}
                              rows={3}
                              className="w-full min-h-[80px] px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                              placeholder="Purpose and description..."
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
                        // Validate all items in multiple items form
                        const validationErrors: Array<{ itemIndex: number; fields: string[] }> = [];
                        
                        multipleItems.forEach((mi, idx) => {
                          const itemErrors: string[] = [];
                          
                          if (!mi.categorytype || mi.categorytype.trim() === '') {
                            itemErrors.push('Asset Type');
                          }
                          if (!mi.assetcategory || mi.assetcategory.trim() === '') {
                            itemErrors.push('Asset Category');
                          }
                          if ((!mi.assetnamefromcategory || mi.assetnamefromcategory.trim() === '') && 
                              (!mi.assetname || mi.assetname.trim() === '')) {
                            itemErrors.push('Asset Name');
                          }
                          if (!mi.vendorname || mi.vendorname.trim() === '') {
                            itemErrors.push('Vendor Name');
                          }
                          if (!mi.rateinclusivetax || mi.rateinclusivetax <= 0) {
                            itemErrors.push('Rate (Inclusive Tax)');
                          }
                          // Allow ??? in serial number position - backend will generate it
                          const parts = (mi.uniqueid || '').split('/');
                          const hasPlaceholders = parts.some(part => part === '--');
                          if (hasPlaceholders) {
                            itemErrors.push('Unique ID (complete all required fields)');
                          }
                          
                          if (itemErrors.length > 0) {
                            validationErrors.push({ itemIndex: idx + 1, fields: itemErrors });
                          }
                        });
                        
                        if (validationErrors.length > 0) {
                          const errorMessages = validationErrors.map(err => 
                            `Item #${err.itemIndex}: ${err.fields.join(', ')}`
                          ).join(' | ');
                          toast.error(`Please fill in the following fields: ${errorMessages}`, {
                            duration: 6000,
                          });
                          return;
                        }
                        
                        // Backend will generate unique IDs with global serial numbers
                        // Remove uniqueid if it contains AUTO/??? to let backend generate it
                        const loadingToast = toast.loading('Creating items...');
                        try {
                          // Create all items (each row is now an individual item)
                          // Each item will get a globally unique serial number from the backend
                          await Promise.all(multipleItems.map(async (mi) => {
                            // Always let backend generate uniqueid to ensure atomic serial number assignment
                            // The preview shown is just for display - backend will generate the actual unique ID
                            const uniqueIdToSend = undefined; // Backend will generate it with atomic counter
                            
                            const payload: any = {
                              ...formData,
                              assetname: mi.assetname,
                              assetcategory: mi.assetcategory,
                              assetcategoryid: mi.assetcategoryid,
                              makemodel: mi.makemodel,
                              productserialnumber: mi.productserialnumber?.trim() || undefined,
                              vendorname: mi.vendorname,
                              rateinclusivetax: mi.rateinclusivetax,
                              totalcost: mi.totalcost,
                              balancequantityinstock: 1,
                              status: mi.status,
                              conditionofasset: mi.conditionofasset,
                              depreciationmethod: mi.depreciationmethod,
                              expectedlifespan: mi.expectedlifespan,
                              salvagevalue: mi.salvagevalue,
                              specification: mi.specification || '',
                              description: mi.description || '',
                              dateofinvoice: mi.dateofinvoice,
                              dateofentry: mi.dateofentry,
                              attachments: [],
                            };
                            
                            // Only include uniqueid if it's a valid value (not AUTO/??? and not empty)
                            if (uniqueIdToSend) {
                              payload.uniqueid = uniqueIdToSend;
                            }
                            // If uniqueIdToSend is undefined, don't include uniqueid at all - backend will generate it
                            
                            await createInventoryItem(payload).unwrap();
                          }));
                          
                          toast.dismiss(loadingToast);
                          toast.success(`Successfully created ${multipleItems.length} items!`);
                          // Refetch inventory to update the count
                          await refetchInventoryItems();
                          // Refetch serial preview to get updated counter
                          await refetchSerialPreview();
                          
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
                            specification: '',
                            description: '',
                            dateofinvoice: new Date(), 
                            dateofentry: new Date() 
                          }]);
                        } catch (err: any) {
                          console.error(err);
                          toast.dismiss(loadingToast);
                          const errorMessage = err?.data?.message || err?.message || 'Failed to create one or more items';
                          if (errorMessage.includes('uniqueid already exists')) {
                            toast.error(`Unique ID conflict: ${errorMessage}. The system will regenerate IDs. Please try again.`, {
                              duration: 6000,
                            });
                          } else {
                            toast.error(errorMessage);
                          }
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
                        <label className="block mb-2 text-sm font-medium text-gray-700">How many rows to add?</label>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={rowsToAdd}
                          onChange={(e) => setRowsToAdd(e.target.value.replace(/[^0-9]/g, ''))}
                          className="w-full h-11 px-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                              specification: '',
                              description: '',
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
                            // Ensure template has a unique ID first (use current index)
                            const templateIndex = updated.length - 1;
                            if (!template.uniqueid) {
                              const newId = await generateMultipleItemUniqueId(asset, loc, templateIndex);
                              updated[updated.length - 1] = { ...template, uniqueid: newId };
                            }
                            // Build new rows with generated unique IDs in sequence
                            // Start from templateIndex + 1 for new rows
                            const newRows = await Promise.all(
                              Array.from({ length: count }).map(async (_v, i) => {
                                const rowIndex = templateIndex + 1 + i; // Continue sequence from template
                                const newId = await generateMultipleItemUniqueId(asset, loc, rowIndex);
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
                                  specification: template.specification || '',
                                  description: template.description || '',
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