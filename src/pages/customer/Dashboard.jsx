import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Search, Star, ChevronRight, X, Sparkles, Home, Laptop, GraduationCap, Hammer, PartyPopper, Car, Package, Utensils, Wrench } from 'lucide-react'
import toast from 'react-hot-toast'
import { CATEGORIES } from '@/lib/constants'
import { formatPHP } from '@/lib/utils'

const MOCK_LISTINGS = [
  { id: '1', title: 'Professional Home Cleaning', categoryId: 'cleaning', category: 'Cleaning Services', price: 500, unit: 'per session', rating: 4.8, reviews: 42, distance: '0.8 km', provider: 'Maria Santos', tag: 'Top Rated' },
  { id: '2', title: 'Studio Apartment near Cebu IT Park', categoryId: 'rental_props', category: 'Rental Properties', price: 4500, unit: 'per month', rating: 4.5, reviews: 18, distance: '1.2 km', provider: 'Renzo Realty', tag: 'Verified' },
  { id: '3', title: 'Laptop Rental (MacBook Pro M2)', categoryId: 'gadgets', category: 'Gadgets & Tech', price: 800, unit: 'per day', rating: 4.9, reviews: 31, distance: '2.0 km', provider: 'TechRent Cebu', tag: 'Fast Delivery' },
  { id: '4', title: 'High School Math & Science Tutoring', categoryId: 'tutoring', category: 'Tutoring & Lessons', price: 300, unit: 'per hour', rating: 5.0, reviews: 57, distance: '0.5 km', provider: 'Engr. Cruz', tag: 'Certified' },
  { id: '5', title: 'Split-Type AC Cleaning & Repair', categoryId: 'repairs', category: 'Repairs & Maintenance', price: 350, unit: 'per visit', rating: 4.7, reviews: 29, distance: '3.1 km', provider: 'Fix-It Crew Cebu', tag: 'Same Day' },
  { id: '6', title: 'Full Sound System & Stage Lights', categoryId: 'events', category: 'Events & Equipment', price: 3500, unit: 'per day', rating: 4.6, reviews: 14, distance: '1.8 km', provider: 'Cebu Events Pro', tag: 'Packages' },
  { id: '7', title: 'Honda Click 125i Scooter Rental', categoryId: 'vehicles', category: 'Vehicles', price: 450, unit: 'per day', rating: 4.9, reviews: 36, distance: '1.5 km', provider: 'Cebu MotoRent', tag: 'Helmet Included' },
  { id: '8', title: 'Deep Sofa & Carpet Steam Shampoo', categoryId: 'cleaning', category: 'Cleaning Services', price: 650, unit: 'per sofa', rating: 4.8, reviews: 33, distance: '2.1 km', provider: 'CleanPro Cebu', tag: 'Eco-friendly' },
  { id: '9', title: 'Sony Alpha A7 IV Camera & Lens', categoryId: 'gadgets', category: 'Gadgets & Tech', price: 950, unit: 'per day', rating: 4.9, reviews: 40, distance: '2.8 km', provider: 'PixelRent Cebu', tag: '4K Ready' },
  { id: '10', title: 'Packed Meals & Filipino Buffet Catering', categoryId: 'services', category: 'Services', price: 250, unit: 'per head', rating: 4.9, reviews: 83, distance: '0.9 km', provider: 'Lutong Sugbo Catering', tag: 'Halal/Standard' },
  { id: '11', title: 'Electric Generator (3500W Inverter)', categoryId: 'rental_items', category: 'Rental Items', price: 1200, unit: 'per day', rating: 4.8, reviews: 19, distance: '3.4 km', provider: 'PowerRent Cebu', tag: 'Heavy Duty' },
  { id: '12', title: '1-Bedroom Condo in Lahug', categoryId: 'rental_props', category: 'Rental Properties', price: 8500, unit: 'per month', rating: 4.6, reviews: 15, distance: '0.9 km', provider: 'Cebu Living Homes', tag: 'Furnished' },
]

function getCategoryIcon(catId) {
  switch (catId) {
    case 'cleaning': return <Sparkles size={24} className="text-brand-600" />
    case 'rental_props': return <Home size={24} className="text-brand-600" />
    case 'gadgets': return <Laptop size={24} className="text-brand-600" />
    case 'tutoring': return <GraduationCap size={24} className="text-brand-600" />
    case 'repairs': return <Hammer size={24} className="text-brand-600" />
    case 'events': return <PartyPopper size={24} className="text-brand-600" />
    case 'vehicles': return <Car size={24} className="text-brand-600" />
    case 'rental_items': return <Package size={24} className="text-brand-600" />
    case 'services': return <Utensils size={24} className="text-brand-600" />
    default: return <Wrench size={24} className="text-brand-600" />
  }
}

