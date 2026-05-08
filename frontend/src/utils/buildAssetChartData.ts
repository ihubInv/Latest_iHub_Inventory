/** Normalize for matching category.master ↔ inventory.assetname (trim, strip trailing punctuation). */
export function normalizeAssetKey(name: string): string {
  return String(name || '')
    .trim()
    .replace(/[\s,，.。;；]+$/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function displayFromRaw(raw: string): string {
  return String(raw || '')
    .trim()
    .replace(/[\s,，.。;；]+$/g, '')
    .trim()
}

type Agg = { displayName: string; rowCount: number; qtySum: number }

function countFromAgg(a: Agg): number {
  return a.qtySum > 0 ? a.qtySum : a.rowCount
}

/**
 * Build [{ asset, count }] for horizontal bar chart from inventory + optional category master names.
 * Count prefers sum of balancequantityinstock; falls back to row count per asset name.
 */
export function buildAssetChartRows(
  inventoryItems: Array<{ assetname?: string; assetName?: string; balancequantityinstock?: number }>,
  categoryMasterNames: string[]
): { asset: string; count: number }[] {
  const byKey = new Map<string, Agg>()

  for (const item of inventoryItems || []) {
    const raw = item.assetname ?? item.assetName ?? ''
    const key = normalizeAssetKey(raw)
    if (!key) continue
    const display = displayFromRaw(raw) || raw.trim()
    const q = Number(item.balancequantityinstock)
    const addQty = Number.isFinite(q) && q > 0 ? q : 0
    const prev = byKey.get(key)
    if (!prev) {
      byKey.set(key, { displayName: display, rowCount: 1, qtySum: addQty })
    } else {
      prev.rowCount += 1
      prev.qtySum += addQty
      if (display && !prev.displayName) {
        prev.displayName = display
      }
    }
  }

  const categoryKeys = new Set(categoryMasterNames.map(normalizeAssetKey).filter(Boolean))
  const rows: { asset: string; count: number }[] = []

  for (const name of categoryMasterNames) {
    const clean = displayFromRaw(name)
    if (!clean) continue
    const key = normalizeAssetKey(name)
    const agg = byKey.get(key)
    const count = agg ? countFromAgg(agg) : 0
    if (count > 0) rows.push({ asset: clean, count })
  }

  for (const [key, agg] of byKey) {
    if (categoryKeys.has(key)) continue
    const c = countFromAgg(agg)
    if (c > 0) rows.push({ asset: agg.displayName || key, count: c })
  }

  rows.sort((a, b) => b.count - a.count)
  return rows
}
