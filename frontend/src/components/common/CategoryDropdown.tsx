import React from 'react';
import { Folder, Tag } from 'lucide-react';
import AttractiveDropdown from './AttractiveDropdown';
import type { Category } from '../../types';

interface CategoryDropdownProps {
  categories: Category[];
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
}

const CategoryDropdown: React.FC<CategoryDropdownProps> = ({
  categories,
  value,
  onChange,
  placeholder = "Select category",
  searchable = true,
  ...props
}) => {
  const options = categories
    .filter((category: any) => category.isactive)
    .map(category => ({
      value: category.name,
      label: category.name,
      icon: category.type === 'major' ? <Tag className="w-4 h-4 text-blue-500" /> : <Folder className="w-4 h-4 text-purple-500" />,
      description: category.description || `${category.type} asset category`
    }));

  return (
    <AttractiveDropdown
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      icon={<Folder className="w-4 h-4" />}
      searchable={searchable}
      {...props}
    />
  );
};

export default CategoryDropdown;
