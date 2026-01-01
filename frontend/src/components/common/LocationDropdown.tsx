import React from 'react';
import { MapPin, Building } from 'lucide-react';
import AttractiveDropdown from './AttractiveDropdown';
import type { InventoryItem } from '../../types';
import { useGetLocationsQuery } from '../../store/api';

interface LocationDropdownProps {
  inventoryItems: InventoryItem[];
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

const LocationDropdown: React.FC<LocationDropdownProps> = ({
  inventoryItems,
  value,
  onChange,
  placeholder = "Select location",
  searchable = true,
  ...props
}) => {
  const { data: locationsResponse } = useGetLocationsQuery({});
  const locations = locationsResponse?.data || [];
  
  // Get all active locations from database
  const activeLocations = locations?.filter((location: any) => location.isactive);
  
  // Always include "Storage Room A" as a protected default location
  const protectedLocation = {
    id: 'protected-storage-room-a',
    name: 'Storage Room A',
    isactive: true,
    createdat: new Date().toISOString(),
    updatedat: new Date().toISOString()
  };
  
  // Combine protected location with database locations, ensuring no duplicates
  const allLocations = [
    protectedLocation,
    ...activeLocations.filter((location: any) => location.name !== 'Storage Room A')
  ];
  
  // Create location options with inventory data
  const options = allLocations.map((location: any) => {
    const itemsInLocation = inventoryItems?.filter((item: any) => item.locationofitem === location.name);
    const availableItems = itemsInLocation.filter((item: any) => item.status === 'available').length;
    const issuedItems = itemsInLocation.filter((item: any) => item.status === 'issued').length;
    
    return {
      value: location.name,
      label: location.name,
      icon: <MapPin className="w-4 h-4 text-blue-500" />,
      description: `${itemsInLocation.length} items (${availableItems} available, ${issuedItems} issued)`,
      disabled: false // All locations are selectable
    };
  });

  // Show placeholder message if no options available (should never happen now)
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
      disabled={props.disabled} // Only disable if explicitly passed as prop
      {...props}
    />
  );
};

export default LocationDropdown;
