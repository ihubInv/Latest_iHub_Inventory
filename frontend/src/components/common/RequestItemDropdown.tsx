import React from 'react';
import { 
  Laptop, 
  Monitor, 
  Keyboard, 
  Mouse, 
  Armchair, 
  Printer, 
  Smartphone, 
  Tablet,
  Package,
  Computer,
  Webcam
} from 'lucide-react';
import AttractiveDropdown from './AttractiveDropdown';

interface RequestItemDropdownProps {
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
  options?: string[]; // Add dynamic options prop
}

const RequestItemDropdown: React.FC<RequestItemDropdownProps> = ({
  value,
  onChange,
  placeholder = "Select item type",
  options: customOptions,
  ...props
}) => {
  // Use custom options if provided, otherwise use default static options
  const getOptions = () => {
    if (customOptions && customOptions.length > 0) {
      // Convert string array to dropdown options format
      return customOptions.map((item: any) => ({
        value: item,
        label: item,
        icon: <Package className="w-4 h-4 text-blue-500" />,
        description: 'Available in inventory'
      }));
    }
    
    // Default static options (fallback)
    return [
    { 
      value: 'Laptop', 
      label: 'Laptop', 
      icon: <Laptop className="w-4 h-4 text-blue-500" />,
      description: 'Portable computer'
    },
    { 
      value: 'Desktop Computer', 
      label: 'Desktop Computer', 
      icon: <Computer className="w-4 h-4 text-green-500" />,
      description: 'Desktop workstation'
    },
    { 
      value: 'Monitor', 
      label: 'Monitor', 
      icon: <Monitor className="w-4 h-4 text-purple-500" />,
      description: 'Display screen'
    },
    { 
      value: 'Keyboard', 
      label: 'Keyboard', 
      icon: <Keyboard className="w-4 h-4 text-orange-500" />,
      description: 'Input device'
    },
    { 
      value: 'Mouse', 
      label: 'Mouse', 
      icon: <Mouse className="w-4 h-4 text-red-500" />,
      description: 'Pointing device'
    },
    { 
      value: 'Office Chair', 
      label: 'Office Chair', 
      icon: <Armchair className="w-4 h-4 text-brown-500" />,
      description: 'Ergonomic seating'
    },
    { 
      value: 'Desk', 
      label: 'Desk', 
      icon: <Package className="w-4 h-4 text-gray-500" />,
      description: 'Work surface'
    },
    { 
      value: 'Printer', 
      label: 'Printer', 
      icon: <Printer className="w-4 h-4 text-cyan-500" />,
      description: 'Document printing'
    },
    { 
      value: 'Mobile Phone', 
      label: 'Mobile Phone', 
      icon: <Smartphone className="w-4 h-4 text-pink-500" />,
      description: 'Mobile device'
    },
    { 
      value: 'Tablet', 
      label: 'Tablet', 
      icon: <Tablet className="w-4 h-4 text-indigo-500" />,
      description: 'Portable tablet'
    },
    { 
      value: 'Webcam', 
      label: 'Webcam', 
      icon: <Webcam className="w-4 h-4 text-teal-500" />,
      description: 'Video camera'
    },
    { 
      value: 'Other', 
      label: 'Other', 
      icon: <Package className="w-4 h-4 text-gray-400" />,
      description: 'Specify custom item'
    }
    ];
  };

  const options = getOptions();

  return (
    <AttractiveDropdown
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      icon={<Package className="w-4 h-4" />}
      searchable
      {...props}
    />
  );
};

export default RequestItemDropdown;
