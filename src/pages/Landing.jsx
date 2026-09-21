import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  MapPin, Star, Shield, Zap, Clock, MessageCircle,
  Search, Calendar, CheckCircle2, ChevronRight, ArrowRight,
  Sparkles, Award, Users
} from 'lucide-react'

const FEATURES = [
  { icon: Zap,            title: 'Book in Minutes',        desc: 'Find and book services or rentals instantly without unnecessary back-and-forth.' },
  { icon: Shield,         title: 'Verified Providers',     desc: 'All providers go through KYC identity verification before going live on the platform.' },
  { icon: Star,           title: 'Reviews & Ratings',      desc: 'Make confident choices with genuine ratings from verified customers in Cebu.' },
  { icon: Clock,          title: 'Real-time Availability', desc: 'Live availability schedules so you always book confirmed, active time slots.' },
  { icon: MapPin,         title: 'Location-Based',         desc: 'Discover services, equipment, and rentals within your exact Cebu neighborhood.' },
  {
    icon: MessageCircle,
    title: 'Direct Provider Chat',
    desc: 'Communicate directly with providers. (Unavailable as of the moment – coming soon)',
    unavailable: true,
  },
]

const FEATURED_CATEGORIES = [
  {
    title: 'Cleaning & Home Care',
    desc: 'Deep cleaning, aircon maintenance, house sanitization',
    count: '42+ providers',
    tag: 'Popular in Cebu',
  },
  {
    title: 'Gadgets & Electronics',
    desc: 'Cameras, drones, audio systems, gaming rentals',
    count: '28+ items',
    tag: 'Trending',
  },
  {
    title: 'Rental Properties & Spaces',
    desc: 'Event venues, studio spaces, short-stay units',
    count: '35+ listings',
    tag: 'High Demand',
  },
  {
    title: 'Events & Party Equipment',
    desc: 'Lighting, projectors, sound systems, tents & chairs',
    count: '19+ providers',
    tag: 'Events',
  },
  {
    title: 'Tutoring & Academic Lessons',
    desc: 'Math, language tutors, music and tech lessons',
    count: '24+ tutors',
    tag: 'Education',
  },
  {
    title: 'Vehicle & Transport Rentals',
    desc: 'Cars, vans, scooters, moving transport in Cebu',
    count: '31+ rentals',
    tag: 'Transport',
  },
]

const STEPS = [
  {
    n: '1',
    title: '1. Discover Nearby',
    desc: 'Browse local properties, equipment, and everyday services tailored to your area in Cebu.',
    icon: Search,
  },
  {
    n: '2',
    title: '2. Book & Schedule',
    desc: 'Choose your dates or service time, review details, and reserve instantly with real-time confirmation.',
    icon: Calendar,
  },
  {
    n: '3',
    title: '3. Get It Done',
    desc: 'Pick up your rental or receive your requested service smoothly and hassle-free.',
    icon: CheckCircle2,
  },
]

