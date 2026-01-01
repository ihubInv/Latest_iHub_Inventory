import React from 'react';
import { Star, StarHalf, AlertTriangle, XCircle } from 'lucide-react';
import AttractiveDropdown from './AttractiveDropdown';

interface ConditionDropdownProps {
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

const ConditionDropdown: React.FC<ConditionDropdownProps> = ({
  value,
  onChange,
  placeholder = "Select condition",
  ...props
}) => {
  const options = [
    { 
      value: 'excellent', 
      label: 'Excellent', 
      icon: <Star className="w-4 h-4 text-green-500" />,
      description: 'Like new condition'
    },
    { 
      value: 'good', 
      label: 'Good', 
      icon: <Star className="w-4 h-4 text-blue-500" />,
      description: 'Minor wear, fully functional'
    },
    { 
      value: 'fair', 
      label: 'Fair', 
      icon: <StarHalf className="w-4 h-4 text-yellow-500" />,
      description: 'Visible wear but working'
    },
    { 
      value: 'poor', 
      label: 'Poor', 
      icon: <AlertTriangle className="w-4 h-4 text-orange-500" />,
      description: 'Significant wear, needs attention'
    },
    { 
      value: 'damaged', 
      label: 'Damaged', 
      icon: <XCircle className="w-4 h-4 text-red-500" />,
      description: 'Requires repair or replacement'
    }
  ];

  return (
    <AttractiveDropdown
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      icon={<Star className="w-4 h-4" />}
      {...props}
    />
  );
};

export default ConditionDropdown;
