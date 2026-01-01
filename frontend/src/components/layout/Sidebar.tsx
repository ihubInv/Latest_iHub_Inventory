import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import type { RootState } from '../../store';
import {
  LayoutDashboard,
  Package,
  PackagePlus,
  PackageX,
  Users,
  FileText,
  ClipboardList,
  FolderPlus,
  ChevronLeft,
  ChevronRight,
  MapPin,
  UserCheck,
  Bell,
  Eye,
  LogOut
} from 'lucide-react';
import { logout } from '../../store/slices/authSlice';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle, mobileOpen, onMobileToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  if (!user) return null;

  const getMenuItems = () => {

    switch (user.role) {
      case 'admin':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: `/admin/dashboard` },
          { icon: PackagePlus, label: 'Add Inventory', path: `/add-inventory` },
          { icon: FolderPlus, label: 'Add Category', path: `/add-category` },
          { icon: Package, label: 'Total Inventory', path: `/inventory` },
          { icon: UserCheck, label: 'Issued Items', path: `/issued-items` },
          { icon: PackageX, label: 'Return Requests', path: `/return-requests` },
          { icon: MapPin, label: 'Location Management', path: `/locations` },
          { icon: Users, label: 'User Management', path: `/users` },
          { icon: FileText, label: 'Reports', path: `/reports` },
        ];
      
      case 'stock-manager':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: `/stock-manager/dashboard` },
          { icon: PackagePlus, label: 'Add Inventory', path: `/add-inventory` },
          { icon: FolderPlus, label: 'Add Category', path: `/add-category` },
          { icon: Package, label: 'Total Inventory', path: `/inventory` },
          { icon: UserCheck, label: 'Issued Items', path: `/issued-items` },
          { icon: PackageX, label: 'Return Requests', path: `/return-requests` },
          { icon: MapPin, label: 'Location Management', path: `/locations` },
          { icon: FileText, label: 'Reports', path: `/reports` },
        ];
      
      case 'employee':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: `/employee/dashboard` },
          { icon: ClipboardList, label: 'Create Request', path: `/create-request` },
          { icon: Eye, label: 'Issued Items Details', path: `/employee/issued-items` },
          { icon: Bell, label: 'Notifications', path: `/notifications` },
        ];
      
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  const handleNavigation = (path: string) => {
    navigate(path);
    // Close mobile sidebar after navigation
    if (mobileOpen) {
      onMobileToggle();
    }
  };

  const handleLogout = async () => {
    try {
      // Perform logout and then navigate to login
      // @ts-ignore - thunk returns a promise
      await dispatch(logout());
    } finally {
      navigate('/login');
      if (mobileOpen) onMobileToggle();
    }
  };

  return (
    <>
      {/* Transparent scrollbar styles for sidebar */}
      <style>{`
        .sidebar-scroll::-webkit-scrollbar { width: 8px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.25);
          border-radius: 8px;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.4); }
        .sidebar-scroll { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.25) transparent; }
      `}</style>
      {/* Desktop Sidebar */}
      <div className={`hidden lg:flex bg-gradient-to-b from-[#0d559e]/90 via-[#1a6bb8]/90 to-[#2c7bc7]/90 text-white backdrop-blur-lg shadow-2xl flex-col h-full fixed left-0 top-0 z-40 transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}>
      
        <div className={`flex items-center justify-between p-4 border-b border-white/10 transition-all ${collapsed ? 'px-2' : 'px-6'}`}>
          {/* Logo + Title */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-[#0d559e] via-[#1a6bb8] to-[#2c7bc7] hover:from-[#0a4a8a] hover:via-[#155a9e] hover:to-[#256bb6] rounded-2xl shadow-lg transition-all duration-200">
                <span className="text-lg font-bold text-white">I</span>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-xl font-bold text-white">Inventory</h1>
                <p className="-mt-1 text-sm text-blue-100 font-medium">Management</p>
              </div>
            )}
          </div>
          
          {/* Minimize/Maximize Button */}
          <button
            onClick={onToggle}
            className={`flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 text-white hover:scale-110 ${collapsed ? 'mx-auto' : ''}`}
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? (
              <ChevronRight size={18} className="text-white" />
            ) : (
              <ChevronLeft size={18} className="text-white" />
            )}
          </button>
        </div>

        {/* User Info */}
        {!collapsed && (
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-[#0d559e] to-[#1a6bb8]">
                <span className="text-sm font-medium text-white">
                  {user.name?.split(' ').map((n: string) => n[0]).join('')}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-blue-100 capitalize">{user.role?.replace('-', ' ')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="sidebar-scroll flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const colorMap: Record<string, string> = {
              'Dashboard': 'text-amber-200',
              'Add Inventory': 'text-emerald-200',
              'Add Category': 'text-rose-200',
              'Total Inventory': 'text-cyan-200',
              'Issued Items': 'text-indigo-200',
              'Return Requests': 'text-orange-200',
              'Location Management': 'text-fuchsia-200',
              'User Management': 'text-lime-200',
              'Reports': 'text-violet-200',
              'Create Request': 'text-teal-200',
              'Issued Items Details': 'text-sky-200',
              'Notifications': 'text-orange-200',
            };
            const iconColor = colorMap[item.label] || 'text-blue-100';
            
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-4 py-3 text-left rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-white/15 hover:bg-white/20 text-white shadow'
                    : 'text-white/90 hover:bg-white/5'
                }`}
                title={collapsed ? item.label : ''}
              >
                <div className={`flex items-center ${collapsed ? '' : 'space-x-3'}`}>
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-white/10 ring-1 ring-white/10">
                    <item.icon size={18} className={`${isActive ? 'text-white' : iconColor}`} />
                  </span>
                  {!collapsed && <span className="font-medium">{item.label}</span>}
                </div>
              </button>
            );
          })}
        </nav>
        {/* Logout - Desktop */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-4 py-3 text-left rounded-lg transition-all duration-200 bg-white/10 hover:bg-white/15 text-white border border-white/15 shadow-sm`}
            title={collapsed ? 'Logout' : ''}
          >
            <div className={`flex items-center ${collapsed ? '' : 'space-x-3'}`}>
              <LogOut size={20} className="text-blue-100" />
              {!collapsed && <span className="font-medium">Logout</span>}
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-[#0d559e] via-[#1a6bb8] to-[#2c7bc7] text-white shadow-lg transform transition-transform duration-300 ease-in-out ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-[#0d559e] via-[#1a6bb8] to-[#2c7bc7] hover:from-[#0a4a8a] hover:via-[#155a9e] hover:to-[#256bb6] rounded-xl">
              <span className="text-lg font-bold text-white">IM</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Inventory</h1>
              <p className="text-sm text-blue-100">Management</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-[#0d559e] to-[#1a6bb8]">
              <span className="text-sm font-medium text-white">
                {user.name?.split(' ').map((n: string) => n[0]).join('')}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-white">{user.name}</p>
              <p className="text-xs text-blue-100 capitalize">{user.role?.replace('-', ' ')}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-scroll flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const colorMap: Record<string, string> = {
              'Dashboard': 'text-amber-200',
              'Add Inventory': 'text-emerald-200',
              'Add Category': 'text-rose-200',
              'Total Inventory': 'text-cyan-200',
              'Issued Items': 'text-indigo-200',
              'Return Requests': 'text-orange-200',
              'Location Management': 'text-fuchsia-200',
              'User Management': 'text-lime-200',
              'Reports': 'text-violet-200',
              'Create Request': 'text-teal-200',
              'Issued Items Details': 'text-sky-200',
              'Notifications': 'text-orange-200',
            };
            const iconColor = colorMap[item.label] || 'text-blue-100';
            
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center justify-between px-4 py-3 text-left rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-white/15 hover:bg-white/20 text-white shadow'
                    : 'text-white/90 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-white/10 ring-1 ring-white/10">
                    <item.icon size={18} className={`${isActive ? 'text-white' : iconColor}`} />
                  </span>
                  <span className="font-medium">{item.label}</span>
                </div>
              </button>
            );
          })}
        </nav>
        {/* Logout - Mobile */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-4 py-3 text-left rounded-lg transition-all duration-200 bg-white/10 hover:bg_WHITE/15 text-white border border-white/15 shadow-sm"
          >
            <div className="flex items-center space-x-3">
              <LogOut size={20} className="text-blue-100" />
              <span className="font-medium">Logout</span>
            </div>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

