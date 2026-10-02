import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, MapPin, CheckCircle, Heart, MessageCircle, ChevronLeft, Clock, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatPHP, calcFees } from '@/lib/utils'
import { ALL_LISTINGS } from '@/pages/customer/Explore'
import { isFavorite, toggleFavorite } from '@/lib/favorites'
import { fetchBackendListings } from '@/lib/listingsService'

const DEFAULT_MOCK = {
  id: '1',
  title: 'Professional Home Cleaning Service',
  category: 'Services · Cleaning',
  description: 'We provide thorough, eco-friendly cleaning services across Metro Cebu. Our trained team handles everything from deep cleaning to regular maintenance. We bring our own materials and equipment. Satisfaction guaranteed or your next session is free.',
  price: 500,
  unit: 'per session',
  rating: 4.8,
  reviews: 42,
  bookings: 134,
  provider: { name: 'Maria Santos', avatar: 'MS', rating: 4.9, verified: true, joined: 'March 2024' },
  photos: ['from-blue-500 to-indigo-600', 'from-indigo-500 to-purple-600', 'from-sky-400 to-blue-500', 'from-cyan-500 to-blue-600'],
  reviews_list: [
    { user: 'Ana R.',   rating: 5, comment: 'Very thorough and professional. Arrived right on time. Will book again!', date: '2 days ago' },
    { user: 'Marco L.', rating: 4, comment: 'Good service, carefully cleaned every corner. Highly recommended.', date: '1 week ago' },
    { user: 'Grace T.', rating: 5, comment: 'Excellent! Everything is in spotless condition.', date: '2 weeks ago' },
  ],
}

