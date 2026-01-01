import React from 'react';
import { Filter, Package, Zap, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import AttractiveDropdown from './AttractiveDropdown';

interface FilterOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
}

interface FilterDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select filter",
  ...props
}) => {
  return (
    <AttractiveDropdown
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      icon={<Filter className="w-4 h-4" />}
      {...props}
    />
  );
};

// Pre-defined filter options for common use cases
export const categoryTypeFilters: FilterOption[] = [
  { 
    value: 'all', 
    label: 'All Types', 
    icon: <Package className="w-4 h-4 text-gray-500" />,
    description: 'Show all categories'
  },
  { 
    value: 'major', 
    label: 'Major', 
    icon: <Package className="w-4 h-4 text-blue-500" />,
    description: 'Physical items only'
  },
  { 
    value: 'minor', 
    label: 'Minor', 
    icon: <Zap className="w-4 h-4 text-purple-500" />,
    description: 'Digital assets only'
  }
];

export const statusFilters: FilterOption[] = [
  { 
    value: 'all', 
    label: 'All Status', 
    icon: <Filter className="w-4 h-4 text-gray-500" />,
    description: 'Show all status'
  },
  { 
    value: 'active', 
    label: 'Active', 
    icon: <CheckCircle className="w-4 h-4 text-green-500" />,
    description: 'Active items only'
  },
  { 
    value: 'inactive', 
    label: 'Inactive', 
    icon: <XCircle className="w-4 h-4 text-red-500" />,
    description: 'Inactive items only'
  },
  { 
    value: 'pending', 
    label: 'Pending', 
    icon: <AlertCircle className="w-4 h-4 text-yellow-500" />,
    description: 'Pending items only'
  }
];

export default FilterDropdown;
