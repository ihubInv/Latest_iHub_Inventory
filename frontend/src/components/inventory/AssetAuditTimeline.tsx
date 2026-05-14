import React from 'react'
import { useGetInventoryAuditHistoryQuery } from '../../store/api/inventoryApi'
import { History, Package, User, Calendar, FileText } from 'lucide-react'

interface AssetAuditTimelineProps {
  inventoryItemId: string | undefined
  /** Sent as query param so the API can resolve the row if path id is stale or wrong */
  uniqueId?: string
  className?: string
}

const MONGO_ID_RE = /^[a-f\d]{24}$/i

const normalizeMongoId = (raw: unknown): string | undefined => {
  if (!raw) return undefined
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    return MONGO_ID_RE.test(trimmed) ? trimmed : undefined
  }
  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    return (
      normalizeMongoId(obj.id) ||
      normalizeMongoId(obj._id) ||
      normalizeMongoId(obj.$oid) ||
      undefined
    )
  }
  return undefined
}

const formatWhen = (d: string | Date | undefined) => {
  if (!d) return '—'
  try {
    const dt = new Date(d)
    if (Number.isNaN(dt.getTime())) return '—'
    return dt.toLocaleString()
  } catch {
    return '—'
  }
}

const AssetAuditTimeline: React.FC<AssetAuditTimelineProps> = ({
  inventoryItemId,
  uniqueId,
  className = '',
}) => {
  const resolvedInventoryId = normalizeMongoId(inventoryItemId)

  const { data, isLoading, isError, error } = useGetInventoryAuditHistoryQuery(
    { id: resolvedInventoryId || '', uniqueId },
    { skip: !resolvedInventoryId }
  )

  const events = data?.data?.events || []

  if (!inventoryItemId) {
    return null
  }

  if (!resolvedInventoryId) {
    return (
      <div className={`rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 ${className}`}>
        Could not load audit history. Invalid inventory item id.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-12 text-gray-500 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0d559e] mr-3" />
        Loading audit history…
      </div>
    )
  }

  if (isError) {
    const err = error as { data?: { message?: string }; status?: number | string; error?: string }
    const detail =
      err?.data?.message ||
      (typeof err?.status === 'number' ? `HTTP ${err.status}` : '') ||
      err?.error ||
      ''
    return (
      <div className={`rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 ${className}`}>
        Could not load audit history.{detail ? ` ${detail}` : ''}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div
        className={`rounded-lg border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-gray-500 ${className}`}
      >
        <History className="w-10 h-10 mx-auto mb-2 text-gray-400" />
        <p>No audit events recorded for this asset yet.</p>
      </div>
    )
  }

  return (
    <div className={`space-y-0 ${className}`}>
      <ol className="relative border-l border-gray-200 ml-3">
        {events.map((ev: Record<string, unknown>, idx: number) => (
          <li key={`${String(ev.source)}-${String(ev.id)}-${idx}`} className="relative mb-8 ml-6">
            <span className="absolute flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full -left-4 ring-4 ring-white">
              {ev.source === 'transaction' ? (
                <Package className="w-4 h-4 text-blue-700" />
              ) : (
                <FileText className="w-4 h-4 text-indigo-700" />
              )}
            </span>
            <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {(ev.summary as string) || (ev.kind as string)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    <span className="uppercase tracking-wide">{String(ev.source)}</span>
                    {ev.kind ? ` · ${String(ev.kind)}` : ''}
                  </p>
                </div>
                <div className="flex items-center text-xs text-gray-600 whitespace-nowrap">
                  <Calendar className="w-3.5 h-3.5 mr-1 shrink-0" />
                  {formatWhen(ev.at as string)}
                </div>
              </div>

              {Boolean(ev.actor) && typeof ev.actor === 'object' && (
                <div className="flex items-start gap-2 text-sm text-gray-700 mb-1">
                  <User className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
                  <div>
                    <span className="font-medium">Action by:</span>{' '}
                    {(ev.actor as { name?: string }).name || '—'}
                    {(ev.actor as { email?: string }).email ? ` · ${(ev.actor as { email?: string }).email}` : ''}
                    {(ev.actor as { role?: string }).role ? ` · ${(ev.actor as { role?: string }).role}` : ''}
                    {(ev.actor as { department?: string }).department
                      ? ` · ${(ev.actor as { department?: string }).department}`
                      : ''}
                  </div>
                </div>
              )}

              {Boolean(ev.assignee || ev.subject) && typeof (ev.assignee || ev.subject) === 'object' && (
                <div className="flex items-start gap-2 text-sm text-gray-700 mb-1">
                  <User className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-medium">{ev.assignee ? 'Assignee / holder:' : 'Related user:'}</span>{' '}
                    {((ev.assignee || ev.subject) as { name?: string }).name || '—'}
                    {((ev.assignee || ev.subject) as { email?: string }).email
                      ? ` · ${((ev.assignee || ev.subject) as { email?: string }).email}`
                      : ''}
                    {((ev.assignee || ev.subject) as { department?: string }).department
                      ? ` · ${((ev.assignee || ev.subject) as { department?: string }).department}`
                      : ''}
                  </div>
                </div>
              )}

              {typeof ev.quantity === 'number' && (
                <p className="text-xs text-gray-600 mt-1">
                  Qty: {ev.quantity}
                  {ev.previousQuantity != null && ev.newQuantity != null
                    ? ` (stock ${String(ev.previousQuantity)} → ${String(ev.newQuantity)})`
                    : ''}
                </p>
              )}

              {Boolean(ev.purpose) && <p className="text-xs text-gray-600 mt-1">Purpose: {String(ev.purpose)}</p>}

              {Boolean(ev.expectedReturnDate) && (
                <p className="text-xs text-gray-600">Expected return: {formatWhen(ev.expectedReturnDate as string)}</p>
              )}
              {Boolean(ev.actualReturnDate) && (
                <p className="text-xs text-gray-600">Actual return: {formatWhen(ev.actualReturnDate as string)}</p>
              )}
              {Boolean(ev.condition) && <p className="text-xs text-gray-600">Condition: {String(ev.condition)}</p>}
              {Boolean(ev.transactionStatus) && (
                <p className="text-xs text-gray-600">Workflow status: {String(ev.transactionStatus)}</p>
              )}

              {Boolean(ev.remarks) && (
                <p className="text-sm text-gray-700 mt-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="font-medium text-gray-800">Remarks:</span> {String(ev.remarks)}
                </p>
              )}

              {Array.isArray(ev.changes) && (ev.changes as unknown[]).length > 0 && (
                <div className="mt-3 overflow-x-auto">
                  <p className="text-xs font-semibold text-gray-800 mb-1">Field changes</p>
                  <table className="min-w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
                    <thead className="bg-gray-100 text-gray-700">
                      <tr>
                        <th className="text-left px-2 py-1">Field</th>
                        <th className="text-left px-2 py-1">From</th>
                        <th className="text-left px-2 py-1">To</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(ev.changes as { field: string; from: unknown; to: unknown }[]).map((c, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          <td className="px-2 py-1 font-mono text-gray-800">{c.field}</td>
                          <td className="px-2 py-1 text-gray-600 max-w-[180px] truncate" title={String(c.from)}>
                            {c.from === null || c.from === undefined ? '—' : String(c.from)}
                          </td>
                          <td className="px-2 py-1 text-gray-900 max-w-[180px] truncate" title={String(c.to)}>
                            {c.to === null || c.to === undefined ? '—' : String(c.to)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default AssetAuditTimeline
