import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, MapPin, CheckCircle, Heart, MessageCircle, ChevronLeft, Clock, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatPHP, calcFees } from '@/lib/utils'

const MOCK = {
  id: '1',
  title: 'Professional Home Cleaning Service',
  category: 'Cleaning Services',
  description: 'We provide thorough, eco-friendly home cleaning services across Metro Manila. Our trained team handles everything from deep cleaning to regular maintenance. We bring our own materials and equipment. Satisfaction guaranteed or your next session is free.',
  price: 500, unit: 'per session',
  rating: 4.8, reviews: 42,
  bookings: 134,
  color: 'from-purple-400 to-pink-400',
  provider: { name: 'Maria Santos', avatar: 'MS', rating: 4.9, verified: true, joined: 'March 2024' },
  photos: ['from-purple-400 to-pink-400', 'from-pink-400 to-rose-400', 'from-violet-400 to-purple-400', 'from-fuchsia-400 to-pink-400'],
  reviews_list: [
    { user: 'Ana R.',   rating: 5, comment: 'Very thorough and professional. Will book again!', date: '2 days ago' },
    { user: 'Marco L.', rating: 4, comment: 'Good service, arrived on time. Highly recommended.', date: '1 week ago' },
    { user: 'Grace T.', rating: 5, comment: 'Excellent! My house has never been this clean.', date: '2 weeks ago' },
  ],
}

export default function ListingDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [selectedPhoto, setSelectedPhoto] = useState(0)
  const [fav, setFav] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [sessions, setSessions] = useState(1)

  const subtotal = MOCK.price * sessions
  const { fee, total } = calcFees(subtotal)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand-600 w-fit">
        <ChevronLeft size={16} /> Back to Listings
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Gallery */}
          <div>
            <div className={`h-72 rounded-2xl bg-gradient-to-br ${MOCK.photos[selectedPhoto]} mb-3`} />
            <div className="flex gap-2">
              {MOCK.photos.map((p, i) => (
                <button key={i} onClick={() => setSelectedPhoto(i)}
                  className={`w-16 h-16 rounded-xl bg-gradient-to-br ${p} transition-all ${selectedPhoto === i ? 'ring-2 ring-brand-500 ring-offset-2' : 'opacity-60 hover:opacity-90'}`} />
              ))}
            </div>
          </div>

          {/* Title & info */}
          <div>
            <span className="badge-brand mb-2">{MOCK.category}</span>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{MOCK.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1"><Star size={14} className="fill-amber-400 text-amber-400" />{MOCK.rating} ({MOCK.reviews} reviews)</span>
              <span className="flex items-center gap-1"><CheckCircle size={14} className="text-green-500" />{MOCK.bookings} bookings</span>
            </div>
          </div>

          {/* Description */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-2">About this Service</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{MOCK.description}</p>
          </div>

          {/* Provider */}
          <div className="card flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-lg">
              {MOCK.provider.avatar}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{MOCK.provider.name}</span>
                {MOCK.provider.verified && (
                  <span className="badge-success text-xs"><CheckCircle size={10} /> KYC Verified</span>
                )}
              </div>
              <div className="text-sm text-gray-500 flex items-center gap-3 mt-0.5">
                <span className="flex items-center gap-1"><Star size={12} className="fill-amber-400 text-amber-400" />{MOCK.provider.rating}</span>
                <span>Member since {MOCK.provider.joined}</span>
              </div>
            </div>
            <button onClick={() => toast('Redirecting to Messenger...')}
              className="btn-secondary btn-sm">
              <MessageCircle size={14} /> Contact
            </button>
          </div>

          {/* Reviews */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Customer Reviews</h2>
            <div className="flex flex-col gap-4">
              {MOCK.reviews_list.map((r, i) => (
                <div key={i} className={`${i < MOCK.reviews_list.length - 1 ? 'pb-4 border-b border-gray-100' : ''}`}>
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
          <div className="card sticky top-24 flex flex-col gap-5">
            <div>
              <span className="text-2xl font-bold text-brand-600">{formatPHP(MOCK.price)}</span>
              <span className="text-sm text-gray-400 ml-1">{MOCK.unit}</span>
            </div>

            <div className="form-group">
              <label className="label flex items-center gap-2"><Calendar size={14} />Select Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]} className="input" />
            </div>

            <div className="form-group">
              <label className="label flex items-center gap-2"><Clock size={14} />Number of Sessions</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setSessions(s => Math.max(1, s - 1))}
                  className="w-9 h-9 rounded-lg border border-gray-200 hover:bg-gray-100 font-bold text-lg">−</button>
                <span className="font-bold text-lg w-8 text-center">{sessions}</span>
                <button onClick={() => setSessions(s => s + 1)}
                  className="w-9 h-9 rounded-lg border border-gray-200 hover:bg-gray-100 font-bold text-lg">+</button>
              </div>
            </div>

            {/* Order summary */}
            <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatPHP(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Platform Fee (10%)</span><span>{formatPHP(fee)}</span></div>
              <div className="divider my-1" />
              <div className="flex justify-between font-bold text-base"><span>Total</span><span className="text-brand-600">{formatPHP(total)}</span></div>
            </div>

            <button
              onClick={() => { if (!startDate) return toast.error('Select a date first'); navigate(`/customer/checkout/${MOCK.id}`) }}
              className="btn-primary btn-lg w-full">
              Book Now
            </button>

            <button onClick={() => { setFav(v => !v); toast(fav ? 'Removed from favorites' : 'Added to favorites!') }}
              className={`btn-secondary w-full gap-2 ${fav ? 'text-red-500 border-red-200 bg-red-50' : ''}`}>
              <Heart size={16} className={fav ? 'fill-red-500' : ''} />
              {fav ? 'Saved to Favorites' : 'Add to Favorites'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
