import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Search, Star, Clock, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { CATEGORIES } from '@/lib/constants'
import { formatPHP, truncate } from '@/lib/utils'

const MOCK_LISTINGS = [
  { id: '1', title: 'Professional Home Cleaning', category: 'Cleaning Services', price: 500, unit: 'per session', rating: 4.8, reviews: 42, distance: '0.8 km', provider: 'Maria Santos', color: 'from-purple-400 to-pink-400' },
  { id: '2', title: 'Room for Rent – Quezon City', category: 'Rental Properties', price: 4500, unit: 'per month', rating: 4.5, reviews: 18, distance: '1.2 km', provider: 'Renzo Realty', color: 'from-blue-400 to-cyan-400' },
  { id: '3', title: 'Laptop Rental (MacBook Pro)', category: 'Gadgets & Tech', price: 800, unit: 'per day', rating: 4.9, reviews: 31, distance: '2.0 km', provider: 'TechRent PH', color: 'from-green-400 to-teal-400' },
  { id: '4', title: 'Math & Science Tutoring', category: 'Tutoring & Lessons', price: 300, unit: 'per hour', rating: 5.0, reviews: 57, distance: '0.5 km', provider: 'Engr. Cruz', color: 'from-yellow-400 to-orange-400' },
  { id: '5', title: 'AC & Appliance Repair', category: 'Repairs & Maintenance', price: 350, unit: 'per visit', rating: 4.7, reviews: 29, distance: '3.1 km', provider: 'Fix-It Crew', color: 'from-red-400 to-rose-400' },
  { id: '6', title: 'Sound System & Lights Rental', category: 'Events & Equipment', price: 3500, unit: 'per day', rating: 4.6, reviews: 14, distance: '1.8 km', provider: 'Events Pro', color: 'from-indigo-400 to-violet-400' },
]

function ListingCard({ listing, onClick }) {
  const [fav, setFav] = useState(false)
  return (
    <motion.div whileHover={{ y: -4 }} className="card-hover overflow-hidden p-0"
      onClick={onClick}>
      <div className={`h-36 bg-gradient-to-br ${listing.color} relative`}>
        <button onClick={e => { e.stopPropagation(); setFav(v => !v); toast(fav ? 'Removed from favorites' : 'Added to favorites!') }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
          <span className={fav ? 'text-red-500' : 'text-gray-400'}>♥</span>
        </button>
        <div className="absolute bottom-3 left-3">
          <span className="badge-neutral text-xs">{listing.category}</span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">{listing.title}</h3>
        <p className="text-xs text-gray-500 mb-2">{listing.provider}</p>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-bold text-brand-600">{formatPHP(listing.price)}</span>
            <span className="text-xs text-gray-400 ml-1">{listing.unit}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            <span className="text-xs font-medium">{listing.rating}</span>
            <span className="text-xs text-gray-400">({listing.reviews})</span>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-2">
          <MapPin size={11} className="text-gray-400" />
          <span className="text-xs text-gray-400">{listing.distance}</span>
        </div>
      </div>
    </motion.div>
  )
}

export default function CustomerDashboard() {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Discover</h1>
        <div className="flex items-center gap-2 mt-1">
          <MapPin size={14} className="text-brand-600" />
          <span className="text-sm text-gray-500">Metro Manila</span>
          <button className="text-xs text-brand-600 hover:underline">Change</button>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search services, rentals, equipment..."
          className="input pl-11 py-3.5 text-base shadow-sm" />
      </div>

      {/* Categories */}
      <div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border ${
                activeCategory === cat.id
                  ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
              }`}>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Nearby Listings */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">📍 Nearby Listings</h2>
          <button onClick={() => navigate('/customer/listings')}
            className="text-sm text-brand-600 hover:underline flex items-center gap-1">
            See all <ChevronRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_LISTINGS.slice(0, 3).map(l => (
            <ListingCard key={l.id} listing={l} onClick={() => navigate(`/customer/listings/${l.id}`)} />
          ))}
        </div>
      </section>

      {/* Recommended */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">⭐ Recommended for You</h2>
          <button onClick={() => navigate('/customer/listings')}
            className="text-sm text-brand-600 hover:underline flex items-center gap-1">
            See all <ChevronRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_LISTINGS.slice(3, 6).map(l => (
            <ListingCard key={l.id} listing={l} onClick={() => navigate(`/customer/listings/${l.id}`)} />
          ))}
        </div>
      </section>
    </motion.div>
  )
}