export default function ListingDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [selectedPhoto, setSelectedPhoto] = useState(0)
  const [fav, setFav] = useState(() => isFavorite(id))
  const tomorrow = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d
  }, [])
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  const dayAfterTomorrow = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 2)
    return d
  }, [])
  const dayAfterTomorrowStr = dayAfterTomorrow.toISOString().split('T')[0]

  const [dateMode, setDateMode] = useState('single') // 'single' | 'multiple'
  const [startDate, setStartDate] = useState(tomorrowStr)
  const [endDate, setEndDate] = useState(dayAfterTomorrowStr)
  const [sessions, setSessions] = useState(1)

  const minEndDateStr = useMemo(() => {
    if (!startDate) return tomorrowStr
    const d = new Date(startDate)
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  }, [startDate, tomorrowStr])

  const handleStartDateChange = (newStart) => {
    if (newStart < tomorrowStr) {
      toast.error('Bookings must be scheduled at least 1 day in advance (starting from tomorrow).')
      setStartDate(tomorrowStr)
      return
    }
    setStartDate(newStart)
    const nextDay = new Date(newStart)
    nextDay.setDate(nextDay.getDate() + 1)
    const nextDayStr = nextDay.toISOString().split('T')[0]
    if (endDate <= newStart) {
      setEndDate(nextDayStr)
      if (dateMode === 'multiple') setSessions(2)
    } else if (dateMode === 'multiple') {
      const diffDays = Math.max(2, Math.round((new Date(endDate) - new Date(newStart)) / 86400000) + 1)
      setSessions(diffDays)
    }
  }

  const handleEndDateChange = (newEnd) => {
    if (newEnd <= startDate) {
      toast.error('Multiple dates selection requires the end date to be at least the next day.')
      setEndDate(minEndDateStr)
      setSessions(2)
      return
    }
    setEndDate(newEnd)
    const diffDays = Math.max(2, Math.round((new Date(newEnd) - new Date(startDate)) / 86400000) + 1)
    setSessions(diffDays)
  }

  // Sync favorites state
  useEffect(() => {
    setFav(isFavorite(id))
    const handler = () => setFav(isFavorite(id))
    window.addEventListener('serviceq_favorites_updated', handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener('serviceq_favorites_updated', handler)
      window.removeEventListener('storage', handler)
    }
  }, [id])

  const [backendListing, setBackendListing] = useState(null)

  useEffect(() => {
    let isMounted = true
    fetchBackendListings().then(items => {
      if (isMounted && Array.isArray(items)) {
        const found = items.find(l => String(l.id) === String(id))
        if (found) setBackendListing(found)
      }
    }).catch(() => {})
    return () => { isMounted = false }
  }, [id])

  // Dynamically resolve listing from custom listings + ALL_LISTINGS by id
  const listing = useMemo(() => {
    let all = ALL_LISTINGS
    try {
      const custom = JSON.parse(localStorage.getItem('serviceq_custom_listings')) || []
      if (Array.isArray(custom) && custom.length > 0) {
        const customIds = new Set(custom.map(c => String(c.id)))
        all = [...custom, ...ALL_LISTINGS.filter(l => !customIds.has(String(l.id)))]
      }
    } catch {}

    const matched = (backendListing && String(backendListing.id) === String(id))
      ? backendListing
      : all.find(l => String(l.id) === String(id))
    if (!matched) return DEFAULT_MOCK

    const initials = (matched.provider || 'SP')
      .split(' ')
      .map(w => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()

    const colorGradients = matched.type === 'rentals'
      ? ['from-emerald-500 to-teal-600', 'from-teal-500 to-cyan-600', 'from-emerald-400 to-teal-500', 'from-cyan-500 to-emerald-600']
      : ['from-blue-500 to-indigo-600', 'from-indigo-500 to-purple-600', 'from-sky-400 to-blue-500', 'from-cyan-500 to-blue-600']

    return {
      ...DEFAULT_MOCK,
      id: matched.id,
      title: matched.title,
      category: `${matched.category}${matched.subCategory ? ` · ${matched.subCategory}` : ''}`,
      description: matched.description || `${matched.title} provided by ${matched.provider}. Available for immediate booking with verified quality guarantee and secure digital payment via ServiceQ. Located ${matched.distance || '1.0'} km away in Metro Cebu.`,
      price: matched.price,
      unit: matched.unit || 'per session',
      rating: matched.rating || 5.0,
      reviews: matched.reviews || 0,
      bookings: Math.round((matched.reviews || 10) * 2.8) || 45,
      provider: {
        name: (matched.provider && matched.provider !== 'Verified Provider') ? matched.provider : 'Service Provider',
        avatar: initials,
        rating: matched.rating || 5.0,
        verified: !!(matched.isVerified || matched.provider_verified || matched.providerVerified),
        joined: 'January 2024',
      },
      providerId: matched.providerId || null,
      photos: colorGradients,
    }
  }, [id])

  const subtotal = listing.price * sessions
  const { fee, total } = calcFees(subtotal)

  const handleBookNow = () => {
    if (!startDate) return toast.error('Please select a preferred date first')
    if (startDate < tomorrowStr) {
      return toast.error('Bookings must be scheduled at least 1 day in advance (starting from tomorrow).')
    }
    if (dateMode === 'multiple' && endDate <= startDate) {
      return toast.error('Multiple dates selection requires the end date to be at least the next day.')
    }

    const orderPayload = {
      id: listing.id,
      title: listing.title,
      category: listing.category,
      provider: listing.provider.name,
      providerId: listing.providerId || null,
      price: listing.price,
      unit: listing.unit,
      date: dateMode === 'multiple' ? `${startDate} to ${endDate}` : startDate,
      startDate,
      endDate: dateMode === 'multiple' ? endDate : null,
      dateMode,
      sessions,
      subtotal,
      fee,
      total,
    }

    // Persist to session storage for resilience
    try {
      sessionStorage.setItem('serviceq_current_order', JSON.stringify(orderPayload))
    } catch {}

    navigate(`/customer/checkout/${listing.id}`, { state: orderPayload })
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <button onClick={() => navigate('/customer/explore')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand-600 w-fit">
        <ChevronLeft size={16} /> Back to Explore
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Gallery */}
          <div>
            <div className={`h-72 rounded-2xl bg-gradient-to-br ${listing.photos[selectedPhoto]} mb-3 shadow-inner flex items-center justify-center text-white/40 text-4xl font-black`}>
              ServiceQ Verified
            </div>
            <div className="flex gap-2">
              {listing.photos.map((p, i) => (
                <button key={i} onClick={() => setSelectedPhoto(i)}
                  className={`w-16 h-16 rounded-xl bg-gradient-to-br ${p} transition-all ${selectedPhoto === i ? 'ring-2 ring-brand-500 ring-offset-2 scale-105' : 'opacity-60 hover:opacity-90'}`} />
              ))}
            </div>
          </div>

          {/* Title & info */}
          <div>
            <span className="badge-brand mb-2">{listing.category}</span>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{listing.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1"><Star size={14} className="fill-amber-400 text-amber-400" />{listing.rating} ({listing.reviews} reviews)</span>
              <span className="flex items-center gap-1"><CheckCircle size={14} className="text-green-500" />{listing.bookings} bookings</span>
            </div>
          </div>

          {/* Description */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-2">About this {listing.category.includes('Rental') ? 'Rental' : 'Service'}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{listing.description}</p>
          </div>

          {/* Provider */}
          <div className="card flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-lg">
              {listing.provider.avatar}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{listing.provider.name}</span>
                {listing.provider.verified && (
                  <span className="badge-success text-xs"><CheckCircle size={10} /> KYC Verified</span>
                )}
              </div>
              <div className="text-sm text-gray-500 flex items-center gap-3 mt-0.5">
                <span className="flex items-center gap-1"><Star size={12} className="fill-amber-400 text-amber-400" />{listing.provider.rating}</span>
                <span>Member since {listing.provider.joined}</span>
              </div>
            </div>
            <button onClick={() => toast.success('Connecting to provider messaging...')}
              className="btn-secondary btn-sm">
              <MessageCircle size={14} /> Contact
            </button>
          </div>

          {/* Reviews */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Customer Reviews</h2>
            <div className="flex flex-col gap-4">
              {listing.reviews_list.map((r, i) => (
                <div key={i} className={`${i < listing.reviews_list.length - 1 ? 'pb-4 border-b border-gray-100' : ''}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-gray-900">{r.user}</span>
                    <span className="text-xs text-gray-400">{r.date}</span>
                  </div>
                  <div className="flex gap-0.5 mb-1">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} size={12} className={j < r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-200'} />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">{r.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — Booking card */}
        <div className="lg:col-span-1">
          <div className="card sticky top-24 flex flex-col gap-5 border border-gray-200/80 shadow-sm">
            <div>
              <span className="text-2xl font-bold text-brand-600">{formatPHP(listing.price)}</span>
              <span className="text-sm text-gray-400 ml-1">{listing.unit}</span>
            </div>

            {/* Date Selection Mode (Single Day or Multiple Dates) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="label !mb-0 flex items-center gap-1.5 font-semibold text-gray-800">
                  <Calendar size={14} className="text-brand-600" />
                  Select Preferred Date
                </label>
                <div className="flex gap-1 bg-gray-100 p-0.5 rounded-lg text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setDateMode('single')
                      setSessions(1)
                    }}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      dateMode === 'single' ? 'bg-white text-brand-700 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Single Date
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDateMode('multiple')
                      const diffDays = Math.max(2, Math.round((new Date(endDate) - new Date(startDate)) / 86400000) + 1)
                      setSessions(diffDays)
                    }}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      dateMode === 'multiple' ? 'bg-white text-brand-700 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Multiple Dates
                  </button>
                </div>
              </div>

              {dateMode === 'single' ? (
                <div>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => handleStartDateChange(e.target.value)}
                    min={tomorrowStr}
                    className="input"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    • Earliest booking date is tomorrow ({tomorrowStr})
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 bg-gray-50 border border-gray-200/70 rounded-xl p-3">
                  <div>
                    <span className="text-[11px] font-semibold text-gray-600 block mb-1">
                      Start Date (Earliest: Tomorrow)
                    </span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => handleStartDateChange(e.target.value)}
                      min={tomorrowStr}
                      className="input bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-gray-600 block mb-1">
                      End Date (Must be the next day or later)
                    </span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => handleEndDateChange(e.target.value)}
                      min={minEndDateStr}
                      className="input bg-white"
                    />
                  </div>
                  <div className="bg-brand-50/70 border border-brand-100 rounded-lg p-2 text-xs text-brand-800 flex items-center justify-between">
                    <span>Duration:</span>
                    <span className="font-bold">{sessions} consecutive days</span>
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="label flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Clock size={14} />Quantity / Units / Sessions</span>
                {dateMode === 'multiple' && (
                  <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                    Auto-set by dates
                  </span>
                )}
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={dateMode === 'multiple'}
                  onClick={() => setSessions(s => Math.max(1, s - 1))}
                  className="w-9 h-9 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg"
                >
                  −
                </button>
                <span className="font-bold text-lg w-8 text-center">{sessions}</span>
                <button
                  type="button"
                  disabled={dateMode === 'multiple'}
                  onClick={() => setSessions(s => s + 1)}
                  className="w-9 h-9 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg"
                >
                  +
                </button>
              </div>
            </div>

            {/* Order summary */}
            <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-2 text-sm border border-gray-100">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatPHP(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Platform Fee (10%)</span><span>{formatPHP(fee)}</span></div>
              <div className="divider my-1" />
              <div className="flex justify-between font-bold text-base"><span>Total</span><span className="text-brand-600">{formatPHP(total)}</span></div>
            </div>

            <button
              onClick={handleBookNow}
              className="btn-primary btn-lg w-full font-bold shadow-sm">
              Book Now
            </button>

            <button
              onClick={() => {
                const isAdded = toggleFavorite(listing.id)
                setFav(isAdded)
                toast(isAdded ? 'Saved to favorites!' : 'Removed from favorites')
              }}
              className={`btn-secondary w-full gap-2 ${fav ? 'text-red-500 border-red-200 bg-red-50' : ''}`}
            >
              <Heart size={16} className={fav ? 'fill-red-500' : ''} />
              {fav ? 'Saved to Favorites' : 'Add to Favorites'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
