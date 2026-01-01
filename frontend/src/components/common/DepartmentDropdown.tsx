import React from 'react';
import { Building, Code, Briefcase, Users, Heart, Cog } from 'lucide-react';
import AttractiveDropdown from './AttractiveDropdown';

interface DepartmentDropdownProps {
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

const DepartmentDropdown: React.FC<DepartmentDropdownProps> = ({
  value,
  onChange,
  placeholder = "Select department",
  ...props
}) => {
  const options = [
    { 
      value: 'IT Department', 
      label: 'IT Department', 
      icon: <Code className="w-4 h-4 text-blue-500" />,
      description: 'Information Technology'
    },
    { 
      value: 'HR Department', 
      label: 'HR Department', 
      icon: <Users className="w-4 h-4 text-green-500" />,
      description: 'Human Resources'
    },
    { 
      value: 'Finance Department', 
      label: 'Finance Department', 
      icon: <Briefcase className="w-4 h-4 text-purple-500" />,
      description: 'Financial Management'
    },
    { 
      value: 'Operations Department', 
      label: 'Operations Department', 
      icon: <Cog className="w-4 h-4 text-orange-500" />,
      description: 'Daily Operations'
    },
    { 
      value: 'Marketing Department', 
      label: 'Marketing Department', 
      icon: <Heart className="w-4 h-4 text-pink-500" />,
      description: 'Marketing & Sales'
    },
    { 
      value: 'Administration', 
      label: 'Administration', 
      icon: <Building className="w-4 h-4 text-gray-500" />,
      description: 'Administrative Services'
    }
  ];

  return (
    <AttractiveDropdown
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      icon={<Building className="w-4 h-4" />}
      searchable
      {...props}
    />
  );
};

export default DepartmentDropdown;
