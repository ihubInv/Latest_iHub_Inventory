import React, { useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { useGetInventoryItemsQuery } from '../../store/api';
import { 
  Package, 
  Calendar, 
  User, 
  MapPin, 
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Eye
} from 'lucide-react';
import AttractiveLoader from '../common/AttractiveLoader';

interface IssuedItem {
  id: string;
  itemName: string;
  issuedBy: string;
  issueDate: string;
  purpose: string;
  expectedReturn?: string;
  status: 'active' | 'overdue';
  daysOut: number;
  location: string;
  value: number;
  description: string;
}

const EmployeeIssuedItems: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { data: inventoryItems = [], isLoading } = useGetInventoryItemsQuery();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingItem, setViewingItem] = useState<IssuedItem | null>(null);

  // Debug logging for raw data
  console.log('🔍 Raw Data Debug:', {
    isLoading,
    inventoryItemsCount: inventoryItems.length,
    availableItems: inventoryItems?.filter((item: any) => item.status === 'available').length,
    issuedItems: inventoryItems?.filter((item: any) => item.status === 'issued').length,
    inventoryItems: inventoryItems.map((item: any) => ({
      id: item.id,
      assetname: item.assetname,
      status: item.status,
      issuedto: item.issuedto,
      issuedby: item.issuedby,
      issueddate: item.issueddate
    }))
  });

  // Filter issued items for current employee
  const issuedItems: IssuedItem[] = inventoryItems
    .filter((item: any) => item.status === 'issued')
    .map((item: any) => {
      // Use actual database columns instead of parsing description
      const issuedTo = item.issuedto || 'Unknown';
      const issuedBy = item.issuedby || 'Unknown';
      const issueDate = item.issueddate?.toISOString() || 
                       item.dateofissue?.toISOString() || 
                       (item.lastmodifieddate ? new Date(item.lastmodifieddate).toISOString() : new Date().toISOString());
      const expectedReturn = item.expectedreturndate?.toISOString();
      
      // Parse purpose from description as fallback (for backward compatibility)
      const description = item.description || '';
      const purposeMatch = description.match(/PURPOSE: (.+)/);
      const purpose = purposeMatch ? purposeMatch[1] : 'Direct Issue';
      
      const daysSinceIssued = issueDate ? 
        Math.floor((Date.now() - new Date(issueDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;
      
      return {
        id: item.id,
        itemName: item.assetname,
        issuedBy,
        issuedTo, // Add this missing field
        issueDate,
        purpose,
        expectedReturn,
        status: daysSinceIssued > 30 ? 'overdue' : 'active',
        daysOut: daysSinceIssued,
        location: item.locationofitem,
        value: item.totalcost || 0,
        description: item.description || ''
      };
    })
    .filter((item: any) => item.issuedBy !== 'Unknown' && item.issuedTo !== 'Unknown'); // Only show items that have issuance info

  // Debug logging
  console.log('🔍 Debug - EmployeeIssuedItems:', {
    totalInventoryItems: inventoryItems?.length,
    issuedStatusItems: inventoryItems?.filter((item: any) => item.status === 'issued').length,
    issuedItemsAfterMapping: issuedItems?.length,
    currentUser: user?.name,
    issuedItemsData: issuedItems?.map((item: any) => ({
      id: item.id,
      itemName: item.itemName,
      issuedBy: item.issuedBy,
      issuedTo: item.issuedTo
    }))
  });

  // Filter items for current employee
  const myIssuedItems = issuedItems.filter((item: any) => {
    // Use actual database column instead of parsing description
    const inventoryItem = inventoryItems.find(i => i.id === item.id);
    const issuedTo = inventoryItem?.issuedto || '';
    
    // Check if this item was issued to the current employee by NAME (not ID)
    const matches = issuedTo === user?.name;
    
    // Debug logging for each item
    console.log('🔍 Employee Filter Debug:', {
      itemId: item.id,
      itemName: item.itemName,
      issuedTo: issuedTo,
      currentUserId: user?.id,
      currentUserName: user?.name,
      matches: matches
    });
    
    return matches;
  });

  // Debug logging for final result
  console.log('🔍 Final Debug - EmployeeIssuedItems:', {
    myIssuedItemsCount: myIssuedItems.length,
    myIssuedItems: myIssuedItems.map((item: any) => ({
      id: item.id,
      itemName: item.itemName,
      issuedBy: item.issuedBy
    }))
  });

  // Filter by search term
  const filteredItems = myIssuedItems.filter((item: any) =>
    item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalItems: myIssuedItems.length,
    overdueItems: myIssuedItems.filter((item: any) => item.status === 'overdue').length,
    totalValue: myIssuedItems.reduce((sum, item) => sum + item.value, 0),
    avgDaysOut: myIssuedItems.length > 0 ? 
      Math.round(myIssuedItems.reduce((sum, item) => sum + item.daysOut, 0) / myIssuedItems.length) : 0
  };

  // Temporary function to test issuing an item
  const testIssueItem = async () => {
    const availableItems = inventoryItems?.filter((item: any) => item.status === 'available');
    if (availableItems.length > 0) {
      const testItem = availableItems[0];
      console.log('🧪 Testing issue of item:', testItem);
      
      // This would normally be done through the approval process
      // For now, just log what would happen
      console.log('Would issue:', {
        itemId: testItem.id,
        itemName: testItem.assetname,
        issuedTo: user?.name,
        issuedBy: 'Test Admin',
        issuedDate: new Date().toISOString()
      });
    } else {
      console.log('❌ No available items to test with');
    }
  };

  if (isLoading) {
    return <AttractiveLoader message="Loading your issued items..." variant="fullscreen" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Issued Items</h1>
          <p className="mt-1 text-gray-600">Items currently issued to you</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Temporary test button */}
          <button
            onClick={testIssueItem}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
          >
            🧪 Test Issue Item
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overdue Items</p>
              <p className="text-2xl font-bold text-gray-900">{stats.overdueItems}</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats.totalValue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Days Out</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgDaysOut}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Items List */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Issued Items ({filteredItems.length})</h3>
        </div>

        {filteredItems.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredItems.map((item) => (
              <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-lg font-medium text-gray-900">{item.itemName}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === 'overdue' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {item.status === 'overdue' ? 'Overdue' : 'Active'}
                      </span>
                    </div>
                    
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>Issued by: {item.issuedBy}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(item.issueDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span>{item.location}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>{item.daysOut} days out</span>
                      </div>
                    </div>

                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Purpose:</span> {item.purpose}
                      </p>
                      {item.expectedReturn && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Expected Return:</span> {new Date(item.expectedReturn).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">₹{item.value.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">Value</p>
                    </div>
                    <button
                      onClick={() => setViewingItem(item)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No issued items found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search terms' : 'You don\'t have any items issued to you yet'}
            </p>
          </div>
        )}
      </div>

      {/* Item Details Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 backdrop-blur-sm transition-all duration-300" onClick={() => setViewingItem(null)}></div>
            
            <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Item Details</h3>
                <button
                  onClick={() => setViewingItem(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="sr-only">Close</span>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-medium text-gray-900">{viewingItem.itemName}</h4>
                  <p className="text-gray-600">{viewingItem.purpose}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Issued By</p>
                    <p className="text-sm text-gray-900">{viewingItem.issuedBy}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Issue Date</p>
                    <p className="text-sm text-gray-900">{new Date(viewingItem.issueDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Location</p>
                    <p className="text-sm text-gray-900">{viewingItem.location}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Days Out</p>
                    <p className="text-sm text-gray-900">{viewingItem.daysOut} days</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Value</p>
                    <p className="text-sm text-gray-900">₹{viewingItem.value.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      viewingItem.status === 'overdue' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {viewingItem.status === 'overdue' ? 'Overdue' : 'Active'}
                    </span>
                  </div>
                </div>

                {viewingItem.expectedReturn && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Expected Return Date</p>
                    <p className="text-sm text-gray-900">{new Date(viewingItem.expectedReturn).toLocaleDateString()}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-gray-500">Description</p>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{viewingItem.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeIssuedItems;
