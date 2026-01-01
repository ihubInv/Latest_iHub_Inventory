import React from 'react';
import { 
  UserPlus, 
  RotateCcw, 
  TrendingUp, 
  Briefcase, 
  Home, 
  GraduationCap, 
  Clock, 
  Building,
  Target
} from 'lucide-react';
import AttractiveDropdown from './AttractiveDropdown';

interface PurposeDropdownProps {
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

const PurposeDropdown: React.FC<PurposeDropdownProps> = ({
  value,
  onChange,
  placeholder = "Select purpose",
  ...props
}) => {
  const options = [
    { 
      value: 'New Employee Setup', 
      label: 'New Employee Setup', 
      icon: <UserPlus className="w-4 h-4 text-green-500" />,
      description: 'Equipment for new hire'
    },
    { 
      value: 'Replacement for Damaged Item', 
      label: 'Replacement for Damaged Item', 
      icon: <RotateCcw className="w-4 h-4 text-orange-500" />,
      description: 'Replace broken equipment'
    },
    { 
      value: 'Upgrade Existing Equipment', 
      label: 'Upgrade Existing Equipment', 
      icon: <TrendingUp className="w-4 h-4 text-blue-500" />,
      description: 'Hardware upgrade'
    },
    { 
      value: 'Project Requirements', 
      label: 'Project Requirements', 
      icon: <Briefcase className="w-4 h-4 text-purple-500" />,
      description: 'Project-specific needs'
    },
    { 
      value: 'Remote Work Setup', 
      label: 'Remote Work Setup', 
      icon: <Home className="w-4 h-4 text-cyan-500" />,
      description: 'Work from home equipment'
    },
    { 
      value: 'Training Purposes', 
      label: 'Training Purposes', 
      icon: <GraduationCap className="w-4 h-4 text-red-500" />,
      description: 'Educational or training use'
    },
    { 
      value: 'Temporary Assignment', 
      label: 'Temporary Assignment', 
      icon: <Clock className="w-4 h-4 text-yellow-500" />,
      description: 'Short-term use'
    },
    { 
      value: 'Department Expansion', 
      label: 'Department Expansion', 
      icon: <Building className="w-4 h-4 text-indigo-500" />,
      description: 'Team growth needs'
    },
    { 
      value: 'Other', 
      label: 'Other', 
      icon: <Target className="w-4 h-4 text-gray-400" />,
      description: 'Specify custom purpose'
    }
  ];

  return (
    <AttractiveDropdown
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      icon={<Target className="w-4 h-4" />}
      searchable
      {...props}
    />
  );
};

export default PurposeDropdown;
