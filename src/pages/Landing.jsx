import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { MapPin, Star, Shield, Zap, Clock, MessageCircle, ChevronRight } from 'lucide-react'

const FEATURES = [
  { icon: Zap,            title: 'Book in Minutes',        desc: 'Find and book services or rentals instantly without back-and-forth.' },
  { icon: Shield,         title: 'Verified Providers',     desc: 'All providers go through KYC identity verification before going live.' },
  { icon: Star,           title: 'Reviews & Ratings',      desc: 'Make confident choices with honest reviews from real customers.' },
  { icon: Clock,          title: 'Real-time Availability', desc: 'Live calendar availability so you always book confirmed time slots.' },
  { icon: MapPin,         title: 'Location-Based',         desc: 'Discover services and rentals near you using your city or GPS.' },
  { icon: MessageCircle,  title: 'Direct Chat',            desc: 'Message providers directly through the platform before and after booking.' },
]

const STEPS = [
  { n: '1', title: 'Search Near You',        desc: 'Browse services and rentals in your area by category or keyword.' },
  { n: '2', title: 'Book with Confidence',   desc: 'Check reviews, availability, pricing, and provider details — then book.' },
  { n: '3', title: 'Pay Securely & Enjoy',   desc: 'Pay via GCash, Maya, or bank transfer and get a digital receipt.' },
]

function AnimFade({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="page-container flex items-center justify-between py-4">
          <div className="flex items-center gap-2"><img src="/logo.png" alt="ServiceQ" className="h-10 w-10 object-contain" /><span className="font-bold text-xl text-gray-900">ServiceQ</span></div>
          <div className="flex items-center gap-3">
            <Link to="/login"    className="btn-ghost text-sm">Sign In</Link>
            <Link to="/register" className="btn-primary text-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-accent-50 pt-20 pb-28">
        {/* Background blobs */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-200 rounded-full opacity-20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-accent-200 rounded-full opacity-20 blur-3xl" />

        <div className="page-container relative">
          <div className="max-w-2xl mx-auto text-center">
            <AnimFade>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100 text-brand-700 text-sm font-medium mb-6">
                <MapPin size={14} /> Now available in Cebu
              </div>
            </AnimFade>

            <AnimFade delay={0.1}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 leading-tight mb-6 text-balance">
                Find Services &{' '}
                <span className="text-brand-700">Rentals Near You</span>
              </h1>
            </AnimFade>

            <AnimFade delay={0.2}>
              <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-xl mx-auto">
                ServiceQ is your one-stop marketplace for booking trusted local services and rentals across the Philippines — from home cleaning to gadgets, tutors to event equipment.
              </p>
            </AnimFade>

            <AnimFade delay={0.3}>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/login" className="btn-primary btn-lg gap-2">
                  Sign In <ChevronRight size={18} />
                </Link>
                <Link to="/register" className="btn-secondary btn-lg">
                  Create Account
                </Link>
              </div>
            </AnimFade>

            {/* Mock stat pills */}
            <AnimFade delay={0.4}>
              <div className="flex flex-wrap justify-center gap-4 mt-10">
                {[['500+', 'Listings'], ['200+', 'Providers'], ['1,000+', 'Happy Customers'], ['4.8★', 'Avg Rating']].map(([val, label]) => (
                  <div key={label} className="bg-white rounded-2xl shadow-card px-5 py-3 text-center">
                    <div className="text-lg font-black gradient-brand-text">{val}</div>
                    <div className="text-xs text-gray-500">{label}</div>
                  </div>
                ))}
              </div>
            </AnimFade>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 bg-white">
        <div className="page-container">
          <AnimFade>
            <div className="text-center mb-14">
              <h2 className="text-3xl font-black text-gray-900 mb-3">Everything You Need in One Place</h2>
              <p className="text-gray-500 max-w-lg mx-auto">Built for Filipino customers and local providers — simple, safe, and fast.</p>
            </div>
          </AnimFade>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <AnimFade key={f.title} delay={i * 0.08}>
                <div className="card hover:shadow-lg transition-shadow duration-200">
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center mb-4">
                    <f.icon size={22} className="text-brand-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </AnimFade>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 bg-gray-50">
        <div className="page-container">
          <AnimFade>
            <div className="text-center mb-14">
              <h2 className="text-3xl font-black text-gray-900 mb-3">How It Works</h2>
              <p className="text-gray-500">Book in 3 simple steps</p>
            </div>
          </AnimFade>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {STEPS.map((s, i) => (
              <AnimFade key={s.n} delay={i * 0.1}>
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center shadow-brand-glow">
                    <span className="text-white font-black text-xl">{s.n}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{s.title}</h3>
                    <p className="text-sm text-gray-500">{s.desc}</p>
                  </div>
                </div>
              </AnimFade>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-24 bg-brand-600">
        <div className="page-container text-center">
          <AnimFade>
            <h2 className="text-3xl font-black text-white mb-4">Ready to Get Started?</h2>
            <p className="text-brand-100 mb-8 max-w-md mx-auto">
              Join customers and providers already using ServiceQ in Cebu.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/login" className="bg-white text-brand-600 font-bold px-8 py-3 rounded-2xl hover:bg-brand-50 transition-colors">
                Sign In
              </Link>
              <Link to="/register" className="bg-white/20 text-white font-bold px-8 py-3 rounded-2xl hover:bg-white/30 transition-colors border border-white/30">
                Create Account
              </Link>
            </div>
          </AnimFade>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="page-container flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2"><img src="/logo.png" alt="ServiceQ" className="h-9 w-9 object-contain" /><span className="font-bold text-white">ServiceQ</span></div>
          <p className="text-sm">© 2026 ServiceQ. All rights reserved.</p>
          <div className="flex gap-4 text-sm">
            <button className="hover:text-white transition-colors">Privacy Policy</button>
            <button className="hover:text-white transition-colors">Terms of Service</button>
          </div>
        </div>
      </footer>
    </div>
  )
}


