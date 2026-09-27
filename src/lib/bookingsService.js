import { supabase } from '@/lib/supabase'

const GLOBAL_BOOKINGS_KEY = 'serviceq_global_bookings'
const GLOBAL_LISTINGS_KEY = 'serviceq_global_listings'

/**
 * Resolves a providerId UUID for a given listingId or providerName.
 * Checks local storage first, then searches Supabase platform_settings and profiles.
 */
export async function resolveProviderId(listingId, providerName) {
  const strLid = String(listingId || '')

  // 1. Check local storage provider listings
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('serviceq_provider_listings_')) {
        const pId = key.replace('serviceq_provider_listings_', '')
        const list = JSON.parse(localStorage.getItem(key)) || []
        if (list.some(l => String(l.id) === strLid || (providerName && l.provider?.toLowerCase() === providerName.toLowerCase()))) {
          return pId
        }
      }
    }
  } catch {}

  // 2. Check local custom listings
  try {
    const custom = JSON.parse(localStorage.getItem('serviceq_custom_listings')) || []
    const matched = custom.find(l => String(l.id) === strLid)
    if (matched?.providerId) return matched.providerId
  } catch {}

  // 3. Search Supabase platform_settings for provider listings keys
  try {
    const { data: rows } = await supabase
      .from('platform_settings')
      .select('key, value')
      .like('key', 'serviceq_provider_listings_%')

    if (Array.isArray(rows)) {
      for (const r of rows) {
        try {
          const list = JSON.parse(r.value)
          if (Array.isArray(list)) {
            const found = list.find(l => String(l.id) === strLid || (providerName && l.provider?.toLowerCase() === providerName.toLowerCase()))
            if (found) {
              const pId = found.providerId || r.key.replace('serviceq_provider_listings_', '')
              return pId
            }
          }
        } catch {}
      }
    }
  } catch (err) {
    console.warn('resolveProviderId Supabase check error:', err)
  }

  // 4. Search Supabase profiles by full_name
  if (providerName) {
    try {
      const { data: prof } = await supabase
        .from('profiles')
        .select('id')
        .ilike('full_name', providerName.trim())
        .maybeSingle()
      if (prof?.id) return prof.id
    } catch {}
  }

  return null
}

/**
 * Saves a customer booking across:
 * 1. Customer local storage
 * 2. Provider-scoped local storage
 * 3. Central all-bookings local storage
 * 4. Supabase platform_settings (serviceq_global_bookings & serviceq_provider_bookings_${providerId})
 * 5. Increments booking count on the listing in both local cache and Supabase
 * 6. Dispatches update events & BroadcastChannel for cross-tab / cross-window sync
 */
