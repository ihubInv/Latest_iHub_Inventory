import React from 'react';
import { Users, Shield, UserCheck, User } from 'lucide-react';
import AttractiveDropdown from './AttractiveDropdown';

interface RoleDropdownProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  includeAdmin?: boolean;
}

const RoleDropdown: React.FC<RoleDropdownProps> = ({
  value,
  onChange,
  placeholder = "Select role",
  includeAdmin = true,
  ...props
}) => {
  const options = [
    ...(includeAdmin ? [{
      value: 'admin',
      label: 'Administrator',
      icon: <Shield className="w-4 h-4 text-red-500" />,
      description: 'Full system access and management'
    }] : []),
    {
      value: 'stock-manager',
      label: 'Stock Manager',
      icon: <UserCheck className="w-4 h-4 text-blue-500" />,
      description: 'Inventory management and approvals'
    },
    {
      value: 'employee',
      label: 'Employee',
      icon: <User className="w-4 h-4 text-green-500" />,
      description: 'Basic access and request submission'
    }
  ];

  return (
    <AttractiveDropdown
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      icon={<Users className="w-4 h-4" />}
      {...props}
    />
  );
};

export default RoleDropdown;