function ListingCard({ listing, onClick }) {
  const [fav, setFav] = useState(false)

  return (
    <motion.div whileHover={{ y: -4 }} className="card-hover overflow-hidden p-0 border border-gray-100"
      onClick={onClick}>
      {/* Visual Header */}
      <div className="h-32 bg-brand-50 border-b border-gray-100 relative flex items-center justify-center">
        <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center">
          {getCategoryIcon(listing.categoryId)}
        </div>

        <button onClick={e => { e.stopPropagation(); setFav(v => !v); toast(fav ? 'Removed from favorites' : 'Added to favorites!') }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-sm transition-colors"
          title="Favorite">
          <span className={fav ? 'text-red-500 font-bold' : 'text-gray-400'}>♥</span>
        </button>

        <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5">
          <span className="badge-brand text-[11px]">{listing.category}</span>
          {listing.tag && (
            <span className="bg-white/90 text-gray-600 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-gray-200">
              {listing.tag}
            </span>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1 line-clamp-1">{listing.title}</h3>
        <p className="text-xs text-gray-500 mb-3">{listing.provider}</p>

        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
          <div>
            <span className="font-bold text-brand-700">{formatPHP(listing.price)}</span>
            <span className="text-[11px] text-gray-400 ml-1">{listing.unit}</span>
          </div>
          <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            <span className="text-xs font-semibold text-amber-700">{listing.rating}</span>
            <span className="text-[10px] text-gray-400">({listing.reviews})</span>
          </div>
        </div>

        <div className="flex items-center gap-1 mt-2.5 text-gray-400">
          <MapPin size={12} className="text-brand-600" />
          <span className="text-xs">{listing.distance} away · Cebu</span>
        </div>
      </div>
    </motion.div>
  )
}

export default function CustomerDashboard() {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')

  // Reactive filtering
  const filteredListings = MOCK_LISTINGS.filter(l => {
    // Search match
    const q = search.trim().toLowerCase()
    const matchesSearch = !q ||
      l.title.toLowerCase().includes(q) ||
      l.category.toLowerCase().includes(q) ||
      l.provider.toLowerCase().includes(q)

    // Category match
    const matchesCategory = activeCategory === 'all' || l.categoryId === activeCategory

    return matchesSearch && matchesCategory
  })

  const isFiltering = activeCategory !== 'all' || search.trim() !== ''
  const activeCatObj = CATEGORIES.find(c => c.id === activeCategory)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Discover</h1>
        <div className="flex items-center gap-2 mt-1">
          <MapPin size={14} className="text-brand-600" />
          <span className="text-sm font-medium text-gray-700">Cebu City, Philippines</span>
          <span className="text-xs bg-brand-50 text-brand-700 font-semibold px-2 py-0.5 rounded-full">Active Area</span>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search services, rentals, tutors, equipment in Cebu..."
          className="input pl-11 pr-10 py-3.5 text-base shadow-sm"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600"
            title="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Categories chips */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Browse Categories</span>
          {isFiltering && (
            <button
              onClick={() => { setActiveCategory('all'); setSearch('') }}
              className="text-xs text-brand-600 font-semibold hover:underline flex items-center gap-1"
            >
              Reset filters
            </button>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map(cat => {
            const count = cat.id === 'all'
              ? MOCK_LISTINGS.length
              : MOCK_LISTINGS.filter(l => l.categoryId === cat.id).length

            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border flex items-center gap-1.5 ${
                  activeCategory === cat.id
                    ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeCategory === cat.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* If actively filtering: show filtered list */}
      {isFiltering ? (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="section-title">
                {search ? `Search results for "${search}"` : activeCatObj?.label}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">Found {filteredListings.length} matching listings in Cebu</p>
            </div>
            <button
              onClick={() => { setActiveCategory('all'); setSearch('') }}
              className="text-xs text-brand-600 hover:underline"
            >
              Clear filter
            </button>
          </div>

          {filteredListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredListings.map(l => (
                <ListingCard key={l.id} listing={l} onClick={() => navigate(`/customer/listings/${l.id}`)} />
              ))}
            </div>
          ) : (
            <div className="card text-center py-14 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
                <Search size={22} />
              </div>
              <h3 className="font-semibold text-gray-900 text-base">No listings found</h3>
              <p className="text-sm text-gray-500 max-w-sm">
                We couldn't find any services or rentals matching your current filter.
              </p>
              <button
                onClick={() => { setActiveCategory('all'); setSearch('') }}
                className="btn-secondary btn-sm mt-2"
              >
                Show All Listings
              </button>
            </div>
          )}
        </section>
      ) : (
        /* Default view when no filter: Nearby + Recommended */
        <>
          {/* Nearby Listings */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">📍 Nearby in Cebu</h2>
              <button
                onClick={() => navigate('/customer/listings')}
                className="text-sm text-brand-600 hover:underline flex items-center gap-1 font-medium"
              >
                See all <ChevronRight size={14} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {MOCK_LISTINGS.slice(0, 6).map(l => (
                <ListingCard key={l.id} listing={l} onClick={() => navigate(`/customer/listings/${l.id}`)} />
              ))}
            </div>
          </section>

          {/* Recommended */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">⭐ Recommended for You</h2>
              <button
                onClick={() => navigate('/customer/listings')}
                className="text-sm text-brand-600 hover:underline flex items-center gap-1 font-medium"
              >
                See all <ChevronRight size={14} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {MOCK_LISTINGS.slice(6, 12).map(l => (
                <ListingCard key={l.id} listing={l} onClick={() => navigate(`/customer/listings/${l.id}`)} />
              ))}
            </div>
          </section>
        </>
      )}
    </motion.div>
  )
}