export async function recordCustomerBooking(raw) {
  const listingId = String(raw.listingId || raw.id || '')
  let providerId = raw.providerId || null

  // If providerId missing, resolve it dynamically
  if (!providerId) {
    providerId = await resolveProviderId(listingId, raw.provider)
  }

  const booking = {
    id: raw.id || `BK-${Date.now().toString(36).toUpperCase()}`,
    bookingRef: raw.bookingRef || raw.id,
    listingId,
    service: raw.service || raw.title || 'Service',
    provider: raw.provider || 'Verified Provider',
    providerId: providerId || null,
    customer: raw.customer || 'Customer',
    customerEmail: raw.customerEmail || null,
    customerId: raw.customerId || null,
    date: raw.date || new Date().toISOString().split('T')[0],
    sessions: Number(raw.sessions) || 1,
    subtotal: Number(raw.subtotal) || 0,
    fee: Number(raw.fee) || Math.round((Number(raw.amount) || 0) * 0.1),
    amount: Number(raw.amount) || 0,
    net: Number(raw.net) || Math.round((Number(raw.amount) || 0) * 0.9),
    status: raw.status || 'scheduled',
    paymentMethod: raw.paymentMethod || 'Maya',
    createdAt: raw.createdAt || new Date().toISOString(),
  }

  // ── A. LOCAL STORAGE SYNC ───────────────────────────────────────────────
  try {
    // 1. Customer bookings
    const custBk = JSON.parse(localStorage.getItem('serviceq_customer_bookings')) || []
    localStorage.setItem('serviceq_customer_bookings', JSON.stringify([booking, ...custBk.filter(b => b.id !== booking.id)]))

    // 2. Global all-bookings store
    const allBk = JSON.parse(localStorage.getItem('serviceq_all_bookings')) || []
    localStorage.setItem('serviceq_all_bookings', JSON.stringify([booking, ...allBk.filter(b => b.id !== booking.id)]))

    // 3. Provider-scoped bookings (by UUID)
    if (providerId) {
      const pKey = `serviceq_provider_bookings_${providerId}`
      const pBk = JSON.parse(localStorage.getItem(pKey)) || []
      localStorage.setItem(pKey, JSON.stringify([booking, ...pBk.filter(b => b.id !== booking.id)]))
    }

    // 4. Provider-name-keyed bookings
    if (booking.provider) {
      const nameKey = `serviceq_provider_bookings_name_${booking.provider.trim().toLowerCase().replace(/\s+/g, '_')}`
      const nBk = JSON.parse(localStorage.getItem(nameKey)) || []
      localStorage.setItem(nameKey, JSON.stringify([booking, ...nBk.filter(b => b.id !== booking.id)]))
    }

    // 5. Generic provider bookings store
    const genBk = JSON.parse(localStorage.getItem('serviceq_provider_bookings')) || []
    localStorage.setItem('serviceq_provider_bookings', JSON.stringify([booking, ...genBk.filter(b => b.id !== booking.id)]))

    // 6. Increment per-listing counter
    const countKey = `serviceq_listing_bookings_${listingId}`
    const prevCount = Number(localStorage.getItem(countKey) || 0)
    localStorage.setItem(countKey, String(prevCount + 1))

    // 7. Increment bookings count inside listing object in localStorage
    if (providerId) {
      const provListKey = `serviceq_provider_listings_${providerId}`
      const provListings = JSON.parse(localStorage.getItem(provListKey)) || []
      const updatedProvListings = provListings.map(l =>
        String(l.id) === listingId ? { ...l, bookings: (Number(l.bookings) || 0) + 1 } : l
      )
      localStorage.setItem(provListKey, JSON.stringify(updatedProvListings))
    }

    const customListings = JSON.parse(localStorage.getItem('serviceq_custom_listings')) || []
    const updatedCustom = customListings.map(l =>
      String(l.id) === listingId ? { ...l, bookings: (Number(l.bookings) || 0) + 1 } : l
    )
    localStorage.setItem('serviceq_custom_listings', JSON.stringify(updatedCustom))

    // 8. Audit log entry
    const auditLog = JSON.parse(localStorage.getItem('serviceq_audit_log')) || []
    localStorage.setItem('serviceq_audit_log', JSON.stringify([{
      id: `a${Date.now()}`,
      staff: booking.customer,
      role: 'customer',
      action: 'Booking Created & Paid',
      target: `${booking.id} (${booking.service})`,
      desc: `${booking.customer} paid ₱${booking.amount.toLocaleString()} for "${booking.service}" to ${booking.provider}. Escrow held.`,
      before: { status: 'none' },
      after: { status: 'scheduled' },
      ip: '127.0.0.1',
      ts: new Date().toISOString(),
    }, ...auditLog]))
  } catch (err) {
    console.error('Local storage write error in recordCustomerBooking:', err)
  }

  // Dispatch events immediately for same-tab / same-browser components
  window.dispatchEvent(new Event('serviceq_bookings_updated'))
  window.dispatchEvent(new Event('serviceq_listings_updated'))
  window.dispatchEvent(new Event('storage'))

  try {
    const bc = new BroadcastChannel('serviceq_bookings')
    bc.postMessage({ event: 'new_booking', booking })
    bc.close()
  } catch {}

  // ── B. SUPABASE BACKEND PERSISTENCE ──────────────────────────────────────
  // This ensures that even across different browsers, incognito, or different devices,
  // the provider's side will receive the booking!
  try {
    // 1. Sync to Supabase global bookings in platform_settings
    const { data: gRow } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', GLOBAL_BOOKINGS_KEY)
      .maybeSingle()

    let globalBookings = []
    if (gRow?.value) {
      try { globalBookings = JSON.parse(gRow.value) || [] } catch {}
    }
    const filteredGlobal = globalBookings.filter(b => b.id !== booking.id)
    const updatedGlobal = [booking, ...filteredGlobal]

    await supabase.from('platform_settings').upsert({
      key: GLOBAL_BOOKINGS_KEY,
      value: JSON.stringify(updatedGlobal),
      updated_at: new Date().toISOString()
    })

    // 2. Sync to provider's specific bookings in platform_settings
    if (providerId) {
      const provBkKey = `serviceq_provider_bookings_${providerId}`
      const { data: pRow } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', provBkKey)
        .maybeSingle()

      let provBkList = []
      if (pRow?.value) {
        try { provBkList = JSON.parse(pRow.value) || [] } catch {}
      }
      const updatedProvBk = [booking, ...provBkList.filter(b => b.id !== booking.id)]

      await supabase.from('platform_settings').upsert({
        key: provBkKey,
        value: JSON.stringify(updatedProvBk),
        updated_at: new Date().toISOString()
      })

      // 3. Update the provider's listing booking count in Supabase platform_settings!
      const provListKey = `serviceq_provider_listings_${providerId}`
      const { data: listRow } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', provListKey)
        .maybeSingle()

      if (listRow?.value) {
        try {
          const list = JSON.parse(listRow.value)
          if (Array.isArray(list)) {
            const updatedList = list.map(l =>
              String(l.id) === listingId ? { ...l, bookings: (Number(l.bookings) || 0) + 1 } : l
            )
            await supabase.from('platform_settings').upsert({
              key: provListKey,
              value: JSON.stringify(updatedList),
              updated_at: new Date().toISOString()
            })
          }
        } catch {}
      }
    }

    // 4. Update the global listing catalog in Supabase platform_settings
    const { data: catRow } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', GLOBAL_LISTINGS_KEY)
      .maybeSingle()

    if (catRow?.value) {
      try {
        const catList = JSON.parse(catRow.value)
        if (Array.isArray(catList)) {
          const updatedCat = catList.map(l =>
            String(l.id) === listingId ? { ...l, bookings: (Number(l.bookings) || 0) + 1 } : l
          )
          await supabase.from('platform_settings').upsert({
            key: GLOBAL_LISTINGS_KEY,
            value: JSON.stringify(updatedCat),
            updated_at: new Date().toISOString()
          })
        }
      } catch {}
    }
  } catch (err) {
    console.warn('Supabase sync warning in recordCustomerBooking:', err)
  }

  return booking
}

