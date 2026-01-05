import React, { useState, useRef, useEffect } from 'react';
import { Package, Tag, Plus, Trash2, X, ChevronDown, Check, Search } from 'lucide-react';
import type { Category, InventoryItem } from '../../types';
import { useAddAssetNameMutation, useRemoveAssetNameMutation } from '../../store/api';
import toast from 'react-hot-toast';

interface AssetNameDropdownProps {
  categories: Category[];
  categoryType: string;
  assetCategory: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
  searchable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  inventoryItems?: InventoryItem[]; // For checking if asset name is used
  showAddButton?: boolean; // Show add/delete buttons
  showDeleteButton?: boolean; // Show delete button for each asset name
}

const AssetNameDropdown: React.FC<AssetNameDropdownProps> = ({
  categories,
  categoryType,
  assetCategory,
  value,
  onChange,
  placeholder = "Select asset name",
  searchable = true,
  inventoryItems = [],
  showAddButton = true,
  showDeleteButton = true,
  ...props
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetDescription, setNewAssetDescription] = useState('');
  const [assetNameToDelete, setAssetNameToDelete] = useState<string | null>(null);
  const [addAssetName, { isLoading: isAdding }] = useAddAssetNameMutation();
  const [removeAssetName, { isLoading: isRemoving }] = useRemoveAssetNameMutation();

  // Find the selected category
  const selectedCategory = categories.find((cat: any) => 
    cat.name === assetCategory && cat.type === categoryType && cat.isactive
  );

  // Filter categories based on selected type and category
  const filteredCategories = categories.filter((category: any) => {
    const matchesType = !categoryType || category.type === categoryType;
    const matchesCategory = !assetCategory || category.name === assetCategory;
    return matchesType && matchesCategory && category.isactive;
  });

  // Extract unique asset names from filtered categories
  const assetNames = [...new Set(
    filteredCategories
      .flatMap(category => category.assetnames || [])
      .filter(Boolean)
      .map(assetName => {
        if (typeof assetName === 'string') {
          return assetName;
        } else if (typeof assetName === 'object' && assetName !== null) {
          return assetName.assetname || assetName.name || assetName.label || String(assetName);
        }
        return String(assetName);
      })
      .filter(assetName => assetName && assetName !== 'undefined' && assetName !== 'null')
  )];

  // Check if an asset name is used in inventory
  const isAssetNameUsed = (assetName: string): boolean => {
    return inventoryItems.some((item: any) => 
      item.assetname?.toLowerCase() === assetName.toLowerCase()
    );
  };

  // Handle adding new asset name
  const handleAddAssetName = async () => {
    if (!newAssetName.trim()) {
      toast.error('Please enter an asset name');
      return;
    }

    if (!selectedCategory) {
      toast.error('Please select a category first');
      return;
    }

    // Check if asset name already exists
    const exists = assetNames.some(name => 
      name.toLowerCase() === newAssetName.trim().toLowerCase()
    );

    if (exists) {
      toast.error('This asset name already exists in this category');
      return;
    }

    try {
      await addAssetName({
        id: selectedCategory.id || selectedCategory._id,
        assetName: newAssetName.trim()
      }).unwrap();

      toast.success('Asset name added successfully!');
      setNewAssetName('');
      setNewAssetDescription('');
      setShowAddModal(false);
      
      // Select the newly added asset name
      onChange(newAssetName.trim());
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to add asset name');
    }
  };

  // Handle deleting asset name
  const handleDeleteAssetName = async (assetName: string) => {
    if (!selectedCategory) {
      toast.error('Category not found');
      return;
    }

    // Check if asset name is used in inventory
    if (isAssetNameUsed(assetName)) {
      toast.error(`Cannot delete "${assetName}" - it is used in inventory items`);
      return;
    }

    try {
      await removeAssetName({
        id: selectedCategory.id || selectedCategory._id,
        assetName: assetName
      }).unwrap();

      toast.success('Asset name deleted successfully!');
      setAssetNameToDelete(null);
      
      // Clear selection if deleted asset was selected
      if (value === assetName) {
        onChange('');
      }
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to delete asset name');
    }
  };

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [opensUpward, setOpensUpward] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Calculate dropdown position based on available space
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const calculatePosition = () => {
        if (!dropdownRef.current) return;
        
        const triggerRect = dropdownRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        // Calculate available space below and above
        const spaceBelow = viewportHeight - triggerRect.bottom;
        const spaceAbove = triggerRect.top;
        
        // Default max height for dropdown menu (max-h-80 = 320px)
        // Add some padding for better UX (20px margin)
        const maxMenuHeight = 320;
        const requiredSpace = maxMenuHeight + 20;
        
        // If not enough space below but more space above, open upward
        if (spaceBelow < requiredSpace && spaceAbove > spaceBelow) {
          setOpensUpward(true);
        } else {
          setOpensUpward(false);
        }
      };

      // Calculate immediately
      calculatePosition();

      // Recalculate on scroll and resize
      const handlePositionUpdate = () => {
        if (isOpen) {
          calculatePosition();
        }
      };

      window.addEventListener('scroll', handlePositionUpdate, true);
      window.addEventListener('resize', handlePositionUpdate);

      return () => {
        window.removeEventListener('scroll', handlePositionUpdate, true);
        window.removeEventListener('resize', handlePositionUpdate);
      };
    }
  }, [isOpen, assetNames.length, searchTerm]); // Recalculate when dropdown opens or options change

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    // Close dropdown when clicking outside
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const selectedOption = assetNames.find(name => name === value);

  const filteredAssetNames = searchable 
    ? assetNames.filter(name => 
        name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : assetNames;

  const handleSelect = (assetName: string) => {
    if (!props.disabled) {
      onChange(assetName);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, assetName: string) => {
    e.stopPropagation(); // Prevent dropdown from closing immediately
    const isUsed = isAssetNameUsed(assetName);
    if (!isUsed) {
      setIsOpen(false); // Close dropdown when opening delete modal
      setAssetNameToDelete(assetName);
    }
  };

  // Show placeholder message if no options available
  const displayPlaceholder = !categoryType || !assetCategory 
    ? "Select category type and asset category first"
    : assetNames.length === 0 
      ? "No asset names available. Click 'Add Asset Name' to create one."
      : placeholder;

  return (
    <div className={`space-y-2 ${props.className || ''}`}>
      {props.label && (
        <label className="block mb-2 text-sm font-medium text-gray-700">
          {props.label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => !props.disabled && setIsOpen(!isOpen)}
          disabled={props.disabled || !categoryType || !assetCategory}
          className={`
            w-full text-left rounded-xl shadow-sm transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base
            border border-gray-300 bg-white
            ${props.disabled || !categoryType || !assetCategory
              ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200' 
              : 'hover:border-gray-400 hover:shadow-md cursor-pointer'
            }
            ${props.error ? 'border-red-300 bg-red-50' : ''}
            ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
          `}
        >
          <div className="flex items-center justify-between min-w-0">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="flex flex-col min-w-0 flex-1">
                <span className={`truncate ${selectedOption ? 'text-gray-900' : 'text-gray-500'}`}>
                  {selectedOption || displayPlaceholder}
                </span>
              </div>
            </div>
            <ChevronDown 
              size={18} 
              className={`text-gray-400 transition-transform duration-200 flex-shrink-0 ${
                isOpen ? 'rotate-180' : ''
              }`} 
            />
          </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div 
            ref={dropdownMenuRef}
            className={`absolute z-[60] w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden ${
              opensUpward 
                ? 'bottom-full mb-2' 
                : 'top-full mt-2'
            }`}
          >
            {/* Add Button at Top */}
            {showAddButton && categoryType && assetCategory && selectedCategory && (
              <div className="p-2 border-b border-gray-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAddModal(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Asset Name</span>
                </button>
              </div>
            )}

            {/* Search Input */}
            {searchable && (
              <div className="p-2 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search asset names..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
            
            {/* Options List */}
            <div className="max-h-48 sm:max-h-64 md:max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {filteredAssetNames.length > 0 ? (
                filteredAssetNames.map((assetName) => {
                  const isUsed = isAssetNameUsed(assetName);
                  return (
                    <div
                      key={assetName}
                      className={`
                        w-full px-3 sm:px-4 py-2 sm:py-3 transition-colors duration-150 flex items-center justify-between group
                        ${assetName === value 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                        }
                      `}
                    >
                      <button
                        type="button"
                        onClick={() => handleSelect(assetName)}
                        className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1 text-left"
                      >
                        <Package className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-medium text-sm sm:text-base truncate">{assetName}</span>
                          <span className="text-xs text-gray-500 truncate">
                            {categoryType === 'major' ? 'Major' : 'Minor'} asset{isUsed ? ' (in use)' : ''}
                          </span>
                        </div>
                        {assetName === value && (
                          <Check size={14} className="text-green-500 flex-shrink-0" />
                        )}
                      </button>
                      
                      {/* Delete Icon */}
                      {showDeleteButton && (
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          {isUsed ? (
                            <span className="text-xs text-gray-400" title="Used in inventory">🔒</span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteClick(e, assetName)}
                              className="p-1.5 text-red-600 rounded hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100"
                              title={`Delete ${assetName}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="px-3 sm:px-4 py-2 sm:py-3 text-gray-500 text-center text-sm">
                  No asset names found
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {props.error && (
        <p className="mt-2 text-sm text-red-600">{props.error}</p>
      )}

      {/* Add Asset Name Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md p-6 mx-4 bg-white rounded-xl shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add New Asset Name</h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setNewAssetName('');
                  setNewAssetDescription('');
                }}
                className="p-1 text-gray-400 rounded-lg hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Asset Name *
                </label>
                <input
                  type="text"
                  value={newAssetName}
                  onChange={(e) => setNewAssetName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddAssetName();
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Gaming Laptop"
                  autoFocus
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Description (Optional)
                </label>
                <textarea
                  value={newAssetDescription}
                  onChange={(e) => setNewAssetDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of the asset..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewAssetName('');
                    setNewAssetDescription('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddAssetName}
                  disabled={isAdding || !newAssetName.trim()}
                  className="px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAdding ? 'Adding...' : 'Add Asset Name'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {assetNameToDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md p-6 mx-4 bg-white rounded-xl shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Delete Asset Name</h3>
              <button
                type="button"
                onClick={() => setAssetNameToDelete(null)}
                className="p-1 text-gray-400 rounded-lg hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-gray-700">
                Are you sure you want to delete <span className="font-semibold">"{assetNameToDelete}"</span>?
              </p>
              
              {isAssetNameUsed(assetNameToDelete) ? (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    ⚠️ This asset name is currently used in inventory items and cannot be deleted.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  This action cannot be undone. The asset name will be removed from this category.
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setAssetNameToDelete(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                {!isAssetNameUsed(assetNameToDelete) && (
                  <button
                    type="button"
                    onClick={() => handleDeleteAssetName(assetNameToDelete)}
                    disabled={isRemoving}
                    className="px-4 py-2 text-sm font-medium text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRemoving ? 'Deleting...' : 'Delete'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetNameDropdown;
