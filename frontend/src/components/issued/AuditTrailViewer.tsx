import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  User, 
  Package, 
  ArrowRight, 
  ArrowLeft, 
  Eye, 
  Download,
  RefreshCw,
  Clock,
  MapPin,
  Tag,
  DollarSign,
  FileText,
  X
} from 'lucide-react';
import DateRangePicker from '../common/DateRangePicker';
import FilterDropdown from '../common/FilterDropdown';

interface AuditEntry {
  action: string;
  itemId: string;
  itemName: string;
  issuedTo?: string;
  issuedBy?: string;
  issuedById?: string;
  issuedDate?: string;
  requestId?: string;
  purpose?: string;
  expectedReturnDate?: string;
  actualReturnDate?: string;
  notes?: string;
  previousStatus?: string;
  newStatus?: string;
  department?: string;
  location?: string;
  itemValue?: number;
  itemCategory?: string;
  returnedBy?: string;
  returnedById?: string;
  returnDate?: string;
}

interface AuditTrailViewerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItem?: any;
}

const AuditTrailViewer: React.FC<AuditTrailViewerProps> = ({ 
  isOpen, 
  onClose, 
  selectedItem 
}) => {
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<AuditEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadAuditTrail();
    }
  }, [isOpen, selectedItem]);

  useEffect(() => {
    filterEntries();
  }, [auditEntries, searchTerm, filterAction, startDate, endDate]);

  const loadAuditTrail = () => {
    const storedAudit = localStorage.getItem('issuanceAuditTrail');
    if (storedAudit) {
      const entries: AuditEntry[] = JSON.parse(storedAudit);
      
      // If a specific item is selected, filter for that item
      if (selectedItem) {
        const itemEntries = entries.filter(entry => entry.itemId === selectedItem.id);
        setAuditEntries(itemEntries);
      } else {
        setAuditEntries(entries);
      }
    } else {
      setAuditEntries([]);
    }
  };

  const filterEntries = () => {
    let filtered = [...auditEntries];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(entry =>
        entry.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.issuedTo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.issuedBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by action
    if (filterAction !== 'all') {
      filtered = filtered.filter(entry => entry.action === filterAction);
    }

    // Filter by date range
    if (startDate && endDate) {
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.issuedDate || entry.returnDate || '');
        return entryDate >= startDate && entryDate <= endDate;
      });
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.issuedDate || a.returnDate || '');
      const dateB = new Date(b.issuedDate || b.returnDate || '');
      return dateB.getTime() - dateA.getTime();
    });

    setFilteredEntries(filtered);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'issue':
        return <ArrowRight className="w-4 h-4 text-green-600" />;
      case 'return':
        return <ArrowLeft className="w-4 h-4 text-blue-600" />;
      case 'transfer':
        return <ArrowRight className="w-4 h-4 text-purple-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'issue':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'return':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'transfer':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const exportAuditTrail = () => {
    const csvContent = [
      ['Action', 'Item Name', 'Issued To', 'Issued By', 'Date', 'Purpose', 'Department', 'Location', 'Value', 'Notes'].join(','),
      ...filteredEntries.map(entry => [
        entry.action,
        entry.itemName,
        entry.issuedTo || '',
        entry.issuedBy || '',
        formatDate(entry.issuedDate || entry.returnDate || ''),
        entry.purpose || '',
        entry.department || '',
        entry.location || '',
        entry.itemValue || 0,
        entry.notes || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm transition-all duration-300">
      <div className="w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] bg-white rounded-lg sm:rounded-2xl shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <div className="mb-4 sm:mb-0">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
              {selectedItem ? `${selectedItem.assetname} - Audit Trail` : 'Complete Audit Trail'}
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Track all item issuance and return activities
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            <button
              onClick={exportAuditTrail}
              className="flex items-center justify-center px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Download size={16} className="mr-1" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">Export</span>
            </button>
            <button
              onClick={loadAuditTrail}
              className="flex items-center justify-center px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw size={16} className="mr-1" />
              <span className="hidden sm:inline">Refresh</span>
              <span className="sm:hidden">Refresh</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 transition-colors rounded-lg hover:text-gray-600 hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" size={16} />
              <input
                type="text"
                placeholder="Search audit entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-2 pl-10 pr-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <FilterDropdown
              value={filterAction}
              onChange={setFilterAction}
              options={[
                { value: 'all', label: 'All Actions' },
                { value: 'issue', label: 'Issuance' },
                { value: 'return', label: 'Return' },
                { value: 'transfer', label: 'Transfer' }
              ]}
              placeholder="Filter by action"
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

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <Filter size={16} className="text-gray-400" />
              <span className="text-sm text-gray-600">{filteredEntries.length} entries found</span>
            </div>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterAction('all');
                setStartDate(null);
                setEndDate(null);
              }}
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Audit Trail Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {filteredEntries.length > 0 ? (
            <div className="space-y-3 sm:space-y-4 max-h-full">
              {filteredEntries.map((entry, index) => (
                <div
                  key={`${entry.action}-${entry.itemName}-${entry.timestamp}-${index}`}
                  className="p-3 sm:p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer"
                  onClick={() => setSelectedEntry(entry)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg border ${getActionColor(entry.action)} flex-shrink-0`}>
                        {getActionIcon(entry.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                          <h4 className="text-sm font-medium text-gray-900 capitalize break-words">
                            {entry.action} - {entry.itemName}
                          </h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionColor(entry.action)} self-start flex-shrink-0`}>
                            {entry.action}
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs text-gray-600">
                          <div className="flex items-center space-x-1 min-w-0">
                            <User size={12} className="text-gray-400 flex-shrink-0" />
                            <span className="truncate">
                              {entry.action === 'return' ? 'Returned by' : 'Issued to'}: {entry.action === 'return' ? entry.returnedBy : entry.issuedTo}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1 min-w-0">
                            <Clock size={12} className="text-gray-400 flex-shrink-0" />
                            <span className="truncate">
                              {formatDate(entry.issuedDate || entry.returnDate || '')}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1 min-w-0">
                            <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                            <span className="truncate">{entry.location}</span>
                          </div>
                          {entry.department && (
                            <div className="flex items-center space-x-1 min-w-0">
                              <Tag size={12} className="text-gray-400 flex-shrink-0" />
                              <span className="truncate">{entry.department}</span>
                            </div>
                          )}
                          {entry.itemValue && (
                            <div className="flex items-center space-x-1 min-w-0">
                              <DollarSign size={12} className="text-gray-400 flex-shrink-0" />
                              <span className="truncate">₹{entry.itemValue.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                        {entry.notes && (
                          <p className="mt-2 text-sm text-gray-600 italic break-words">"{entry.notes}"</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEntry(entry);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center min-h-[200px]">
              <History className="mx-auto w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No audit entries found</h3>
              <p className="text-gray-500 text-sm max-w-md">
                {selectedItem ? 'No audit trail available for this item.' : 'No audit entries match your current filters.'}
              </p>
            </div>
          )}
        </div>

        {/* Entry Detail Modal */}
        {selectedEntry && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm transition-all duration-300">
            <div className="w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] bg-white rounded-lg sm:rounded-2xl shadow-xl overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate pr-4">
                  Audit Entry Details
                </h3>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="p-2 text-gray-400 transition-colors rounded-lg hover:text-gray-600 hover:bg-gray-100 flex-shrink-0"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Action</label>
                      <p className="text-sm text-gray-900 capitalize break-words">{selectedEntry.action}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Item Name</label>
                      <p className="text-sm text-gray-900 break-words">{selectedEntry.itemName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {selectedEntry.action === 'return' ? 'Returned By' : 'Issued To'}
                      </label>
                      <p className="text-sm text-gray-900 break-words">
                        {selectedEntry.action === 'return' ? selectedEntry.returnedBy : selectedEntry.issuedTo}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {selectedEntry.action === 'return' ? 'Return Date' : 'Issue Date'}
                      </label>
                      <p className="text-sm text-gray-900 break-words">
                        {formatDate(selectedEntry.issuedDate || selectedEntry.returnDate || '')}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Department</label>
                      <p className="text-sm text-gray-900 break-words">{selectedEntry.department || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Location</label>
                      <p className="text-sm text-gray-900 break-words">{selectedEntry.location || 'N/A'}</p>
                    </div>
                    {selectedEntry.itemValue && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Item Value</label>
                        <p className="text-sm text-gray-900 break-words">₹{selectedEntry.itemValue.toLocaleString()}</p>
                      </div>
                    )}
                    {selectedEntry.purpose && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Purpose</label>
                        <p className="text-sm text-gray-900 break-words">{selectedEntry.purpose}</p>
                      </div>
                    )}
                  </div>
                  {selectedEntry.notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Notes</label>
                      <p className="text-sm text-gray-900 break-words">{selectedEntry.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end p-4 sm:p-6 pt-4 sm:pt-6 border-t border-gray-200 flex-shrink-0">
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="flex items-center px-4 py-2 space-x-2 text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <X size={16} />
                  <span>Close</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditTrailViewer;
