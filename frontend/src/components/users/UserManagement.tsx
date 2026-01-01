import React, { useState } from 'react';
import { 
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation
} from '../../store/api';
import { useAppSelector } from '../../store/hooks';
import { Users, Plus, Edit, Trash2, Search, Filter, UserCheck, UserX, X, Save, Eye, EyeOff, Shield, UserCog, User as UserIcon, Building2, CheckCircle, XCircle } from 'lucide-react';
import AttractiveDropdown from '../common/AttractiveDropdown';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { validateEmail } from '../../utils/validation';
import type  { User } from '../../types';

// Function to create employee account in Supabase Auth
// const createEmployeeAccount = async (userData: FormData) => {
//   try {
//     // First, check if user already exists
//     const { data: existingUser, error: checkError } = await supabase
//       .from('users')
//       .select('id, email')
//       .eq('email', userData.email)
//       .maybeSingle();

//     if (existingUser) {
//       return {
//         success: false,
//         message: 'An account with this email already exists.'
//       };
//     }

//     // Create user record directly in users table (without auth signup)
//     // This approach avoids all session conflicts
//     const { data: userRecord, error: insertError } = await supabase
//       .from('users')
//       .insert({
//         email: userData.email,
//         name: userData.name,
//         role: userData.role,
//         department: userData.department || null,
//         isactive: true,
//         createdat: new Date().toISOString(),
//         lastlogin: new Date().toISOString()
//       })
//       .select()
//       .single();

//     if (insertError) {
//       console.error('Insert error:', insertError);
      
//       // Handle specific error cases
//       if (insertError.code === '23505') {
//         return {
//           success: false,
//           message: 'An account with this email already exists.'
//         };
//       }
      
//       throw new Error(insertError.message);
//     }

//     return {
//       success: true,
//       message: 'Employee account created successfully! The user will need to use "Forgot Password" to set their password and log in.',
//       user: { id: userRecord.id, email: userRecord.email }
//     };
//   } catch (error: any) {
//     console.error('Error creating employee account:', error);
//     return {
//       success: false,
//       message: error.message || 'Failed to create employee account'
//     };
//   }
// };



interface FormData {
  name: string;
  email: string;
  password: string;
  role: string;
  department: string;
  location: string;
}
const UserManagement: React.FC = () => {
  const { data: usersResponse } = useGetUsersQuery({});
  const users = usersResponse?.data || [];
  const [createUser] = useCreateUserMutation();
  const [updateUser] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewingCategory, setViewingCategory] = useState<any>(null);
    const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
const [updateModel, setUpdateModel] = useState(false);

  
  
