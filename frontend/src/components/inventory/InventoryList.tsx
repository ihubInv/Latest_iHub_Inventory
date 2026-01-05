import React, { useState, useEffect } from 'react';
import { 
  useGetInventoryItemsQuery,
  useCreateInventoryItemMutation,
  useUpdateInventoryItemMutation,
  useDeleteInventoryItemMutation
} from '../../store/api';
import { useAppSelector } from '../../store/hooks';
import { AssetConditionChart, CategoryDistributionChart } from '../charts/ChartComponents';
import { Search, Filter, Download, Edit, Trash2, Eye, Package, Save, X, Zap, Calculator, BarChart3, List, AlertTriangle, CheckSquare, Square, FileSpreadsheet, FileText, Image, Sliders, RotateCcw, ChevronDown } from 'lucide-react';
import { CRUDToasts } from '../../services/toastService';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { createAttractiveExcelFile, createAttractiveCSV } from '../../utils/enhancedExport';
import { 
  exportInventoryToExcel, 
  exportInventoryToCSV, 
  exportDataOnly,
  exportWithCharts,
  debugChartExport,
  getAvailableFields,
  // ExportOptions 
} from '../../utils/inventoryExport';
import html2canvas from 'html2canvas';
import ViewInventory from './ViewInventory';
import UpdateInventory from './UpdateInventory';
import StatusDropdown from '../common/StatusDropdown';
import CategoryDropdown from '../common/CategoryDropdown';
// import ConditionDropdown from '../common/ConditionDropdown';
import DateRangePicker from '../common/DateRangePicker';
import InventoryPivotTable from './InventoryPivotTable';
import type  { InventoryItem, Attachment } from '../../types'; // Import Attachment type
import AttractiveLoader from '../common/AttractiveLoader'; // Import AttractiveLoader

interface AddInventoryFormData {
  uniqueid: string;
  financialyear: string;
  dateofinvoice: Date | null;
  dateofentry: Date | null;
  invoicenumber: string;
  assetcategory: string;
  assetcategoryid: string;
  assetname: string;
  specification: string;
  makemodel: string;
  productserialnumber?: string;
  vendorname: string;
  quantityperitem: number;
  rateinclusivetax: number;
  totalcost: number;
  locationofitem: string;
  issuedto: string;
  dateofissue: Date | null;
  expectedreturndate: Date | null;
  balancequantityinstock: number;
  description: string;
  unitofmeasurement: string;
  depreciationmethod: '' | 'straight-line' | 'declining-balance' | 'sum-of-years';
  warrantyinformation: string | undefined;
  maintenanceschedule: string | undefined;
  conditionofasset: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  status: 'available' | 'issued' | 'maintenance' | 'retired';
  minimumstocklevel: number;
  purchaseordernumber: string | undefined;
  expectedlifespan: string | undefined;
  annualmanagementcharge: number | undefined;
  salvagevalue: number | undefined;
  attachments: (File | Attachment)[] | undefined;
  createdby: string;
  lastmodifiedby?: string;
  lastmodifieddate?: Date;
}

// import UpdateInventory from './updateInventory';

