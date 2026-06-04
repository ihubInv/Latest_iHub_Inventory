import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  /** When set, replaces default max-height / scroll classes on the options list (search stays fixed above). */
  optionsScrollClassName?: string;
  /** Single-line trigger (hides description under selected label) for aligned form rows */
  compactTrigger?: boolean;
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
  variant = 'default',
  optionsScrollClassName,
  compactTrigger = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [menuPosition, setMenuPosition] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const gap = 8;
    const preferredMax = 320;
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;
    const openUp = spaceBelow < 180 && spaceAbove > spaceBelow;
    const maxHeight = Math.min(preferredMax, openUp ? spaceAbove : spaceBelow);

    if (openUp) {
      setMenuPosition({
        bottom: window.innerHeight - rect.top + gap,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.max(120, maxHeight),
      });
    } else {
      setMenuPosition({
        top: rect.bottom + gap,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.max(120, maxHeight),
      });
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setIsOpen(false);
      setSearchTerm('');
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setMenuPosition(null);
      return;
    }
    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);
    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [isOpen, updateMenuPosition]);

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const selectedOption = options.find(option => option.value === value);

  const optionsScrollClasses =
    optionsScrollClassName?.trim() ||
    'max-h-48 sm:max-h-64 md:max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100';

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
        return 'h-10 px-3 text-sm';
      case 'lg':
        return 'h-12 px-4 text-base';
      default:
        return 'h-11 px-4 text-sm';
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

  const menuPanel = isOpen && menuPosition && (
    <div
      ref={menuRef}
      className="fixed z-[200] flex flex-col bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
      style={{
        left: menuPosition.left,
        width: menuPosition.width,
        top: menuPosition.top,
        bottom: menuPosition.bottom,
        maxHeight: menuPosition.maxHeight,
      }}
    >
      {searchable && (
        <div className="p-2 sm:p-3 border-b border-gray-100 shrink-0">
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

      <div className={`${optionsScrollClasses} flex-1 min-h-0 overflow-y-auto`}>
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
  );

  return (
    <div className={`relative ${className}`} ref={rootRef}>
      {label && (
        <label className="block mb-2 text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => {
            if (disabled) return;
            setIsOpen((prev) => !prev);
          }}
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
              <div className={`flex min-w-0 flex-1 ${compactTrigger ? 'items-center' : 'flex-col'}`}>
                <span className={`truncate ${selectedOption ? 'text-gray-900' : 'text-gray-500'}`}>
                  {selectedOption ? selectedOption.label : placeholder}
                </span>
                {!compactTrigger && selectedOption?.description && (
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

        {menuPanel && createPortal(menuPanel, document.body)}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default AttractiveDropdown;
