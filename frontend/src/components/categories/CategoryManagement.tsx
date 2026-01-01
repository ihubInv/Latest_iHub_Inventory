import React, { useState } from 'react';
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useAddAssetNameMutation,
  // Note: useCanDeleteCategoryQuery and useCanRemoveAssetNamesFromCategoryQuery
  // are not implemented. Backend handles validation.
  useGetAssetsQuery,
  useCreateAssetMutation,
  useUpdateAssetMutation,
  useDeleteAssetMutation,
  // Note: useCanDeleteAssetQuery not implemented. Backend handles validation.
  useGetInventoryItemsQuery,
  inventoryApi
} from '../../store/api';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import DateRangePicker from '../common/DateRangePicker';
import { CategoryDistributionChart } from '../charts/ChartComponents';
import CategoryTypeDropdown from '../common/CategoryTypeDropdown';
import FilterDropdown, { categoryTypeFilters, statusFilters } from '../common/FilterDropdown';
import { formatDate, formatDateTime } from '../../utils/dateUtils';
import type { Category } from '../../types';
import { 
  FolderPlus, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Calendar,
  Package,
  Zap,
  Eye,
  Save,
  X,
  Layers,
  Box
} from 'lucide-react';
import { CRUDToasts } from '../../services/toastService';
import toast from 'react-hot-toast';