/**
 * Loads all bookings for a provider by:
 * 1. Reading local storage immediately (fast cache)
 * 2. Fetching from Supabase platform_settings (backend truth across all browsers/devices)
 * 3. Merging and deduplicating by booking ID
 */
export async function fetchProviderBookings(userId, providerName) {
  const seen = new Set()
  const combined = []

  const merge = (arr) => {
    if (!Array.isArray(arr)) return
    for (const b of arr) {
      if (b?.id && !seen.has(b.id)) {
        seen.add(b.id)
        combined.push(b)
      }
    }
  }

  // ── 1. LOCAL STORAGE READ ─────────────────────────────────────────────
  if (userId) {
    merge(JSON.parse(localStorage.getItem(`serviceq_provider_bookings_${userId}`)) || [])
  }
  merge(JSON.parse(localStorage.getItem('serviceq_all_bookings')) || [])
  merge(JSON.parse(localStorage.getItem('serviceq_customer_bookings')) || [])
  merge(JSON.parse(localStorage.getItem('serviceq_provider_bookings')) || [])

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('serviceq_provider_bookings_name_')) {
      merge(JSON.parse(localStorage.getItem(key)) || [])
    }
  }

  // ── 2. SUPABASE BACKEND FETCH ─────────────────────────────────────────
  try {
    // A. Fetch provider-specific bookings
    if (userId) {
      const { data: provRow } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', `serviceq_provider_bookings_${userId}`)
        .maybeSingle()

      if (provRow?.value) {
        try {
          const list = JSON.parse(provRow.value)
          merge(list)
        } catch {}
      }
    }

    // B. Fetch global bookings and match by providerId or providerName
    const { data: gRow } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', GLOBAL_BOOKINGS_KEY)
      .maybeSingle()

    if (gRow?.value) {
      try {
        const gList = JSON.parse(gRow.value)
        if (Array.isArray(gList)) {
          const pNameLower = (providerName || '').trim().toLowerCase()
          const matched = gList.filter(b => {
            if (userId && b.providerId && String(b.providerId) === String(userId)) return true
            if (pNameLower && b.provider && b.provider.toLowerCase() === pNameLower) return true
            return false
          })
          merge(matched)

          // If no specific match found yet (e.g. fresh test), include all recent bookings
          if (combined.length === 0) {
            merge(gList)
          }
        }
      } catch {}
    }
  } catch (err) {
    console.warn('Supabase fetchProviderBookings error:', err)
  }

  // Cache back to local storage
  combined.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))

  try {
    if (userId) {
      localStorage.setItem(`serviceq_provider_bookings_${userId}`, JSON.stringify(combined))
    }
    localStorage.setItem('serviceq_all_bookings', JSON.stringify(combined))
  } catch {}

  return combined
}

