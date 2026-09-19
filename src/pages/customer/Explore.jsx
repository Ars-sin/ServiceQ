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

const TYPE_TABS = [
  { id: 'all',      label: 'All Listings', icon: LayoutGrid },
  { id: 'services', label: 'Services',     icon: Wrench },
  { id: 'rentals',  label: 'Rentals',      icon: Package },
]

export const ALL_LISTINGS = [
  { id: '1',  type: 'services', category: 'Services', subCategory: 'Cleaning',     title: 'Professional Home Cleaning',              price: 500,  unit: 'per session', rating: 4.8, reviews: 42, distance: 0.8, provider: 'Maria Santos',        tag: 'Top Rated' },
  { id: '2',  type: 'rentals',  category: 'Rentals',  subCategory: 'Apartment',    title: 'Studio Apartment near Cebu IT Park',       price: 4500, unit: 'per month',   rating: 4.5, reviews: 18, distance: 1.2, provider: 'Renzo Realty',        tag: 'Verified' },
  { id: '3',  type: 'rentals',  category: 'Rentals',  subCategory: 'Gadgets',      title: 'Laptop Rental (MacBook Pro M2)',           price: 800,  unit: 'per day',     rating: 4.9, reviews: 31, distance: 2.0, provider: 'TechRent Cebu',      tag: 'Fast Delivery' },
  { id: '4',  type: 'services', category: 'Services', subCategory: 'Tutoring',     title: 'High School Math & Science Tutoring',      price: 300,  unit: 'per hour',    rating: 5.0, reviews: 57, distance: 0.5, provider: 'Engr. Cruz',          tag: 'Certified' },
  { id: '5',  type: 'services', category: 'Services', subCategory: 'Repairs',      title: 'Split-Type AC Cleaning & Repair',          price: 350,  unit: 'per visit',   rating: 4.7, reviews: 29, distance: 3.1, provider: 'Fix-It Crew Cebu',   tag: 'Same Day' },
  { id: '6',  type: 'rentals',  category: 'Rentals',  subCategory: 'Events',       title: 'Full Sound System & Stage Lights',         price: 3500, unit: 'per day',     rating: 4.6, reviews: 14, distance: 1.8, provider: 'Cebu Events Pro',    tag: 'Packages' },
  { id: '7',  type: 'rentals',  category: 'Rentals',  subCategory: 'Vehicles',     title: 'Honda Click 125i Scooter Rental',          price: 450,  unit: 'per day',     rating: 4.9, reviews: 36, distance: 1.5, provider: 'Cebu MotoRent',      tag: 'Helmet Included' },
  { id: '8',  type: 'services', category: 'Services', subCategory: 'Cleaning',     title: 'Deep Sofa & Carpet Steam Shampoo',         price: 650,  unit: 'per sofa',    rating: 4.8, reviews: 33, distance: 2.1, provider: 'CleanPro Cebu',      tag: 'Eco-friendly' },
  { id: '9',  type: 'rentals',  category: 'Rentals',  subCategory: 'Gadgets',      title: 'Sony Alpha A7 IV Camera & Lens Kit',       price: 950,  unit: 'per day',     rating: 4.9, reviews: 40, distance: 2.8, provider: 'PixelRent Cebu',     tag: '4K Ready' },
  { id: '10', type: 'services', category: 'Services', subCategory: 'Catering',     title: 'Packed Meals & Filipino Buffet Catering',  price: 250,  unit: 'per head',    rating: 4.9, reviews: 83, distance: 0.9, provider: 'Lutong Sugbo',       tag: 'Catering' },
  { id: '11', type: 'rentals',  category: 'Rentals',  subCategory: 'Equipment',    title: 'Electric Generator (3500W Inverter)',       price: 1200, unit: 'per day',     rating: 4.8, reviews: 19, distance: 3.4, provider: 'PowerRent Cebu',     tag: 'Heavy Duty' },
  { id: '12', type: 'rentals',  category: 'Rentals',  subCategory: 'Property',     title: '1-Bedroom Furnished Condo in Lahug',       price: 8500, unit: 'per month',   rating: 4.6, reviews: 15, distance: 0.9, provider: 'Cebu Living Homes',  tag: 'Furnished' },
  { id: '13', type: 'rentals',  category: 'Rentals',  subCategory: 'Gadgets',      title: 'DSLR Gimbal & Drone Photography Kit',      price: 750,  unit: 'per day',     rating: 4.8, reviews: 26, distance: 1.7, provider: 'DroneHub Cebu',     tag: 'Popular' },
  { id: '14', type: 'services', category: 'Services', subCategory: 'Repairs',      title: 'Plumbing & Water Leak Repair',             price: 400,  unit: 'per service', rating: 4.7, reviews: 21, distance: 1.1, provider: 'QuickPlumb Cebu',   tag: 'Express' },
  { id: '15', type: 'rentals',  category: 'Rentals',  subCategory: 'Vehicles',     title: 'Toyota Innova Van with Driver',            price: 2800, unit: 'per day',     rating: 5.0, reviews: 64, distance: 2.4, provider: 'Sugbo Van Rentals',  tag: 'Tour Ready' },
]

