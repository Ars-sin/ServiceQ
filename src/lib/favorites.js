const STORAGE_KEY = 'serviceq_customer_favorites'
const DEFAULT_FAVORITES = []

export function getFavoriteIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw !== null) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {}

  return DEFAULT_FAVORITES
}

export function isFavorite(id) {
  if (!id) return false
  const ids = getFavoriteIds()
  return ids.includes(String(id))
}

export function toggleFavorite(id) {
  if (!id) return false
  const targetId = String(id)
  const ids = getFavoriteIds()
  let nextIds
  let isAdded = false

  if (ids.includes(targetId)) {
    nextIds = ids.filter(i => i !== targetId)
    isAdded = false
  } else {
    nextIds = [targetId, ...ids]
    isAdded = true
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextIds))
  } catch {}

  window.dispatchEvent(new CustomEvent('serviceq_favorites_updated', {
    detail: { id: targetId, isAdded, ids: nextIds }
  }))

  return isAdded
}