const [formData, setFormData] = useState<FormData>({
        name: '',
        email: '',
        password: '',
        role: 'employee',
        department: '',
        location: ''
      });
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Debug: Log formData changes
  React.useEffect(() => {
    console.log('🔍 FormData Debug - Current Form Data:', formData);
  }, [formData]);
  const roleOptions = [
    { 
      value: 'employee', 
      label: 'Employee',
      icon: <UserIcon size={16} />,
      description: 'Basic user with limited access'
    },
    { 
      value: 'stock-manager', 
      label: 'Stock Manager',
      icon: <UserCog size={16} />,
      description: 'Can manage inventory and users'
    },
    { 
      value: 'admin', 
      label: 'Administrator',
      icon: <Shield size={16} />,
      description: 'Full system access and control'
    }
  ];

  const statusOptions = [
    { 
      value: 'all', 
      label: 'All Status',
      icon: <Filter size={16} />,
      description: 'Show all users'
    },
    { 
      value: 'active', 
      label: 'Active',
      icon: <CheckCircle size={16} className="text-green-500" />,
      description: 'Currently active users'
    },
    { 
      value: 'inactive', 
      label: 'Inactive',
      icon: <XCircle size={16} className="text-red-500" />,
      description: 'Deactivated users'
    }
  ];

  const departmentOptions = [
    { 
      value: '', 
      label: 'No Department',
      icon: <Building2 size={16} />,
      description: 'No specific department assigned'
    },
    { 
      value: 'IT', 
      label: 'Information Technology',
      icon: <Building2 size={16} />,
      description: 'IT department'
    },
    { 
      value: 'HR', 
      label: 'Human Resources',
      icon: <Building2 size={16} />,
      description: 'Human Resources department'
    },
    { 
      value: 'Finance', 
      label: 'Finance',
      icon: <Building2 size={16} />,
      description: 'Finance department'
    },
    { 
      value: 'Operations', 
      label: 'Operations',
      icon: <Building2 size={16} />,
      description: 'Operations department'
    },
    { 
      value: 'Marketing', 
      label: 'Marketing',
      icon: <Building2 size={16} />,
      description: 'Marketing department'
    }
  ];

  const locationOptions = [
    { 
      value: '', 
      label: 'No Location',
      icon: <Building2 size={16} />,
      description: 'No specific location assigned'
    },
    { 
      value: 'Mandi', 
      label: 'Mandi',
      icon: <Building2 size={16} />,
      description: 'Mandi location'
    },
    { 
      value: 'Delhi', 
      label: 'Delhi',
      icon: <Building2 size={16} />,
      description: 'Delhi location'
    },
    { 
      value: 'Bangalore', 
      label: 'Bangalore',
      icon: <Building2 size={16} />,
      description: 'Bangalore location'
    },
    { 
      value: 'Mumbai', 
      label: 'Mumbai',
      icon: <Building2 size={16} />,
      description: 'Mumbai location'
    }
  ];


  const filteredUsers = users.filter((user: any) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.isactive) ||
                         (filterStatus === 'inactive' && !user.isactive);
    
    // Role-based visibility: Admins see all, Stock Managers see all except other admins, Employees see only themselves
    let matchesVisibility = true;
    if (currentUser?.role === 'stock-manager') {
      matchesVisibility = user.role !== 'admin'; // Stock managers can't see admin accounts
    } else if (currentUser?.role === 'employee') {
      matchesVisibility = user.id === currentUser.id; // Employees can only see themselves
    }
    // Admins can see all users (matchesVisibility remains true)
    
    return matchesSearch && matchesRole && matchesStatus && matchesVisibility;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'stock-manager':
        return 'bg-blue-100 text-blue-800';
      case 'employee':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (isactive: boolean) => {
    return isactive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const loadingToast = toast.loading('Updating user status...');
      
      // TODO: Replace with proper API call
      // const { error } = await supabase
      //   .from('users')
      //   .update({ 
      //     isactive: !currentStatus,
      //     lastlogin: new Date().toISOString()
      //   })
      //   .eq('id', userId);

      // if (error) throw error;

      toast.dismiss(loadingToast);
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      
      // Refresh the users list
      window.location.reload();
    } catch (error: any) {
      console.error('Status update error:', error);
      toast.error('Failed to update user status. Please try again.');
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUser(userId).unwrap();
    }
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.isactive).length,
    inactive: users.filter(u => !u.isactive).length,
    admins: users.filter(u => u.role === 'admin').length,
    stockManagers: users.filter(u => u.role === 'stock-manager').length,
    employees: users.filter(u => u.role === 'employee').length
  };



  

    const validateForm = (): string[] => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Password is optional since user will set it via "Forgot Password"
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors);
  };
  
  


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    const allowedDomain = "@ihubiitmandi.in";
    if (!formData.email.endsWith(allowedDomain)) {
      toast.error(`Only emails ending with ${allowedDomain} are allowed to register.`);
      return;
    }
  
    if (!validateForm()) return;
    setIsLoading(true);
    
    let loadingToast: string | undefined;
  
    try {
      loadingToast = toast.loading('Creating employee account...');
      
      // Check if user already exists in the current users list
      const existingUser = users.find((u: any) => u.email.toLowerCase() === formData.email.toLowerCase());
      if (existingUser) {
        throw new Error('An account with this email already exists.');
      }
      
      // TODO: Replace with proper API call
      // const result = await createEmployeeAccount(formData);
      // 
      // if (!result.success) {
      //   throw new Error(result.message);
      // }
      
      // Temporarily succeed for testing
      const result = { success: true, message: 'Employee account created temporarily' };

      // Add the new user to the context to update the UI immediately
      const newUser: Omit<User, 'id' | 'createdat'> = {
        email: formData.email,
        name: formData.name,
        role: formData.role as 'admin' | 'stock-manager' | 'employee',
        department: formData.department || '',
        isactive: true,
        lastlogin: new Date()
      };
      
      // Add user to context (this will trigger a re-render)
      await createUser(newUser).unwrap();
  
      toast.dismiss(loadingToast);
      toast.success('Employee account created successfully!');
      
      // Close modal and reset form
      setShowAddModal(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'employee',
        department: '',
        location: ''
      });
      setErrors({});
  
    } catch (error: any) {
      console.error('Registration error:', error);
      if (loadingToast) {
        toast.dismiss(loadingToast);
      }
      
      // Provide more specific error messages
      let errorMessage = error.message || 'An unexpected error occurred';
      if (error.message?.includes('duplicate key') || error.message?.includes('already exists')) {
        errorMessage = 'An account with this email already exists.';
      }
      
      toast.error(`Failed to create employee account: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };
  

  





const handleUpdateUser = async (userId: string, updatedData: Partial<{
  name: string;
  role: string;
  department: string;
  location: string;
  isactive: boolean;
}>) => {
  
  try {
    console.log('Updating user:', userId, updatedData);
    const loadingToast = toast.loading('Updating user...');
    
    // TODO: Replace with proper API call
    // const { error } = await supabase
    //   .from('users')
    //   .update({
    //     ...updatedData,
    //     lastlogin: new Date().toISOString() // auto-update login time
    //   })
    //   .eq('id', userId);
    
    // if (error) throw error;

    toast.dismiss(loadingToast);
    toast.success('User updated successfully!');
    
    // Refresh the users list
    window.location.reload();
  } catch (error: any) {
    console.error('Update error:', error);
    toast.error('Failed to update user. Please try again.');
  }
};



const handleUserUpdate = (user:any) => {
  // Debug: Log the user data to see what's available
  console.log('🔍 User Update Debug - User Data:', {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    location: user.location,
    fullUser: user
  });

  // Load selected user data into formData for editing
  const formDataToSet = {
    name: user.name || '',
    email: user.email || '',
    password: '', // Do not prefill password for security
    role: user.role || 'employee',
    department: user.department || '',
    location: user.location || ''
  };

  console.log('🔍 User Update Debug - Form Data to Set:', formDataToSet);

  setFormData(formDataToSet);
  setEditingCategory(user);
  setUpdateModel(true);
}









  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-gray-600">Manage system users and their permissions</p>
        </div>
        {currentUser?.role === 'admin' && (
          <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 space-x-2 text-white transition-all duration-200 rounded-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
            <Plus size={16} className="text-green-500" />
            <span>Add User</span>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6 sm:gap-6">
        <div className="p-4 bg-white border border-gray-100 shadow-sm rounded-2xl sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 sm:text-sm">Total Users</p>
              <p className="text-xl font-bold text-gray-900 sm:text-2xl">{stats.total}</p>
            </div>
            <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600">
              <Users className="w-4 h-4 text-white sm:h-6 sm:w-6" />
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border border-gray-100 shadow-sm rounded-2xl sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 sm:text-sm">Active</p>
              <p className="text-xl font-bold text-gray-900 sm:text-2xl">{stats.active}</p>
            </div>
            <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-r from-green-500 to-teal-600">
              <UserCheck className="w-4 h-4 text-white sm:h-6 sm:w-6" />
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border border-gray-100 shadow-sm rounded-2xl sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 sm:text-sm">Inactive</p>
              <p className="text-xl font-bold text-gray-900 sm:text-2xl">{stats.inactive}</p>
            </div>
            <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-600">
              <UserX className="w-4 h-4 text-white sm:h-6 sm:w-6" />
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border border-gray-100 shadow-sm rounded-2xl sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 sm:text-sm">Admins</p>
              <p className="text-xl font-bold text-gray-900 sm:text-2xl">{stats.admins}</p>
            </div>
            <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-600">
              <Users className="w-4 h-4 text-white sm:h-6 sm:w-6" />
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border border-gray-100 shadow-sm rounded-2xl sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 sm:text-sm">Managers</p>
              <p className="text-xl font-bold text-gray-900 sm:text-2xl">{stats.stockManagers}</p>
            </div>
            <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600">
              <Users className="w-4 h-4 text-white sm:h-6 sm:w-6" />
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border border-gray-100 shadow-sm rounded-2xl sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 sm:text-sm">Employees</p>
              <p className="text-xl font-bold text-gray-900 sm:text-2xl">{stats.employees}</p>
            </div>
            <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-r from-green-500 to-teal-600">
              <Users className="w-4 h-4 text-white sm:h-6 sm:w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 bg-white border border-gray-100 shadow-sm rounded-2xl sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" size={16} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-3 pl-10 pr-4 border border-gray-300 rounded-xl shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400"
            />
          </div>

          <AttractiveDropdown
            options={[
              { 
                value: 'all', 
                label: 'All Roles',
                icon: <Filter size={16} />,
                description: 'Show all user roles'
              },
              ...roleOptions
            ]}
            value={filterRole}
            onChange={setFilterRole}
            placeholder="Filter by role"
            size="sm"
            variant="bordered"
          />

          <AttractiveDropdown
            options={statusOptions}
            value={filterStatus}
            onChange={setFilterStatus}
            placeholder="Filter by status"
            size="sm"
            variant="bordered"
          />

          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-gray-400" />
            <span className="text-sm text-gray-600">{filteredUsers.length} users</span>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-2xl">
        {filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase sm:px-6">User</th>
                  <th className="px-4 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase sm:px-6">Role</th>
                  <th className="px-4 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase sm:px-6">Department</th>
                  <th className="px-4 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase sm:px-6">Location</th>
                  <th className="px-4 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase sm:px-6">Status</th>
                  <th className="px-4 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase sm:px-6">Last Login</th>
                  <th className="px-4 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase sm:px-6">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-gray-50">
                    <td className="px-4 py-4 sm:px-6 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-8 h-8 sm:h-10 sm:w-10">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full sm:h-10 sm:w-10 bg-gradient-to-r from-blue-500 to-purple-600">
                            <span className="text-xs font-medium text-white sm:text-sm">
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3 sm:ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-xs text-gray-500 sm:text-sm">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 sm:px-6 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                        {user.role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 sm:px-6 whitespace-nowrap">
                      {user.department || 'N/A'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 sm:px-6 whitespace-nowrap">
                      {user.location || 'N/A'}
                    </td>
                    <td className="px-4 py-4 sm:px-6 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.isactive)}`}>
                        {user.isactive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 sm:px-6 whitespace-nowrap">
                      {user.lastlogin ? new Date(user.lastlogin).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium sm:px-6 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {(currentUser?.role === 'admin' || (currentUser?.role === 'stock-manager' && user.role !== 'admin')) && (
                          <button
                            onClick={() => handleToggleStatus(user.id, user.isactive)}
                            className={`p-1 rounded transition-colors ${
                              user.isactive 
                                ? 'text-orange-600 hover:text-orange-900' 
                                : 'text-green-600 hover:text-green-900'
                            }`}
                            title={user.isactive ? 'Deactivate' : 'Activate'}
                          >
                            {user.isactive ? <UserX size={16} className="text-red-500" /> : <UserCheck size={16} className="text-green-500" />}
                          </button>
                        )}
                        {(currentUser?.role === 'admin' || (currentUser?.role === 'stock-manager' && user.role !== 'admin')) && (
                          <>
                            <button 
                              onClick={() => handleUserUpdate(user)}
                              className="p-1 text-blue-600 transition-colors rounded hover:text-blue-900"
                              title="Edit User"
                            >
                              <Edit size={16} className="text-blue-500" />
                            </button>
                            {currentUser?.role === 'admin' && user.id !== currentUser.id && (
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="p-1 text-red-600 transition-colors rounded hover:text-red-900"
                                title="Delete User"
                              >
                                <Trash2 size={16} className="text-red-500" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">No users found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>


{showAddModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-sm transition-all duration-300">
    <div className="w-full max-w-4xl max-h-[90vh] p-8 bg-white rounded-2xl shadow-xl">
      <h3 className="mb-6 text-2xl font-semibold text-gray-900">
        Add New Employes 
      </h3>
      <div className="overflow-y-auto max-h-[calc(90vh-8rem)]">
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* Row 1 - Column 1 */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400"
            placeholder="e.g., Rohit Kumar"
          />
        </div>

        {/* Row 1 - Column 2 */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400"
            placeholder="rohit@ihubiitmandi.in"
          />
        </div>

        {/* Row 2 - Column 1 */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Password <span className="text-gray-400">(Optional)</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400"
              placeholder="Leave empty - user will set password via 'Forgot Password'"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff size={20} className="text-blue-500" /> : <Eye size={20} className="text-blue-500" />}
            </button>
          </div>
        </div>

        {/* Row 2 - Column 2 */}
        <div>
          <AttractiveDropdown
            label="Department"
            options={departmentOptions}
            value={formData.department}
            onChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
            placeholder="Select department"
            size="sm"
            searchable
            variant="bordered"
          />
        </div>

        {/* Row 3 - Column 1 */}
        <div>
          <AttractiveDropdown
            label="Location"
            options={locationOptions}
            value={formData.location}
            onChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
            placeholder="Select location"
            size="sm"
            searchable
            variant="bordered"
          />
        </div>

        {/* Row 4 - Role Dropdown */}
        <div className="md:col-span-2">
          <AttractiveDropdown
            label="Role"
            options={roleOptions}
            value={formData.role}
            onChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
            placeholder="Select user role"
            required
            size="sm"
            variant="bordered"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end pt-4 space-x-3 md:col-span-2">
          <button
            type="button"
            onClick={() => {
              if (!isLoading) {
                setShowAddModal(false);
                setFormData({
                  name: '',
                  email: '',
                  password: '',
                  role: 'employee',
                  department: '',
                  location: ''
                });
                setErrors({});
              }
            }}
            disabled={isLoading}
            className={`flex items-center px-4 py-2 text-gray-700 border border-gray-300 rounded-lg ${
              isLoading 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-gray-100'
            }`}
          >
            <X size={16} className="mr-1 text-red-500" />
            Cancel
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className={`flex items-center px-4 py-2 space-x-2 text-white transition-all duration-200 rounded-lg shadow-lg ${
              isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 hover:shadow-xl'
            }`}
          >
            <Save size={16} className="mr-1 text-green-500" />
            {isLoading ? 'Adding User...' : 'Add User'}
          </button>
        </div>
      </form>
      </div>
    </div>
  </div>
)}



{updateModel && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-sm transition-all duration-300">
    <div className="w-full max-w-4xl max-h-[90vh] p-8 bg-white rounded-2xl shadow-xl">
      <h3 className="mb-6 text-2xl font-semibold text-gray-900">
  Update User Details
      </h3>
      <div className="overflow-y-auto max-h-[calc(90vh-8rem)]">
<form
  onSubmit={(e) => {
    e.preventDefault();
    // Call update logic with the selected user id and updated formData
    if (editingCategory && editingCategory.id) {
      handleUpdateUser(editingCategory.id, {
        name: formData.name,
        role: formData.role,
        department: formData.department,
        location: formData.location,
        isactive: editingCategory.isactive // preserve existing active status
      });
      setUpdateModel(false);
    }
  }}
  className="grid grid-cols-1 md:grid-cols-2 gap-6"
>
  {/* Row 1 - Column 1 */}
  <div>
    <label className="block mb-2 text-sm font-medium text-gray-700">
      Name <span className="text-red-500">*</span>
    </label>
    <input
      type="text"
      value={formData.name}
      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
      required
      className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400"
      placeholder="e.g., Rohit Kumar"
    />
  </div>

  {/* Row 1 - Column 2 */}
  <div>
    <label className="block mb-2 text-sm font-medium text-gray-700">
      Email <span className="text-red-500">*</span>
    </label>
    <input
      type="email"
      value={formData.email}
      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
      className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400"
      placeholder="rohit@ihubiitmandi.in"
    />
  </div>

  {/* Row 2 - Column 1 */}
  {/* <div>
    <label className="block mb-1 text-sm font-medium text-gray-700">Password</label>
    <input
      type="password"
      value={formData.password}
      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
      placeholder="password"
    />
  </div> */}

  {/* Row 2 - Column 1 */}
  <div>
    <AttractiveDropdown
      label="Department"
      options={departmentOptions}
      value={formData.department}
      onChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
      placeholder="Select department"
      size="sm"
      searchable
      variant="bordered"
    />
  </div>

  {/* Row 2 - Column 2 */}
  <div>
    <AttractiveDropdown
      label="Location"
      options={locationOptions}
      value={formData.location}
      onChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
      placeholder="Select location"
      size="sm"
      searchable
      variant="bordered"
    />
  </div>

  {/* Row 3 - Role Dropdown */}
  <div className="md:col-span-2">
    <AttractiveDropdown
      label="Role"
      options={roleOptions}
      value={formData.role}
      onChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
      placeholder="Select user role"
      required
      size="sm"
      variant="bordered"
    />
  </div>

  {/* Buttons */}
  <div className="flex justify-end pt-4 space-x-3 md:col-span-2">
    <button
      type="button"
      onClick={() => setUpdateModel(false)}
      className="flex items-center px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100"
    >
      <X size={16} className="mr-1 text-red-500" />
      Cancel
    </button>

    <button
      type="submit"
      className="flex items-center px-4 py-2 space-x-2 text-white transition-all duration-200 rounded-lg shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 hover:shadow-xl"
    >
      <Save size={16} className="mr-1 text-green-500" />
      Update User
    </button>
  </div>
</form>
      </div>
    </div>
  </div>
)}



    </div>
  );
};

export default UserManagement;