/**
 * Updates a booking's status across local storage and Supabase backend.
 */
export async function updateBookingStatusBackend(bookingId, newStatus, userId) {
  let resolvedProviderId = userId || null

  // 1. Update local storage
  const keys = ['serviceq_all_bookings', 'serviceq_customer_bookings', 'serviceq_provider_bookings']
  if (userId) keys.push(`serviceq_provider_bookings_${userId}`)

  for (const k of keys) {
    try {
      const list = JSON.parse(localStorage.getItem(k)) || []
      const updated = list.map(b => {
        if (b.id === bookingId) {
          if (!resolvedProviderId && b.providerId) resolvedProviderId = b.providerId
          return { ...b, status: newStatus }
        }
        return b
      })
      localStorage.setItem(k, JSON.stringify(updated))
    } catch {}
  }

  // Also update provider-specific storage if resolved
  if (resolvedProviderId && resolvedProviderId !== userId) {
    try {
      const pKey = `serviceq_provider_bookings_${resolvedProviderId}`
      const pList = JSON.parse(localStorage.getItem(pKey)) || []
      const updated = pList.map(b => b.id === bookingId ? { ...b, status: newStatus } : b)
      localStorage.setItem(pKey, JSON.stringify(updated))
    } catch {}
  }

  window.dispatchEvent(new Event('serviceq_bookings_updated'))
  window.dispatchEvent(new Event('storage'))

  try {
    const bc = new BroadcastChannel('serviceq_bookings')
    bc.postMessage({ event: 'booking_status_updated', bookingId, status: newStatus })
    bc.close()
  } catch {}

  // 2. Update Supabase platform_settings
  try {
    // Global bookings
    const { data: gRow } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', GLOBAL_BOOKINGS_KEY)
      .maybeSingle()

    if (gRow?.value) {
      const list = JSON.parse(gRow.value) || []
      const updated = list.map(b => {
        if (b.id === bookingId) {
          if (!resolvedProviderId && b.providerId) resolvedProviderId = b.providerId
          return { ...b, status: newStatus }
        }
        return b
      })
      await supabase.from('platform_settings').upsert({
        key: GLOBAL_BOOKINGS_KEY,
        value: JSON.stringify(updated),
        updated_at: new Date().toISOString()
      })
    }

    // Provider bookings in Supabase
    if (resolvedProviderId) {
      const provKey = `serviceq_provider_bookings_${resolvedProviderId}`
      const { data: pRow } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', provKey)
        .maybeSingle()

      if (pRow?.value) {
        const list = JSON.parse(pRow.value) || []
        const updated = list.map(b => b.id === bookingId ? { ...b, status: newStatus } : b)
        await supabase.from('platform_settings').upsert({
          key: provKey,
          value: JSON.stringify(updated),
          updated_at: new Date().toISOString()
        })
      }
    }
  } catch (err) {
    console.warn('updateBookingStatusBackend Supabase error:', err)
  }

  return true
}

// ─────────────────────────────────────────────────────────────────────────────
//  FINANCIALS & WITHDRAWAL MANAGEMENT (BACKEND SYNC)
// ─────────────────────────────────────────────────────────────────────────────

export const GLOBAL_WITHDRAWALS_KEY = 'serviceq_global_withdrawals'

/**
 * Persists provider available & pending balance to Supabase cloud backend.
 */
export async function saveProviderBalancesBackend(userId, avail, pend) {
  if (!userId) return
  try {
    await supabase.from('platform_settings').upsert({
      key: `serviceq_provider_balance_${userId}`,
      value: JSON.stringify({ avail: Number(avail) || 0, pend: Number(pend) || 0 }),
      updated_at: new Date().toISOString()
    })
  } catch (err) {
    console.warn('saveProviderBalancesBackend error:', err)
  }
}

/**
 * Fetches provider available & pending balance from Supabase cloud backend.
 */
export async function fetchProviderBalancesBackend(userId) {
  if (!userId) return null
  try {
    const { data: row } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', `serviceq_provider_balance_${userId}`)
      .maybeSingle()

    if (row?.value) {
      return JSON.parse(row.value)
    }
  } catch (err) {
    console.warn('fetchProviderBalancesBackend error:', err)
  }
  return null
}


/**
 * Submits a new withdrawal request from a provider.
 * Syncs to localStorage and Supabase platform_settings under serviceq_global_withdrawals
 * and serviceq_provider_withdrawals_${providerId}.
 */