function AnimFade({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
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
    <div className="min-h-screen bg-brand-950 font-sans text-gray-800">

      {/* ── TOP NAVBAR ────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-brand-950/95 backdrop-blur-md border-b border-brand-800/60 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between py-4 sm:py-5">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/logoword(white).png"
              alt="ServiceQ"
              className="h-8 sm:h-9 w-auto object-contain"
              onError={(e) => {
                e.target.onerror = null
                e.target.src = '/logo.png'
              }}
            />
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-brand-100">
            <a href="#hero" className="hover:text-white transition py-1">Home</a>
            <a href="#explore" className="hover:text-white transition py-1">Explore</a>
            <a href="#features" className="hover:text-white transition py-1">Features</a>
            <a href="#how-it-works" className="hover:text-white transition py-1">How It Works</a>
          </div>

          {/* Action Buttons with strong visibility */}
          <div className="flex items-center gap-3.5">
            <Link
              to="/login"
              className="px-4.5 py-2 text-sm font-bold text-white hover:text-brand-100 border border-white/40 hover:border-white rounded-xl transition bg-white/5"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-5 py-2 text-sm font-bold text-brand-950 bg-white hover:bg-brand-50 rounded-xl shadow-md transition hover:scale-105 active:scale-95"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO & EXPLORE (Seamless Gradient Blend) ────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-b from-brand-950 via-brand-900 to-brand-950 text-white">
        {/* Subtle ambient decorative glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-brand-500/15 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute top-[45%] left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-brand-400/10 blur-[150px] rounded-full pointer-events-none" />

        {/* ── HERO SECTION ── */}
        <section id="hero" className="relative z-10 pt-16 pb-12 scroll-mt-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
            <AnimFade>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-800/90 border border-brand-400/40 text-brand-200 text-xs sm:text-sm font-semibold mb-6 shadow-sm">
                <MapPin size={14} className="text-brand-300" /> Serving Cebu City & surrounding areas
              </div>
            </AnimFade>

            <AnimFade delay={0.1}>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight mb-6">
                ServiceQ : One search.<br />
                <span className="text-brand-300">Endless possibilities, locally</span>
              </h1>
            </AnimFade>

            <AnimFade delay={0.2}>
              <p className="text-base sm:text-lg text-brand-100 leading-relaxed mb-10 max-w-2xl mx-auto">
                We connect you to our trusted local providers for rental space, gear, and daily services. Compare options, check live availability, and book what you need in seconds.
              </p>
            </AnimFade>

            {/* High-visibility Action Buttons */}
            <AnimFade delay={0.3}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-8 py-4 bg-white text-brand-950 hover:bg-brand-50 font-extrabold text-base rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 flex items-center justify-center gap-2 hover:-translate-y-0.5 active:scale-95"
                >
                  Create Free Account <ChevronRight size={18} />
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-8 py-4 bg-brand-800/80 hover:bg-brand-700 text-white font-bold text-base rounded-2xl border-2 border-brand-400/70 shadow-lg transition-all duration-200 flex items-center justify-center gap-2 hover:-translate-y-0.5 active:scale-95"
                >
                  Sign In to Dashboard <ArrowRight size={18} />
                </Link>
              </div>
            </AnimFade>

            {/* 3 Floating White Cards on Blue (Matching User Mockup with Interactive Transitions) */}
            <AnimFade delay={0.4}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-14 text-left">
                {/* Card 1 */}
                <div className="bg-white rounded-2xl p-6 shadow-2xl border border-white/60 hover:-translate-y-2 hover:ring-2 hover:ring-brand-300 hover:shadow-brand-500/20 transition-all duration-300 cursor-pointer group">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 group-hover:bg-brand-600 text-brand-600 group-hover:text-white flex items-center justify-center mb-3 transition-colors duration-200 shadow-sm">
                    <Zap size={22} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-base mb-1">Fast Service Booking</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">Book cleaners, AC technicians, makeup artists, and tutors with verified pricing.</p>
                </div>

                {/* Card 2 (Top Rated) */}
                <div className="bg-white rounded-2xl p-6 shadow-2xl border border-white/60 sm:-translate-y-2 ring-2 ring-brand-300 hover:-translate-y-3 hover:ring-brand-400 hover:shadow-brand-500/30 transition-all duration-300 cursor-pointer group">
                  <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center mb-3 shadow-sm">
                    <Sparkles size={22} />
                  </div>
                  <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">Top Rated</span>
                  <h3 className="font-bold text-gray-900 text-base mb-1">Gear & Space Rentals</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">Rent cameras, event equipment, party needs, and rental spaces without friction.</p>
                </div>

                {/* Card 3 */}
                <div className="bg-white rounded-2xl p-6 shadow-2xl border border-white/60 hover:-translate-y-2 hover:ring-2 hover:ring-brand-300 hover:shadow-brand-500/20 transition-all duration-300 cursor-pointer group">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 group-hover:bg-brand-600 text-brand-600 group-hover:text-white flex items-center justify-center mb-3 transition-colors duration-200 shadow-sm">
                    <Award size={22} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-base mb-1">Verified Local Providers</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">Government ID-checked providers in Cebu with authentic ratings and secure payouts.</p>
                </div>
              </div>
            </AnimFade>
          </div>
        </section>

        {/* ── EXPLORE SERVICES ── */}
        <section id="explore" className="relative z-10 pt-10 pb-20 scroll-mt-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <AnimFade>
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">Explore ServiceQ</h2>
                <p className="text-brand-100 text-sm max-w-md mx-auto">
                  Find exactly what you need across Cebu's trusted local marketplace.
                </p>
              </div>
            </AnimFade>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURED_CATEGORIES.map((cat, idx) => (
                <AnimFade key={cat.title} delay={idx * 0.08}>
                  <div className="bg-white rounded-2xl p-6 shadow-xl border border-white/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700">
                          {cat.tag}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">{cat.count}</span>
                      </div>
                      <h3 className="text-base font-bold text-gray-900 mb-1">{cat.title}</h3>
                      <p className="text-xs text-gray-500 leading-relaxed">{cat.desc}</p>
                    </div>
                  </div>
                </AnimFade>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ── FEATURES GRID ─────────────────────────────────────────── */}
      <section id="features" className="py-20 bg-brand-950 text-white border-t border-brand-800/60 scroll-mt-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <AnimFade>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">Why Choose ServiceQ</h2>
              <p className="text-brand-100 text-sm max-w-md mx-auto">Built specifically for Filipino service consumers and verified local providers.</p>
            </div>
          </AnimFade>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <AnimFade key={f.title} delay={i * 0.08}>
                <div className="bg-brand-900/80 border border-brand-800 rounded-2xl p-6 hover:bg-brand-850 transition duration-200 shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-sm">
                      <f.icon size={22} />
                    </div>
                    {f.unavailable && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                        Unavailable at the moment
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-white text-base mb-2">{f.title}</h3>
                  <p className="text-xs text-brand-100 leading-relaxed">{f.desc}</p>
                </div>
              </AnimFade>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS (White Section with High-Contrast Blue Borders) ─── */}
      <section id="how-it-works" className="py-20 bg-white scroll-mt-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <AnimFade>
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2">How ServiceQ Works</h2>
              <p className="text-gray-500 text-sm max-w-lg mx-auto">
                A seamless process from browsing to booking local rentals and services.
              </p>
            </div>
          </AnimFade>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <AnimFade key={s.n} delay={i * 0.1}>
                <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:border-brand-300 hover:shadow-lg transition-all duration-200">
                  {/* Rounded blue outline icon container (matching user mockup) */}
                  <div className="w-20 h-20 rounded-2xl border-2 border-brand-500 bg-brand-50 flex items-center justify-center text-brand-600 mb-5 shadow-sm">
                    <s.icon size={34} className="text-brand-600" />
                  </div>
                  <h3 className="font-extrabold text-gray-900 text-base mb-2">{s.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed max-w-xs">{s.desc}</p>
                </div>
              </AnimFade>
            ))}
          </div>
        </div>
      </section>

      {/* ── READY TO GET STARTED (Vibrant CTA) ────────────────────── */}
      <section className="py-16 bg-gradient-to-r from-brand-800 via-brand-700 to-brand-800 text-white text-center border-t border-b border-brand-700">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <AnimFade>
            <h2 className="text-3xl font-black text-white mb-3">Ready to Experience ServiceQ?</h2>
            <p className="text-brand-100 text-sm mb-8 max-w-md mx-auto">
              Join Cebu's growing network of customers and service providers today.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-3.5 bg-white text-brand-900 hover:bg-brand-50 font-extrabold text-sm rounded-xl shadow-lg transition hover:scale-105"
              >
                Create Account
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-3.5 bg-brand-900/60 hover:bg-brand-900 text-white border-2 border-white/60 font-bold text-sm rounded-xl transition hover:scale-105"
              >
                Sign In
              </Link>
            </div>
          </AnimFade>
        </div>
      </section>

      {/* ── FOOTER (Vibrant Rich Blue matching Mockup) ───────────── */}
      <footer className="bg-brand-950 border-t border-brand-800/80 text-brand-200 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-xs">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img
              src="/logoword(white).png"
              alt="ServiceQ"
              className="h-7 w-auto object-contain"
              onError={(e) => {
                e.target.onerror = null
                e.target.src = '/logo.png'
              }}
            />
          </div>

          {/* Contact Links from mockup */}
          <div className="flex flex-wrap justify-center gap-6 text-brand-200">
            <a href="mailto:partner@serviceq.com" className="hover:text-white transition">partner@serviceq.com</a>
            <a href="mailto:support@serviceq.com" className="hover:text-white transition">support@serviceq.com</a>
            <span className="text-brand-400 font-mono">+63 (032) 412-SERV (7378)</span>
          </div>

          <p className="text-brand-400">© 2026 ServiceQ. All rights reserved.</p>
        </div>
      </footer>

    </div>
  )
}
