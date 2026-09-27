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
    status: raw.status || 'pending',
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
      after: { status: 'pending' },
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
  // 1. Update local storage
  const keys = ['serviceq_all_bookings', 'serviceq_customer_bookings', 'serviceq_provider_bookings']
  if (userId) keys.push(`serviceq_provider_bookings_${userId}`)

  for (const k of keys) {
    try {
      const list = JSON.parse(localStorage.getItem(k)) || []
      const updated = list.map(b => b.id === bookingId ? { ...b, status: newStatus } : b)
      localStorage.setItem(k, JSON.stringify(updated))
    } catch {}
  }

  window.dispatchEvent(new Event('serviceq_bookings_updated'))

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
      const updated = list.map(b => b.id === bookingId ? { ...b, status: newStatus } : b)
      await supabase.from('platform_settings').upsert({
        key: GLOBAL_BOOKINGS_KEY,
        value: JSON.stringify(updated),
        updated_at: new Date().toISOString()
      })
    }

    // Provider bookings
    if (userId) {
      const provKey = `serviceq_provider_bookings_${userId}`
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
