import React, { useState } from 'react';
import { useGetRequestsQuery, useGetMyRequestsQuery } from '../../store/api';
import { useAppSelector } from '../../store/hooks';
import { Clock, CheckCircle, XCircle, FileText, Search, Filter } from 'lucide-react';
import FilterDropdown from '../common/FilterDropdown';

const RequestStatus: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  
  const { data: requestsData = [], isLoading, error } = useGetRequestsQuery({}, {
    skip: user?.role === 'employee' // Skip for employees - they should use my-requests
  });

  const { data: myRequestsData = [], isLoading: myRequestsLoading } = useGetMyRequestsQuery({ page: 1, limit: 100 }, {
    skip: user?.role !== 'employee' // Only fetch for employees
  });

  // Use appropriate data source based on user role
  const requests = user?.role === 'employee' ? (myRequestsData || []) : requestsData;
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Filter requests for current user (if employee gets own requests, admins/SM see all)
  const userRequests = user?.role === 'admin' || user?.role === 'stock-manager' 
    ? requests // Admins and Stock Managers see all requests
    : requests; // Employees already get only their own requests from my-requests endpoint

  const filteredRequests = userRequests.filter(request => {
    const matchesSearch = request.itemtype.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.employeename.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return Clock;
      case 'approved':
        return CheckCircle;
      case 'rejected':
        return XCircle;
      default:
        return FileText;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusGradient = (status: string) => {
    switch (status) {
      case 'pending':
        return 'from-[#0d559e] to-[#1a6bb8]';
      case 'approved':
        return 'from-[#0d559e] to-[#1a6bb8]';
      case 'rejected':
        return 'from-[#0d559e] to-[#1a6bb8]';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const stats = {
    total: filteredRequests.length,
    pending: filteredRequests.filter(req => req.status === 'pending').length,
    approved: filteredRequests.filter(req => req.status === 'approved').length,
    rejected: filteredRequests.filter(req => req.status === 'rejected').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0d559e] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-red-600">Failed to load requests</p>
          <p className="text-gray-500 text-sm mt-2">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Request Status</h1>
          <p className="mt-1 text-gray-600">
            {user?.role === 'employee' 
              ? 'Track your inventory requests and their approval status'
              : 'Monitor all employee inventory requests'
            }
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-[#0d559e] to-[#1a6bb8]">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-[#0d559e] to-[#1a6bb8]">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-[#0d559e] to-[#1a6bb8]">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-[#0d559e] to-[#1a6bb8]">
              <XCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="relative">
            <Search className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" size={16} />
            <input
              type="text"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <FilterDropdown
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { value: 'all', label: 'All Status', icon: <Filter className="w-4 h-4 text-gray-500" />, description: 'Show all requests' },
              { value: 'pending', label: 'Pending', icon: <Clock className="w-4 h-4 text-yellow-500" />, description: 'Awaiting approval' },
              { value: 'approved', label: 'Approved', icon: <CheckCircle className="w-4 h-4 text-green-500" />, description: 'Approved requests' },
              { value: 'rejected', label: 'Rejected', icon: <XCircle className="w-4 h-4 text-red-500" />, description: 'Rejected requests' }
            ]}
            placeholder="Filter by status"
            size="sm"
          />

          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-gray-400" />
            <span className="text-sm text-gray-600">{filteredRequests.length} requests</span>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-2xl">
        {filteredRequests.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredRequests.map((request) => {
              const StatusIcon = getStatusIcon(request.status);
              const statusGradient = getStatusGradient(request.status);
              
              return (
                <div key={request.id} className="p-6 transition-colors hover:bg-gray-50">
                  <div className="flex items-start space-x-4">
                    <div className={`flex-shrink-0 p-3 rounded-xl bg-gradient-to-r ${statusGradient}`}>
                      <StatusIcon className="w-6 h-6 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{request.itemtype}</h3>
                          <p className="mt-1 text-sm text-gray-600">
                            Quantity: {request.quantity} • Purpose: {request.purpose}
                          </p>
                          {user?.role !== 'employee' && (
                            <p className="text-sm text-gray-600">
                              Requested by: {request.employeename}
                            </p>
                          )}
                          <p className="mt-2 text-xs text-gray-500">
                            Submitted: {new Date(request.submittedat).toLocaleDateString()}
                          </p>
                          {request.reviewedat && (
                            <p className="text-xs text-gray-500">
                              Reviewed: {new Date(request.reviewedat).toLocaleDateString()}
                              {request.reviewername && ` by ${request.reviewername}`}
                            </p>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(request.status)}`}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      
                      {request.justification && (
                        <div className="p-3 mt-4 rounded-lg bg-gray-50">
                          <p className="mb-1 text-sm font-medium text-gray-700">Justification:</p>
                          <p className="text-sm text-gray-600">{request.justification}</p>
                        </div>
                      )}
                      
                      {request.remarks && (
                        <div className="p-3 mt-4 rounded-lg bg-blue-50">
                          <p className="mb-1 text-sm font-medium text-blue-700">Reviewer Remarks:</p>
                          <p className="text-sm text-blue-600">{request.remarks}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">No requests found</h3>
            <p className="text-gray-600">
              {user?.role === 'employee' 
                ? "You haven't submitted any requests yet"
                : "No employee requests match your search criteria"
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestStatus;