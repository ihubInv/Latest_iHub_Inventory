import React from 'react';
import { Package, Zap } from 'lucide-react';
import AttractiveDropdown from './AttractiveDropdown';

interface CategoryTypeDropdownProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
}

const CategoryTypeDropdown: React.FC<CategoryTypeDropdownProps> = ({
  value,
  onChange,
  placeholder = "Select category type",
  ...props
}) => {
  const options = [
    { 
      value: 'major', 
      label: 'Major', 
      icon: <Package className="w-4 h-4 text-blue-500" />,
      description: 'Physical items'
    },
    { 
      value: 'minor', 
      label: 'Minor', 
      icon: <Zap className="w-4 h-4 text-purple-500" />,
      description: 'Digital assets'
    }
  ];

  return (
    <AttractiveDropdown
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      icon={<Package className="w-4 h-4" />}
      {...props}
    />
  );
};

export default CategoryTypeDropdown;
