import { supabase } from '@/lib/supabase'

// BASE_LISTINGS intentionally empty — only real provider listings are shown
export const BASE_LISTINGS = []


const GLOBAL_LISTINGS_KEY = 'serviceq_global_listings'

/**
 * Normalizes an arbitrary listing object into standard frontend format.
 */
export function normalizeListing(raw) {
  if (!raw) return null

  const id = String(raw.id || raw.listing_id || Date.now())
  const rawType = String(raw.type || raw.listing_type || 'services').toLowerCase()
  const type = rawType.includes('rental') ? 'rentals' : 'services'

  const reviews = parseInt(raw.reviews ?? raw.reviews_count ?? 0) || 0
  const rawRating = raw.rating ?? raw.avg_rating
  const rating = reviews === 0 ? 0 : (rawRating !== undefined && rawRating !== null && rawRating !== '' ? parseFloat(rawRating) : 5.0)

  let photos = []
  if (Array.isArray(raw.photos) && raw.photos.length > 0) {
    photos = raw.photos
  } else if (Array.isArray(raw.images) && raw.images.length > 0) {
    photos = raw.images
  } else if (raw.image && typeof raw.image === 'string') {
    photos = [raw.image]
  }

  return {
    id,
    title: raw.title || 'Untitled Offering',
    type,
    category: raw.category || 'Services',
    subCategory: raw.subCategory || raw.sub_category || raw.category || 'General',
    price: parseFloat(raw.price) || 0,
    unit: raw.unit || raw.price_unit || 'per session',
    status: raw.status || 'active',
    bookings: parseInt(raw.bookings || raw.total_bookings) || 0,
    color: raw.color || (type === 'rentals' ? 'from-emerald-400 to-teal-400' : 'from-blue-400 to-indigo-400'),
    provider: (raw.business_name && raw.business_name !== 'Verified Provider')
      ? raw.business_name
      : (raw.provider && raw.provider !== 'Verified Provider')
        ? raw.provider
        : (raw.provider_name || raw.business_name || 'Service Provider'),
    businessName: raw.business_name || raw.businessName || raw.provider_name || raw.provider || 'Service Provider',

    providerId: raw.providerId || raw.provider_id || raw.userId || raw.user_id || null,
    distance: parseFloat(raw.distance) || 1.0,
    lat: raw.lat !== undefined && raw.lat !== null ? parseFloat(raw.lat) : 10.3157,
    lng: raw.lng !== undefined && raw.lng !== null ? parseFloat(raw.lng) : 123.8854,
    rating,
    reviews,
    reviews_list: Array.isArray(raw.reviews_list) ? raw.reviews_list : [],
    tag: (raw.tag && raw.tag !== 'Verified')
      ? raw.tag
      : ((raw.isVerified || raw.provider_verified || raw.providerVerified) ? 'Verified' : ''),
    isVerified: Boolean(
      raw.isVerified ||
      raw.provider_verified ||
      raw.providerVerified ||
      (raw.providerId && typeof window !== 'undefined' && (
        window.localStorage?.getItem(`provider_verified_${raw.providerId}`) === 'true' ||
        window.localStorage?.getItem('serviceq_kyc_approved') === 'true'
      ))
    ),
    days: Array.isArray(raw.days) && raw.days.length > 0 ? raw.days : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    hoursFrom: raw.hoursFrom || raw.hours_from || '08:00',
    hoursTo: raw.hoursTo || raw.hours_to || '17:00',
    availableFrom: raw.availableFrom || raw.available_from || null,
    availableTo: raw.availableTo || raw.available_to || null,
    ongoingAvailability: raw.ongoingAvailability ?? raw.ongoing_availability ?? true,
    location: raw.location || raw.location_text || raw.city || 'Cebu City',
    serviceArea: raw.serviceArea || raw.service_area || 'Metro Cebu',
    description: raw.description || raw.title || '',
    photos,
    updatedAt: raw.updatedAt || raw.updated_at || new Date().toISOString(),
  }
}

/**
 * Synchronous local cache loader. Ensures instantaneous UI rendering.
 */
