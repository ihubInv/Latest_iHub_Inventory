import React from 'react';
import { 
  useGetRequestsQuery,
  useGetInventoryItemsQuery,
  useGetMyRequestsQuery
} from '../../store/api';
import { useAppSelector } from '../../store/hooks';
import { Clock, Package, User, CheckCircle, XCircle } from 'lucide-react';

const RecentActivity: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  
  // Admin/Stock Manager: Get all requests and inventory
  const { data: requestsResponse } = useGetRequestsQuery({}, {
    skip: user?.role === 'employee' // Skip for employees
  });
  
  // Employee: Get only their own requests
  const { data: myRequestsResponse } = useGetMyRequestsQuery({ page: 1, limit: 50 }, {
    skip: user?.role !== 'employee' // Only for employees
  });
  
  const { data: inventoryResponse } = useGetInventoryItemsQuery({}, {
    skip: user?.role === 'employee' // Skip inventory for employees - they don't need this data
  });
  
  // Use appropriate data source
  const requests = user?.role === 'employee' 
    ? (myRequestsResponse || []) 
    : (requestsResponse?.data || []);
  const inventoryItems = inventoryResponse?.data || [];

  // Generate recent activities from requests and inventory
  const activities = [
    ...requests.slice(0, 3).map(request => ({
      id: `request-${request.id}`,
      type: 'request',
      title: `${request.employeename} requested ${request.itemtype}`,
      description: `Quantity: ${request.quantity} - ${request.purpose}`,
      time: request.submittedat,
      status: request.status,
      icon: User
    })),
    ...inventoryItems.slice(0, 2).map((item: any) => ({
      id: `inventory-${item.id}`,
      type: 'inventory',
      title: `${item.assetname} added to inventory`,
      description: `Category: ${item.assetcategory} - Location: ${item.locationofitem}`,
      time: item.createdat,
      status: 'added',
      icon: Package
    }))
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return CheckCircle;
      case 'rejected':
        return XCircle;
      case 'pending':
        return Clock;
      default:
        return Package;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600';
      case 'rejected':
        return 'text-red-600';
      case 'pending':
        return 'text-yellow-600';
      default:
        return 'text-blue-600';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  return (
    <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Recent Activity</h3>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-blue-500"></div>
          <span className="text-sm text-gray-600">Live updates</span>
        </div>
      </div>
      
      {activities.length > 0 ? (
        <div className="space-y-4">
          {activities.map((activity) => {
            const StatusIcon = getStatusIcon(activity.status);
            const statusColor = getStatusColor(activity.status);
            
            return (
              <div key={activity.id} className="flex items-start p-3 space-x-3 transition-colors rounded-lg hover:bg-gray-50">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
                    <activity.icon className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.title}
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    {activity.description}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {formatTime(activity.time)}
                    </span>
                    <StatusIcon className={`w-4 h-4 ${statusColor}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-8 text-center">
          <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600">No recent activity</p>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;