import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Pagination from '@/components/ui/Pagination'
import {
  MapPin, Search, Star, X, Sparkles,
  Home, Laptop, GraduationCap, Hammer, PartyPopper,
  Car, Package, Utensils, Wrench, SlidersHorizontal,
  RotateCcw, LayoutGrid
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatPHP } from '@/lib/utils'
import { getFavoriteIds, toggleFavorite } from '@/lib/favorites'
import { useAuth } from '@/contexts/AuthContext'

import { BASE_LISTINGS, loadCachedListings, fetchBackendListings } from '@/lib/listingsService'

const TYPE_TABS = [
  { id: 'all',      label: 'All Listings', icon: LayoutGrid },
  { id: 'services', label: 'Services',     icon: Wrench },
  { id: 'rentals',  label: 'Rentals',      icon: Package },
]

export const ALL_LISTINGS = BASE_LISTINGS

export function loadAllMergedListings() {
  return loadCachedListings()
}

export function getListingIcon(subCategory) {
  switch (subCategory) {
    case 'Cleaning':  return <Sparkles size={22} className="text-brand-600" />
    case 'Apartment':
    case 'Property':  return <Home size={22} className="text-brand-600" />
    case 'Gadgets':   return <Laptop size={22} className="text-brand-600" />
    case 'Tutoring':  return <GraduationCap size={22} className="text-brand-600" />
    case 'Repairs':   return <Hammer size={22} className="text-brand-600" />
    case 'Events':    return <PartyPopper size={22} className="text-brand-600" />
    case 'Vehicles':  return <Car size={22} className="text-brand-600" />
    case 'Equipment': return <Package size={22} className="text-brand-600" />
    case 'Catering':  return <Utensils size={22} className="text-brand-600" />
    default:          return <Wrench size={22} className="text-brand-600" />
  }
}