export function loadCachedListings() {
  const merged = []
  const seenIds = new Set()

  // 1. Check custom listings cache
  try {
    const custom = JSON.parse(localStorage.getItem('serviceq_custom_listings')) || []
    if (Array.isArray(custom)) {
      for (const item of custom) {
        const norm = normalizeListing(item)
        // Never show pending_verification or archived listings to customers
        if (norm && !seenIds.has(norm.id) && norm.status !== 'archived' && norm.status !== 'pending_verification') {
          seenIds.add(norm.id)
          merged.push(norm)
        }
      }
    }
  } catch {}

  // 2. Check provider-scoped storage keys
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('serviceq_provider_listings_')) {
        const provListings = JSON.parse(localStorage.getItem(key)) || []
        if (Array.isArray(provListings)) {
          for (const item of provListings) {
            const norm = normalizeListing(item)
            // Never show pending_verification or archived listings to customers
            if (norm && !seenIds.has(norm.id) && norm.status !== 'archived' && norm.status !== 'pending_verification') {
              seenIds.add(norm.id)
              merged.push(norm)
            }
          }
        }
      }
    }
  } catch {}


  // 3. Fallback to base mock listings
  for (const item of BASE_LISTINGS) {
    const norm = normalizeListing(item)
    if (norm && !seenIds.has(norm.id)) {
      seenIds.add(norm.id)
      merged.push(norm)
    }
  }

  return merged
}

/**
 * Asynchronously fetches and merges listings from Supabase backend
 * (both the `listings` table and `platform_settings` global catalog).
 */
export async function fetchBackendListings(includeBase = true) {
  const seenIds = new Set()
  const backendItems = []

  // 0. Fetch approved provider IDs from Supabase so all their listings are marked verified (SQI-50)
  const approvedProvIds = new Set()
  try {
    const { data: profs } = await supabase
      .from('profiles')
      .select('id, avatar_url, is_active')
      .eq('role', 'provider')
      .eq('is_active', true)

    if (Array.isArray(profs)) {
      profs.forEach(p => {
        let isAppr = false
        try {
          if (p.avatar_url && p.avatar_url.startsWith('{')) {
            const meta = JSON.parse(p.avatar_url)
            if (meta.status === 'approved') isAppr = true
          }
        } catch {}
        if (isAppr || localStorage.getItem(`provider_verified_${p.id}`) === 'true') {
          approvedProvIds.add(String(p.id))
        }
      })
    }
  } catch {}

  // 1. Fetch from Supabase platform_settings (Global Provider Catalog)
  try {
    const { data: settingRow, error: settingErr } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', GLOBAL_LISTINGS_KEY)
      .maybeSingle()

    if (!settingErr && settingRow?.value) {
      const parsed = JSON.parse(settingRow.value)
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          const norm = normalizeListing(item)
          if (norm && !seenIds.has(norm.id) && norm.status !== 'archived') {
            if (norm.providerId && approvedProvIds.has(String(norm.providerId))) {
              norm.isVerified = true
              norm.tag = 'Verified'
            }
            seenIds.add(norm.id)
            backendItems.push(norm)
          }
        }
      }
    }
  } catch (err) {
    console.warn('Could not read global listings from platform_settings:', err)
  }

  // 2. Fetch from Supabase `listings` table
  try {
    const { data: tableListings, error: tableErr } = await supabase
      .from('listings')
      .select('*')
      .neq('status', 'archived')

    if (!tableErr && Array.isArray(tableListings)) {
      for (const item of tableListings) {
        const norm = normalizeListing(item)
        if (norm && !seenIds.has(norm.id)) {
          if (norm.providerId && approvedProvIds.has(String(norm.providerId))) {
            norm.isVerified = true
            norm.tag = 'Verified'
          }
          seenIds.add(norm.id)
          backendItems.push(norm)
        }
      }
    }
  } catch (err) {
    console.warn('Could not read from listings table:', err)
  }

  // 3. Merge with local custom cache for any offline / newly created local items
  try {
    const custom = JSON.parse(localStorage.getItem('serviceq_custom_listings')) || []
    if (Array.isArray(custom)) {
      for (const item of custom) {
        const norm = normalizeListing(item)
        if (norm && !seenIds.has(norm.id) && norm.status !== 'archived') {
          seenIds.add(norm.id)
          backendItems.push(norm)
        }
      }
    }
  } catch {}

  // 4. Also check provider-scoped listings in localStorage
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('serviceq_provider_listings_')) {
        const pList = JSON.parse(localStorage.getItem(key)) || []
        if (Array.isArray(pList)) {
          for (const item of pList) {
            const norm = normalizeListing(item)
            if (norm && !seenIds.has(norm.id) && norm.status !== 'archived') {
              seenIds.add(norm.id)
              backendItems.push(norm)
            }
          }
        }
      }
    }
  } catch {}

  // 5. Fill in Base Listings only if requested (for customer browse)
  if (includeBase) {
    for (const item of BASE_LISTINGS) {
      const norm = normalizeListing(item)
      if (norm && !seenIds.has(norm.id)) {
        seenIds.add(norm.id)
        backendItems.push(norm)
      }
    }
  }

  // SQI-50: Check approved providers from Supabase profiles to ensure listings of newly verified providers (e.g. Mochi Elorie) are verified
  const approvedProviderIds = new Set()
  const approvedProviderNames = new Set()

  try {
    const { data: provProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, role, avatar_url, is_active')
      .eq('role', 'provider')

    if (Array.isArray(provProfiles)) {
      for (const p of provProfiles) {
        let isApproved = false
        if (p.is_active) isApproved = true
        if (p.avatar_url && p.avatar_url.startsWith('{')) {
          try {
            const meta = JSON.parse(p.avatar_url)
            if (meta?.status === 'approved') isApproved = true
            if (meta?.status === 'suspended' || meta?.status === 'rejected') isApproved = false
          } catch {}
        }
        if (isApproved) {
          if (p.id) approvedProviderIds.add(String(p.id))
          if (p.full_name) approvedProviderNames.add(p.full_name.trim().toLowerCase())
        }
      }
    }
  } catch (err) {
    console.warn('Could not query approved provider profiles:', err)
  }

  // Also check local storage provider_verified_ keys
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('provider_verified_') && localStorage.getItem(key) === 'true') {
        approvedProviderIds.add(key.replace('provider_verified_', ''))
      }
    }
  } catch {}

  // Mark all listings matching approved providers as verified
  for (const item of backendItems) {
    const isApproved =
      (item.providerId && approvedProviderIds.has(String(item.providerId))) ||
      (item.provider && approvedProviderNames.has(item.provider.trim().toLowerCase()))

    if (isApproved) {
      item.isVerified = true
      item.provider_verified = true
      if (!item.tag) item.tag = 'Verified'
    }
  }

  // Persist combined active custom listings to localStorage for instant load next time
  try {
    const customOnly = backendItems.filter(l => !BASE_LISTINGS.some(b => String(b.id) === String(l.id)))
    localStorage.setItem('serviceq_custom_listings', JSON.stringify(customOnly))
  } catch {}

  return backendItems
}