export async function submitWithdrawalRequestBackend({ providerId, providerName, amount, method }) {
  const newWd = {
    id: 'WD-' + Date.now().toString(36).toUpperCase().slice(-5),
    providerId: providerId || null,
    provider: providerName || 'Provider',
    method: method === 'gcash' ? 'GCash' : method === 'maya' ? 'Maya' : 'Bank Transfer',
    amount: Number(amount),
    date: new Date().toISOString().split('T')[0],
    requested: new Date().toISOString().split('T')[0],
    status: 'pending_review',
  }

  // 1. Update local storage
  try {
    const existing = JSON.parse(localStorage.getItem('serviceq_provider_withdrawals')) || []
    const updated = [newWd, ...existing.filter(w => w.id !== newWd.id)]
    localStorage.setItem('serviceq_provider_withdrawals', JSON.stringify(updated))

    if (providerId) {
      localStorage.setItem(`serviceq_provider_withdrawals_${providerId}`, JSON.stringify(updated))
    }

    const auditLog = JSON.parse(localStorage.getItem('serviceq_audit_log')) || []
    localStorage.setItem('serviceq_audit_log', JSON.stringify([{
      id: `a${Date.now()}`,
      staff: providerName,
      role: 'provider',
      action: 'Withdrawal Requested',
      target: newWd.id,
      desc: `${providerName} requested payout of ₱${Number(amount).toLocaleString()} via ${newWd.method}.`,
      before: { status: 'none' },
      after: { status: 'pending_review' },
      ip: '127.0.0.1',
      ts: new Date().toISOString(),
    }, ...auditLog]))
  } catch (err) {
    console.warn('Local storage error in submitWithdrawalRequestBackend:', err)
  }

  window.dispatchEvent(new Event('serviceq_withdrawals_updated'))
  window.dispatchEvent(new Event('storage'))

  try {
    const bc = new BroadcastChannel('serviceq_withdrawals')
    bc.postMessage({ event: 'new_withdrawal', withdrawal: newWd })
    bc.close()
  } catch {}

  // 2. Sync to Supabase platform_settings
  try {
    // A. Global withdrawals list (read by Admin Financials & Admin Dashboard)
    const { data: gRow } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', GLOBAL_WITHDRAWALS_KEY)
      .maybeSingle()

    let gList = []
    if (gRow?.value) {
      try { gList = JSON.parse(gRow.value) || [] } catch {}
    }
    const updatedG = [newWd, ...gList.filter(w => w.id !== newWd.id)]

    await supabase.from('platform_settings').upsert({
      key: GLOBAL_WITHDRAWALS_KEY,
      value: JSON.stringify(updatedG),
      updated_at: new Date().toISOString()
    })

    // B. Provider-specific withdrawals key
    if (providerId) {
      const pKey = `serviceq_provider_withdrawals_${providerId}`
      const { data: pRow } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', pKey)
        .maybeSingle()

      let pList = []
      if (pRow?.value) {
        try { pList = JSON.parse(pRow.value) || [] } catch {}
      }
      const updatedP = [newWd, ...pList.filter(w => w.id !== newWd.id)]

      await supabase.from('platform_settings').upsert({
        key: pKey,
        value: JSON.stringify(updatedP),
        updated_at: new Date().toISOString()
      })
    }
  } catch (err) {
    console.warn('Supabase sync error in submitWithdrawalRequestBackend:', err)
  }

  return newWd
}

/**
 * Fetches all withdrawals: prioritizes Supabase backend as the authority on status (approvals, completions, rejections),
 * then merges any unsynced local withdrawals and caches the authoritative status back to localStorage.
 */
