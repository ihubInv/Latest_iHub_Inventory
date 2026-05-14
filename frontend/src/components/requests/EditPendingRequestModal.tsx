import React, { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { useGetCategoriesQuery, useUpdateRequestMutation } from '../../store/api'
import CategoryDropdown from '../common/CategoryDropdown'
import PurposeDropdown from '../common/PurposeDropdown'
import toast from 'react-hot-toast'

export function getRequestDocumentId(request: any): string {
  if (!request) return ''
  const raw = request.id ?? request._id
  return typeof raw === 'object' && raw != null ? String(raw) : String(raw ?? '')
}

interface EditPendingRequestModalProps {
  isOpen: boolean
  onClose: () => void
  request: any | null
}

const EditPendingRequestModal: React.FC<EditPendingRequestModalProps> = ({
  isOpen,
  onClose,
  request,
}) => {
  const [updateRequest, { isLoading }] = useUpdateRequestMutation()
  const { data: categoriesResponse, isLoading: categoriesLoading } = useGetCategoriesQuery({})
  const categories = categoriesResponse?.data || []

  const [itemtype, setItemtype] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [purpose, setPurpose] = useState('')
  const [justification, setJustification] = useState('')

  useEffect(() => {
    if (!isOpen || !request) return
    setItemtype(request.itemtype || '')
    setQuantity(typeof request.quantity === 'number' ? request.quantity : Number(request.quantity) || 1)
    setPurpose(request.purpose || '')
    setJustification(request.justification || '')
  }, [isOpen, request])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const id = getRequestDocumentId(request)
    if (!id) {
      toast.error('Invalid request')
      return
    }
    if (!itemtype.trim() || !purpose.trim() || justification.trim().length < 5) {
      toast.error('Please fill all required fields (justification at least 5 characters)')
      return
    }
    try {
      await updateRequest({
        id,
        data: {
          itemtype: itemtype.trim(),
          quantity: Math.max(1, Number(quantity) || 1),
          purpose: purpose.trim(),
          justification: justification.trim(),
        },
      }).unwrap()
      toast.success('Request updated')
      onClose()
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Failed to update request'
      toast.error(msg)
    }
  }

  if (!request) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit request" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">Item type (category) *</label>
          <CategoryDropdown
            categories={categories}
            value={itemtype}
            onChange={setItemtype}
            placeholder={categoriesLoading ? 'Loading…' : 'Select category'}
            required
            searchable
            disabled={categoriesLoading || categories.length === 0}
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">Quantity *</label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <PurposeDropdown label="Purpose *" value={purpose} onChange={setPurpose} placeholder="Select purpose" required />
          {purpose === 'Other' && (
            <input
              type="text"
              placeholder="Specify purpose"
              className="w-full px-3 py-2 mt-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setPurpose(e.target.value)}
            />
          )}
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">Justification *</label>
          <textarea
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Why do you need this item?"
          />
        </div>

        <p className="text-xs text-gray-500">Only pending requests can be edited.</p>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || categories.length === 0}>
            {isLoading ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default EditPendingRequestModal
