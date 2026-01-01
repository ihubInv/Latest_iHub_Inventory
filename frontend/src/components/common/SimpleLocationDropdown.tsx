import React from 'react';
import { MapPin, Building } from 'lucide-react';
import AttractiveDropdown from './AttractiveDropdown';
import { useGetLocationsQuery } from '../../store/api';

interface SimpleLocationDropdownProps {
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

const SimpleLocationDropdown: React.FC<SimpleLocationDropdownProps> = ({
  value,
  onChange,
  placeholder = "Select location",
  searchable = true,
  ...props
}) => {
  const { data: locations = [], isLoading, error } = useGetLocationsQuery();
  
  // Debug: Log locations to see what's being fetched
  console.log('=== LOCATION DROPDOWN DEBUG ===');
  console.log('Raw locations from database:', locations);
  console.log('Is loading:', isLoading);
  console.log('Error:', error);
  console.log('Locations type:', typeof locations);
  console.log('Locations length:', locations?.length);
  console.log('Locations array check:', Array.isArray(locations));
  
  // Use locations from database
  const allLocations = locations || [];
  
  console.log('All locations from API:', allLocations);
  console.log('Total locations count:', allLocations.length);
  console.log('=== END DEBUG ===');
  
  // Create location options
  const options = allLocations.map((location: any) => ({
    value: location.name,
    label: location.name,
    icon: <MapPin className="w-4 h-4 text-blue-500" />,
    description: location.description || 'Location',
    disabled: false
  }));

  // Show placeholder message if no options available
  const displayPlaceholder = options.length === 0 
    ? "No locations available - Add locations in Location Management"
    : placeholder || "Select location";

  return (
    <AttractiveDropdown
      options={options}
      value={value}
      onChange={onChange}
      placeholder={displayPlaceholder}
      icon={<Building className="w-4 h-4" />}
      searchable={searchable}
      {...props}
    />
  );
};

export default SimpleLocationDropdown;
