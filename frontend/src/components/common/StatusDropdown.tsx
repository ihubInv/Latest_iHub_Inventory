import React from 'react';
import { Activity, Clock, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import AttractiveDropdown from './AttractiveDropdown';

interface StatusDropdownProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
  type?: 'inventory' | 'request';
  size?: 'sm' | 'md' | 'lg';
}

const StatusDropdown: React.FC<StatusDropdownProps> = ({
  value,
  onChange,
  placeholder = "Select status",
  type = 'inventory',
  ...props
}) => {
  const getOptions = () => {
    if (type === 'inventory') {
      return [
        { 
          value: 'available', 
          label: 'Available', 
          icon: <CheckCircle className="w-4 h-4 text-green-500" />,
          description: 'Ready for use'
        },
        { 
          value: 'issued', 
          label: 'Issued', 
          icon: <Activity className="w-4 h-4 text-blue-500" />,
          description: 'Currently in use'
        },
        { 
          value: 'maintenance', 
          label: 'Maintenance', 
          icon: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
          description: 'Under repair'
        },
        { 
          value: 'retired', 
          label: 'Retired', 
          icon: <XCircle className="w-4 h-4 text-red-500" />,
          description: 'No longer in service'
        }
      ];
    } else {
      return [
        { 
          value: 'pending', 
          label: 'Pending', 
          icon: <Clock className="w-4 h-4 text-yellow-500" />,
          description: 'Awaiting review'
        },
        { 
          value: 'approved', 
          label: 'Approved', 
          icon: <CheckCircle className="w-4 h-4 text-green-500" />,
          description: 'Request approved'
        },
        { 
          value: 'rejected', 
          label: 'Rejected', 
          icon: <XCircle className="w-4 h-4 text-red-500" />,
          description: 'Request denied'
        }
      ];
    }
  };

  return (
    <AttractiveDropdown
      options={getOptions()}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      icon={<Activity className="w-4 h-4" />}
      {...props}
    />
  );
};

export default StatusDropdown;
