import React from 'react';
import { Ruler, Package, Droplets, Weight } from 'lucide-react';
import AttractiveDropdown from './AttractiveDropdown';

interface UnitDropdownProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  searchable?: boolean;
}

const UnitDropdown: React.FC<UnitDropdownProps> = ({
  value,
  onChange,
  placeholder = "Select unit",
  ...props
}) => {
  const options = [
    { 
      value: 'Pieces', 
      label: 'Pieces', 
      icon: <Package className="w-4 h-4 text-blue-500" />,
      description: 'Individual items or units'
    },
    { 
      value: 'Kg', 
      label: 'Kilograms (Kg)', 
      icon: <Weight className="w-4 h-4 text-green-500" />,
      description: 'Weight measurement'
    },
    { 
      value: 'Liters', 
      label: 'Liters', 
      icon: <Droplets className="w-4 h-4 text-cyan-500" />,
      description: 'Volume measurement'
    },
    { 
      value: 'Meters', 
      label: 'Meters', 
      icon: <Ruler className="w-4 h-4 text-purple-500" />,
      description: 'Length measurement'
    },
    { 
      value: 'Sets', 
      label: 'Sets', 
      icon: <Package className="w-4 h-4 text-orange-500" />,
      description: 'Complete sets or collections'
    },
    { 
      value: 'Boxes', 
      label: 'Boxes', 
      icon: <Package className="w-4 h-4 text-red-500" />,
      description: 'Boxed items or containers'
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

export default UnitDropdown;