const InventoryList: React.FC = () => {
  const { data: inventoryResponse, isLoading: loading } = useGetInventoryItemsQuery({}, {
    refetchOnMountOrArgChange: true, // Always refetch on mount if data is stale
    refetchOnFocus: true, // Refetch when window gains focus
    refetchOnReconnect: true, // Refetch when network reconnects
    pollingInterval: 10000, // Poll every 10 seconds to keep data fresh
  });
  const inventoryItems = inventoryResponse?.data || [];

  // Calculate real-time status counts
  const statusCounts = React.useMemo(() => {
    if (inventoryItems.length === 0) return { available: 0, issued: 0, maintenance: 0, retired: 0 };
    
    return inventoryItems.reduce((acc: any, item: any) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, { available: 0, issued: 0, maintenance: 0, retired: 0 });
  }, [inventoryItems]);

  // Debug: Log inventory items status distribution
  React.useEffect(() => {
    if (inventoryItems.length > 0) {
      console.log('📊 Inventory Status Distribution:', statusCounts);
      console.log('📦 Total Items:', inventoryItems.length);
    }
  }, [inventoryItems, statusCounts]);
  const [createInventoryItem] = useCreateInventoryItemMutation();
  const [updateInventoryItem] = useUpdateInventoryItemMutation();
  const [deleteInventoryItem] = useDeleteInventoryItemMutation();
  const { user } = useAppSelector((state) => state.auth);
  // Initialize states with localStorage persistence
  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem('inventoryListSearchTerm') || '';
  });
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [viewingCategory, setViewingCategory] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState(() => {
    return localStorage.getItem('inventoryListFilterStatus') || 'all';
  });
  const [filterCategory, setFilterCategory] = useState(() => {
    return localStorage.getItem('inventoryListFilterCategory') || 'all';
  });
  const [startDate, setStartDate] = useState<Date | null>(() => {
    const saved = localStorage.getItem('inventoryListStartDate');
    return saved ? new Date(saved) : null;
  });
  const [endDate, setEndDate] = useState<Date | null>(() => {
    const saved = localStorage.getItem('inventoryListEndDate');
    return saved ? new Date(saved) : null;
  });
  const [activeTab, setActiveTab] = useState<'list' | 'pivot' | 'category'>(() => {
    return (localStorage.getItem('inventoryListActiveTab') as 'list' | 'pivot' | 'category') || 'category';
  });
  
  // Category view states
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // Delete functionality states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  
  // Update functionality states
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [itemToUpdate, setItemToUpdate] = useState<any>(null);
  
  // Export functionality states
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportFilters, setShowExportFilters] = useState(false);
  const [exportFilters, setExportFilters] = useState({
    includeFields: [
      'uniqueid', 'assetname', 'assetcategory', 'status', 'conditionofasset',
      'locationofitem', 'vendorname', 'balancequantityinstock', 'rateinclusivetax',
      'totalcost', 'minimumstocklevel', 'financialyear', 'dateofinvoice', 'dateofentry'
    ],
    includeCharts: true
  });
  // Chart references for export
  const conditionChartRef = React.useRef<any>(null);
  const categoryChartRef = React.useRef<any>(null);
  const exportMenuRef = React.useRef<HTMLDivElement>(null);
  const exportFiltersRef = React.useRef<HTMLDivElement>(null);

  // Close export menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
      if (exportFiltersRef.current && !exportFiltersRef.current.contains(event.target as Node)) {
        setShowExportFilters(false);
      }
    };

    if (showExportMenu || showExportFilters) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportMenu, showExportFilters]);

  // Chart image capture function
  const captureChartImage = async (chartRef: React.RefObject<any>): Promise<string | null> => {
    if (!chartRef.current) {
      console.warn('Chart ref is null');
      return null;
    }
    
    try {
      // Wait a bit for the chart to render
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: chartRef.current.offsetWidth,
        height: chartRef.current.offsetHeight
      });
      
      const dataURL = canvas.toDataURL('image/png', 1.0);
      console.log('Chart captured successfully, size:', dataURL.length);
      return dataURL;
    } catch (error) {
      console.error('Error capturing chart:', error);
      return null;
    }
  };

  const [formData, setFormData] = useState<AddInventoryFormData>({
    uniqueid: '',
    financialyear: '2024-25',
    dateofinvoice: null,
    dateofentry: new Date(), // Set to today by default
    invoicenumber: '',
    assetcategory: '',
    assetcategoryid: "",
    assetname: '',
    specification: '',
    makemodel: '',
    productserialnumber: '',
    vendorname: '',
    quantityperitem: 1,
    rateinclusivetax: 0,
    totalcost: 0,
    locationofitem: '',
    issuedto: '',
    dateofissue: null,
    expectedreturndate: null,
    balancequantityinstock: 0,
    description: '',
    unitofmeasurement: 'Pieces',
    depreciationmethod: '',
    warrantyinformation: undefined,
    maintenanceschedule: undefined,
    conditionofasset: 'excellent',
    status: 'available',
    minimumstocklevel: 5,
    purchaseordernumber: undefined,
    expectedlifespan: undefined,
    annualmanagementcharge: undefined,
    salvagevalue: undefined,
    attachments: [],
    createdby: user?.id || 'unknown',
    lastmodifiedby: user?.id || 'unknown',
    lastmodifieddate: new Date(),
  });

  // Save filter states to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('inventoryListSearchTerm', searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    localStorage.setItem('inventoryListFilterStatus', filterStatus);
  }, [filterStatus]);

  useEffect(() => {
    localStorage.setItem('inventoryListFilterCategory', filterCategory);
  }, [filterCategory]);

  useEffect(() => {
    if (startDate) {
      localStorage.setItem('inventoryListStartDate', startDate.toISOString());
    } else {
      localStorage.removeItem('inventoryListStartDate');
    }
  }, [startDate]);

  useEffect(() => {
    if (endDate) {
      localStorage.setItem('inventoryListEndDate', endDate.toISOString());
    } else {
      localStorage.removeItem('inventoryListEndDate');
    }
  }, [endDate]);

  useEffect(() => {
    localStorage.setItem('inventoryListActiveTab', activeTab);
  }, [activeTab]);




  const filteredItems = inventoryItems?.filter((item: any) => {
    const matchesSearch = item.assetname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.uniqueid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vendorname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.assetcategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.subcategory && item.subcategory.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.brand && item.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.locationofitem && item.locationofitem.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || item.assetcategory === filterCategory;
    
    // Date range filtering - check if item's dateofentry falls within the selected range
    const matchesDateRange = (() => {
      if (!startDate && !endDate) return true; // No date filter applied
      
      // Handle different date formats that might come from the API
      let itemDate: Date | null = null;
      if (item.dateofentry) {
        if (typeof item.dateofentry === 'string') {
          itemDate = new Date(item.dateofentry);
        } else if (item.dateofentry instanceof Date) {
          itemDate = item.dateofentry;
        }
      } else if (item.createdat) {
        // Fallback to createdat if dateofentry is null
        if (typeof item.createdat === 'string') {
          itemDate = new Date(item.createdat);
        } else if (item.createdat instanceof Date) {
          itemDate = item.createdat;
        }
      }
      
      // If item has no valid date, exclude it when date filter is applied
      if (!itemDate || isNaN(itemDate.getTime())) {
        return false;
      }
      
      // Normalize dates to start of day for comparison
      const start = startDate ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()) : null;
      const end = endDate ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999) : null;
      const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
      
      if (start && end) {
        return itemDateOnly >= start && itemDateOnly <= end;
      } else if (start) {
        return itemDateOnly >= start;
      } else if (end) {
        return itemDateOnly <= end;
      }
      
      return true;
    })();

    return matchesSearch && matchesStatus && matchesCategory && matchesDateRange;
  });

  // Create categories array for the dropdown - only include categories that have filtered items
  const categoryNames = [...new Set(filteredItems.map((item: any) => item.assetcategory))].filter(Boolean);
  const categories = categoryNames.map(name => ({
    id: name,
    name: name,
    type: 'major' as const,
    description: `₹ {name} category`,
    isactive: true,
    createdat: new Date(),
    updatedat: new Date(),
    createdby: 'system'
  }));
  const statuses = ['available', 'issued', 'maintenance', 'retired'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'issued':
        return 'bg-blue-100 text-blue-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'retired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent':
        return 'bg-green-100 text-green-800';
      case 'good':
        return 'bg-blue-100 text-blue-800';
      case 'fair':
        return 'bg-yellow-100 text-yellow-800';
      case 'poor':
        return 'bg-orange-100 text-orange-800';
      case 'damaged':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };


  const handleEditCategory = (item: any) => {
    setEditingCategory(item);
    setFormData({
      // const now = new Date();


      uniqueid: item.uniqueid,
      financialyear: item.financialyear,
      dateofinvoice: item.dateofinvoice,
      dateofentry: item.dateofentry,
      invoicenumber: item.invoicenumber,
      assetcategory: item.assetcategory,
      assetcategoryid: item.assetcategoryid,
      assetname: item.assetname,
      specification: item.specification,
      makemodel: item.makemodel,
      productserialnumber: item.productserialnumber,
      vendorname: item.vendorname,
      quantityperitem: item.quantityperitem,
      rateinclusivetax: item.rateinclusivetax,
      totalcost: item.totalcost,
      locationofitem: item.locationofitem,
      issuedto: item.issuedto,
      dateofissue: item.dateofissue ?? null,
      expectedreturndate: item.expectedreturndate ?? null,
      balancequantityinstock: item.balancequantityinstock,
      description: item.description,
      unitofmeasurement: item.unitofmeasurement,
      depreciationmethod: item.depreciationmethod as AddInventoryFormData['depreciationmethod'],
      warrantyinformation: item.warrantyinformation,
      maintenanceschedule: item.maintenanceschedule,
      conditionofasset: item.conditionofasset,
      status: item.status,
      minimumstocklevel: item.minimumstocklevel,
      purchaseordernumber: item.purchaseordernumber,
      expectedlifespan: item.expectedlifespan,
      annualmanagementcharge: item.annualmanagementcharge,
      salvagevalue: item.salvagevalue,
      attachments: item.attachments ?? undefined,
      createdby: item.createdby,
      lastmodifiedby: item.lastmodifiedby,
      lastmodifieddate: item.lastmodifieddate,
    });
  };

  const handleUpdateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      const updatedItem: Partial<InventoryItem> = {
        ...formData, // Spread formData into a new object
        lastmodifiedby: user?.id || 'unknown', // Explicitly add lastmodifiedby
        lastmodifieddate: new Date(), // Explicitly add lastmodifieddate
        attachments: formData.attachments?.map(att => ({
          name: (att as File).name || (att as Attachment).name,
          url: (att as File).name ? URL.createObjectURL(att as File) : (att as Attachment).url
        })) || [],
        id: editingCategory.id,
        createdat: editingCategory.createdat,
      };
      updateInventoryItem({
        id: editingCategory.id,
        data: updatedItem
      });
      setEditingCategory(null);
      setFormData({
        uniqueid: '',
        financialyear: '2024-25',
        dateofinvoice: null,
        dateofentry: new Date(), // Set to today by default
        invoicenumber: '',
        assetcategory: '',
        assetcategoryid: "",
        assetname: '',
        specification: '',
        makemodel: '',
        productserialnumber: '',
        vendorname: '',
        quantityperitem: 1,
        rateinclusivetax: 0,
        totalcost: 0,
        locationofitem: '',
        issuedto: '',
        dateofissue: null,
        expectedreturndate: null,
        balancequantityinstock: 0,
        description: '',
        unitofmeasurement: 'Pieces',
        depreciationmethod: '',
        warrantyinformation: undefined,
        maintenanceschedule: undefined,
        conditionofasset: 'excellent',
        status: 'available',
        minimumstocklevel: 5,
        purchaseordernumber: undefined,
        expectedlifespan: undefined,
        annualmanagementcharge: undefined,
        salvagevalue: undefined,
        attachments: [],
        createdby: user?.id || 'unknown',
        lastmodifiedby: user?.id || 'unknown',
        lastmodifieddate: new Date(),
      });
    }
  };





  const handleAddCategory = async (e: React.FormEvent) => {
    
    e.preventDefault();
    try {
      const newItem: Omit<InventoryItem, 'id' | 'createdat' | 'updatedat'> = {
        ...formData,
        dateofentry: formData.dateofentry || new Date(), // Set to today if not provided
        lastmodifiedby: user?.id || 'unknown', // Explicitly add lastmodifiedby
        lastmodifieddate: new Date(), // Explicitly add lastmodifieddate
        attachments: formData.attachments?.map(att => ({
          name: (att as File).name || (att as Attachment).name,
          url: (att as File).name ? URL.createObjectURL(att as File) : (att as Attachment).url
        })) || [],
      };
      await createInventoryItem(newItem).unwrap();
      setFormData({
        uniqueid: '',
        financialyear: '2024-25',
        dateofinvoice: null,
        dateofentry: new Date(), // Set to today by default
        invoicenumber: '',
        assetcategory: '',
        assetcategoryid: "",
        assetname: '',
        specification: '',
        makemodel: '',
        productserialnumber: '',
        vendorname: '',
        quantityperitem: 1,
        rateinclusivetax: 0,
        totalcost: 0,
        locationofitem: '',
        issuedto: '',
        dateofissue: null,
        expectedreturndate: null,
        balancequantityinstock: 0,
        description: '',
        unitofmeasurement: 'Pieces',
        depreciationmethod: '',
        warrantyinformation: undefined,
        maintenanceschedule: undefined,
        conditionofasset: 'excellent',
        status: 'available',
        minimumstocklevel: 5,
        purchaseordernumber: undefined,
        expectedlifespan: undefined,
        annualmanagementcharge: undefined,
        salvagevalue: undefined,
        attachments: [],
        createdby: user?.id || 'unknown',
        lastmodifiedby: user?.id || 'unknown',
        lastmodifieddate: new Date(),
      });
    } catch (err) {
      console.error('Failed to add category:', err);
      // Optional: show toast or error message
    }
  };

 

  // Enhanced delete functionality
  const handleDeleteClick = (item: any) => {
    console.log('🗑️ handleDeleteClick called with item:', item);
    setItemToDelete(item);
    setShowDeleteModal(true);
    console.log('✅ Delete modal state set:', { showDeleteModal: true, itemToDelete: item });
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    
    setIsDeleting(true);
    try {
      const loadingToast = CRUDToasts.deleting('inventory item');
      await deleteInventoryItem(itemToDelete.id).unwrap();
      toast.dismiss(loadingToast);
      setShowDeleteModal(false);
      setItemToDelete(null);
      CRUDToasts.deleted('inventory item');
    } catch (error) {
      console.error('Error deleting item:', error);
      CRUDToasts.deleteError('inventory item', 'Please try again');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdate = (item: any) => {
    console.log('🔄 handleUpdate called with item:', item);
    setItemToUpdate(item);
    setShowUpdateModal(true);
    console.log('✅ Update modal state set:', { showUpdateModal: true, itemToUpdate: item });
  };

  const handleUpdateSuccess = (updatedItem: any) => {
    // Update the item in the local state
      updateInventoryItem({
        id: updatedItem.id,
        data: updatedItem
      });
    setShowUpdateModal(false);
    setItemToUpdate(null);
  };

  // Bulk delete functionality
  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map((item: any) => item.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedItems.length === 0) return;
    setShowBulkDeleteModal(true);
  };

  const handleConfirmBulkDelete = async () => {
    setIsDeleting(true);
    try {
      const loadingToast = CRUDToasts.bulkDeleting(selectedItems.length);
      for (const itemId of selectedItems) {
        await deleteInventoryItem(itemId).unwrap();
      }
      toast.dismiss(loadingToast);
      setShowBulkDeleteModal(false);
      setSelectedItems([]);
      CRUDToasts.bulkDeleted(selectedItems.length);
    } catch (error) {
      console.error('Error deleting items:', error);
      CRUDToasts.bulkDeleteError('Please try again');
    } finally {
      setIsDeleting(false);
    }
  };

  // Field mapping for export
  const fieldMapping = {
    uniqueid: 'Unique ID',
    assetname: 'Asset Name',
    assetcategory: 'Category',
    status: 'Status',
    conditionofasset: 'Condition',
    locationofitem: 'Location',
    vendorname: 'Vendor',
    balancequantityinstock: 'Quantity in Stock',
    rateinclusivetax: 'Rate (Inclusive Tax)',
    totalcost: 'Total Cost',
    minimumstocklevel: 'Minimum Stock Level',
    financialyear: 'Financial Year',
    dateofinvoice: 'Date of Invoice',
    dateofentry: 'Date of Entry',
    specification: 'Specification',
    unitofmeasurement: 'Unit of Measurement',
    purpose: 'Purpose',
    depreciationmethod: 'Depreciation Method',
    depreciationrate: 'Depreciation Rate'
  };

  // Enhanced export functions
  const exportToExcel = async (includeCharts: boolean = false) => {
    setIsExporting(true);
    try {
      const wb = XLSX.utils.book_new();
      
      // Prepare data with selected fields only
      const selectedFields = exportFilters.includeFields;
      const headers = selectedFields.map(field => fieldMapping[field as keyof typeof fieldMapping] || field);
      const data = filteredItems.map((item: any) => 
        selectedFields.map(field => {
          const value = item[field as keyof typeof item];
          if (field === 'dateofinvoice' || field === 'dateofentry') {
            return value && typeof value === 'string' ? new Date(value).toLocaleDateString() : 
                   value && value instanceof Date ? value.toLocaleDateString() : '';
          }
          return value || '';
        })
      );

      // Create main data sheet with enhanced styling
      const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
      
      // Enhanced styling for the worksheet
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      
      // Style headers with gradient-like effect
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (ws[cellAddress]) {
          ws[cellAddress].s = {
            font: { 
              bold: true, 
              color: { rgb: "FFFFFF" },
              size: 12,
              name: "Segoe UI"
            },
            fill: { 
              fgColor: { rgb: "1976D2" }, // Blue color
              patternType: "solid"
            },
            alignment: { 
              horizontal: "center", 
              vertical: "center",
              wrapText: true
            },
            border: {
              top: { style: "medium", color: { rgb: "1565C0" } },
              bottom: { style: "medium", color: { rgb: "1565C0" } },
              left: { style: "medium", color: { rgb: "1565C0" } },
              right: { style: "medium", color: { rgb: "1565C0" } }
            }
          };
        }
      }

      // Style data rows with alternating colors
      for (let row = range.s.r + 1; row <= range.e.r; row++) {
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          if (!ws[cellAddress]) continue;
          
          const isEvenRow = (row - 1) % 2 === 0;
          ws[cellAddress].s = {
            font: { 
              name: "Segoe UI",
              size: 11,
              color: { rgb: isEvenRow ? "2C3E50" : "34495E" }
            },
            fill: { 
              fgColor: { rgb: isEvenRow ? "F8F9FA" : "FFFFFF" },
              patternType: "solid"
            },
            alignment: { 
              horizontal: "left", 
              vertical: "center",
              wrapText: true
            },
            border: {
              top: { style: "thin", color: { rgb: "E9ECEF" } },
              bottom: { style: "thin", color: { rgb: "E9ECEF" } },
              left: { style: "thin", color: { rgb: "E9ECEF" } },
              right: { style: "thin", color: { rgb: "E9ECEF" } }
            }
          };
        }
      }

      // Set dynamic column widths based on content
      const colWidths = headers.map((header, index) => {
        const maxLength = Math.max(
          header.length,
          ...data.map(row => String(row[index] || '').length)
        );
        return { wch: Math.min(Math.max(maxLength + 2, 12), 30) };
      });
      ws['!cols'] = colWidths;

      // Add freeze panes for headers
      ws['!freeze'] = { xSplit: 0, ySplit: 1 };

      XLSX.utils.book_append_sheet(wb, ws, 'Inventory Data');

      // Add charts sheet with embedded chart images if requested
      if (includeCharts) {
        const chartsWs = XLSX.utils.aoa_to_sheet([
          ['📊 INVENTORY ANALYSIS CHARTS'],
          [''],
          ['Generated on: ' + new Date().toLocaleDateString()],
          ['Total Records: ' + filteredItems.length],
          [''],
          ['📈 ASSET CONDITION DISTRIBUTION'],
          [''],
          ['Chart will be displayed here'],
          [''],
          ['📊 CATEGORY DISTRIBUTION'],
          [''],
          ['Chart will be displayed here'],
          [''],
          ['📋 SUMMARY STATISTICS'],
          [''],
          ['Total Assets: ' + filteredItems.length],
          ['Categories: ' + [...new Set(filteredItems.map((item: any) => item.assetcategory))].length],
          ['Locations: ' + [...new Set(filteredItems.map((item: any) => item.locationofitem))].length],
          ['Vendors: ' + [...new Set(filteredItems.map((item: any) => item.vendorname))].length],
          [''],
          ['💡 NOTES'],
          ['• Charts are generated based on current filter settings'],
          ['• Data reflects the selected fields and applied filters'],
          ['• Export timestamp: ' + new Date().toLocaleString()]
        ]);

        // Enhanced styling for charts sheet
        const chartsRange = XLSX.utils.decode_range(chartsWs['!ref'] || 'A1');
        
        // Title styling
        chartsWs['A1'].s = {
          font: { 
            bold: true, 
            size: 18, 
            color: { rgb: "2E7D32" },
            name: "Segoe UI"
          },
          fill: { 
            fgColor: { rgb: "E8F5E8" },
            patternType: "solid"
          },
          alignment: { 
            horizontal: "center",
            vertical: "center"
          },
          border: {
            top: { style: "medium", color: { rgb: "2E7D32" } },
            bottom: { style: "medium", color: { rgb: "2E7D32" } },
            left: { style: "medium", color: { rgb: "2E7D32" } },
            right: { style: "medium", color: { rgb: "2E7D32" } }
          }
        };

        // Section headers styling
        const sectionHeaders = [6, 10, 14, 19];
        sectionHeaders.forEach(row => {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: 0 });
          if (chartsWs[cellAddress]) {
            chartsWs[cellAddress].s = {
              font: { 
                bold: true, 
                size: 14, 
                color: { rgb: "1976D2" },
                name: "Segoe UI"
              },
              fill: { 
                fgColor: { rgb: "E3F2FD" },
                patternType: "solid"
              },
              alignment: { 
                horizontal: "left",
                vertical: "center"
              }
            };
          }
        });

        // Set column widths for charts sheet
        chartsWs['!cols'] = [{ wch: 50 }];

        XLSX.utils.book_append_sheet(wb, chartsWs, 'Charts & Analysis');

        // Try to capture and embed chart images
        try {
          // Capture condition chart
          const conditionChartImage = await captureChartImage(conditionChartRef);
          if (conditionChartImage) {
            // Note: XLSX doesn't directly support image embedding
            // This would require a more advanced library like ExcelJS
            console.log('Condition chart captured successfully');
          }

          // Capture category chart
          const categoryChartImage = await captureChartImage(categoryChartRef);
          if (categoryChartImage) {
            console.log('Category chart captured successfully');
          }
        } catch (chartError) {
          console.warn('Chart capture failed:', chartError);
        }
      }

      // Save the file with enhanced metadata
      const fileName = `inventory-export-₹ {new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success(`Excel file exported successfully! ₹ {includeCharts ? 'Charts included.' : ''}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export Excel file');
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

  const exportToCSV = async () => {
    setIsExporting(true);
    try {
      const selectedFields = exportFilters.includeFields;
      const headers = selectedFields.map(field => fieldMapping[field as keyof typeof fieldMapping] || field);
      
      // Add metadata header
      const metadata = [
        ['# INVENTORY EXPORT REPORT'],
        ['Generated on: ' + new Date().toLocaleString()],
        ['Total Records: ' + filteredItems.length],
        ['Selected Fields: ' + selectedFields.length],
        ['Export Type: CSV'],
        [''],
        ['# DATA'],
        ['']
      ];

      const data = filteredItems.map((item: any) => 
        selectedFields.map(field => {
          const value = item[field as keyof typeof item];
          if (field === 'dateofinvoice' || field === 'dateofentry') {
            return value && typeof value === 'string' ? new Date(value).toLocaleDateString() : 
                   value && value instanceof Date ? value.toLocaleDateString() : '';
          }
          // Escape commas and quotes in CSV
          const stringValue = String(value || '');
          return stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')
            ? `"₹ {stringValue.replace(/"/g, '""')}"` 
            : stringValue;
        })
      );

      // Combine metadata, headers, and data
      const csvContent = [
        ...metadata.map(row => row.join(',')),
        headers.join(','),
        ...data.map(row => row.join(','))
      ].join('\n');

      // Add BOM for proper UTF-8 encoding
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-export-₹ {new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('CSV file exported successfully with metadata!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export CSV file');
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

  // Advanced Excel export with embedded charts using ExcelJS
  const exportToExcelAdvanced = async (includeCharts: boolean = false) => {
    setIsExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      
      // Set workbook properties
      workbook.creator = 'Inventory Management System';
      workbook.lastModifiedBy = user?.email || 'System';
      workbook.created = new Date();
      workbook.modified = new Date();

      // Create main data worksheet
      const dataWorksheet = workbook.addWorksheet('Inventory Data');
      
      // Prepare data
      const selectedFields = exportFilters.includeFields;
      const headers = selectedFields.map(field => fieldMapping[field as keyof typeof fieldMapping] || field);
      
      // Add headers with styling
      dataWorksheet.addRow(headers);
      const headerRow = dataWorksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12, name: 'Segoe UI' };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1976D2' } // Blue color instead of green
      };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      headerRow.border = {
        top: { style: 'medium', color: { argb: 'FF1565C0' } },
        left: { style: 'medium', color: { argb: 'FF1565C0' } },
        bottom: { style: 'medium', color: { argb: 'FF1565C0' } },
        right: { style: 'medium', color: { argb: 'FF1565C0' } }
      };

      // Add data rows with alternating colors
      filteredItems.forEach((item, index) => {
        const rowData = selectedFields.map(field => {
          const value = item[field as keyof typeof item];
          if (field === 'dateofinvoice' || field === 'dateofentry') {
            return value && typeof value === 'string' ? new Date(value) : 
                   value && value instanceof Date ? value : '';
          }
          return value || '';
        });
        
        const row = dataWorksheet.addRow(rowData);
        const isEvenRow = index % 2 === 0;
        
        row.font = { 
          name: 'Segoe UI', 
          size: 11, 
          color: { argb: isEvenRow ? 'FF2C3E50' : 'FF34495E' } 
        };
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isEvenRow ? 'FFF8F9FA' : 'FFFFFFFF' }
        };
        row.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
        row.border = {
          top: { style: 'thin', color: { argb: 'FFE9ECEF' } },
          left: { style: 'thin', color: { argb: 'FFE9ECEF' } },
          bottom: { style: 'thin', color: { argb: 'FFE9ECEF' } },
          right: { style: 'thin', color: { argb: 'FFE9ECEF' } }
        };
      });

      // Set column widths
      selectedFields.forEach((field, index) => {
        const header = headers[index];
        const maxLength = Math.max(
          header.length,
          ...filteredItems.map((item: any) => String(item[field as keyof typeof item] || '').length)
        );
        dataWorksheet.getColumn(index + 1).width = Math.min(Math.max(maxLength + 2, 12), 30);
      });

      // Freeze header row
      dataWorksheet.views = [{ state: 'frozen', ySplit: 1 }];

      // Add charts worksheet if requested
      if (includeCharts) {
        const chartsWorksheet = workbook.addWorksheet('Charts & Analysis');
        
        // Add title
        const titleRow = chartsWorksheet.addRow(['📊 INVENTORY ANALYSIS CHARTS']);
        titleRow.font = { bold: true, size: 18, color: { argb: 'FFFFFFFF' }, name: 'Segoe UI' };
        titleRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1976D2' } // Blue color instead of green
        };
        titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
        titleRow.border = {
          top: { style: 'medium', color: { argb: 'FF1565C0' } },
          left: { style: 'medium', color: { argb: 'FF1565C0' } },
          bottom: { style: 'medium', color: { argb: 'FF1565C0' } },
          right: { style: 'medium', color: { argb: 'FF1565C0' } }
        };
        chartsWorksheet.mergeCells('A1:D1');

        // Add metadata
        chartsWorksheet.addRow(['']);
        chartsWorksheet.addRow(['Generated on: ' + new Date().toLocaleDateString()]);
        chartsWorksheet.addRow(['Total Records: ' + filteredItems.length]);
        chartsWorksheet.addRow(['']);

        // Try to capture and embed chart images
        try {
          // Add some spacing before charts
          chartsWorksheet.addRow(['']);
          chartsWorksheet.addRow(['']);

          // Capture condition chart
          const conditionChartImage = await captureChartImage(conditionChartRef);
          if (conditionChartImage) {
            // Add chart section header
            const conditionHeaderRow = chartsWorksheet.addRow(['📈 ASSET CONDITION DISTRIBUTION']);
            conditionHeaderRow.font = { bold: true, size: 14, color: { argb: 'FF1976D2' }, name: 'Segoe UI' };
            conditionHeaderRow.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFE3F2FD' }
            };
            chartsWorksheet.addRow(['']);

            // Add chart placeholder instead of actual chart image due to browser compatibility
            try {
              // Add chart placeholder since Buffer is not available in browser
              chartsWorksheet.addRow(['📊 Condition Chart Available']);
              chartsWorksheet.addRow(['Chart visualization would be displayed here in Excel']);
              chartsWorksheet.addRow(['']);
              
              console.log('Condition chart placeholder added successfully');
            } catch (imageError) {
              console.warn('Failed to embed condition chart image:', imageError);
              chartsWorksheet.addRow(['Chart image could not be embedded']);
            }

            // Add condition data
            const conditionData = {
              excellent: filteredItems.filter((item: any) => item.conditionofasset === 'excellent').length,
              good: filteredItems.filter((item: any) => item.conditionofasset === 'good').length,
              fair: filteredItems.filter((item: any) => item.conditionofasset === 'fair').length,
              poor: filteredItems.filter((item: any) => item.conditionofasset === 'poor').length
            };

            chartsWorksheet.addRow(['Condition Distribution Data:']);
            chartsWorksheet.addRow(['Excellent: ' + conditionData.excellent]);
            chartsWorksheet.addRow(['Good: ' + conditionData.good]);
            chartsWorksheet.addRow(['Fair: ' + conditionData.fair]);
            chartsWorksheet.addRow(['Poor: ' + conditionData.poor]);
            chartsWorksheet.addRow(['']);
          } else {
            console.warn('Condition chart image not captured');
            chartsWorksheet.addRow(['📈 ASSET CONDITION DISTRIBUTION']);
            chartsWorksheet.addRow(['Chart could not be captured']);
            chartsWorksheet.addRow(['']);
          }

          // Add spacing between charts
          chartsWorksheet.addRow(['']);
          chartsWorksheet.addRow(['']);

          // Capture category chart
          const categoryChartImage = await captureChartImage(categoryChartRef);
          if (categoryChartImage) {
            // Add category section header
            const categoryHeaderRow = chartsWorksheet.addRow(['📊 CATEGORY DISTRIBUTION']);
            categoryHeaderRow.font = { bold: true, size: 14, color: { argb: 'FF1976D2' }, name: 'Segoe UI' };
            categoryHeaderRow.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFE3F2FD' }
            };
            chartsWorksheet.addRow(['']);

            // Add chart placeholder instead of actual chart image due to browser compatibility
            try {
              // Add chart placeholder since Buffer is not available in browser
              chartsWorksheet.addRow(['📊 Category Chart Available']);
              chartsWorksheet.addRow(['Chart visualization would be displayed here in Excel']);
              chartsWorksheet.addRow(['']);
              
              console.log('Category chart placeholder added successfully');
            } catch (imageError) {
              console.warn('Failed to embed category chart image:', imageError);
              chartsWorksheet.addRow(['Chart image could not be embedded']);
            }

            // Add category data
            const categoryData = filteredItems.reduce((acc, item) => {
              acc[item.assetcategory] = (acc[item.assetcategory] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);

            chartsWorksheet.addRow(['Category Distribution Data:']);
            Object.entries(categoryData).forEach(([category, count]) => {
              chartsWorksheet.addRow([category + ': ' + count]);
            });
            chartsWorksheet.addRow(['']);
          } else {
            console.warn('Category chart image not captured');
            chartsWorksheet.addRow(['📊 CATEGORY DISTRIBUTION']);
            chartsWorksheet.addRow(['Chart could not be captured']);
            chartsWorksheet.addRow(['']);
          }
        } catch (chartError) {
          console.warn('Chart capture failed:', chartError);
          chartsWorksheet.addRow(['Chart capture failed: ' + (chartError instanceof Error ? chartError.message : 'Unknown error')]);
        }

        // Add summary statistics
        const summaryHeaderRow = chartsWorksheet.addRow(['📋 SUMMARY STATISTICS']);
        summaryHeaderRow.font = { bold: true, size: 14, color: { argb: 'FF1976D2' }, name: 'Segoe UI' };
        summaryHeaderRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE3F2FD' }
        };
        chartsWorksheet.addRow(['']);
        chartsWorksheet.addRow(['Total Assets: ' + filteredItems.length]);
        chartsWorksheet.addRow(['Categories: ' + [...new Set(filteredItems.map((item: any) => item.assetcategory))].length]);
        chartsWorksheet.addRow(['Locations: ' + [...new Set(filteredItems.map((item: any) => item.locationofitem))].length]);
        chartsWorksheet.addRow(['Vendors: ' + [...new Set(filteredItems.map((item: any) => item.vendorname))].length]);
        chartsWorksheet.addRow(['']);

        // Add notes
        const notesHeaderRow = chartsWorksheet.addRow(['💡 NOTES']);
        notesHeaderRow.font = { bold: true, size: 14, color: { argb: 'FF1976D2' }, name: 'Segoe UI' };
        notesHeaderRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE3F2FD' }
        };
        chartsWorksheet.addRow(['']);
        chartsWorksheet.addRow(['• Charts are generated based on current filter settings']);
        chartsWorksheet.addRow(['• Data reflects the selected fields and applied filters']);
        chartsWorksheet.addRow(['• Export timestamp: ' + new Date().toLocaleString()]);
        chartsWorksheet.addRow(['• Chart images are captured and included in the analysis']);

        // Set column width for charts sheet
        chartsWorksheet.getColumn(1).width = 50;
      }

      // Save the file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-export-advanced-₹ {new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success(`Advanced Excel file exported successfully! ₹ {includeCharts ? 'Charts and analysis included.' : ''}`);
    } catch (error) {
      console.error('Advanced export error:', error);
      toast.error('Failed to export advanced Excel file');
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

  // Simplified export functions - same as pivot tab
  const exportDataOnlyExcel = async () => {
    setIsExporting(true);
    try {
      const loadingToast = toast.loading('Exporting data only...');
      
      await exportDataOnly();
      
      toast.dismiss(loadingToast);
      toast.success('Data-only Excel exported successfully!');
    } catch (error) {
      console.error('Data-only export error:', error);
      toast.error('Failed to export data-only Excel');
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

  const exportChartsExcel = async () => {
    setIsExporting(true);
    try {
      const loadingToast = toast.loading('Exporting with chart data...');
      
      // Create pivot-like data structure for enhanced export
      const pivotData = {
        rows: [...new Set(inventoryItems.map((item: any) => item.assetcategory))],
        columns: [...new Set(inventoryItems.map((item: any) => item.status))],
        data: {} as Record<string, Record<string, number>>
      };

      // Populate pivot data
      pivotData.rows.forEach(row => {
        pivotData.data[row] = {};
        pivotData.columns.forEach(col => {
          const count = inventoryItems?.filter((item: any) => 
            item.assetcategory === row && item.status === col
          ).length;
          pivotData.data[row][col] = count;
        });
      });

      const pivotConfig = {
        rows: ['assetcategory'],
        columns: ['status'],
        values: 'balancequantityinstock',
        aggregation: 'count' as const
      };

      const availableFields = [
        { value: 'assetcategory', label: 'Asset Category' },
        { value: 'status', label: 'Status' },
        { value: 'conditionofasset', label: 'Condition' },
        { value: 'locationofitem', label: 'Location' }
      ];

      const valueFields = [
        { value: 'balancequantityinstock', label: 'Quantity in Stock' },
        { value: 'totalcost', label: 'Total Cost' }
      ];

      const workbook = await createAttractiveExcelFile(
        pivotData,
        pivotConfig,
        availableFields,
        valueFields,
        'bar',
        true, // includeCharts
        true, // showCharts
        undefined, // primaryChartRef
        undefined, // secondaryChartRef
        inventoryItems // Pass complete inventory data
      );
      
      // Generate and download file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `inventory-analysis-with-chart-data-₹ {timestamp}.xlsx`;
      link.download = filename;
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.dismiss(loadingToast);
      toast.success('Excel with chart data exported successfully!');
    } catch (error) {
      console.error('Chart data export error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to export Excel with chart data';
      toast.error(errorMessage);
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

  // const debugCharts = async () => {
  //   setIsExporting(true);
  //   try {
  //     const loadingToast = toast.loading('Testing chart creation...');
      
  //     await debugChartExport();
      
  //     toast.dismiss(loadingToast);
  //     toast.success('Debug chart test completed! Check console for details.');
  //   } catch (error) {
  //     console.error('Debug chart error:', error);
  //     toast.error('Debug chart test failed. Check console for details.');
  //   } finally {
  //     setIsExporting(false);
  //     setShowExportMenu(false);
  //   }
  // };

  const toggleFieldSelection = (field: string) => {
    setExportFilters(prev => ({
      ...prev,
      includeFields: prev.includeFields.includes(field)
        ? prev.includeFields.filter(f => f !== field)
        : [...prev.includeFields, field]
    }));
  };

  // Reset all filters function
  const resetFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterCategory('all');
    setStartDate(null);
    setEndDate(null);
    toast.success('All filters have been reset!');
  };

  // Category view functions
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
    setExpandedCategories(new Set(categoryNames));
  };

  const collapseAllCategories = () => {
    setExpandedCategories(new Set());
  };

  // Group inventory by category for category view
  const inventoryByCategory = categoryNames.reduce((acc: Record<string, any[]>, category: string) => {
    acc[category] = filteredItems.filter((item: any) => item.assetcategory === category);
    return acc;
  }, {} as Record<string, any[]>);

  // Chart data
  const conditionData = {
    excellent: filteredItems.filter((item: any) => item.conditionofasset === 'excellent').length,
    good: filteredItems.filter((item: any) => item.conditionofasset === 'good').length,
    fair: filteredItems.filter((item: any) => item.conditionofasset === 'fair').length,
    poor: filteredItems.filter((item: any) => item.conditionofasset === 'poor').length,
    damaged: filteredItems.filter((item: any) => item.conditionofasset === 'damaged').length,
  };

  const categoryChartData = {
    categories: categoryNames,
    counts: categoryNames.map((cat: any) => filteredItems.filter((item: any) => item.assetcategory === cat).length),
  };

  // Show loading state while data is being fetched
  if (loading) {
    return <AttractiveLoader message="Loading inventory data..." variant="fullscreen" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Total Inventory</h1>
          <p className="mt-1 text-gray-600">Manage, track and analyze all inventory items</p>
          
          {/* Real-time Status Summary */}
          <div className="flex items-center mt-3 space-x-4">
            <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-800">
                {statusCounts.available} Available
              </span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 rounded-full">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-blue-800">
                {statusCounts.issued} Issued
              </span>
            </div>
            {statusCounts.maintenance > 0 && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-yellow-100 rounded-full">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium text-yellow-800">
                  {statusCounts.maintenance} Maintenance
                </span>
              </div>
            )}
            {statusCounts.retired > 0 && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-red-100 rounded-full">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium text-red-800">
                  {statusCounts.retired} Retired
                </span>
              </div>
            )}
            <div className="text-sm text-gray-500">
              Total: {inventoryItems.length} items
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {/* Always show bulk delete button area for debugging */}
          {(user?.role === 'admin' || user?.role === 'stock-manager') && (
            <>
              {/* Selection status indicator */}
              {selectedItems.length > 0 && (
                <div className="flex items-center px-3 py-1 text-sm border border-blue-200 rounded-lg bg-blue-50">
                  <CheckSquare size={16} className="mr-2 text-green-500" />
                  <span className="text-blue-700">{selectedItems.length} selected</span>
                </div>
              )}
              
              {/* Action buttons when items are selected */}
              {selectedItems.length > 0 && (
                <>
                  <button
                    onClick={() => setSelectedItems([])}
                    className="flex items-center px-3 py-2 space-x-2 text-gray-600 transition-all duration-200 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    <X size={16} className="text-red-500" />
                    <span>Clear</span>
                  </button>
                  
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center px-4 py-2 space-x-2 text-white transition-all duration-200 rounded-lg shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  >
                    <Trash2 size={16} className="text-red-500" />
                    <span>Delete Selected ({selectedItems.length})</span>
                  </button>
                </>
              )}
            </>
          )}
          
          {activeTab === 'list' && (
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={isExporting}
                className="flex items-center px-4 py-2 space-x-2 text-white transition-all duration-200 rounded-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={16} className="text-blue-500" />
                <span>{isExporting ? 'Exporting...' : 'Export'}</span>
                <ChevronDown 
                  size={16} 
                  className={`transition-transform duration-200 ₹ {showExportMenu ? 'rotate-180' : ''}`} 
                />
              </button>
              
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                  <div className="p-3 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900">Export Options</h3>
                    <p className="text-xs text-gray-600 mt-1">Choose format and content</p>
                  </div>
                  
                  <div className="p-3 space-y-3">
                    {/* Excel Export Options */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-gray-700 flex items-center">
                        <FileSpreadsheet className="w-3 h-3 mr-1" />
                        Excel Export
                      </h4>
                      
                      <button
                        onClick={exportDataOnlyExcel}
                        disabled={isExporting}
                        className="w-full flex items-center justify-between p-2 text-left text-sm border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                          <span>Data Only</span>
                        </div>
                        <span className="text-xs text-gray-500">Clean</span>
                      </button>
                      
                      <button
                        onClick={exportChartsExcel}
                        disabled={isExporting}
                        className="w-full flex items-center justify-between p-2 text-left text-sm border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <BarChart3 className="w-4 h-4 text-green-600" />
                          <span>With Chart Data</span>
                        </div>
                        <span className="text-xs text-gray-500">Premium</span>
                      </button>
                    </div>

                    {/* CSV Export Option */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-gray-700 flex items-center">
                        <FileText className="w-3 h-3 mr-1" />
                        CSV Export
                      </h4>
                      
                      <button
                        onClick={exportToCSV}
                        disabled={isExporting}
                        className="w-full flex items-center justify-between p-2 text-left text-sm border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-orange-600" />
                          <span>CSV File</span>
                        </div>
                        <span className="text-xs text-gray-500">Simple</span>
                      </button>
                    </div>

                    {/* Debug Option */}
                    {/* <div className="space-y-2">
                      <h4 className="text-xs font-medium text-gray-700 flex items-center">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Debug
                      </h4>
                      
                      <button
                        onClick={debugCharts}
                        disabled={isExporting}
                        className="w-full flex items-center justify-between p-2 text-left text-sm border border-gray-200 rounded-lg hover:border-yellow-300 hover:bg-yellow-50 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                          <span>Test Charts</span>
                        </div>
                        <span className="text-xs text-gray-500">Debug</span>
                      </button>
                    </div> */}
                  </div>
                  
                  {/* <div className="p-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                    <p className="text-xs text-center text-gray-500">
                      📊 Exports ALL data from database
                    </p>
                  </div> */}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl">
        <div className="border-b border-gray-200">
          <nav className="flex px-6 space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('pivot')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ₹ {
                activeTab === 'pivot'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4" />
                <span>Pivot Analysis</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('category')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ₹ {
                activeTab === 'category'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Package className="w-4 h-4" />
                <span>Inventory List</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'pivot' ? (
            <InventoryPivotTable />
          ) : (
            /* Inventory List - Category View renamed */
            <div className="space-y-6">
              {/* Charts Section */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Asset Condition Chart */}
                <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Asset Condition Overview</h3>
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#0d559e] to-[#1a6bb8]"></div>
                  </div>
                  <div className="h-64" ref={conditionChartRef}>
                    <AssetConditionChart data={conditionData} />
                  </div>
                </div>

                {/* Category Distribution Chart */}
                <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Category Distribution</h3>
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#0d559e] to-[#1a6bb8]"></div>
                  </div>
                  <div className="h-64" ref={categoryChartRef}>
                    <CategoryDistributionChart data={categoryChartData} />
                  </div>
                </div>
              </div>


                {/* Category View Filters - same as list view */}
                <div className="p-4 border border-gray-200 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Filter className="w-5 h-5 text-gray-600" />
                      <h3 className="text-lg font-semibold text-gray-800">Filter</h3>
                      {(searchTerm || filterStatus !== 'all' || filterCategory !== 'all') && (
                        <span className="px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={expandAllCategories}
                        className="flex items-center px-3 py-2 space-x-2 text-sm font-medium text-blue-600 transition-all duration-200 bg-white border border-blue-300 rounded-lg hover:bg-blue-50"
                      >
                        <ChevronDown size={16} className="rotate-180" />
                        <span>Expand All</span>
                      </button>
                      <button
                        onClick={collapseAllCategories}
                        className="flex items-center px-3 py-2 space-x-2 text-sm font-medium text-gray-600 transition-all duration-200 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <ChevronDown size={16} />
                        <span>Collapse All</span>
                      </button>
                      <button
                        onClick={resetFilters}
                        className="flex items-center px-3 py-2 space-x-2 text-sm font-medium text-gray-600 transition-all duration-200 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <RotateCcw size={16} />
                        <span>Reset</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div className="relative">
                      <Search className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" size={16} />
                      <input
                        type="text"
                        placeholder="Search inventory..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full py-2 pl-10 pr-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="min-w-48">
                      <StatusDropdown
                        value={filterStatus === 'all' ? '' : filterStatus}
                        onChange={(value) => setFilterStatus(value || 'all')}
                        type="inventory"
                        placeholder="All Status"
                        size="sm"
                      />
                    </div>

                    <div className="min-w-48">
                      <CategoryDropdown
                        value={filterCategory === 'all' ? '' : filterCategory}
                        onChange={(value) => setFilterCategory(value || 'all')}
                        categories={categories}
                        placeholder="Filter by category"
                        size="sm"
                        searchable
                      />
                    </div>

                    <div className="min-w-48">
                      <div className="flex items-center space-x-2">
                        <DateRangePicker
                          startDate={startDate}
                          endDate={endDate}
                          onStartDateChange={setStartDate}
                          onEndDateChange={setEndDate}
                          startPlaceholder="Start date"
                          endPlaceholder="End date"
                          size="sm"
                        />
                        {(startDate || endDate) && (
                          <button
                            onClick={() => {
                              setStartDate(null);
                              setEndDate(null);
                            }}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-200"
                            title="Clear date filter"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Filter size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-600">{filteredItems.length} items across {categoryNames.length} categories</span>
                    </div>
                  </div>
                </div>

                {/* Category Tree Body - This whole table content needs to be removed */}
                <div className="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-2xl">
                  {Object.keys(inventoryByCategory).length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {Object.entries(inventoryByCategory).map((entry: [string, any]) => {
                        const [category, categoryItems] = entry;
                        const isExpanded = expandedCategories.has(category);
                        const categoryStats = {
                          total: categoryItems.length,
                          available: categoryItems.filter((item: any) => item.status === 'available').length,
                          issued: categoryItems.filter((item: any) => item.status === 'issued').length,
                          maintenance: categoryItems.filter((item: any) => item.status === 'maintenance').length,
                          retired: categoryItems.filter((item: any) => item.status === 'retired').length,
                          totalValue: categoryItems.reduce((sum: number, item: any) => sum + (item.totalcost || 0), 0),
                          totalQuantity: categoryItems.reduce((sum: number, item: any) => sum + (item.balancequantityinstock || 0), 0)
                        };

                        return (
                          <div key={category} className="transition-all duration-200 hover:bg-gray-50">
                            {/* Category Header */}
                            <div 
                              className="flex items-center justify-between p-4 cursor-pointer"
                              onClick={() => toggleCategoryExpansion(category)}
                            >
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-r from-[#0d559e] to-[#1a6bb8]">
                                  <Package className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
                                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                                    <span>{categoryStats.total} items</span>
                                    {/* <span>{categoryStats.totalQuantity.toLocaleString()} units</span> */}
                                    <span>₹ {categoryStats.totalValue.toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-4">
                                {/* Quick Stats */}
                                <div className="flex items-center space-x-2 text-sm">
                                  <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800`}>
                                    {categoryStats.available} Available
                                  </span>
                                  <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800`}>
                                    {categoryStats.issued} Issued
                                  </span>
                                  {categoryStats.maintenance > 0 && (
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800`}>
                                      {categoryStats.maintenance} Maintenance
                                    </span>
                                  )}
                                  {categoryStats.retired > 0 && (
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800`}>
                                      {categoryStats.retired} Retired
                                    </span>
                                  )}
                                </div>
                                
                                {/* Expand/Collapse Icon */}
                                <ChevronDown 
                                  size={20}
                                  className={`text-gray-400 transition-transform duration-200 ₹ {
                                    isExpanded ? 'rotate-180' : ''
                                  }`} 
                                />
                              </div>
                            </div>

                            {/* Category Items - Collapsible */}
                            {isExpanded && (
                              <div className="border-t border-gray-100 bg-gray-50">
                                <div className="max-h-96 overflow-y-auto">
                                  <table className="w-full">
                                    <thead className="bg-gray-100 border-b border-gray-200">
                                      <tr>
                                        {user?.role === 'admin' || user?.role === 'stock-manager' ? (
                                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const allItemIds = categoryItems.map((item: any) => item.id);
                                                const allSelected = allItemIds.every((id: string) => selectedItems.includes(id));
                                                if (allSelected) {
                                                  setSelectedItems(prev => prev.filter(id => !allItemIds.includes(id)));
                                                } else {
                                                  setSelectedItems(prev => [...prev, ...allItemIds]);
                                                }
                                              }}
                                              className="flex items-center justify-center w-5 h-5 text-blue-600 border border-gray-300 rounded hover:bg-blue-50"
                                            >
                                              {categoryItems.every((item: any) => selectedItems.includes(item.id)) ? (
                                                <CheckSquare size={16} className="text-green-500" />
                                              ) : (
                                                <Square size={16} />
                                              )}
                                            </button>
                                          </th>
                                        ) : null}
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {categoryItems.map((item: any) => (
                                        <tr key={item.id} className="transition-colors hover:bg-gray-50">
                                          {/* Checkbox for selection */}
                                          {user?.role === 'admin' || user?.role === 'stock-manager' ? (
                                            <td className="px-4 py-4 whitespace-nowrap">
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleSelectItem(item.id);
                                                }}
                                                className="flex items-center justify-center w-5 h-5 text-blue-600 border border-gray-300 rounded hover:bg-blue-50"
                                              >
                                                {selectedItems.includes(item.id) ? (
                                                  <CheckSquare size={16} className="text-green-500" />
                                                ) : (
                                                  <Square size={16} />
                                                )}
                                              </button>
                                            </td>
                                          ) : null}
                                          
                                          <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                              <div className="flex-shrink-0 w-8 h-8">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100">
                                                  <Package className="w-4 h-4 text-blue-600" />
                                                </div>
                                              </div>
                                              <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{item.assetname}</div>
                                                <div className="text-sm text-gray-500">{item.uniqueid}</div>
                                              </div>
                                            </div>
                                          </td>
                                          
                                          <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ₹ {getStatusColor(item.status)}`}>
                                              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                            </span>
                                          </td>
                                          
                                          <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ₹ {getConditionColor(item.conditionofasset)}`}>
                                              {item.conditionofasset.charAt(0).toUpperCase() + item.conditionofasset.slice(1)}
                                            </span>
                                          </td> 
                                          
                                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {item.locationofitem}
                                          </td>
                                          
                                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center space-x-2">
                                              <button 
                                                className="p-1 text-blue-600 rounded hover:text-blue-900"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  console.log('👁️ View button clicked for item:', item);
                                                  setViewingCategory(item);
                                                  console.log('✅ View modal state set:', { viewingCategory: item });
                                                }}
                                              >
                                                <Eye size={16} className="text-blue-500" />
                                              </button>
                                              {user?.role === 'admin' || user?.role === 'stock-manager' ? (
                                                <>
                                                  <button 
                                                    className="p-1 text-green-600 rounded hover:text-green-900"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleUpdate(item);
                                                    }}
                                                  >
                                                    <Edit size={16} className="text-blue-500" />
                                                  </button>
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleDeleteClick(item);
                                                    }}
                                                    className="p-1 text-red-600 rounded hover:text-red-900 hover:bg-red-50"
                                                    title="Delete item"
                                                  >
                                                    <Trash2 size={16} className="text-red-500" />
                                                  </button>
                                                </>
                                              ) : null}
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="mb-2 text-lg font-medium text-gray-900">No inventory items found</h3>
                      <p className="text-gray-600">Try adjusting your search or filter criteria</p>
                    </div>
                  )}
                </div>


              {/* Bulk Delete Confirmation Modal */}
              {showBulkDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm transition-all duration-300">
                  <div className="w-full max-w-md p-6 mx-4 bg-white shadow-2xl rounded-2xl">
                    <div className="flex items-center mb-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-gray-900">Delete Multiple Items</h3>
                        <p className="text-sm text-gray-600">This action cannot be undone</p>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <p className="text-gray-700">
                        Are you sure you want to delete <span className="font-semibold">{selectedItems.length} selected item{selectedItems.length > 1 ? 's' : ''}</span>?
                      </p>
                      <div className="mt-3 overflow-y-auto max-h-32">
                        <ul className="space-y-1 text-sm text-gray-600">
                          {selectedItems.slice(0, 5).map(itemId => {
                            const item = filteredItems.find(i => i.id === itemId);
                            return (
                              <li key={itemId} className="flex items-center">
                                <span className="w-2 h-2 mr-2 bg-red-400 rounded-full"></span>
                                {item?.assetname} ({item?.uniqueid})
                              </li>
                            );
                          })}
                          {selectedItems.length > 5 && (
                            <li className="italic text-gray-400">
                              ... and {selectedItems.length - 5} more items
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          setShowBulkDeleteModal(false);
                        }}
                        className="flex-1 px-4 py-2 text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200"
                        disabled={isDeleting}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmBulkDelete}
                        disabled={isDeleting}
                        className="flex-1 px-4 py-2 text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isDeleting ? 'Deleting...' : `Delete All ₹ {selectedItems.length}`}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Floating Action Bar - appears when items are selected */}
              {selectedItems.length > 0 && (user?.role === 'admin' || user?.role === 'stock-manager') && (
                <div className="fixed z-40 transform -translate-x-1/2 bottom-6 left-1/2">
                  <div className="flex items-center px-6 py-3 space-x-3 bg-white border border-gray-200 rounded-full shadow-2xl">
                    <div className="flex items-center px-3 py-1 text-sm border border-blue-200 rounded-full bg-blue-50">
                      <CheckSquare size={16} className="mr-2 text-green-500" />
                      <span className="font-medium text-blue-700">{selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected</span>
                    </div>
                    
                    <button
                      onClick={() => setSelectedItems([])}
                      className="flex items-center px-4 py-2 space-x-2 text-gray-600 transition-all duration-200 bg-gray-100 rounded-full hover:bg-gray-200"
                    >
                      <X size={16} className="text-red-500" />
                      <span>Clear</span>
                    </button>
                    
                    <button
                      onClick={handleBulkDelete}
                      className="flex items-center px-4 py-2 space-x-2 text-white transition-all duration-200 bg-red-600 rounded-full shadow-lg hover:bg-red-700"
                    >
                      <Trash2 size={16} className="text-red-500" />
                      <span>Delete Selected</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <>
          {console.log('🗑️ Rendering Delete modal', { showDeleteModal, itemToDelete })}
          <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm transition-all duration-300">
          <div className="w-full max-w-md p-6 mx-4 bg-white shadow-2xl rounded-2xl">
            <div className="flex items-center mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Delete Item</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700">
                Are you sure you want to delete <span className="font-semibold">"{itemToDelete?.assetname}"</span>?
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Asset ID: {itemToDelete?.uniqueid}
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setItemToDelete(null);
                }}
                className="flex-1 px-4 py-2 text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
        </>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm transition-all duration-300">
          <div className="w-full max-w-md p-6 mx-4 bg-white shadow-2xl rounded-2xl">
            <div className="flex items-center mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Delete Multiple Items</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700">
                Are you sure you want to delete <span className="font-semibold">{selectedItems.length} selected item{selectedItems.length > 1 ? 's' : ''}</span>?
              </p>
              <div className="mt-3 overflow-y-auto max-h-32">
                <ul className="space-y-1 text-sm text-gray-600">
                  {selectedItems.slice(0, 5).map(itemId => {
                    const item = filteredItems.find(i => i.id === itemId);
                    return (
                      <li key={itemId} className="flex items-center">
                        <span className="w-2 h-2 mr-2 bg-red-400 rounded-full"></span>
                        {item?.assetname} ({item?.uniqueid})
                      </li>
                    );
                  })}
                  {selectedItems.length > 5 && (
                    <li className="italic text-gray-400">
                      ... and {selectedItems.length - 5} more items
                    </li>
                  )}
                </ul>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowBulkDeleteModal(false);
                }}
                className="flex-1 px-4 py-2 text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBulkDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : `Delete All ₹ {selectedItems.length}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Bar - appears when items are selected */}
      {selectedItems.length > 0 && (user?.role === 'admin' || user?.role === 'stock-manager') && (
        <div className="fixed z-40 transform -translate-x-1/2 bottom-6 left-1/2">
          <div className="flex items-center px-6 py-3 space-x-3 bg-white border border-gray-200 rounded-full shadow-2xl">
            <div className="flex items-center px-3 py-1 text-sm border border-blue-200 rounded-full bg-blue-50">
              <CheckSquare size={16} className="mr-2 text-green-500" />
              <span className="font-medium text-blue-700">{selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected</span>
            </div>
            
            <button
              onClick={() => setSelectedItems([])}
              className="flex items-center px-4 py-2 space-x-2 text-gray-600 transition-all duration-200 bg-gray-100 rounded-full hover:bg-gray-200"
            >
              <X size={16} className="text-red-500" />
              <span>Clear</span>
            </button>
            
            <button
              onClick={handleBulkDelete}
              className="flex items-center px-4 py-2 space-x-2 text-white transition-all duration-200 bg-red-600 rounded-full shadow-lg hover:bg-red-700"
            >
              <Trash2 size={16} className="text-red-500" />
              <span>Delete Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* Update Inventory Modal */}
      {showUpdateModal && itemToUpdate && (
        <>
          {console.log('🔧 Rendering UpdateInventory modal', { showUpdateModal, itemToUpdate })}
          <UpdateInventory
            item={itemToUpdate}
            isOpen={showUpdateModal}
            onClose={() => {
              setShowUpdateModal(false);
              setItemToUpdate(null);
            }}
            onUpdate={handleUpdateSuccess}
          />
        </>
      )}

      {/* View Inventory Modal */}
      {viewingCategory && (
        <>
          {console.log('👁️ Rendering ViewInventory modal', { viewingCategory })}
          <ViewInventory
            item={viewingCategory}
            onClose={() => setViewingCategory(null)}
          />
        </>
      )}
    </div>
  );
};

export default InventoryList;
