import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  description?: string;
}

interface AttractiveDropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
  icon?: React.ReactNode;
  searchable?: boolean;
  multiple?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'bordered' | 'filled';
}

const AttractiveDropdown: React.FC<AttractiveDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  label,
  required = false,
  disabled = false,
  className = "",
  error,
  icon,
  searchable = false,
  size = 'md',
  variant = 'default'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const selectedOption = options.find(option => option.value === value);
  
  // Debug: Log the value and selected option
  React.useEffect(() => {
    console.log('🔍 AttractiveDropdown Debug:', {
      label: label,
      value: value,
      selectedOption: selectedOption,
      options: options
    });
  }, [value, selectedOption, label, options]);

  const filteredOptions = searchable 
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.value.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  const handleSelect = (optionValue: string) => {
    if (!disabled) {
      onChange(optionValue);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-9 px-3 text-sm';
      case 'lg':
        return 'h-11 px-4 text-base';
      default:
        return 'h-10 px-4 text-sm';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'bordered':
        return 'border-2 border-gray-300 bg-white';
      case 'filled':
        return 'border border-gray-200 bg-gray-50';
      default:
        return 'border border-gray-300 bg-white';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block mb-2 text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            w-full text-left rounded-xl shadow-sm transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${getSizeClasses()}
            ${getVariantClasses()}
            ${disabled 
              ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200' 
              : 'hover:border-gray-400 hover:shadow-md cursor-pointer'
            }
            ${error ? 'border-red-300 bg-red-50' : ''}
            ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
          `}
        >
          <div className="flex items-center justify-between min-w-0">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              {icon && <span className="text-gray-400 flex-shrink-0">{icon}</span>}
              {selectedOption?.icon && <span className="text-gray-600 flex-shrink-0">{selectedOption.icon}</span>}
              <div className="flex flex-col min-w-0 flex-1">
                <span className={`truncate ${selectedOption ? 'text-gray-900' : 'text-gray-500'}`}>
                  {selectedOption ? selectedOption.label : placeholder}
                </span>
                {selectedOption?.description && (
                  <span className="text-xs text-gray-400 truncate">{selectedOption.description}</span>
                )}
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
          <div className="absolute z-[60] w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            {searchable && (
              <div className="p-2 sm:p-3 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search options..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
            
            <div className="max-h-48 sm:max-h-64 md:max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    disabled={option.disabled}
                    className={`
                      w-full px-3 sm:px-4 py-2 sm:py-3 text-left transition-colors duration-150 flex items-center justify-between
                      ${option.disabled 
                        ? 'text-gray-400 cursor-not-allowed bg-gray-50' 
                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer'
                      }
                      ${option.value === value ? 'bg-blue-50 text-blue-700' : ''}
                    `}
                  >
                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                      {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-medium text-sm sm:text-base truncate">{option.label}</span>
                        {option.description && (
                          <span className="text-xs text-gray-500 truncate">{option.description}</span>
                        )}
                      </div>
                    </div>
                    {option.value === value && (
                      <Check size={14} className="text-green-500 flex-shrink-0" />
                    )}
                  </button>
                ))
              ) : (
                <div className="px-3 sm:px-4 py-2 sm:py-3 text-gray-500 text-center text-sm">
                  No options found
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default AttractiveDropdown;
