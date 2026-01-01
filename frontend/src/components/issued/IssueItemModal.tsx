import React, { useState, useEffect, useRef } from 'react';
import { 
  useGetInventoryItemsQuery,
  useIssueItemMutation,
  useGetUsersQuery
} from '../../store/api';
import { useAppSelector } from '../../store/hooks';
import { 
  Package, 
  User, 
  Calendar, 
  CheckCircle, 
  XCircle,
  ArrowRight,
  AlertCircle,
  Search,
  Building2,
  Laptop,
  Users,
  Briefcase,
  GraduationCap,
  Shield,
  Wrench,
  Heart,
  DollarSign,
  Globe,
  Home,
  ChevronDown
} from 'lucide-react';
import { CRUDToasts } from '../../services/toastService';
import toast from 'react-hot-toast';

interface IssueItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableItems: any[];
}

const IssueItemModal: React.FC<IssueItemModalProps> = ({ isOpen, onClose, availableItems }) => {
  const [issueItem] = useIssueItemMutation();
  const { data: usersResponse } = useGetUsersQuery({});
  const users = usersResponse?.data || [];
  const { user } = useAppSelector((state) => state.auth);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter available items based on search term
  const filteredItems = availableItems.filter((item: any) =>
    item.assetname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.assetcategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.locationofitem.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter active employees (excluding current user if they're admin)
  const activeEmployees = users.filter(userItem => 
    userItem.isactive && 
    (userItem.role === 'employee' || userItem.role === 'stock-manager') &&
    userItem.id !== user?.id // Don't include current user
  );

  // Filter employees based on search term
  const filteredEmployees = activeEmployees.filter(employee =>
    employee.name.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
    (employee.department || '').toLowerCase().includes(employeeSearchTerm.toLowerCase())
  );

  // Debug: Log users data to see what's being fetched
  console.log('All users from context:', users);
  console.log('Active employees filtered:', activeEmployees);
  console.log('Current user:', user);

  // Function to get department-specific icon
  const getDepartmentIcon = (department: string) => {
    const dept = department?.toLowerCase() || '';
    
    if (dept.includes('it') || dept.includes('technology') || dept.includes('tech')) {
      return <Laptop size={16} className="text-blue-600" />;
    } else if (dept.includes('hr') || dept.includes('human') || dept.includes('resource')) {
      return <Users size={16} className="text-green-600" />;
    } else if (dept.includes('finance') || dept.includes('accounting') || dept.includes('account')) {
      return <DollarSign size={16} className="text-green-700" />;
    } else if (dept.includes('marketing') || dept.includes('sales')) {
      return <Briefcase size={16} className="text-purple-600" />;
    } else if (dept.includes('operations') || dept.includes('ops')) {
      return <Wrench size={16} className="text-orange-600" />;
    } else if (dept.includes('education') || dept.includes('training') || dept.includes('academic')) {
      return <GraduationCap size={16} className="text-indigo-600" />;
    } else if (dept.includes('security') || dept.includes('admin')) {
      return <Shield size={16} className="text-red-600" />;
    } else if (dept.includes('health') || dept.includes('medical')) {
      return <Heart size={16} className="text-pink-600" />;
    } else if (dept.includes('international') || dept.includes('global')) {
      return <Globe size={16} className="text-cyan-600" />;
    } else if (dept.includes('facilities') || dept.includes('maintenance')) {
      return <Home size={16} className="text-yellow-600" />;
    } else {
      return <Building2 size={16} className="text-gray-600" />;
    }
  };

  // Click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsEmployeeDropdownOpen(false);
        setEmployeeSearchTerm('');
      }
    };

    if (isEmployeeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEmployeeDropdownOpen]);

  const handleIssueItem = async () => {
    if (!selectedItem || !selectedEmployee) {
      toast.error('Please select an item and employee');
      return;
    }

    setIsSubmitting(true);
    const loadingToast = CRUDToasts.updating('item');

    try {
      await issueItem({
        id: selectedItem.id,
        issuedTo: selectedEmployee.name,
        expectedReturnDate: issueDate,
        purpose: 'Direct Issue',
        notes: `Direct issue to ${selectedEmployee.name} by ${user?.name || 'Admin'}`
      }).unwrap();

      toast.dismiss(loadingToast);
      CRUDToasts.updated('item');
      
      // Reset form
      setSelectedItem(null);
      setSelectedEmployee(null);
      setIssueDate(new Date().toISOString().split('T')[0]);
      setSearchTerm('');
      setEmployeeSearchTerm('');
      setIsEmployeeDropdownOpen(false);
      onClose();
    } catch (error) {
      console.error('Failed to issue item:', error);
      toast.dismiss(loadingToast);
      CRUDToasts.updateError('item', 'Please try again');
    }

    setIsSubmitting(false);
  };

  const handleClose = () => {
    setSelectedItem(null);
    setSelectedEmployee(null);
    setIssueDate(new Date().toISOString().split('T')[0]);
    setSearchTerm('');
    setEmployeeSearchTerm('');
    setIsEmployeeDropdownOpen(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm transition-all duration-300 overflow-y-auto">
        <div className="w-full max-w-2xl mx-auto my-4 bg-white rounded-lg sm:rounded-2xl shadow-xl">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 pr-2">Issue Item to Employee</h3>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 transition-colors rounded-lg hover:text-gray-600 hover:bg-gray-100"
          >
            <XCircle size={20} className="text-red-500" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Step 1: Select Item */}
          <div>
            <h4 className="mb-3 text-base sm:text-lg font-medium text-gray-900 flex items-center">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
              Step 1: Select Available Item
            </h4>
            
            {/* Search Filter */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" size={16} />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full py-2 pl-10 pr-4 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {searchTerm && (
                <div className="mt-2 text-sm text-gray-600">
                  Showing {filteredItems.length} of {availableItems.length} items
                </div>
              )}
            </div>

            {/* Items List with Contained Scrolling */}
            <div className="max-h-40 sm:max-h-56 md:max-h-72 lg:max-h-80 overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-inner custom-scrollbar">
              {filteredItems.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`p-3 sm:p-4 cursor-pointer transition-colors ${
                        selectedItem?.id === item.id
                          ? 'bg-blue-50 border-l-4 border-blue-500'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-gray-900 text-sm sm:text-base truncate">{item.assetname}</h5>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">{item.assetcategory}</p>
                          <p className="text-xs sm:text-sm text-gray-500 truncate">
                            Stock: {item.balancequantityinstock} | Location: {item.locationofitem}
                          </p>
                        </div>
                        <div className="flex-shrink-0 sm:text-right">
                          <p className="text-sm font-medium text-gray-900">₹{item.totalcost?.toLocaleString()}</p>
                          <p className="text-xs text-gray-500 capitalize">{item.status}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 sm:p-8 text-center text-gray-500">
                  <AlertCircle className="mx-auto w-6 h-6 sm:w-8 sm:h-8 mb-2" />
                  <p className="text-sm sm:text-base">{searchTerm ? 'No items match your search' : 'No available items found'}</p>
                  <p className="text-xs sm:text-sm">
                    {searchTerm ? 'Try adjusting your search terms' : 'Add inventory items first'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Employee Details */}
          <div>
            <h4 className="mb-3 text-base sm:text-lg font-medium text-gray-900 flex items-center">
              <User className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-600" />
              Step 2: Employee Information
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Employee Name *
                </label>
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsEmployeeDropdownOpen(!isEmployeeDropdownOpen)}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-left flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      {selectedEmployee ? (
                        <>
                          {getDepartmentIcon(selectedEmployee.department || '')}
                          <span>{selectedEmployee.name}</span>
                          <span className="text-gray-500">({selectedEmployee.department || 'No Department'})</span>
                        </>
                      ) : (
                        <span className="text-gray-500">Select an employee</span>
                      )}
                    </div>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${isEmployeeDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isEmployeeDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {/* Search Input */}
                      <div className="p-2 border-b border-gray-200">
                        <div className="relative">
                          <Search className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" size={14} />
                          <input
                            type="text"
                            placeholder="Search employees..."
                            value={employeeSearchTerm}
                            onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                            className="w-full py-1 pl-8 pr-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      
                      {/* Employee List */}
                      <div className="py-1">
                        {filteredEmployees.length > 0 ? (
                          filteredEmployees.map((employee) => (
                            <button
                              key={employee.id}
                              type="button"
                              onClick={() => {
                                setSelectedEmployee(employee);
                                setIsEmployeeDropdownOpen(false);
                                setEmployeeSearchTerm('');
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                            >
                              {getDepartmentIcon(employee.department || '')}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 truncate">{employee.name}</div>
                                <div className="text-gray-500 truncate">{employee.department || 'No Department'}</div>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-gray-500 text-center">
                            {employeeSearchTerm ? 'No employees found' : 'No active employees available'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {activeEmployees.length === 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    No active employees available. Please add employees in User Management.
                  </p>
                )}
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Issue Date *
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Selected Item Summary */}
          {selectedItem && (
            <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h5 className="font-medium text-blue-900 mb-2 text-sm sm:text-base">Selected Item:</h5>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <p className="text-blue-800 text-sm sm:text-base">{selectedItem.assetname}</p>
                  <p className="text-xs sm:text-sm text-blue-600">{selectedItem.assetcategory}</p>
                </div>
                <div className="mt-2 sm:mt-0 sm:text-right">
                  <p className="text-blue-800 font-medium text-sm sm:text-base">₹{selectedItem.totalcost?.toLocaleString()}</p>
                  <p className="text-xs sm:text-sm text-blue-600">Stock: {selectedItem.balancequantityinstock}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end pt-4 sm:pt-6 mt-4 sm:mt-6 space-y-3 sm:space-y-0 sm:space-x-3 border-t border-gray-200 p-4 sm:p-6">
          <button
            onClick={handleClose}
            className="flex items-center justify-center px-4 py-2 space-x-2 text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50 text-sm sm:text-base"
          >
            <XCircle size={16} className="text-red-500" />
            <span>Cancel</span>
          </button>
          <button
            onClick={handleIssueItem}
            disabled={!selectedItem || !selectedEmployee || isSubmitting}
            className="flex items-center justify-center px-4 py-2 space-x-2 text-white transition-all duration-200 rounded-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            <CheckCircle size={16} className="text-green-500" />
            <span>{isSubmitting ? 'Issuing...' : 'Issue Item'}</span>
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default IssueItemModal;
