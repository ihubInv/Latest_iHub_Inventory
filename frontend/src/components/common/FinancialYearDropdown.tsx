import React from 'react';
import { Calendar } from 'lucide-react';
import AttractiveDropdown from './AttractiveDropdown';
import { getFinancialYears, getCurrentFinancialYear } from '../../constants/companyInfo';

interface FinancialYearDropdownProps {
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

const FinancialYearDropdown: React.FC<FinancialYearDropdownProps> = ({
  value,
  onChange,
  placeholder = "Select Financial Year",
  ...props
}) => {
  // Get list of financial years from 2020-21 onwards
  const financialYearsList = getFinancialYears();
  
  // Convert to options format for AttractiveDropdown
  const options = financialYearsList.map(fy => ({
    value: fy,
    label: fy,
    description: `1st April ${fy.split('-')[0]} to 31st March ${fy.split('-')[1]}`
  }));

  // Get current financial year for fallback display
  const currentFY = getCurrentFinancialYear();
  // Use provided value, or fallback to current FY for display (parent should set default)
  const displayValue = value && value.trim() !== '' ? value : currentFY;

  return (
    <AttractiveDropdown
      options={options}
      value={displayValue}
      onChange={onChange}
      placeholder={placeholder}
      icon={<Calendar className="w-4 h-4" />}
      searchable={false}
      {...props}
    />
  );
};

export default FinancialYearDropdown;