export async function fetchBackendWithdrawals(userId) {
  const seen = new Set()
  const combined = []

  const isMockOrTest = (id) => !id || /^WD-00[1-6]$/.test(id) || /^WD-TEST/i.test(id) || id === 'WD-AO2UA'

  const merge = (arr, isAuthoritative = false) => {
    if (!Array.isArray(arr)) return
    for (const w of arr) {
      if (!w?.id || isMockOrTest(w.id)) continue
      // If scoped to a specific provider, filter by providerId if available
      if (userId && w.providerId && w.providerId !== userId) continue

      if (!seen.has(w.id)) {
        seen.add(w.id)
        combined.push(w)
      } else if (isAuthoritative) {
        // Authoritative cloud status overrides older local record
        const idx = combined.findIndex(item => item.id === w.id)
        if (idx !== -1) {
          combined[idx] = { ...combined[idx], ...w }
        }
      }
    }
  }

  // 1. SUPABASE BACKEND FETCH FIRST (Authoritative on approved / completed / rejected status)
  try {
    const { data: gRow } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', GLOBAL_WITHDRAWALS_KEY)
      .maybeSingle()

    if (gRow?.value) {
      const gList = JSON.parse(gRow.value) || []
      merge(gList, true)
    }

    if (userId) {
      const { data: pRow } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', `serviceq_provider_withdrawals_${userId}`)
        .maybeSingle()

      if (pRow?.value) {
        const pList = JSON.parse(pRow.value) || []
        merge(pList, true)
      }
    }
  } catch (err) {
    console.warn('fetchBackendWithdrawals Supabase error:', err)
  }

  // 2. Local storage read second (to pick up any brand-new local submissions not yet synced)
  try {
    if (userId) {
      merge(JSON.parse(localStorage.getItem(`serviceq_provider_withdrawals_${userId}`)) || [])
    }
    merge(JSON.parse(localStorage.getItem('serviceq_provider_withdrawals')) || [])
  } catch {}

  // Sort newest first
  combined.sort((a, b) => new Date(b.requested || b.date || 0) - new Date(a.requested || a.date || 0))

  // 3. Two-way sync: If local had a completely new withdrawal not in cloud, push to Supabase
  try {
    const { data: checkRow } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', GLOBAL_WITHDRAWALS_KEY)
      .maybeSingle()

    let cloudList = []
    if (checkRow?.value) {
      try { cloudList = JSON.parse(checkRow.value) || [] } catch {}
    }
    const cloudIds = new Set(cloudList.map(w => w.id))
    const missingInCloud = combined.filter(w => !cloudIds.has(w.id))

    if (missingInCloud.length > 0) {
      const mergedCloud = [...missingInCloud, ...cloudList]
      await supabase.from('platform_settings').upsert({
        key: GLOBAL_WITHDRAWALS_KEY,
        value: JSON.stringify(mergedCloud),
        updated_at: new Date().toISOString()
      })
    }
  } catch (syncErr) {
    console.warn('Two-way withdrawal sync error:', syncErr)
  }

  // 4. Update local storage with the authoritative status so stale 'pending_review' is replaced!
  try {
    localStorage.setItem('serviceq_provider_withdrawals', JSON.stringify(combined))
    if (userId) {
      localStorage.setItem(`serviceq_provider_withdrawals_${userId}`, JSON.stringify(combined))
    }
  } catch {}

  return combined
}

/**
 * Admin approves a withdrawal request.
 * Sets status to 'completed', deducts provider pending balance, and syncs across local storage and Supabase.
 */