/**
 * Fetches strictly real listings from backend for Admin Listing Moderation.
 * Excludes all default mock items.
 */
export async function fetchAdminBackendListings() {
  return fetchBackendListings(false)
}

/**
 * Loads provider-specific listings from localStorage and Supabase.
 */
export async function fetchProviderListings(userId, profileName) {
  if (!userId) return []
  const localKey = `serviceq_provider_listings_${userId}`
  let localItems = []
  try {
    localItems = JSON.parse(localStorage.getItem(localKey)) || []
  } catch {}

  const seenIds = new Set(localItems.map(l => String(l.id)))
  const merged = [...localItems]

  // Strict ownership check — only match by explicit userId/providerId field.
  // Name-based matching is intentionally removed because it causes cross-account
  // listing bleed when two accounts share the same display name.
  const isMatchingItem = (item) => {
    if (!item) return false
    const pid = String(item.providerId || item.provider_id || item.userId || item.user_id || '')
    return pid !== '' && pid === String(userId)
  }

  // Check local custom listings for this provider (userId-scoped only)
  try {
    const custom = JSON.parse(localStorage.getItem('serviceq_custom_listings')) || []
    if (Array.isArray(custom)) {
      for (const item of custom) {
        if (isMatchingItem(item)) {
          const norm = normalizeListing(item)
          if (norm && !seenIds.has(norm.id)) {
            seenIds.add(norm.id)
            merged.push(norm)
          }
        }
      }
    }
  } catch {}


  // A. Check Supabase platform_settings for this specific provider
  try {
    const { data: provRow } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', `serviceq_provider_listings_${userId}`)
      .maybeSingle()

    if (provRow?.value) {
      const parsed = JSON.parse(provRow.value)
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          const norm = normalizeListing(item)
          if (norm && !seenIds.has(norm.id)) {
            seenIds.add(norm.id)
            merged.push(norm)
          }
        }
      }
    }
  } catch {}

  // B. Check Supabase global catalog for listings with this providerId or name
  try {
    const { data: globalRow } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', GLOBAL_LISTINGS_KEY)
      .maybeSingle()

    if (globalRow?.value) {
      const parsed = JSON.parse(globalRow.value)
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (isMatchingItem(item)) {
            const norm = normalizeListing(item)
            if (norm && !seenIds.has(norm.id)) {
              seenIds.add(norm.id)
              merged.push(norm)
            }
          }
        }
      }
    }
  } catch {}

  // C. Check Supabase listings table
  try {
    const { data: dbItems } = await supabase
      .from('listings')
      .select('*')
      .or(`provider_id.eq.${userId}`)

    if (Array.isArray(dbItems)) {
      for (const item of dbItems) {
        const norm = normalizeListing(item)
        if (norm && !seenIds.has(norm.id)) {
          seenIds.add(norm.id)
          merged.push(norm)
        }
      }
    }
  } catch {}

  // Update localStorage
  try {
    localStorage.setItem(localKey, JSON.stringify(merged))
  } catch {}

  return merged
}

