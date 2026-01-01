import React, { useState } from 'react'
import { useGetRequestAuditTrailQuery } from '../../store/api'
import { Clock, User, CheckCircle, XCircle, Package, AlertTriangle, Shield, FileText } from 'lucide-react'

interface AuditTrailProps {
  requestId: string
}

interface AuditEntry {
  id: string
  action: string
  performedBy: string
  performedByName: string
  timestamp: Date
  details: any
  ipAddress?: string
  userAgent?: string
}

const AuditTrail: React.FC<AuditTrailProps> = ({ requestId }) => {
  const { data: auditEntries = [], isLoading } = useGetRequestAuditTrailQuery(requestId)
  const [showTechDetails, setShowTechDetails] = useState(false)

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'created':
      case 'submitted': return Package
      case 'approved': return CheckCircle
      case 'rejected': return XCircle
      case 'modified': return FileText
      case 'issued': return Package
      case 'returned': return CheckCircle
      default: return Clock
    }
  }

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'created':
      case 'submitted': return 'text-blue-600 bg-blue-100'
      case 'approved': return 'text-green-600 bg-green-100'
      case 'rejected': return 'text-red-600 bg-red-100'
      case 'modified': return 'text-yellow-600 bg-yellow-100'
      case 'issued': return 'text-purple-600 bg-purple-100'
      case 'returned': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
      full: date.toLocaleString()
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Request Audit Trail</h3>
        <button
          onClick={() => setShowTechDetails(!showTechDetails)}
          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
        >
          <Shield className="w-4 h-4" />
          <span>{showTechDetails ? 'Hide' : 'Show'} Technical Details</span>
        </button>
      </div>

      <div className="space-y-3">
        {auditEntries.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <Clock className="w-8 h-8 mx-auto mb-2" />
            <p>No audit trail entries found</p>
          </div>
        ) : (
          auditEntries.map((entry: AuditEntry, index: number) => {
            const ActionIcon = getActionIcon(entry.action)
            const timestamp = formatTimestamp(entry.timestamp)
            
            return (
              <div key={entry.id} className="relative">
                {index !== auditEntries.length - 1 && (
                  <div className="absolute left-4 top-8 w-0.5 h-full bg-gray-200"></div>
                )}
                
                <div className="relative flex items-start space-x-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getActionColor(entry.action)}`}>
                    <ActionIcon className="w-4 h-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-gray-900 capitalize">
                          {entry.action} Request
                        </h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getActionColor(entry.action)}`}>
                          {entry.action}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        <div>{timestamp.date}</div>
                        <div>{timestamp.time}</div>
                      </div>
                    </div>
                    
                    <div className="mt-2 flex items-center space-x-4 text-xs text-gray-600">
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>{entry.performedByName} ({entry.performedBy})</span>
                      </div>
                    </div>
                    
                    {entry.details && (
                      <div className="mt-3 p-3 bg-gray-50 rounded border">
                        <h5 className="text-xs font-medium text-gray-700 mb-2">Action Details:</h5>
                        <div className="space-y-1 text-xs text-gray-600">
                          {Object.entries(entry.details).map(([key, value]) => (
                            <div key={key} className="flex">
                              <span className="font-medium text-gray-700 w-20">{key}:</span>
                              <span className="text-gray-600">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {showTechDetails && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <h5 className="text-xs font-medium text-yellow-700 mb-2">Technical Details:</h5>
                        <div className="space-y-1 text-xs text-yellow-600">
                          {entry.ipAddress && (
                            <div>IP: {entry.ipAddress}</div>
                          )}
                          {entry.userAgent && (
                            <div>User Agent: {entry.userAgent.substring(0, 50)}...</div>
                          )}
                          {entry.timestamp && (
                            <div>Full Timestamp: {timestamp.full}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default AuditTrail
