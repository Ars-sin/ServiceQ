import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Star, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatPHP } from '@/lib/utils'
import EmptyState from '@/components/ui/EmptyState'
import { ALL_LISTINGS, getListingIcon } from '@/pages/customer/Explore'
import { getFavoriteIds, toggleFavorite } from '@/lib/favorites'

export default function CustomerFavorites() {
  const navigate = useNavigate()
  const [favoriteIds, setFavoriteIds] = useState(getFavoriteIds)

  useEffect(() => {
    const handler = () => setFavoriteIds(getFavoriteIds())
    window.addEventListener('serviceq_favorites_updated', handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener('serviceq_favorites_updated', handler)
      window.removeEventListener('storage', handler)
    }
  }, [])

  // Resolve matching listings from ALL_LISTINGS
  const favorites = useMemo(() => {
    return favoriteIds
      .map(id => ALL_LISTINGS.find(l => String(l.id) === String(id)))
      .filter(Boolean)
  }, [favoriteIds])

  const remove = (id) => {
    toggleFavorite(id)
    setFavoriteIds(getFavoriteIds())
    toast('Removed from favorites')
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6 max-w-6xl mx-auto w-full pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Favorites</h1>
          <p className="text-xs text-gray-500 mt-0.5">Services and rentals you have saved for later</p>
        </div>
        <span className="text-xs bg-brand-50 text-brand-700 font-bold px-3 py-1 rounded-full border border-brand-200">
          {favorites.length} saved
        </span>
      </div>

      {favorites.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No favorites yet"
          description="Browse listings and tap the heart icon on any card to save your favorites here."
          action={
            <button
              onClick={() => navigate('/customer/explore')}
              className="btn-primary text-xs mt-2"
            >
              Explore Listings
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {favorites.map(l => (
              <motion.div
                key={l.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.18 }}
                className="card-hover overflow-hidden p-0 border border-gray-100 flex flex-col justify-between bg-white rounded-2xl shadow-sm hover:shadow-md cursor-pointer"
                onClick={() => navigate(`/customer/listings/${l.id}`)}
              >
                {/* Visual Header */}
                <div className="h-32 bg-brand-50/70 border-b border-gray-100 relative flex items-center justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center p-2.5">
                    {getListingIcon(l.subCategory)}
                  </div>

                  <button
                    onClick={e => {
                      e.stopPropagation()
                      remove(l.id)
                    }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center hover:scale-110 transition-transform"
                    title="Remove from favorites"
                  >
                    <Heart size={16} className="fill-red-500 text-red-500" />
                  </button>

                  <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5 flex-wrap">
                    <span className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] ${
                      l.type === 'services'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {l.type === 'services' ? 'Service' : 'Rental'}
                    </span>
                    {l.subCategory && (
                      <span className="bg-white/90 text-gray-700 text-[10px] font-medium px-2 py-0.5 rounded-full border border-gray-200">
                        {l.subCategory}
                      </span>
                    )}
                    {l.tag && (
                      <span className="bg-white/90 text-gray-700 text-[10px] font-medium px-2 py-0.5 rounded-full border border-gray-200">
                        {l.tag}
                      </span>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm leading-snug mb-1 line-clamp-1">
                      {l.title}
                    </h3>
                    <p className="text-xs text-gray-500 mb-3 flex items-center justify-between">
                      <span>{l.provider}</span>
                      <span className="text-gray-400 flex items-center gap-0.5 text-[11px]">
                        <MapPin size={11} className="text-gray-400" /> {l.distance} km away
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-2">
                    <div>
                      <span className="font-extrabold text-brand-700 text-base">{formatPHP(l.price)}</span>
                      <span className="text-[11px] text-gray-400 ml-1">{l.unit}</span>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-semibold text-gray-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      <span>{l.rating}</span>
                      <span className="text-gray-400 text-[10px]">({l.reviews})</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}
