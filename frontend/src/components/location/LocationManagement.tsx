import React, { useState, useEffect } from 'react';
import { 
  useGetLocationsQuery,
  useCreateLocationMutation,
  useUpdateLocationMutation,
  useDeleteLocationMutation,
  useToggleLocationStatusMutation,
  useGetLocationStatsQuery,
  // useSearchLocationsQuery
} from '../../store/api';
import { useGetInventoryItemsQuery } from '../../store/api';
import { useAppSelector } from '../../store/hooks';
import DateRangePicker from '../common/DateRangePicker';
import FilterDropdown, { statusFilters } from '../common/FilterDropdown';
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Calendar,
  Package,
  Eye,
  Save,
  X,
  Building,
  MapPinIcon,
  Users
} from 'lucide-react';
import { CRUDToasts } from '../../services/toastService';
import toast from 'react-hot-toast';

const LocationManagement: React.FC = () => {
  const { data: locationsResponse, isLoading: loading, error } = useGetLocationsQuery({});
  const locations = (locationsResponse?.data || []).map((loc: any) => ({
    ...loc,
    isactive: loc.isactive ?? loc.isActive ?? false,
  }));
  const [createLocation] = useCreateLocationMutation();
  const [updateLocation] = useUpdateLocationMutation();
  const [deleteLocation] = useDeleteLocationMutation();
  const [toggleLocationStatus] = useToggleLocationStatusMutation();
  const { data: locationStats } = useGetLocationStatsQuery();
  const { data: inventoryResponse } = useGetInventoryItemsQuery({});
  const inventoryItems = inventoryResponse?.data || [];
  const { user } = useAppSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<any>(null);
  const [viewingLocation, setViewingLocation] = useState<any>(null);

  const [newLocation, setNewLocation] = useState({
    name: '',
    description: '',
    address: '',
    capacity: 50,
    isactive: true
  });

  // Use locations directly from RTK Query
  const locationData = locations;

  const filteredLocations = locationData.filter((location: any) => {
    const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && location.isactive) ||
                         (filterStatus === 'inactive' && !location.isactive);
    
    let matchesDate = true;
    if (startDate && endDate) {
      const locationDate = new Date(location.updatedat);
      matchesDate = locationDate >= startDate && locationDate <= endDate;
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = CRUDToasts.creating('location');
    try {
      await createLocation({
        ...newLocation,
        isActive: newLocation.isactive,
        createdBy: user?.id || 'unknown',
        lastModifiedBy: user?.id || 'unknown'
      }).unwrap();
      toast.dismiss(loadingToast);
      setNewLocation({
        name: '',
        description: '',
        address: '',
        capacity: 50,
        isactive: true
      });
      setShowAddModal(false);
      CRUDToasts.created('location');
    } catch (err) {
      console.error('Failed to add location:', err);
      toast.dismiss(loadingToast);
      CRUDToasts.createError('location', 'Please try again');
    }
  };
  
  const handleEditLocation = (location: any) => {
    setEditingLocation(location);
    setNewLocation({
      name: location.name,
      description: location.description,
      address: location.address,
      capacity: location.capacity,
      isactive: location.isactive ?? location.isActive ?? false
    });
    setShowAddModal(true);
  };

  const handleUpdateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLocation) {
      const loadingToast = CRUDToasts.updating('location');
      try {
        await updateLocation({
          id: editingLocation.id,
          data: {
            ...newLocation,
            isActive: newLocation.isactive,
          }
        }).unwrap();
        toast.dismiss(loadingToast);
        setEditingLocation(null);
        setNewLocation({
          name: '',
          description: '',
          address: '',
          capacity: 50,
          isactive: true
        });
        setShowAddModal(false);
        CRUDToasts.updated('location');
      } catch (err) {
        console.error('Failed to update location:', err);
        toast.dismiss(loadingToast);
        CRUDToasts.updateError('location', 'Please try again');
      }
    }
  };

  const handleDeleteLocation = async (locationId: string) => {
    // Only admins can delete locations
    if (user?.role !== 'admin') {
      toast.error('Only administrators can delete locations');
      return;
    }
    // Prevent deletion of protected "Storage Room A" location
    const location = locations.find((loc: any) => loc.id === locationId);
    if (location && location.name === 'Storage Room A') {
      toast.error('Cannot delete "Storage Room A" - This is a protected default location');
      return;
    }
    
    const loadingToast = CRUDToasts.deleting('location');
    try {
      await deleteLocation(locationId).unwrap();
      toast.dismiss(loadingToast);
      CRUDToasts.deleted('location');
    } catch (err) {
      console.error('Failed to delete location:', err);
      toast.dismiss(loadingToast);
      CRUDToasts.deleteError('location', 'Please try again');
    }
  };

  const getStatusColor = (isactive: boolean) => {
    return isactive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const stats = {
    total: locationStats?.total || locations.length,
    active: locationStats?.active || locations.filter(loc => loc.isactive).length,
    inactive: locationStats?.inactive || locations.filter(loc => !loc.isactive).length,
    totalItems: inventoryItems.length,
    issuedItems: inventoryItems?.filter((item: any) => item.status === 'issued').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Location Management</h1>
          <p className="mt-1 text-gray-600">Manage inventory locations and track item placements</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 space-x-2 text-white transition-all duration-200 rounded-lg shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 hover:shadow-xl"
        >
          <Plus size={16} className="text-green-500" />
          <span>Add Location</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Locations</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-[#0d559e] to-[#1a6bb8]">
              <MapPin className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Locations</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-[#0d559e] to-[#1a6bb8]">
              <Building className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-[#0d559e] to-[#1a6bb8]">
              <Package className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Issued Items</p>
              <p className="text-2xl font-bold text-gray-900">{stats.issuedItems}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-[#0d559e] to-[#1a6bb8]">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" size={16} />
            <input
              type="text"
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <FilterDropdown
            value={filterStatus}
            onChange={setFilterStatus}
            options={statusFilters}
            placeholder="Filter by status"
            size="sm"
          />

          <div className="sm:col-span-2">
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              startPlaceholder="Start Date"
              endPlaceholder="End Date"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-gray-400" />
            <span className="text-sm text-gray-600">{filteredLocations.length} locations found</span>
          </div>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterStatus('all');
              setStartDate(null);
              setEndDate(null);
            }}
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Locations Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredLocations.map((location) => (
          <div key={location.id} className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-[#0d559e] to-[#1a6bb8]">
                  <MapPinIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{location.name}</h3>
                  <p className="text-sm text-gray-600">{location.description}</p>
                </div>
              </div>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(location.isactive)}`}>
                {location.isactive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center space-x-2">
                <Building className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">{location.address}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Package className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Capacity: {location.capacity} items</span>
              </div>
            </div>


            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => setViewingLocation(location)}
                className="p-2 text-blue-600 transition-colors rounded hover:text-blue-900 hover:bg-blue-50"
                title="View Details"
              >
                <Eye size={16} className="text-blue-500" />
              </button>
              <button
                onClick={() => handleEditLocation(location)}
                className="p-2 text-green-600 transition-colors rounded hover:text-green-900 hover:bg-green-50"
                title="Edit Location"
              >
                <Edit size={16} className="text-blue-500" />
              </button>
              {(user?.role === 'admin' || user?.role === 'stock-manager') && (
                <button
                  onClick={() => handleDeleteLocation(location.id)}
                  disabled={location.name === 'Storage Room A'}
                  className={`p-2 transition-colors rounded ${
                    location.name === 'Storage Room A'
                      ? 'text-gray-400 cursor-not-allowed bg-gray-50'
                      : 'text-red-600 hover:text-red-900 hover:bg-red-50'
                  }`}
                  title={location.name === 'Storage Room A' ? 'Cannot delete protected location' : 'Delete Location'}
                >
                  <Trash2 size={16} className={location.name === 'Storage Room A' ? 'text-gray-400' : 'text-red-500'} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredLocations.length === 0 && (
        <div className="py-12 text-center">
          <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">No locations found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* Add/Edit Location Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-300">
          <div className="w-full max-w-lg p-6 bg-white rounded-2xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              {editingLocation ? 'Edit Location' : 'Add New Location'}
            </h3>
            
            <form onSubmit={editingLocation ? handleUpdateLocation : handleAddLocation} className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Location Name *</label>
                <input
                  type="text"
                  value={newLocation.name}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., IT Department, Storage Room A"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={newLocation.description}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of this location..."
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Address</label>
                <input
                  type="text"
                  value={newLocation.address}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Physical address of the location"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Capacity</label>
                  <input
                    type="number"
                    value={newLocation.capacity}
                    onChange={(e) => setNewLocation(prev => ({ ...prev, capacity: parseInt(e.target.value) || 50 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Max items"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isactive"
                  checked={newLocation.isactive}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, isactive: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isactive" className="block ml-2 text-sm text-gray-900">
                  Active Location
                </label>
              </div>

              <div className="flex items-center justify-end pt-4 space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingLocation(null);
                    setNewLocation({
                      name: '',
                      description: '',
                      address: '',
                      capacity: 50,
                      contactperson: '',
                      contactnumber: '',
                      isactive: true
                    });
                  }}
                  className="flex items-center px-4 py-2 space-x-2 text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <X size={16} className="text-red-500" />
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  className="flex items-center px-4 py-2 space-x-2 text-white transition-all duration-200 rounded-lg shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 hover:shadow-xl"
                >
                  <Save size={16} className="text-green-500" />
                  <span>{editingLocation ? 'Update' : 'Add'} Location</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Location Modal */}
      {viewingLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-300">
          <div className="w-full max-w-lg p-6 bg-white rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Location Details</h3>
              <button
                onClick={() => setViewingLocation(null)}
                className="text-gray-400 transition-colors hover:text-gray-600"
              >
                <X size={20} className="text-red-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-xl bg-gradient-to-r from-[#0d559e] to-[#1a6bb8]">
                  <MapPinIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">{viewingLocation.name}</h4>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(viewingLocation.isactive)}`}>
                    {viewingLocation.isactive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Description</label>
                <p className="p-3 text-gray-900 rounded-lg bg-gray-50">
                  {viewingLocation.description || 'No description provided'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Address</label>
                  <p className="text-sm text-gray-900">{viewingLocation.address}</p>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Capacity</label>
                  <p className="text-sm text-gray-900">{viewingLocation.capacity} items</p>
                </div>
              </div>

            </div>

            <div className="flex items-center justify-end pt-6 mt-6 space-x-3 border-t border-gray-200">
              <button
                onClick={() => {
                  setViewingLocation(null);
                  handleEditLocation(viewingLocation);
                }}
                className="flex items-center px-4 py-2 space-x-2 text-white transition-all duration-200 rounded-lg bg-gradient-to-r from-[#0d559e] to-[#1a6bb8] hover:from-green-600 hover:to-teal-700"
              >
                <Edit size={16} className="text-blue-500" />
                <span>Edit Location</span>
              </button>
              <button
                onClick={() => setViewingLocation(null)}
                className="px-4 py-2 text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationManagement;