function ListingCard({ listing, onClick, isFav, onToggleFav }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.18 }}
      className="card-hover overflow-hidden p-0 border border-gray-100 flex flex-col justify-between bg-white rounded-2xl shadow-sm hover:shadow-md cursor-pointer"
      onClick={onClick}
    >
      {/* Visual Header */}
      <div className="h-32 bg-brand-50/70 border-b border-gray-100 relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center p-2.5">
          {getListingIcon(listing.subCategory)}
        </div>

        <button
          onClick={e => {
            e.stopPropagation()
            onToggleFav?.(listing.id)
          }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-sm transition-colors"
          title={isFav ? "Remove from favorites" : "Add to favorites"}
        >
          <span className={isFav ? 'text-red-500 font-bold' : 'text-gray-400'}>♥</span>
        </button>

        <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5 flex-wrap">
          <span className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] ${
            listing.type === 'services'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-emerald-100 text-emerald-800'
          }`}>
            {listing.type === 'services' ? 'Service' : 'Rental'}
          </span>
          {listing.subCategory && (
            <span className="bg-white/90 text-gray-700 text-[10px] font-medium px-2 py-0.5 rounded-full border border-gray-200">
              {listing.subCategory}
            </span>
          )}
          {listing.tag && (listing.tag !== 'Verified' || listing.isVerified || listing.provider_verified || listing.providerVerified) && (
            <span className="bg-white/90 text-gray-700 text-[10px] font-medium px-2 py-0.5 rounded-full border border-gray-200">
              {listing.tag}
            </span>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-gray-900 text-sm leading-snug mb-1 line-clamp-1">
            {listing.title}
          </h3>
          <p className="text-xs text-gray-500 mb-3 flex items-center justify-between">
            <span>{(listing.provider && listing.provider !== 'Verified Provider') ? listing.provider : 'Service Provider'}</span>
            <span className="text-gray-400 flex items-center gap-0.5 text-[11px]">
              <MapPin size={11} className="text-gray-400" /> {listing.distance} km away
            </span>
          </p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-2">
          <div>
            <span className="font-extrabold text-brand-700 text-base">{formatPHP(listing.price)}</span>
            <span className="text-[11px] text-gray-400 ml-1">{listing.unit}</span>
          </div>

          <div className="flex items-center gap-1 text-xs font-semibold text-gray-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            <span>{listing.rating}</span>
            <span className="text-gray-400 text-[10px]">({listing.reviews})</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function CustomerExplore() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [search, setSearch]             = useState('')
  const [selectedType, setSelectedType] = useState('all') // 'all' | 'services' | 'rentals'
  const [sort, setSort]                 = useState('recommended')
  const [minPrice, setMinPrice]         = useState(0)
  const [minRating, setMinRating]       = useState(0)
  const [quickFilters, setQuickFilters] = useState([])
  const [showFilters, setShowFilters]   = useState(false)
  const [favoriteIds, setFavoriteIds]   = useState(() => getFavoriteIds(user?.id))

  const [allListings, setAllListings] = useState(loadCachedListings)

  useEffect(() => {
    let isMounted = true
    const syncBackend = async () => {
      try {
        const liveListings = await fetchBackendListings()
        if (isMounted && Array.isArray(liveListings) && liveListings.length > 0) {
          setAllListings(liveListings)
        }
      } catch (err) {
        console.warn('Backend listings sync error:', err)
      }
    }

    syncBackend()

    const handleUpdate = () => {
      setAllListings(loadCachedListings())
      syncBackend()
    }

    window.addEventListener('serviceq_listings_updated', handleUpdate)
    window.addEventListener('storage', handleUpdate)
    window.addEventListener('focus', syncBackend)

    return () => {
      isMounted = false
      window.removeEventListener('serviceq_listings_updated', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
      window.removeEventListener('focus', syncBackend)
    }
  }, [])

  useEffect(() => {
    const handler = () => setFavoriteIds(getFavoriteIds(user?.id))
    handler()
    window.addEventListener('serviceq_favorites_updated', handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener('serviceq_favorites_updated', handler)
      window.removeEventListener('storage', handler)
    }
  }, [user?.id])

  const handleToggleFav = (id) => {
    const isAdded = toggleFavorite(id, user?.id)
    setFavoriteIds(getFavoriteIds(user?.id))
    toast(isAdded ? 'Added to favorites!' : 'Removed from favorites')
  }

  const isDefaultAll =
    selectedType === 'all' &&
    !search.trim() &&
    sort === 'recommended' &&
    minPrice === 0 &&
    minRating === 0 &&
    quickFilters.length === 0

  const [page, setPage] = useState(1)
  const PAGE_SIZE = 12

  // Reset pagination to page 1 whenever filters change
  useEffect(() => {
    setPage(1)
  }, [search, selectedType, sort, minPrice, minRating, quickFilters])

  // Filter and sort listings
  const filtered = allListings
    .filter(item => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchTitle = (item.title || '').toLowerCase().includes(q)
        const matchSub   = (item.subCategory || '').toLowerCase().includes(q)
        const matchProv  = (item.provider || '').toLowerCase().includes(q)
        if (!matchTitle && !matchSub && !matchProv) return false
      }

      // Type filter: All | Services | Rentals (robust singular & plural matching)
      if (selectedType !== 'all') {
        const itemType = (item.type || '').toLowerCase()
        const isService = itemType.startsWith('service')
        const isRental = itemType.startsWith('rental')
        if (selectedType === 'services' && !isService) return false
        if (selectedType === 'rentals' && !isRental) return false
      }

      // Min price filter
      if (minPrice > 0 && (item.price || 0) < minPrice) return false

      // Min rating
      if ((item.rating ?? 5.0) < minRating) return false

      // Quick filters (multi-select array)
      if (quickFilters.includes('under500') && (item.price || 0) > 500) return false
      if (quickFilters.includes('toprated') && (item.rating ?? 5.0) < 4.8) return false
      if (quickFilters.includes('nearby') && (item.distance ?? 1.0) > 2.0) return false

      return true
    })
    .sort((a, b) => {
      const priceA = a.price || 0
      const priceB = b.price || 0
      const ratingA = a.rating ?? 5.0
      const ratingB = b.rating ?? 5.0
      const distA = a.distance ?? 1.0
      const distB = b.distance ?? 1.0

      if (sort === 'price_asc')  return priceA - priceB
      if (sort === 'price_desc') return priceB - priceA
      if (sort === 'rating')     return ratingB - ratingA
      if (sort === 'distance')   return distA - distB

      // 'recommended' default: show custom / newly added listings first
      const isCustomA = !BASE_LISTINGS.some(item => String(item.id) === String(a.id))
      const isCustomB = !BASE_LISTINGS.some(item => String(item.id) === String(b.id))
      if (isCustomA && !isCustomB) return -1
      if (!isCustomA && isCustomB) return 1

      const timeA = new Date(a.updatedAt || 0).getTime()
      const timeB = new Date(b.updatedAt || 0).getTime()
      if (timeA !== timeB) return timeB - timeA

      return ratingB - ratingA
    })

  // Paginate only when default all (no filters on)
  const displayedListings = isDefaultAll
    ? filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : filtered

  const clearAllFilters = () => {
    setSearch('')
    setSelectedType('all')
    setSort('recommended')
    setMinPrice(0)
    setMinRating(0)
    setQuickFilters([])
    setPage(1)
  }

  const hasActiveFilters =
    search.trim() !== '' ||
    selectedType !== 'all' ||
    sort !== 'recommended' ||
    minPrice > 0 ||
    minRating > 0 ||
    quickFilters.length > 0

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6 pb-12">

      {/* ── Top Header Bar ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Explore Services & Rentals</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}! Discover verified providers, rentals, and services across Cebu
          </p>
        </div>

        {/* Location pill */}
        <div className="inline-flex items-center gap-1.5 bg-brand-50 border border-brand-200 text-brand-800 text-xs font-semibold px-3 py-1.5 rounded-full self-start sm:self-auto">
          <MapPin size={13} className="text-brand-600" />
          <span>Cebu City & Vicinity</span>
        </div>
      </div>

      {/* ── Search & Filter Controls ──────────────────────────────── */}
      <div className="card p-4 flex flex-col gap-3.5 shadow-sm border border-gray-200/80">
        <div className="flex flex-col sm:flex-row gap-2.5">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search services, rental items, tutors, providers in Cebu..."
              className="input pl-10 pr-9 text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Sort selector */}
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="input w-full sm:w-44 text-xs font-medium cursor-pointer"
          >
            <option value="recommended">Sort: Recommended</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Highest Rated (★)</option>
            <option value="distance">Nearest Distance</option>
          </select>

          {/* Advanced Filter Toggle */}
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`btn-sm px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition ${
              showFilters || minPrice > 0 || minRating > 0
                ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
            }`}
          >
            <SlidersHorizontal size={14} />
            <span>Filters</span>
            {(minPrice > 0 || minRating > 0) && (
              <span className="w-2 h-2 rounded-full bg-white" />
            )}
          </button>
        </div>

        {/* Collapsible Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {/* Min price slider */}
              <div>
                <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
                  <span>Minimum Price:</span>
                  <span className="font-bold text-brand-700">{minPrice > 0 ? formatPHP(minPrice) : 'Any price'}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5000"
                  step="100"
                  value={minPrice}
                  onChange={e => setMinPrice(Number(e.target.value))}
                  className="w-full accent-brand-600 cursor-pointer"
                />
              </div>

              {/* Minimum rating */}
              <div>
                <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
                  <span>Minimum Rating:</span>
                  <span className="font-bold text-amber-600">{minRating > 0 ? `${minRating}★ and up` : 'Any rating'}</span>
                </div>
                <div className="flex gap-1.5">
                  {[0, 4.0, 4.5, 4.8].map(r => (
                    <button
                      key={r}
                      onClick={() => setMinRating(r)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition ${
                        minRating === r
                          ? 'bg-amber-50 border-amber-300 text-amber-900'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {r === 0 ? 'All' : `${r}★+`}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Simplified Type Tabs: All Listings | Services | Rentals */}
        <div className="flex items-center gap-2 pt-1 border-t border-gray-100 flex-wrap">
          {TYPE_TABS.map(t => {
            const Icon = t.icon
            const active = selectedType === t.id
            const count = t.id === 'all'
              ? ALL_LISTINGS.length
              : ALL_LISTINGS.filter(l => l.type === t.id).length

            return (
              <button
                key={t.id}
                onClick={() => setSelectedType(t.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  active
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon size={14} />
                <span>{t.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                  active ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {count}
                </span>
              </button>
            )
          })}

          <div className="h-4 w-px bg-gray-200 mx-1 hidden sm:block" />

          {/* Quick shortcut filters — now multi-select */}
          {[
            { id: 'under500', label: '⚡ Under ₱500' },
            { id: 'toprated', label: '⭐ Top Rated (4.8★+)' },
            { id: 'nearby',   label: '📍 Nearby (< 2km)' },
          ].map(q => (
            <button
              key={q.id}
              onClick={() => setQuickFilters(curr => curr.includes(q.id) ? curr.filter(f => f !== q.id) : [...curr, q.id])}
              className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition ${
                quickFilters.includes(q.id)
                  ? 'bg-brand-50 border-brand-300 text-brand-800 font-semibold'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {q.label}
            </button>
          ))}

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="ml-auto text-xs text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1 py-1"
            >
              <RotateCcw size={12} /> Reset all
            </button>
          )}
        </div>
      </div>

      {/* ── Results Count & Active Category Indicator ─────────────── */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900">
            {selectedType === 'all'
              ? 'All Listings'
              : selectedType === 'services'
              ? 'Service Providers'
              : 'Rentals & Spaces'}
          </span>
          <span className="text-xs bg-gray-100 text-gray-600 font-semibold px-2 py-0.5 rounded-full">
            {filtered.length} available
          </span>
        </div>

        {hasActiveFilters && (
          <span className="text-xs text-brand-600 font-medium hidden sm:block">
            Showing filtered results in Cebu
          </span>
        )}
      </div>

      {/* ── Listings Grid ─────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="card text-center py-16 flex flex-col items-center justify-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-3xl mb-1">
            🔍
          </div>
          <h3 className="font-bold text-gray-800 text-base">No listings found</h3>
          <p className="text-xs text-gray-500 max-w-sm">
            No services or rentals matched your selected filters or search query. Try broadening your filters or resetting.
          </p>
          <button
            onClick={clearAllFilters}
            className="btn-primary text-xs mt-2 gap-1.5"
          >
            <RotateCcw size={13} /> Reset Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedListings.map(listing => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isFav={favoriteIds.includes(String(listing.id))}
                onToggleFav={handleToggleFav}
                onClick={() => navigate(`/customer/listings/${listing.id}`)}
              />
            ))}
          </div>

          {/* Conditional Pagination: only paginate when default all (no active filters) */}
          {isDefaultAll && filtered.length > PAGE_SIZE && (
            <Pagination
              currentPage={page}
              totalItems={filtered.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </motion.div>
  )
}
