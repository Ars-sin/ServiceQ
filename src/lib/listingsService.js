import { supabase } from '@/lib/supabase'

export const BASE_LISTINGS = [
  { id: '1',  type: 'services', category: 'Services', subCategory: 'Cleaning',     title: 'Professional Home Cleaning',              price: 500,  unit: 'per session', rating: 4.8, reviews: 42, distance: 0.8, provider: 'Maria Santos',        tag: 'Top Rated',      status: 'active' },
  { id: '2',  type: 'rentals',  category: 'Rentals',  subCategory: 'Apartment',    title: 'Studio Apartment near Cebu IT Park',       price: 4500, unit: 'per month',   rating: 4.5, reviews: 18, distance: 1.2, provider: 'Renzo Realty',        tag: 'Verified',       status: 'active' },
  { id: '3',  type: 'rentals',  category: 'Rentals',  subCategory: 'Gadgets',      title: 'Laptop Rental (MacBook Pro M2)',           price: 800,  unit: 'per day',     rating: 4.9, reviews: 31, distance: 2.0, provider: 'TechRent Cebu',      tag: 'Fast Delivery',  status: 'active' },
  { id: '4',  type: 'services', category: 'Services', subCategory: 'Tutoring',     title: 'High School Math & Science Tutoring',      price: 300,  unit: 'per hour',    rating: 5.0, reviews: 57, distance: 0.5, provider: 'Engr. Cruz',          tag: 'Certified',      status: 'active' },
  { id: '5',  type: 'services', category: 'Services', subCategory: 'Repairs',      title: 'Split-Type AC Cleaning & Repair',          price: 350,  unit: 'per visit',   rating: 4.7, reviews: 29, distance: 3.1, provider: 'Fix-It Crew Cebu',   tag: 'Same Day',       status: 'active' },
  { id: '6',  type: 'rentals',  category: 'Rentals',  subCategory: 'Events',       title: 'Full Sound System & Stage Lights',         price: 3500, unit: 'per day',     rating: 4.6, reviews: 14, distance: 1.8, provider: 'Cebu Events Pro',    tag: 'Packages',       status: 'active' },
  { id: '7',  type: 'rentals',  category: 'Rentals',  subCategory: 'Vehicles',     title: 'Honda Click 125i Scooter Rental',          price: 450,  unit: 'per day',     rating: 4.9, reviews: 36, distance: 1.5, provider: 'Cebu MotoRent',      tag: 'Helmet Included',status: 'active' },
  { id: '8',  type: 'services', category: 'Services', subCategory: 'Cleaning',     title: 'Deep Sofa & Carpet Steam Shampoo',         price: 650,  unit: 'per sofa',    rating: 4.8, reviews: 33, distance: 2.1, provider: 'CleanPro Cebu',      tag: 'Eco-friendly',   status: 'active' },
  { id: '9',  type: 'rentals',  category: 'Rentals',  subCategory: 'Gadgets',      title: 'Sony Alpha A7 IV Camera & Lens Kit',       price: 950,  unit: 'per day',     rating: 4.9, reviews: 40, distance: 2.8, provider: 'PixelRent Cebu',     tag: '4K Ready',       status: 'active' },
  { id: '10', type: 'services', category: 'Services', subCategory: 'Catering',     title: 'Packed Meals & Filipino Buffet Catering',  price: 250,  unit: 'per head',    rating: 4.9, reviews: 83, distance: 0.9, provider: 'Lutong Sugbo',       tag: 'Catering',       status: 'active' },
  { id: '11', type: 'rentals',  category: 'Rentals',  subCategory: 'Equipment',    title: 'Electric Generator (3500W Inverter)',       price: 1200, unit: 'per day',     rating: 4.8, reviews: 19, distance: 3.4, provider: 'PowerRent Cebu',     tag: 'Heavy Duty',     status: 'active' },
  { id: '12', type: 'rentals',  category: 'Rentals',  subCategory: 'Property',     title: '1-Bedroom Furnished Condo in Lahug',       price: 8500, unit: 'per month',   rating: 4.6, reviews: 15, distance: 0.9, provider: 'Cebu Living Homes',  tag: 'Furnished',      status: 'active' },
  { id: '13', type: 'rentals',  category: 'Rentals',  subCategory: 'Gadgets',      title: 'DSLR Gimbal & Drone Photography Kit',      price: 750,  unit: 'per day',     rating: 4.8, reviews: 26, distance: 1.7, provider: 'DroneHub Cebu',     tag: 'Popular',        status: 'active' },
  { id: '14', type: 'services', category: 'Services', subCategory: 'Repairs',      title: 'Plumbing & Water Leak Repair',             price: 400,  unit: 'per service', rating: 4.7, reviews: 21, distance: 1.1, provider: 'QuickPlumb Cebu',   tag: 'Express',        status: 'active' },
  { id: '15', type: 'rentals',  category: 'Rentals',  subCategory: 'Vehicles',     title: 'Toyota Innova Van with Driver',            price: 2800, unit: 'per day',     rating: 5.0, reviews: 64, distance: 2.4, provider: 'Sugbo Van Rentals',  tag: 'Tour Ready',     status: 'active' },
]

const GLOBAL_LISTINGS_KEY = 'serviceq_global_listings'

/**
 * Normalizes an arbitrary listing object into standard frontend format.
 */
export function normalizeListing(raw) {
  if (!raw) return null

  const id = String(raw.id || raw.listing_id || Date.now())
  const rawType = String(raw.type || raw.listing_type || 'services').toLowerCase()
  const type = rawType.includes('rental') ? 'rentals' : 'services'

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
    provider: raw.provider || raw.provider_name || raw.business_name || 'Verified Provider',
    providerId: raw.providerId || raw.provider_id || raw.userId || raw.user_id || null,
    distance: parseFloat(raw.distance) || 1.0,
    rating: parseFloat(raw.rating || raw.avg_rating) || 5.0,
    reviews: parseInt(raw.reviews || raw.reviews_count || raw.total_bookings) || 0,
    tag: raw.tag || (raw.status === 'active' ? 'Verified' : ''),
    days: Array.isArray(raw.days) && raw.days.length > 0 ? raw.days : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    hoursFrom: raw.hoursFrom || raw.hours_from || '08:00',
    hoursTo: raw.hoursTo || raw.hours_to || '17:00',
    availableFrom: raw.availableFrom || raw.available_from || null,
    availableTo: raw.availableTo || raw.available_to || null,
    ongoingAvailability: raw.ongoingAvailability ?? raw.ongoing_availability ?? true,
    location: raw.location || raw.location_text || raw.city || 'Cebu City',
    serviceArea: raw.serviceArea || raw.service_area || 'Metro Cebu',
    description: raw.description || raw.title || '',
    photos: Array.isArray(raw.photos) ? raw.photos : (raw.images || []),
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
        if (norm && !seenIds.has(norm.id) && norm.status !== 'archived') {
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
            if (norm && !seenIds.has(norm.id) && norm.status !== 'archived') {
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
export async function fetchProviderListings(userId) {
  if (!userId) return []
  const localKey = `serviceq_provider_listings_${userId}`
  let localItems = []
  try {
    localItems = JSON.parse(localStorage.getItem(localKey)) || []
  } catch {}

  const seenIds = new Set(localItems.map(l => String(l.id)))
  const merged = [...localItems]

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

  // B. Check Supabase global catalog for listings with this providerId
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
          if (String(item.providerId || item.provider_id) === String(userId)) {
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