function getListingIcon(subCategory) {
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

function ListingCard({ listing, onClick }) {
  const [fav, setFav] = useState(false)

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
            setFav(v => !v)
            toast(fav ? 'Removed from favorites' : 'Added to favorites!')
          }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-sm transition-colors"
          title="Favorite"
        >
          <span className={fav ? 'text-red-500 font-bold' : 'text-gray-400'}>♥</span>
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
          {listing.tag && (
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
            <span>{listing.provider}</span>
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
  const [search, setSearch]             = useState('')
  const [selectedType, setSelectedType] = useState('all') // 'all' | 'services' | 'rentals'
  const [sort, setSort]                 = useState('recommended')
  const [maxPrice, setMaxPrice]         = useState(10000)
  const [minRating, setMinRating]       = useState(0)
  const [quickFilter, setQuickFilter]   = useState(null)
  const [showFilters, setShowFilters]   = useState(false)

  const isDefaultAll =
    selectedType === 'all' &&
    !search.trim() &&
    sort === 'recommended' &&
    maxPrice >= 10000 &&
    minRating === 0 &&
    !quickFilter

  const [page, setPage] = useState(1)
  const PAGE_SIZE = 6

  // Reset pagination to page 1 whenever filters change
  useEffect(() => {
    setPage(1)
  }, [search, selectedType, sort, maxPrice, minRating, quickFilter])

  // Filter and sort listings
  const filtered = ALL_LISTINGS
    .filter(item => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchTitle = item.title.toLowerCase().includes(q)
        const matchSub   = item.subCategory?.toLowerCase().includes(q)
        const matchProv  = item.provider.toLowerCase().includes(q)
        if (!matchTitle && !matchSub && !matchProv) return false
      }

      // Type filter: All | Services | Rentals
      if (selectedType !== 'all' && item.type !== selectedType) {
        return false
      }

      // Max price
      if (item.price > maxPrice) return false

      // Min rating
      if (item.rating < minRating) return false

      // Quick filter
      if (quickFilter === 'under500' && item.price > 500) return false
      if (quickFilter === 'toprated' && item.rating < 4.8) return false
      if (quickFilter === 'nearby' && item.distance > 2.0) return false

      return true
    })
    .sort((a, b) => {
      if (sort === 'price_asc')  return a.price - b.price
      if (sort === 'price_desc') return b.price - a.price
      if (sort === 'rating')     return b.rating - a.rating
      if (sort === 'distance')   return a.distance - b.distance
      return 0 // recommended default
    })

  // Paginate only when default all (no filters on)
  const displayedListings = isDefaultAll
    ? filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : filtered

  const clearAllFilters = () => {
    setSearch('')
    setSelectedType('all')
    setSort('recommended')
    setMaxPrice(10000)
    setMinRating(0)
    setQuickFilter(null)
    setPage(1)
  }

  const hasActiveFilters =
    search.trim() !== '' ||
    selectedType !== 'all' ||
    sort !== 'recommended' ||
    maxPrice < 10000 ||
    minRating > 0 ||
    quickFilter !== null

  return (
    <div className="max-w-6xl mx-auto w-full flex flex-col gap-6 pb-12">

      {/* ── Top Header Bar ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Explore Services & Rentals</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Discover verified providers, rentals, and services across Cebu
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
              showFilters || maxPrice < 10000 || minRating > 0
                ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
            }`}
          >
            <SlidersHorizontal size={14} />
            <span>Filters</span>
            {(maxPrice < 10000 || minRating > 0) && (
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
              {/* Max price slider */}
              <div>
                <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
                  <span>Maximum Price:</span>
                  <span className="font-bold text-brand-700">{formatPHP(maxPrice)}</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="10000"
                  step="100"
                  value={maxPrice}
                  onChange={e => setMaxPrice(Number(e.target.value))}
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

          {/* Quick shortcut filters */}
          {[
            { id: 'under500', label: '⚡ Under ₱500' },
            { id: 'toprated', label: '⭐ Top Rated (4.8★+)' },
            { id: 'nearby',   label: '📍 Nearby (< 2km)' },
          ].map(q => (
            <button
              key={q.id}
              onClick={() => setQuickFilter(curr => curr === q.id ? null : q.id)}
              className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition ${
                quickFilter === q.id
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
    </div>
  )
}
