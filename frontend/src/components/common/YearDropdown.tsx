import React from 'react';
import { Calendar } from 'lucide-react';
import AttractiveDropdown from './AttractiveDropdown';
import { COMPANY_INFO } from '../../constants/companyInfo';

interface YearDropdownProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  startYear?: number;
  endYear?: number;
  yearsBack?: number;
  yearsForward?: number;
}

const YearDropdown: React.FC<YearDropdownProps> = ({
  value,
  onChange,
  placeholder = "Select year",
  startYear,
  endYear,
  yearsBack = 10,
  yearsForward = 2,
  ...props
}) => {
  const currentYear = COMPANY_INFO.currentYear;
  
  // Generate year options - start from company founding year (2020) to current year + configurable forward range
  const generateYears = () => {
    const computedStart = typeof startYear === 'number' ? startYear : COMPANY_INFO.foundingYear;
    const computedEndBase = typeof endYear === 'number' ? endYear : currentYear + (yearsForward || 0);
    const validStart = Math.max(computedStart, COMPANY_INFO.foundingYear);
    const validEnd = Math.max(computedEndBase, currentYear); // allow future years
    
    const years = [];
    for (let year = validEnd; year >= validStart; year--) {
      years.push({
        value: year.toString(),
        label: year.toString(),
        icon: <Calendar className="w-4 h-4 text-blue-500" />,
        description: year === currentYear ? 'Current year' : undefined
      });
    }
    return years;
  };

  const options = generateYears();

  return (
    <AttractiveDropdown
      options={options}
      value={value.toString()}
      onChange={(stringValue) => onChange(Number(stringValue))}
      placeholder={placeholder}
      icon={<Calendar className="w-4 h-4" />}
      searchable
      {...props}
    />
  );
};

export default YearDropdown;
