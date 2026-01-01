import React, { useState, useMemo } from 'react';
import { ChevronDown, User, Mail, Building } from 'lucide-react';
import { useGetUsersQuery } from '../../store/api/notificationApi';
// import type  { User as UserType } from '../../types';

interface UserDropdownProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  label?: string;
}

const UserDropdown: React.FC<UserDropdownProps> = ({
  value,
  onChange,
  placeholder = "Select user...",
  disabled = false,
  required = false,
  label = "User"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: usersResponse, isLoading, error } = useGetUsersQuery({});
  const users = usersResponse?.data || [];

  // Filter users based on search term and active status
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    return users
      .filter((user: any) => user.isactive)
      .filter((user: any) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          user.name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          (user.department && user.department.toLowerCase().includes(searchLower))
        );
      })
      .sort((a: any, b: any) => {
        // Sort by role priority (admin, stock-manager, employee) then by name
        const roleOrder: any = { admin: 0, 'stock-manager': 1, employee: 2 };
        const roleDiff = roleOrder[a.role] - roleOrder[b.role];
        if (roleDiff !== 0) return roleDiff;
        return a.name.localeCompare(b.name);
      });
  }, [users, searchTerm]);

  const selectedUser = users.find((user: any) => user.id === value);

  const handleUserSelect = (userId: string) => {
    onChange(userId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'text-red-600 bg-red-100';
      case 'stock-manager':
        return 'text-blue-600 bg-blue-100';
      case 'employee':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'stock-manager':
        return 'Stock Manager';
      case 'employee':
        return 'Employee';
      default:
        return role;
    }
  };

  if (error) {
    return (
      <div>
        {label && (
          <label className="block mb-2 text-sm font-medium text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div className="w-full px-4 py-2 text-red-600 border border-red-300 rounded-lg bg-red-50">
          Error loading users
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {label && (
        <label className="block mb-2 text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled || isLoading}
          className={`w-full px-4 py-2 text-left border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            disabled || isLoading ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {selectedUser ? (
                <>
                  <User className="w-4 h-4 text-gray-500" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      {selectedUser.name}
                    </span>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(selectedUser.role)}`}>
                        {getRoleLabel(selectedUser.role)}
                      </span>
                      {selectedUser.department && (
                        <>
                          <span>•</span>
                          <span>{selectedUser.department}</span>
                        </>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <span className="text-gray-500">
                  {isLoading ? 'Loading users...' : placeholder}
                </span>
              )}
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
            {/* Search Input */}
            <div className="p-3 border-b border-gray-200">
              <input
                type="text"
                placeholder="Search by name, email, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>

            {/* Users List */}
            <div className="max-h-60 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  {searchTerm ? 'No users found matching your search' : 'No active users available'}
                </div>
              ) : (
                filteredUsers.map((user: any) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleUserSelect(user.id)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center space-x-3">
                      <User className="w-4 h-4 text-gray-500" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user.name}
                          </p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                            {getRoleLabel(user.role)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">{user.email}</span>
                          </div>
                          {user.department && (
                            <>
                              <span className="text-gray-300">•</span>
                              <div className="flex items-center space-x-1 text-xs text-gray-500">
                                <Building className="w-3 h-3" />
                                <span className="truncate">{user.department}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default UserDropdown;