export async function approveWithdrawalBackend(withdrawalId, adminName = 'Admin') {
  let approvedWd = null

  // 1. Update local storage
  try {
    const stored = JSON.parse(localStorage.getItem('serviceq_provider_withdrawals')) || []
    const updated = stored.map(w => {
      if (w.id === withdrawalId) {
        approvedWd = { ...w, status: 'completed', approved_at: new Date().toISOString() }
        return approvedWd
      }
      return w
    })
    localStorage.setItem('serviceq_provider_withdrawals', JSON.stringify(updated))

    if (approvedWd?.providerId) {
      localStorage.setItem(`serviceq_provider_withdrawals_${approvedWd.providerId}`, JSON.stringify(updated))
    }

    // Deduct from pending balance
    if (approvedWd?.amount) {
      const curr = Number(localStorage.getItem('serviceq_provider_pending_balance') || 0)
      const newPend = Math.max(0, curr - Number(approvedWd.amount))
      localStorage.setItem('serviceq_provider_pending_balance', String(newPend))
      if (approvedWd?.providerId) {
        const currAvail = Number(localStorage.getItem('serviceq_provider_avail_balance') || 0)
        saveProviderBalancesBackend(approvedWd.providerId, currAvail, newPend)
      }
    }


    // Audit log
    const auditLog = JSON.parse(localStorage.getItem('serviceq_audit_log')) || []
    localStorage.setItem('serviceq_audit_log', JSON.stringify([{
      id: `a${Date.now()}`,
      staff: adminName,
      role: 'superadmin',
      action: 'Withdrawal Approved & Paid',
      target: withdrawalId,
      desc: `Admin approved payout of ₱${Number(approvedWd?.amount || 0).toLocaleString()} for ${approvedWd?.provider || 'Provider'} via ${approvedWd?.method || 'Payout'}.`,
      before: { status: approvedWd?.status || 'pending_review' },
      after: { status: 'completed' },
      ip: '127.0.0.1',
      ts: new Date().toISOString(),
    }, ...auditLog]))
  } catch (err) {
    console.warn('Local update error in approveWithdrawalBackend:', err)
  }

  window.dispatchEvent(new Event('serviceq_withdrawals_updated'))
  window.dispatchEvent(new Event('storage'))

  try {
    const bc = new BroadcastChannel('serviceq_withdrawals')
    bc.postMessage({ event: 'withdrawal_approved', withdrawalId })
    bc.close()
  } catch {}

  // 2. Update Supabase platform_settings
  try {
    // Global withdrawals
    const { data: gRow } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', GLOBAL_WITHDRAWALS_KEY)
      .maybeSingle()

    if (gRow?.value) {
      const list = JSON.parse(gRow.value) || []
      const updatedG = list.map(w => w.id === withdrawalId ? { ...w, status: 'completed', approved_at: new Date().toISOString() } : w)
      await supabase.from('platform_settings').upsert({
        key: GLOBAL_WITHDRAWALS_KEY,
        value: JSON.stringify(updatedG),
        updated_at: new Date().toISOString()
      })
    }

    // Provider withdrawals
    if (approvedWd?.providerId) {
      const pKey = `serviceq_provider_withdrawals_${approvedWd.providerId}`
      const { data: pRow } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', pKey)
        .maybeSingle()

      if (pRow?.value) {
        const list = JSON.parse(pRow.value) || []
        const updatedP = list.map(w => w.id === withdrawalId ? { ...w, status: 'completed', approved_at: new Date().toISOString() } : w)
        await supabase.from('platform_settings').upsert({
          key: pKey,
          value: JSON.stringify(updatedP),
          updated_at: new Date().toISOString()
        })
      }
    }
  } catch (err) {
    console.warn('Supabase approve error in approveWithdrawalBackend:', err)
  }

  return true
}

/**
 * Admin rejects a withdrawal request.
 * Updates status to 'rejected' with reason and refunds amount to provider available balance.
 */
export async function rejectWithdrawalBackend(withdrawalId, reason = 'Administrative review', adminName = 'Admin') {
  let targetWd = null

  // 1. Update local storage
  try {
    const stored = JSON.parse(localStorage.getItem('serviceq_provider_withdrawals')) || []
    const updated = stored.map(w => {
      if (w.id === withdrawalId) {
        targetWd = { ...w, status: 'rejected', rejectNote: reason }
        return targetWd
      }
      return w
    })
    localStorage.setItem('serviceq_provider_withdrawals', JSON.stringify(updated))

    // Refund back to available balance and remove from pending
    if (targetWd?.amount) {
      const currAvail = Number(localStorage.getItem('serviceq_provider_avail_balance') || 0)
      const currPend = Number(localStorage.getItem('serviceq_provider_pending_balance') || 0)
      localStorage.setItem('serviceq_provider_avail_balance', String(currAvail + Number(targetWd.amount)))
      localStorage.setItem('serviceq_provider_pending_balance', String(Math.max(0, currPend - Number(targetWd.amount))))
    }
  } catch (err) {
    console.warn('Local reject error in rejectWithdrawalBackend:', err)
  }

  window.dispatchEvent(new Event('serviceq_withdrawals_updated'))
  window.dispatchEvent(new Event('storage'))

  // 2. Update Supabase platform_settings
  try {
    const { data: gRow } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', GLOBAL_WITHDRAWALS_KEY)
      .maybeSingle()

    if (gRow?.value) {
      const list = JSON.parse(gRow.value) || []
      const updatedG = list.map(w => w.id === withdrawalId ? { ...w, status: 'rejected', rejectNote: reason } : w)
      await supabase.from('platform_settings').upsert({
        key: GLOBAL_WITHDRAWALS_KEY,
        value: JSON.stringify(updatedG),
        updated_at: new Date().toISOString()
      })
    }
  } catch (err) {
    console.warn('Supabase reject error in rejectWithdrawalBackend:', err)
  }

  return true
}

/**
 * Advances withdrawal through the review stages (e.g. pending_review -> verified -> approved -> processing -> completed)
 */
