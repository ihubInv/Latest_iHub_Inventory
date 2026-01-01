import React from 'react';
import { Package, Laptop, Monitor, Mouse, Keyboard, Printer, Smartphone, Headphones, Camera, HardDrive } from 'lucide-react';
import AttractiveDropdown from './AttractiveDropdown';
import { Asset } from '../../types';

interface AssetSelectionDropdownProps {
  assets: Asset[];
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

const AssetSelectionDropdown: React.FC<AssetSelectionDropdownProps> = ({
  assets,
  value,
  onChange,
  placeholder = "Select an asset",
  searchable = true,
  ...props
}) => {
  // Get appropriate icon based on asset name
  const getAssetIcon = (assetName: string) => {
    const name = assetName.toLowerCase();
    
    if (name.includes('laptop') || name.includes('notebook')) {
      return <Laptop className="w-4 h-4 text-blue-500" />;
    } else if (name.includes('monitor') || name.includes('display') || name.includes('screen')) {
      return <Monitor className="w-4 h-4 text-purple-500" />;
    } else if (name.includes('mouse')) {
      return <Mouse className="w-4 h-4 text-gray-500" />;
    } else if (name.includes('keyboard')) {
      return <Keyboard className="w-4 h-4 text-orange-500" />;
    } else if (name.includes('printer')) {
      return <Printer className="w-4 h-4 text-cyan-500" />;
    } else if (name.includes('phone') || name.includes('mobile') || name.includes('smartphone')) {
      return <Smartphone className="w-4 h-4 text-green-500" />;
    } else if (name.includes('headphone') || name.includes('headset')) {
      return <Headphones className="w-4 h-4 text-pink-500" />;
    } else if (name.includes('camera')) {
      return <Camera className="w-4 h-4 text-red-500" />;
    } else if (name.includes('hard') || name.includes('drive') || name.includes('storage')) {
      return <HardDrive className="w-4 h-4 text-indigo-500" />;
    } else {
      return <Package className="w-4 h-4 text-blue-500" />;
    }
  };

  // Convert assets to dropdown options
  const options = assets.map(asset => ({
    value: asset.name,
    label: asset.name,
    icon: getAssetIcon(asset.name),
    description: asset.description || `Added on ${new Date(asset.createdat).toLocaleDateString()}`
  }));

  // Show appropriate placeholder message
  const displayPlaceholder = assets.length === 0 
    ? "No assets available. Add assets first using the 'Add Asset' button."
    : placeholder;

  return (
    <AttractiveDropdown
      options={options}
      value={value}
      onChange={onChange}
      placeholder={displayPlaceholder}
      icon={<Package className="w-4 h-4" />}
      searchable={searchable}
      disabled={assets.length === 0}
      {...props}
    />
  );
};

export default AssetSelectionDropdown;