const CategoryManagement: React.FC = () => {
  const { data: categoriesResponse, error: categoriesError, isLoading: categoriesLoading } = useGetCategoriesQuery({});
  const categories = categoriesResponse?.data || [];
  
  const [createCategory] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [addAssetName] = useAddAssetNameMutation();
  const { data: assetsResponse } = useGetAssetsQuery({});
  const assets = assetsResponse?.data || [];

  // Fetch inventory items to check usage
  const { data: inventoryResponse } = useGetInventoryItemsQuery({});
  const inventoryItems = inventoryResponse?.data || [];
  const [createAsset] = useCreateAssetMutation();
  const [updateAsset] = useUpdateAssetMutation();
  const [deleteAsset] = useDeleteAssetMutation();
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingAsset, setEditingAsset] = useState<any>(null);
  const [viewingCategory, setViewingCategory] = useState<any>(null);
  const [viewingAsset, setViewingAsset] = useState<any>(null);

  const [newCategory, setNewCategory] = useState({
    name: '',
    assetnames: [] as (string | any)[],
    type: 'major' as const,
    description: '',
    isactive: true
  });

  // Get validation data for the category being edited
  // Check if asset names are being used in inventory
  const canRemoveAssetNames = (assetName: string) => {
    return !inventoryItems.some((item: any) => item.assetname === assetName);
  };

  const [newAsset, setNewAsset] = useState({
    name: '',
    description: '',
    assetcategory: ''
  });

  const [currentAssetName, setCurrentAssetName] = useState('');
  const [assetNameChanges, setAssetNameChanges] = useState<{ oldName: string; newName: string }[]>([]);

  // Function to add asset name to the list
  const addAssetNameToList = () => {
    if (currentAssetName.trim()) {
      const assetName = currentAssetName.trim();
      
      // Check if asset already exists (handle both string and object formats)
      const alreadyExists = newCategory.assetnames.some(name => {
        const displayName = typeof name === 'string' ? name : (name as any)?.assetname || (name as any)?.name || String(name);
        return displayName === assetName;
      });
      
      if (alreadyExists) {
        toast.error('Asset name already exists in this category');
        return;
      }
      
      setNewCategory(prev => ({
        ...prev,
        assetnames: [...prev.assetnames, assetName]
      }));
      setCurrentAssetName('');
      
      toast.success(`Asset "${assetName}" added to category`);
    }
  };

  // Function to remove asset name from the list
  const removeAssetName = (assetName: string) => {
    // If we're editing a category, check if we can remove asset names
    if (editingCategory) {
      // For now, we'll allow removal but the API will validate
      // In a more advanced implementation, we could check here first
    }
    
    setNewCategory(prev => ({
      ...prev,
      assetnames: prev.assetnames.filter(name => {
        // Handle both string and object formats
        const displayName = typeof name === 'string' ? name : (name as any)?.assetname || (name as any)?.name || String(name);
        return displayName !== assetName;
      })
    }));
    
    toast.success(`Asset "${assetName}" removed from category`);
  };

  // Function to edit asset name in the list
  const editAssetName = (oldName: string, newName: string) => {
    // Update the local state
    setNewCategory(prev => ({
      ...prev,
      assetnames: prev.assetnames.map(name => {
        // Handle both string and object formats
        const displayName = typeof name === 'string' ? name : (name as any)?.assetname || (name as any)?.name || String(name);
        return displayName === oldName ? newName : name;
      })
    }));
    
    // Track the change for API call
    setAssetNameChanges(prev => {
      // Remove any existing change for this old name
      const filtered = prev.filter(change => change.oldName !== oldName);
      // Add the new change
      return [...filtered, { oldName, newName }];
    });
  };

  // Function to handle Enter key press
  const handleAssetNameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addAssetNameToList();
    }
  };

    const filteredCategories = categories.filter((category: any) => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || category.type === filterType;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && category.isactive) ||
                         (filterStatus === 'inactive' && !category.isactive);
    
    let matchesDate = true;
    if (startDate && endDate) {
      const categoryDate = new Date(category.createdat);
      matchesDate = categoryDate >= startDate && categoryDate <= endDate;
    }
    
    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

  

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newAsset.name.trim()) {
      const loadingToast = CRUDToasts.creating('asset');
      try {
        await createAsset({
          name: newAsset.name.trim(),
          description: newAsset.description.trim(),
          assetcategory: newAsset.assetcategory.trim(),
          isactive: true,
          createdby: user?.id || 'unknown'
        }).unwrap();
        toast.dismiss(loadingToast);
        setNewAsset({
          name: '',
          description: '',
          assetcategory: ''
        });
        setShowAddAssetModal(false);
        CRUDToasts.created('asset');
      } catch (err) {
        console.error('Failed to add asset:', err);
        toast.dismiss(loadingToast);
        CRUDToasts.createError('asset', 'Please try again');
      }
    }
  };

  const handleEditAsset = (asset: any) => {
    setEditingAsset(asset);
    setNewAsset({
      name: asset.name,
      description: asset.description || '',
      assetcategory: asset.assetcategory || ''
    });
    setShowAddAssetModal(true);
  };

  const handleUpdateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAsset && newAsset.name.trim()) {
      const loadingToast = CRUDToasts.updating('asset');
      try {
        await updateAsset({
          id: editingAsset.id,
          updates: {
            name: newAsset.name.trim(),
            description: newAsset.description.trim(),
            assetcategory: newAsset.assetcategory.trim()
          }
        }).unwrap();
        toast.dismiss(loadingToast);
        setEditingAsset(null);
        setNewAsset({
          name: '',
          description: '',
          assetcategory: ''
        });
        setShowAddAssetModal(false);
        CRUDToasts.updated('asset');
      } catch (err) {
        console.error('Failed to update asset:', err);
        toast.dismiss(loadingToast);
        CRUDToasts.updateError('asset', 'Please try again');
      }
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    const loadingToast = CRUDToasts.deleting('asset');
    try {
      await deleteAsset(assetId).unwrap();
      toast.dismiss(loadingToast);
      CRUDToasts.deleted('asset');
    } catch (err: any) {
      console.error('Failed to delete asset:', err);
      toast.dismiss(loadingToast);
      
      // Show detailed error message if it contains inventory item information
      if (err?.message && err.message.includes('inventory item')) {
        toast.error(err.message, { duration: 8000 });
      } else {
        CRUDToasts.deleteError('asset', err?.message || 'Please try again');
      }
    }
  };

  const handleViewAsset = (asset: any) => {
    setViewingAsset(asset);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = CRUDToasts.creating('category');
    try {
      console.log('🔍 Creating category:', { 
        name: newCategory.name, 
        type: newCategory.type, 
        description: newCategory.description,
        assetCount: newCategory.assetnames.length 
      });
      
      // Create the category first (without asset names)
      const categoryResponse = await createCategory({
        name: newCategory.name,
        type: newCategory.type,
        description: newCategory.description,
        isactive: newCategory.isactive,
        createdby: user?.id || 'unknown'
      }).unwrap();

      console.log('✅ Category created successfully:', categoryResponse.data._id);

      // Then add asset names to the created category
      if (newCategory.assetnames && newCategory.assetnames.length > 0) {
        console.log('🔍 Adding asset names to category:', newCategory.assetnames);
        
        const assetPromises = newCategory.assetnames.map((assetName) => 
          addAssetName({
            id: categoryResponse.data._id,
            assetName: typeof assetName === 'string' ? assetName : assetName.name || assetName.assetname
          }).unwrap().catch(err => {
            const assetNameStr = typeof assetName === 'string' ? assetName : assetName.name || assetName.assetname;
            console.error(`Failed to add asset "${assetNameStr}":`, err);
            return null; // Don't fail the entire operation if one asset fails
          })
        );
        
        await Promise.allSettled(assetPromises);
        console.log('✅ Asset names added to category');
      }

      toast.dismiss(loadingToast);
      
      // Show success message with asset count
      const assetCount = newCategory.assetnames.length;
      if (assetCount > 0) {
        toast.success(`Category "${newCategory.name}" created successfully with ${assetCount} asset${assetCount > 1 ? 's' : ''}!`);
      } else {
        CRUDToasts.created('category');
      }
      
      setNewCategory({
        name: '',
        assetnames: [],
        type: 'major',
        description: '',
        isactive: true
      });
      setCurrentAssetName('');
      setShowAddModal(false);
    } catch (err) {
      console.error('Failed to add category:', err);
      toast.dismiss(loadingToast);
      CRUDToasts.createError('category', 'Please try again');
    }
  };
  
  const handleEditCategory = (category: any) => {
    console.log('🔍 Editing category:', category);
    setEditingCategory(category);
    
    // Handle assetnames properly - extract strings from objects if needed
    const processedAssetNames = (category.assetnames || []).map((assetName: any) => {
      if (typeof assetName === 'string') return assetName;
      if (typeof assetName === 'object' && assetName !== null) {
        return assetName.assetname || assetName.name || assetName.label || String(assetName);
      }
      return String(assetName);
    }).filter(Boolean);
    
    setNewCategory({
      name: category.name,
      assetnames: processedAssetNames,
      type: category.type,
      description: category.description || '',
      isactive: category.isactive
    });
    setAssetNameChanges([]); // Clear any previous changes
    setShowAddModal(true);
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      const loadingToast = CRUDToasts.updating('category');
      try {
        console.log('🔍 Updating category:', {
          id: editingCategory.id,
          data: {
            name: newCategory.name,
            type: newCategory.type,
            description: newCategory.description,
            isactive: newCategory.isactive
          }
        });
        
        await updateCategory({
          id: editingCategory.id,
          data: {
            name: newCategory.name,
            type: newCategory.type,
            description: newCategory.description,
            isactive: newCategory.isactive
          }
        }).unwrap();
        
        // Note: Asset names are managed separately through add/remove asset name endpoints
        // Asset name changes are not sent to the category update endpoint
        
        toast.dismiss(loadingToast);
        setEditingCategory(null);
        setNewCategory({
          name: '',
          assetnames: [],
          type: 'major',
          description: '',
          isactive: true
        });
        setCurrentAssetName('');
        setAssetNameChanges([]);
        setShowAddModal(false);
        CRUDToasts.updated('category');
      } catch (err: any) {
        console.error('Failed to update category:', err);
        toast.dismiss(loadingToast);
        
        // Show detailed error message if it contains inventory item information
        if (err?.message && err.message.includes('inventory item')) {
          toast.error(err.message, { duration: 8000 });
        } else {
          CRUDToasts.updateError('category', err?.message || 'Please try again');
        }
      }
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const loadingToast = CRUDToasts.deleting('category');
    try {
      await deleteCategory(categoryId).unwrap();
      toast.dismiss(loadingToast);
      CRUDToasts.deleted('category');
    } catch (err: any) {
      console.error('Failed to delete category:', err);
      toast.dismiss(loadingToast);
      
      // Show detailed error message if it contains inventory item information
      if (err?.message && err.message.includes('inventory item')) {
        toast.error(err.message, { duration: 8000 });
      } else {
        CRUDToasts.deleteError('category', err?.message || 'Please try again');
      }
    }
  };

  const toggleCategoryStatus = (categoryId: string, currentStatus: boolean) => {
    updateCategory({
      id: categoryId,
      updates: { isactive: !currentStatus }
    });
  };

  const getTypeIcon = (type: string) => {
    return type === 'major' ? Package : Zap;
  };

  const getTypeColor = (type: string) => {
    return type === 'major' 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-purple-100 text-purple-800';
  };

  const getStatusColor = (isactive: boolean) => {
    return isactive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const stats = {
    total: categories.length,
    major: categories.filter((cat: any) => cat.type === 'major').length,
    minor: categories.filter((cat: any) => cat.type === 'minor').length,
    active: categories.filter((cat: any) => cat.isactive).length,
    inactive: categories.filter((cat: any) => !cat.isactive).length
  };

  // Chart data for category distribution
  const categoryChartData = {
    categories: ['Major', 'Minor'],
    counts: [stats.major, stats.minor],
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Category Management</h1>
          <p className="mt-1 text-sm sm:text-base text-gray-600">Manage inventory categories and their classifications</p>
        </div>
      </div>

          {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
        <div className="p-4 sm:p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Categories</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-[#0d559e] to-[#1a6bb8]">
              <FolderPlus className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Major</p>
              <p className="text-2xl font-bold text-gray-900">{stats.major}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-[#0d559e] to-[#1a6bb8]">
              <Package className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Minor</p>
              <p className="text-2xl font-bold text-gray-900">{stats.minor}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-[#0d559e] to-[#1a6bb8]">
              <Zap className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-[#0d559e] to-[#1a6bb8]">
              <FolderPlus className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inactive</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-[#0d559e] to-[#1a6bb8]">
              <FolderPlus className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Category Distribution Chart */}
      <div className="p-4 sm:p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Category Type Distribution</h3>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#0d559e] to-[#1a6bb8]"></div>
            <span className="text-sm text-gray-600">Current data</span>
          </div>
        </div>
        <div className="h-48 sm:h-64">
          <CategoryDistributionChart data={categoryChartData} />
        </div>
      </div>

      {/* Category Management Header */}
      <div className="p-4 sm:p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Category Management</h3>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center px-4 py-2 space-x-2 text-white transition-all duration-200 rounded-lg shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 hover:shadow-xl"
          >
            <Plus size={16} className="text-green-500" />
            <span className="hidden sm:inline">Add Category</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 sm:p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <div className="relative">
            <Search className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" size={16} />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <FilterDropdown
            value={filterType}
            onChange={setFilterType}
            options={categoryTypeFilters}
            placeholder="Filter by type"
            size="sm"
          />

          <FilterDropdown
            value={filterStatus}
            onChange={setFilterStatus}
            options={statusFilters}
            placeholder="Filter by status"
            size="sm"
          />


          <div className="sm:col-span-2">
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              startPlaceholder="Start Date"
              endPlaceholder="End Date"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 gap-2">
          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-gray-400" />
            <span className="text-sm text-gray-600">{filteredCategories.length} categories found</span>
          </div>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterType('all');
              setFilterStatus('all');
              setStartDate(null);
              setEndDate(null);
            }}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 self-start sm:self-auto"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Categories Table */}
      <div className="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-2xl">
        {filteredCategories.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Category</th>
                    <th className="px-3 sm:px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase hidden sm:table-cell">Type</th>
                    <th className="px-3 sm:px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase hidden md:table-cell">Assets</th>
                    <th className="px-3 sm:px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Status</th>
                    <th className="px-3 sm:px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase hidden lg:table-cell">Created</th>
                    <th className="px-3 sm:px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase hidden xl:table-cell">Updated</th>
                    <th className="px-3 sm:px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                
                {filteredCategories?.map((category) => {
                  const TypeIcon = getTypeIcon(category.type);
                  
                  return (
                    <tr key={category.id} className="transition-colors hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10">
                            <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-r ${
                              category.type === 'major' 
                                ? 'from-[#0d559e] to-[#1a6bb8]' 
                                : 'from-[#0d559e] to-[#1a6bb8]'
                            } flex items-center justify-center`}>
                              <TypeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </div>
                          </div>
                          <div className="ml-3 sm:ml-4">
                            <div className="text-sm font-medium text-gray-900">{category.name}</div>
                            <div className="max-w-xs text-xs sm:text-sm text-gray-500 truncate">
                              {category.description || 'No description'}
                            </div>
                            {/* Show type on mobile */}
                            <div className="sm:hidden mt-1">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(category?.type)}`}>
                                {category?.type?.charAt(0)?.toUpperCase() + category?.type?.slice(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(category?.type)}`}>
                            {category?.type?.charAt(0)?.toUpperCase() + category?.type?.slice(1)}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                          <div className="max-w-xs">
                            {category.assetnames && category.assetnames.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {category.assetnames.slice(0, 3).map((assetName: any, index: number) => {
                                  // Handle both string and object formats
                                  const displayName = typeof assetName === 'string' ? assetName : assetName?.assetname || assetName?.name || String(assetName);
                                  return (
                                    <span
                                      key={`${category.id}-asset-${index}`}
                                      className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                                    >
                                      {displayName}
                                    </span>
                                  );
                                })}
                                {category.assetnames.length > 3 && (
                                  <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                    +{category.assetnames.length - 3} more
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-500">No assets</span>
                            )}
                          </div>
                        </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(category?.isactive)}`}>
                          {category?.isactive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-sm text-gray-900 whitespace-nowrap hidden lg:table-cell">
                        {formatDate(category.createdat)}
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-sm text-gray-900 whitespace-nowrap hidden xl:table-cell">
                        {formatDate(category.updatedat)}
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-sm font-medium whitespace-nowrap">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <button
                            onClick={() => setViewingCategory(category)}
                            className="p-1 text-blue-600 transition-colors rounded hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye size={14} className="sm:w-4 sm:h-4 text-blue-500" />
                          </button>
                          <button
                            onClick={() => handleEditCategory(category)}
                            className="p-1 text-green-600 transition-colors rounded hover:text-green-900"
                            title="Edit Category"
                          >
                            <Edit size={14} className="sm:w-4 sm:h-4 text-blue-500" />
                          </button>
                          <button
                            onClick={() => toggleCategoryStatus(category.id, category.isactive)}
                            className={`p-1 rounded transition-colors ${
                              category.isactive 
                                ? 'text-orange-600 hover:text-orange-900' 
                                : 'text-green-600 hover:text-green-900'
                            }`}
                            title={category.isactive ? 'Deactivate' : 'Activate'}
                          >
                            {category.isactive ? '⏸' : '▶'}
                          </button>
                          {(user?.role === 'admin' || user?.role === 'stock-manager') && (
                            <DeleteButtonWithWarning
                              id={category.id}
                              type="category"
                              onDelete={handleDeleteCategory}
                            >
                              <Trash2 size={14} className="sm:w-4 sm:h-4 text-red-500" />
                            </DeleteButtonWithWarning>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 sm:py-12 text-center">
            <FolderPlus className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="mb-2 text-base sm:text-lg font-medium text-gray-900">No categories found</h3>
            <p className="text-sm sm:text-base text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* Add/Edit Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-300">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6 bg-white rounded-2xl">
            <h3 className="mb-4 text-lg sm:text-xl font-semibold text-gray-900">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h3>
            
            <form onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory} className="space-y-4">
            <div>
                <CategoryTypeDropdown
                  label="Asset Type *"
                  value={newCategory.type}
                  onChange={(value) => setNewCategory((prev:any) => ({ ...prev, type: value as 'major' | 'minor' }))}
                  placeholder="Select asset type"
                  required
                  size="sm"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Category Name *</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Electronics, Furniture, Office Supplies"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Asset Names</label>
                <div className="space-y-3">
                  {/* Input field for adding asset names */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={currentAssetName}
                      onChange={(e) => setCurrentAssetName(e.target.value)}
                      onKeyPress={handleAssetNameKeyPress}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Type asset name and press Enter or click Add"
                    />
                    <button
                      type="button"
                      onClick={addAssetNameToList}
                      disabled={!currentAssetName.trim()}
                      className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  
                  {/* Display added asset names */}
                  {newCategory.assetnames.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Added Assets:</p>
                      <div className="flex flex-wrap gap-2">
                        {newCategory.assetnames.map((assetName, index) => (
                          <AssetNameWithWarning
                            key={`new-asset-${index}-${assetName}`}
                            assetName={assetName}
                            categoryId={editingCategory?.id || ''}
                            onRemove={removeAssetName}
                            onEdit={editAssetName}
                            usedAssetNames={inventoryItems}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>


              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of this category..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isactive"
                  checked={newCategory.isactive}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, isactive: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isactive" className="block ml-2 text-sm text-gray-900">
                  Active Category
                </label>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end pt-4 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingCategory(null);
                    setNewCategory({
                      name: '',
                      assetnames: [],
                      type: 'major',
                      description: '',
                      isactive: true
                    });
                    setCurrentAssetName('');
                  }}
                  className="flex items-center justify-center px-4 py-2 space-x-2 text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <X size={16} className="text-red-500" />
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  className="flex items-center justify-center px-4 py-2 space-x-2 text-white transition-all duration-200 rounded-lg shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 hover:shadow-xl"
                >
                  <Save size={16} className="text-green-500" />
                  <span>{editingCategory ? 'Update' : 'Add'} Category</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Category Modal */}
      {viewingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-300">
          <div className="w-full max-w-lg p-6 bg-white rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Category Details</h3>
              <button
                onClick={() => setViewingCategory(null)}
                className="text-gray-400 transition-colors hover:text-gray-600"
              >
                <X size={20} className="text-red-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${
                  viewingCategory.type === 'major' 
                    ? 'from-[#0d559e] to-[#1a6bb8]' 
                    : 'from-[#0d559e] to-[#1a6bb8]'
                }`}>
                  {viewingCategory.type === 'major' ? (
                    <Package className="w-6 h-6 text-white" />
                  ) : (
                    <Zap className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">{viewingCategory.name}</h4>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(viewingCategory?.type)}`}>
                    {viewingCategory?.type?.charAt(0)?.toUpperCase() + viewingCategory?.type?.slice(1)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Asset Names</label>
                <div className="p-3 rounded-lg bg-gray-50">
                  {viewingCategory.assetnames && viewingCategory.assetnames.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {viewingCategory.assetnames.map((assetName: any, index: number) => {
                        // Handle both string and object formats
                        const displayName = typeof assetName === 'string' ? assetName : assetName?.assetname || assetName?.name || String(assetName);
                        return (
                          <span
                            key={`viewing-asset-${index}-${displayName}`}
                            className="inline-flex px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded-full"
                          >
                            {displayName}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-900">No asset names provided</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Description</label>
                <p className="p-3 text-gray-900 rounded-lg bg-gray-50">
                  {viewingCategory.description || 'No description provided'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(viewingCategory.isactive)}`}>
                    {viewingCategory.isactive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Category ID</label>
                  <p className="font-mono text-sm text-gray-600">{viewingCategory.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Created</label>
                  <p className="text-sm text-gray-900">{formatDateTime(viewingCategory.createdAt)}</p>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Last Updated</label>
                  <p className="text-sm text-gray-900">{formatDateTime(viewingCategory.updatedAt)}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-6 mt-6 space-x-3 border-t border-gray-200">
              <button
                onClick={() => {
                  setViewingCategory(null);
                  handleEditCategory(viewingCategory);
                }}
                className="flex items-center px-4 py-2 space-x-2 text-white transition-all duration-200 rounded-lg bg-gradient-to-r from-[#0d559e] to-[#1a6bb8] hover:from-green-600 hover:to-teal-700"
              >
                <Edit size={16} className="text-blue-500" />
                <span>Edit Category</span>
              </button>
              <button
                onClick={() => setViewingCategory(null)}
                className="px-4 py-2 text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Category Modal */}

      {/* Add Asset Modal */}
      {showAddAssetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-300">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6 bg-white rounded-2xl">
            <h3 className="mb-4 text-lg sm:text-xl font-semibold text-gray-900">
              {editingAsset ? 'Edit Asset' : 'Add New Asset'}
            </h3>
            
            <form onSubmit={editingAsset ? handleUpdateAsset : handleAddAsset} className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Asset Name *</label>
                <input
                  type="text"
                  value={newAsset.name}
                  onChange={(e) => setNewAsset(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Dell Laptop, Office Chair, HP Printer"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Asset Category</label>
                <input
                  type="text"
                  value={newAsset.assetcategory}
                  onChange={(e) => setNewAsset(prev => ({ ...prev, assetcategory: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Electronics, Furniture, IT Equipment"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Description (Optional)</label>
                <textarea
                  value={newAsset.description}
                  onChange={(e) => setNewAsset(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Brief description of this asset..."
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end pt-4 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddAssetModal(false);
                    setEditingAsset(null);
                    setNewAsset({
                      name: '',
                      description: '',
                      assetcategory: ''
                    });
                  }}
                  className="flex items-center justify-center px-4 py-2 space-x-2 text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <X size={16} className="text-red-500" />
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  className="flex items-center justify-center px-4 py-2 space-x-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Save size={16} className="text-green-500" />
                  <span>{editingAsset ? 'Update' : 'Add'} Asset</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Smart tooltip component that adjusts position based on screen boundaries
const SmartTooltip: React.FC<{
  content: string;
  children: React.ReactNode;
  className?: string;
}> = ({ content, children, className = "" }) => {
  const [tooltipPosition, setTooltipPosition] = React.useState<'top' | 'bottom'>('top');
  const [isVisible, setIsVisible] = React.useState(false);
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isVisible && tooltipRef.current && triggerRef.current) {
      const tooltip = tooltipRef.current;
      const trigger = triggerRef.current;
      const rect = trigger.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      
      // Check if tooltip would go off screen
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      
      if (spaceAbove < tooltipRect.height + 10 && spaceBelow > tooltipRect.height + 10) {
        setTooltipPosition('bottom');
      } else {
        setTooltipPosition('top');
      }
    }
  }, [isVisible]);

  return (
    <div 
      ref={triggerRef}
      className={`relative group ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`absolute left-1/2 transform -translate-x-1/2 px-3 py-2 text-sm text-white bg-gray-800 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 max-w-xs break-words shadow-lg ${
            tooltipPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          <div className="relative">
            {content}
            {/* Arrow */}
            <div className={`absolute left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 ${
              tooltipPosition === 'top' 
                ? 'top-full border-t-4 border-transparent border-t-gray-800' 
                : 'bottom-full border-b-4 border-transparent border-b-gray-800'
            }`}></div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component to show delete warning for categories/assets with dependencies
const DeleteButtonWithWarning: React.FC<{
  id: string;
  type: 'category' | 'asset';
  onDelete: (id: string) => void;
  children: React.ReactNode;
}> = ({ id, type, onDelete, children }) => {
  // Simplified: Backend will handle validation
  // If items are in use, backend will return error
  const canDelete = true;
  const inventoryItems: string[] = [];

  if (!canDelete) {
    const tooltipContent = `Cannot delete ${type}. Used by: ${inventoryItems.slice(0, 2).join(', ')}${inventoryItems.length > 2 ? ` and ${inventoryItems.length - 2} more` : ''}`;
    
    return (
      <SmartTooltip content={tooltipContent}>
        <button
          disabled
          className="p-1 text-gray-400 transition-colors rounded cursor-not-allowed"
        >
          {children}
        </button>
      </SmartTooltip>
    );
  }

  return (
    <button
      onClick={() => onDelete(id)}
      className="p-1 text-red-600 transition-colors rounded hover:text-red-900"
      title={`Delete ${type}`}
    >
      {children}
    </button>
  );
};

// Helper component to show asset name with removal warning and edit functionality
const AssetNameWithWarning: React.FC<{
  assetName: string | any;
  categoryId: string;
  onRemove: (name: string) => void;
  onEdit: (oldName: string, newName: string) => void;
  usedAssetNames: string[];
}> = ({ assetName, categoryId, onRemove, onEdit, usedAssetNames }) => {
  // Handle both string and object formats
  const displayName = typeof assetName === 'string' ? assetName : assetName?.assetname || assetName?.name || String(assetName);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(displayName);
  
  // Check if this specific asset name is used
  const isAssetNameUsed = usedAssetNames.includes(displayName);
  
  const handleSave = () => {
    if (editValue.trim() && editValue.trim() !== displayName) {
      onEdit(displayName, editValue.trim());
    }
    setIsEditing(false);
    setEditValue(displayName);
  };
  
  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(displayName);
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };
  
  if (isEditing) {
    return (
      <span className="inline-flex items-center px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyPress}
          onBlur={handleSave}
          className="bg-transparent border-none outline-none text-green-800 min-w-0 flex-1"
          autoFocus
        />
        <button
          type="button"
          onClick={handleSave}
          className="ml-1 text-green-600 hover:text-green-800"
          title="Save"
        >
          ✓
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="ml-1 text-green-600 hover:text-green-800"
          title="Cancel"
        >
          ✕
        </button>
      </span>
    );
  }
  
  if (isAssetNameUsed) {
    return (
      <SmartTooltip content="Cannot remove. This asset name is used in inventory items.">
        <span className="inline-flex items-center px-3 py-1 text-sm bg-orange-100 text-orange-800 rounded-full">
          {displayName}
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="ml-2 text-orange-600 hover:text-orange-800"
            title="Edit asset name"
          >
            ✏️
          </button>
          <span className="ml-1 text-orange-600">
            ⚠️
          </span>
        </span>
      </SmartTooltip>
    );
  }

  return (
    <span className="inline-flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
      {displayName}
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="ml-2 text-blue-600 hover:text-blue-800"
        title="Edit asset name"
      >
        ✏️
      </button>
      <button
        type="button"
        onClick={() => onRemove(displayName)}
        className="ml-1 text-blue-600 hover:text-blue-800"
        title="Remove asset name"
      >
        <X size={14} className="text-red-500" />
      </button>
    </span>
  );
};

export default CategoryManagement;