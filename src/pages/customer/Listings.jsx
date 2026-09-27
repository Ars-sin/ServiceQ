import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, SlidersHorizontal, Star, MapPin } from 'lucide-react'
import { CATEGORIES } from '@/lib/constants'
import { formatPHP } from '@/lib/utils'
import { loadCachedListings, fetchBackendListings } from '@/lib/listingsService'

export default function CustomerListings() {
  const navigate = useNavigate()
  const [search, setSearch]   = useState('')
  const [catFilter, setCat]   = useState('all')
  const [maxPrice, setMax]    = useState(10000)
  const [minRating, setMinR]  = useState(0)
  const [sort, setSort]       = useState('recommended')
  const [showFilter, setShowFilter] = useState(false)
  const [listings, setListings] = useState(loadCachedListings)

  useEffect(() => {
    let isMounted = true
    fetchBackendListings().then(live => {
      if (isMounted && Array.isArray(live) && live.length > 0) setListings(live)
    }).catch(() => {})

    const handleUpdate = () => setListings(loadCachedListings())
    window.addEventListener('serviceq_listings_updated', handleUpdate)
    window.addEventListener('storage', handleUpdate)
    return () => {
      isMounted = false
      window.removeEventListener('serviceq_listings_updated', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [])

  const filtered = listings
    .filter(l => !search || (l.title || '').toLowerCase().includes(search.toLowerCase()) || (l.category || '').toLowerCase().includes(search.toLowerCase()))
    .filter(l => catFilter === 'all' || l.category === CATEGORIES.find(c => c.id === catFilter)?.label || l.category?.toLowerCase() === catFilter)
    .filter(l => (l.price || 0) <= maxPrice)
    .filter(l => (l.rating ?? 5.0) >= minRating)
    .sort((a, b) =>
      sort === 'price_asc'  ? (a.price || 0) - (b.price || 0) :
      sort === 'price_desc' ? (b.price || 0) - (a.price || 0) :
      sort === 'rating'     ? (b.rating ?? 5.0) - (a.rating ?? 5.0) : 0
    )

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Browse Listings</h1>
        <span className="text-sm text-gray-500">{filtered.length} results</span>
      </div>

      {/* Search + sort row */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search listings..." className="input pl-9" />
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)} className="input w-auto">
          <option value="recommended">Recommended</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="rating">Highest Rated</option>
        </select>
        <button onClick={() => setShowFilter(v => !v)}
          className={`btn-secondary gap-2 ${showFilter ? 'bg-brand-50 border-brand-400' : ''}`}>
          <SlidersHorizontal size={16} /> Filter
        </button>
      </div>

      {/* Filter panel */}
      {showFilter && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="card grid grid-cols-2 md:grid-cols-4 gap-4 overflow-hidden">
          <div>
            <label className="label">Category</label>
            <select value={catFilter} onChange={e => setCat(e.target.value)} className="input">
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Max Price: {formatPHP(maxPrice)}</label>
            <input type="range" min={100} max={10000} step={100} value={maxPrice}
              onChange={e => setMax(+e.target.value)} className="w-full accent-brand-600 mt-1" />
          </div>
          <div>
            <label className="label">Min Rating: {minRating}★</label>
            <input type="range" min={0} max={5} step={0.5} value={minRating}
              onChange={e => setMinR(+e.target.value)} className="w-full accent-brand-600 mt-1" />
          </div>
          <div className="flex items-end">
            <button onClick={() => { setCat('all'); setMax(10000); setMinR(0) }}
              className="btn-ghost text-sm w-full">Reset Filters</button>
          </div>
        </motion.div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(l => (
          <motion.div key={l.id} whileHover={{ y: -4 }}
            className="card-hover overflow-hidden p-0 cursor-pointer"
            onClick={() => navigate(`/customer/listings/${l.id}`)}>
            <div className={`h-40 bg-gradient-to-br ${l.color}`} />
            <div className="p-4">
              <span className="badge-neutral mb-2">{l.category}</span>
              <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">{l.title}</h3>
              <p className="text-xs text-gray-500 mb-3">{l.provider}</p>
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-brand-600">{formatPHP(l.price)}</span>
                  <span className="text-xs text-gray-400 ml-1">{l.unit}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star size={12} className="fill-amber-400 text-amber-400" />
                  <span className="text-xs font-medium">{l.rating}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <MapPin size={11} className="text-gray-400" />
                <span className="text-xs text-gray-400">{l.distance}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Search size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No listings found</p>
          <p className="text-sm">Try adjusting your search or filters</p>
        </div>
      )}
    </motion.div>
  )
}