/**
 * Saves or updates a listing across:
 * 1. Provider-scoped local storage
 * 2. Custom listings local storage
 * 3. Supabase platform_settings (both provider key & global catalog)
 * 4. Supabase listings table (if permitted)
 * 5. Dispatches global update event
 */
export async function saveProviderListing(rawListing, userId) {
  const listing = normalizeListing(rawListing)
  if (!listing) return false

  const pUserId = userId || listing.providerId || 'anonymous_provider'
  listing.providerId = pUserId
  const localKey = `serviceq_provider_listings_${pUserId}`

  // 1. Update Provider Local Storage
  let provListings = []
  try {
    provListings = JSON.parse(localStorage.getItem(localKey)) || []
  } catch {}
  const provFiltered = provListings.filter(l => String(l.id) !== String(listing.id))
  const newProvListings = [listing, ...provFiltered]
  try {
    localStorage.setItem(localKey, JSON.stringify(newProvListings))
  } catch {}

  // 2. Update Custom Listings Local Storage
  let customListings = []
  try {
    customListings = JSON.parse(localStorage.getItem('serviceq_custom_listings')) || []
  } catch {}
  const customFiltered = customListings.filter(l => String(l.id) !== String(listing.id))
  const newCustomListings = listing.status !== 'archived'
    ? [listing, ...customFiltered]
    : customFiltered
  try {
    localStorage.setItem('serviceq_custom_listings', JSON.stringify(newCustomListings))
  } catch {}

  // 3. Dispatch update event immediately so same-browser tabs update without waiting for network
  window.dispatchEvent(new Event('serviceq_listings_updated'))

  // 4. Sync to Supabase Backend
  try {
    // 4A. Update provider's key in platform_settings
    await supabase.from('platform_settings').upsert({
      key: `serviceq_provider_listings_${pUserId}`,
      value: JSON.stringify(newProvListings),
      updated_at: new Date().toISOString()
    })

    // 4B. Update Global Catalog in platform_settings
    const { data: globalRow } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', GLOBAL_LISTINGS_KEY)
      .maybeSingle()

    let globalListings = []
    if (globalRow?.value) {
      try {
        globalListings = JSON.parse(globalRow.value) || []
      } catch {}
    }

    const filteredGlobal = globalListings.filter(l => String(l.id) !== String(listing.id))
    const updatedGlobal = listing.status === 'active'
      ? [listing, ...filteredGlobal]
      : filteredGlobal // Only active listings are in the public explore catalog

    await supabase.from('platform_settings').upsert({
      key: GLOBAL_LISTINGS_KEY,
      value: JSON.stringify(updatedGlobal),
      updated_at: new Date().toISOString()
    })
  } catch (err) {
    console.warn('Backend sync warning (platform_settings):', err)
  }

  // 4C. Try Supabase listings table upsert
  try {
    const typeEnum = listing.type === 'rentals' ? 'rental_item' : 'service'
    await supabase.from('listings').upsert({
      id: listing.id.includes('-') ? listing.id : undefined, // only use valid uuid or let db generate
      title: listing.title,
      description: listing.description,
      listing_type: typeEnum,
      category: listing.category,
      sub_category: listing.subCategory,
      price: listing.price,
      price_unit: listing.unit,
      status: listing.status,
      location_text: listing.location,
      city: listing.location,
      avg_rating: listing.rating,
      total_bookings: listing.bookings,
      created_at: listing.updatedAt,
      updated_at: new Date().toISOString()
    })
  } catch (err) {
    // May be blocked by RLS if not authenticated with providers table; non-fatal
    console.debug('listings table upsert note:', err?.message)
  }

  return true
}

/**
 * Toggles or updates status of a listing (e.g. active <-> inactive).
 */
