/**
 * Return-request APIs often populate `inventoryitemid` as an object.
 * Normalize to a string id for comparisons and API payloads.
 */
export function getInventoryItemIdFromRef(raw: unknown): string | undefined {
  if (raw == null) return undefined
  if (typeof raw === 'string') {
    const t = raw.trim()
    return t || undefined
  }
  if (typeof raw === 'object') {
    const o = raw as { _id?: unknown; id?: unknown }
    const id = o._id ?? o.id
    if (id != null) return String(id)
    return undefined
  }
  return String(raw)
}

export function returnRequestMatchesInventoryItem(returnReq: any, inventoryItemId: string | undefined): boolean {
  if (!inventoryItemId) return false
  const rid = getInventoryItemIdFromRef(returnReq?.inventoryitemid ?? returnReq?.inventoryItemId)
  return rid != null && String(rid) === String(inventoryItemId)
}
