import React from 'react'
import { Modal } from '../ui/Modal'
import AssetAuditTimeline from './AssetAuditTimeline'
import { History } from 'lucide-react'

interface AssetAuditHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  inventoryItemId: string | undefined
  uniqueId?: string
  assetLabel?: string
}

const AssetAuditHistoryModal: React.FC<AssetAuditHistoryModalProps> = ({
  isOpen,
  onClose,
  inventoryItemId,
  uniqueId,
  assetLabel,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="xl" className="max-h-[90vh]">
      <div className="border-b border-gray-200 pb-4 mb-4 -mt-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-[#0d559e] to-[#1a6bb8]">
            <History className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Asset audit history</h2>
            <p className="text-sm text-gray-600">
              {assetLabel ? `${assetLabel} · ` : ''}
              Chronological record of assignments, returns, stock movements, and detail updates.
            </p>
          </div>
        </div>
      </div>
      <AssetAuditTimeline inventoryItemId={inventoryItemId} uniqueId={uniqueId} />
      <div className="flex justify-end pt-4 mt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
        >
          Close
        </button>
      </div>
    </Modal>
  )
}

export default AssetAuditHistoryModal