export async function updateListingStatus(listingId, newStatus, userId) {
  const strId = String(listingId)
  const pUserId = userId || 'anonymous_provider'
  const localKey = `serviceq_provider_listings_${pUserId}`

  let currentListings = []
  try {
    currentListings = JSON.parse(localStorage.getItem(localKey)) || []
  } catch {}

  const target = currentListings.find(l => String(l.id) === strId)
  if (target) {
    target.status = newStatus
    target.updatedAt = new Date().toISOString()
    return saveProviderListing(target, pUserId)
  }

  // Check custom listings
  let customListings = []
  try {
    customListings = JSON.parse(localStorage.getItem('serviceq_custom_listings')) || []
  } catch {}
  const customTarget = customListings.find(l => String(l.id) === strId)
  if (customTarget) {
    customTarget.status = newStatus
    customTarget.updatedAt = new Date().toISOString()
    return saveProviderListing(customTarget, pUserId)
  }

  // Update directly in Supabase platform_settings
  try {
    const { data: globalRow } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', GLOBAL_LISTINGS_KEY)
      .maybeSingle()

    if (globalRow?.value) {
      const list = JSON.parse(globalRow.value) || []
      const found = list.find(l => String(l.id) === strId)
      if (found) {
        found.status = newStatus
        found.updatedAt = new Date().toISOString()
        await supabase.from('platform_settings').upsert({
          key: GLOBAL_LISTINGS_KEY,
          value: JSON.stringify(list),
          updated_at: new Date().toISOString()
        })
        window.dispatchEvent(new Event('serviceq_listings_updated'))
        return true
      }
    }
  } catch (err) {
    console.warn('updateListingStatus Supabase error:', err)
  }

  return false
}

/**
 * Deletes a listing from local cache and Supabase platform_settings.
 */
export async function deleteListingBackend(listingId) {
  const strId = String(listingId)

  // 1. Remove from custom listings
  try {
    const custom = JSON.parse(localStorage.getItem('serviceq_custom_listings')) || []
    localStorage.setItem('serviceq_custom_listings', JSON.stringify(custom.filter(l => String(l.id) !== strId)))
  } catch {}

  // 2. Remove from provider-scoped localStorage
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('serviceq_provider_listings_')) {
        const list = JSON.parse(localStorage.getItem(key)) || []
        localStorage.setItem(key, JSON.stringify(list.filter(l => String(l.id) !== strId)))
      }
    }
  } catch {}

  window.dispatchEvent(new Event('serviceq_listings_updated'))

  // 3. Remove from Supabase platform_settings
  try {
    const { data: globalRow } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', GLOBAL_LISTINGS_KEY)
      .maybeSingle()

    if (globalRow?.value) {
      const parsed = JSON.parse(globalRow.value) || []
      const filtered = parsed.filter(l => String(l.id) !== strId)
      await supabase.from('platform_settings').upsert({
        key: GLOBAL_LISTINGS_KEY,
        value: JSON.stringify(filtered),
        updated_at: new Date().toISOString()
      })
    }
  } catch (err) {
    console.warn('deleteListingBackend Supabase error:', err)
  }

  return true
}

/**
 * Archives a listing: marks it 'archived', removes from public catalog,
 * and updates provider records.
 */
export async function archiveListing(listingId, userId) {
  return updateListingStatus(listingId, 'archived', userId)
}

/**
 * Updates availability schedule for a listing.
 */
export async function updateListingAvailability(listingId, availData, userId) {
  const pUserId = userId || 'anonymous_provider'
  const localKey = `serviceq_provider_listings_${pUserId}`

  let currentListings = []
  try {
    currentListings = JSON.parse(localStorage.getItem(localKey)) || []
  } catch {}

  let target = currentListings.find(l => String(l.id) === String(listingId))
  if (!target) {
    try {
      const customListings = JSON.parse(localStorage.getItem('serviceq_custom_listings')) || []
      target = customListings.find(l => String(l.id) === String(listingId))
    } catch {}
  }

  if (target) {
    target.days = availData.days || target.days
    target.hoursFrom = availData.hoursFrom || target.hoursFrom
    target.hoursTo = availData.hoursTo || target.hoursTo
    target.availableFrom = availData.availableFrom ?? target.availableFrom
    target.availableTo = availData.ongoingAvailability ? null : (availData.availableTo ?? target.availableTo)
    target.ongoingAvailability = availData.ongoingAvailability ?? target.ongoingAvailability
    target.updatedAt = new Date().toISOString()

    return saveProviderListing(target, pUserId)
  }

  return false
}
