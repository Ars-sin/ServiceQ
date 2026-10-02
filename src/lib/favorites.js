export function getFavoriteStorageKey(userId) {
  if (userId) return `serviceq_customer_favorites_${userId}`
  try {
    const cachedProfile = JSON.parse(localStorage.getItem('serviceq_auth_profile') || '{}')
    if (cachedProfile?.id) return `serviceq_customer_favorites_${cachedProfile.id}`
  } catch {}
  return 'serviceq_customer_favorites'
}

export function getFavoriteIds(userId) {
  try {
    const key = getFavoriteStorageKey(userId)
    const raw = localStorage.getItem(key)
    if (raw !== null) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {}

  return []
}

export function isFavorite(id, userId) {
  if (!id) return false
  const ids = getFavoriteIds(userId)
  return ids.includes(String(id))
}

export function toggleFavorite(id, userId) {
  if (!id) return false
  const targetId = String(id)
  const ids = getFavoriteIds(userId)
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
    const key = getFavoriteStorageKey(userId)
    localStorage.setItem(key, JSON.stringify(nextIds))
  } catch {}

  window.dispatchEvent(new CustomEvent('serviceq_favorites_updated', {
    detail: { id: targetId, isAdded, ids: nextIds }
  }))

  return isAdded
}
