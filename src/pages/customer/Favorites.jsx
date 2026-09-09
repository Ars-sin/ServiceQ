import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Star, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatPHP } from '@/lib/utils'
import EmptyState from '@/components/ui/EmptyState'

const INITIAL = [
  { id: '1', title: 'Professional Home Cleaning',   category: 'Cleaning Services',  price: 500,  unit: 'per session', rating: 4.8, distance: '0.8 km', color: 'from-purple-400 to-pink-400' },
  { id: '3', title: 'Laptop Rental (MacBook Pro)',  category: 'Gadgets & Tech',     price: 800,  unit: 'per day',     rating: 4.9, distance: '2.0 km', color: 'from-green-400 to-teal-400' },
  { id: '4', title: 'Math & Science Tutoring',      category: 'Tutoring & Lessons', price: 300,  unit: 'per hour',    rating: 5.0, distance: '0.5 km', color: 'from-yellow-400 to-orange-400' },
  { id: '8', title: 'Catering Services (Per Head)', category: 'Services',           price: 250,  unit: 'per head',    rating: 4.9, distance: '0.9 km', color: 'from-orange-400 to-yellow-400' },
  { id: '9', title: 'DSLR Camera Rental',           category: 'Gadgets & Tech',     price: 600,  unit: 'per day',     rating: 4.7, distance: '1.4 km', color: 'from-violet-400 to-purple-400' },
  { id: '12',title: 'Graphic Design Services',      category: 'Services',           price: 1500, unit: 'per project', rating: 5.0, distance: '0.3 km', color: 'from-pink-400 to-rose-400' },
]

export default function CustomerFavorites() {
  const [favorites, setFavorites] = useState(INITIAL)

  const remove = id => {
    setFavorites(prev => prev.filter(f => f.id !== id))
    toast('Removed from favorites')
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Favorites</h1>
        <span className="text-sm text-gray-500">{favorites.length} saved</span>
      </div>

      {favorites.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No favorites yet"
          description="Browse listings and tap the heart icon to save your favorites here."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map(l => (
            <motion.div key={l.id} layout exit={{ opacity: 0, scale: 0.9 }}
              className="card-hover overflow-hidden p-0">
              <div className={`h-40 bg-gradient-to-br ${l.color} relative`}>
                <button onClick={() => remove(l.id)}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white shadow flex items-center justify-center hover:scale-110 transition-transform">
                  <Heart size={18} className="fill-red-500 text-red-500" />
                </button>
              </div>
              <div className="p-4">
                <span className="badge-neutral mb-2">{l.category}</span>
                <h3 className="font-semibold text-gray-900 text-sm mb-3">{l.title}</h3>
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
      )}
    </motion.div>
  )
}