export async function advanceWithdrawalBackend(withdrawalId, nextStatus) {
  try {
    const stored = JSON.parse(localStorage.getItem('serviceq_provider_withdrawals')) || []
    const updated = stored.map(w => w.id === withdrawalId ? { ...w, status: nextStatus } : w)
    localStorage.setItem('serviceq_provider_withdrawals', JSON.stringify(updated))
  } catch {}

  window.dispatchEvent(new Event('serviceq_withdrawals_updated'))
  window.dispatchEvent(new Event('storage'))

  try {
    const { data: gRow } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', GLOBAL_WITHDRAWALS_KEY)
      .maybeSingle()

    if (gRow?.value) {
      const list = JSON.parse(gRow.value) || []
      const updatedG = list.map(w => w.id === withdrawalId ? { ...w, status: nextStatus } : w)
      await supabase.from('platform_settings').upsert({
        key: GLOBAL_WITHDRAWALS_KEY,
        value: JSON.stringify(updatedG),
        updated_at: new Date().toISOString()
      })
    }
  } catch (err) {}

  return true
}

/**
 * Fetches all transactions from both local storage and Supabase backend.
 */
export async function fetchBackendTransactions() {
  const seen = new Set()
  const combined = []

  const merge = (arr) => {
    if (!Array.isArray(arr)) return
    for (const b of arr) {
      if (b?.id && !seen.has(b.id) && !/^TXN-00\d$/.test(b.id)) {
        seen.add(b.id)
        combined.push({
          id: b.id,
          customer: b.customer || 'Customer',
          provider: b.provider || 'Provider',
          service: b.service || 'Service',
          gross: Number(b.amount) || 0,
          fee: Number(b.fee) || Math.round((Number(b.amount) || 0) * 0.1),
          net: Number(b.net) || Math.round((Number(b.amount) || 0) * 0.9),
          date: b.date || b.createdAt?.slice(0, 10) || new Date().toISOString().split('T')[0],
          status: b.status === 'completed' || b.status === 'scheduled' ? 'successful' : b.status === 'cancelled' ? 'refunded' : 'pending'
        })
      }
    }
  }

  // 1. Local storage read
  try {
    merge(JSON.parse(localStorage.getItem('serviceq_all_bookings')) || [])
    merge(JSON.parse(localStorage.getItem('serviceq_customer_bookings')) || [])
  } catch {}

  // 2. Supabase backend fetch
  try {
    const { data: gRow } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', GLOBAL_BOOKINGS_KEY)
      .maybeSingle()

    if (gRow?.value) {
      const gList = JSON.parse(gRow.value) || []
      merge(gList)
    }
  } catch (err) {
    console.warn('fetchBackendTransactions error:', err)
  }

  // Sort newest first
  combined.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
  return combined
}

const MOCK_ADMIN_BOOKING_IDS = new Set([
  'SQ-A1B2', 'SQ-C3D4', 'SQ-E5F6', 'SQ-G7H8', 'SQ-I9J0',
  'SQ-K1L2', 'SQ-M3N4', 'SQ-O5P6', 'SQ-Q7R8', 'SQ-S9T0'
])

/**
 * Fetches all real bookings for Admin Bookings management console.
 * Strictly excludes any default/mock bookings.
 */
export async function fetchBackendBookings() {
  const seen = new Set()
  const combined = []

  const merge = (arr) => {
    if (!Array.isArray(arr)) return
    for (const b of arr) {
      if (b?.id && !seen.has(b.id) && !MOCK_ADMIN_BOOKING_IDS.has(b.id)) {
        seen.add(b.id)
        combined.push({
          id: b.id,
          customer: b.customer || 'Customer',
          provider: b.provider || 'Provider',
          service: b.service || b.title || 'Service',
          date: b.date || b.createdAt?.slice(0, 10) || new Date().toISOString().split('T')[0],
          amount: Number(b.amount) || Number(b.subtotal) || 0,
          status: b.status || 'pending',
          dispute: Boolean(b.dispute),
          createdAt: b.createdAt || new Date().toISOString(),
          paymentMethod: b.paymentMethod || 'Maya',
          sessions: b.sessions || 1,
        })
      }
    }
  }

  // 1. Read local storage
  try {
    merge(JSON.parse(localStorage.getItem('serviceq_all_bookings')) || [])
    merge(JSON.parse(localStorage.getItem('serviceq_customer_bookings')) || [])
  } catch {}

  // 2. Fetch Supabase platform_settings
  try {
    const { data: gRow } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', GLOBAL_BOOKINGS_KEY)
      .maybeSingle()

    if (gRow?.value) {
      const gList = JSON.parse(gRow.value) || []
      merge(gList)
    }
  } catch (err) {
    console.warn('fetchBackendBookings Supabase fetch error:', err)
  }

  combined.sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0))
  return combined
}


