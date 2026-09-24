import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  MapPin, Star, Shield, Zap, Clock, MessageCircle,
  Search, Calendar, CheckCircle2, ChevronRight, ArrowRight,
  Sparkles, Award, Users, Home, LayoutGrid, Settings, User,
  Menu, X
} from 'lucide-react'

const NAV_ITEMS = [
  { id: 'hero', label: 'Home', icon: Home },
  { id: 'explore', label: 'Explore', icon: Search },
  { id: 'features', label: 'Features', icon: LayoutGrid },
  { id: 'how-it-works', label: 'How It Works', icon: Settings },
]

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

function AnimFade({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default function LandingPage() {
  const [activeSection, setActiveSection] = useState('hero')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isManualScrolling = useRef(false)
  const scrollTimeout = useRef(null)

  // Track active section on scroll
  useEffect(() => {
    const sections = ['hero', 'explore', 'features', 'how-it-works']
    const handleScroll = () => {
      // Don't override activeSection while smooth scrolling to clicked section
      if (isManualScrolling.current) return

      if (window.scrollY < 100) {
        setActiveSection('hero')
        return
      }

      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 60) {
        setActiveSection('how-it-works')
        return
      }

      const scrollPos = window.scrollY + 140
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i])
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(sections[i])
          break
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
    }
  }, [])

  const scrollToSection = (e, id) => {
    e.preventDefault()
    setActiveSection(id)
    setMobileMenuOpen(false)

    isManualScrolling.current = true
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current)

    if (id === 'hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      const el = document.getElementById(id)
      if (el) {
        const topOffset = 80
        const elementPosition = el.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.pageYOffset - topOffset
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        })
      }
    }

    const unlockScroll = () => {
      isManualScrolling.current = false
      window.removeEventListener('scrollend', unlockScroll)
    }

    if ('onscrollend' in window) {
      window.addEventListener('scrollend', unlockScroll, { once: true })
    }

    scrollTimeout.current = setTimeout(() => {
      isManualScrolling.current = false
    }, 900)
  }

  return (
    <div id="top" className="min-h-screen bg-brand-950 font-sans text-gray-800">

      {/* ── TOP NAVBAR ────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-brand-950/95 backdrop-blur-md border-b border-white/10 shadow-lg">
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 flex items-center justify-between py-4 sm:py-5">
          {/* Logo with plenty of breathing room */}
          <Link to="/" className="flex items-center gap-3 flex-shrink-0 group">
            <img
              src="/logoword(white).png"
              alt="ServiceQ"
              className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-105 duration-200"
              onError={(e) => {
                e.target.onerror = null
                e.target.src = '/logo.png'
              }}
            />
          </Link>

          {/* Desktop Nav Items with smooth animated sliding pill */}
          <div className="hidden md:flex items-center gap-1.5 lg:gap-2 text-sm p-1 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = activeSection === item.id
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => scrollToSection(e, item.id)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 outline-none focus:outline-none select-none ${
                    isActive
                      ? 'text-white font-semibold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavPill"
                      className="absolute inset-0 rounded-full bg-blue-600/35 border border-blue-400/40 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon
                    size={15}
                    className={`relative z-10 transition-colors duration-200 ${
                      isActive ? 'text-white' : 'text-slate-400'
                    }`}
                  />
                  <span className="relative z-10">{item.label}</span>
                </a>
              )
            })}
          </div>

          {/* Desktop Action Buttons with exact reference pill styles */}
          <div className="hidden md:flex items-center gap-3 lg:gap-4 flex-shrink-0">
            {/* Vertical divider */}
            <div className="h-5 w-px bg-white/20 mx-1 hidden lg:block" />

            <Link
              to="/login"
              className="rounded-full border border-white/30 hover:border-white/60 hover:bg-white/10 text-white px-5 py-2 text-sm font-medium flex items-center gap-2 transition duration-200 active:scale-95"
            >
              <User size={15} className="text-white" />
              <span>Sign In</span>
            </Link>

            <Link
              to="/register"
              className="rounded-full bg-gradient-to-r from-blue-500 via-sky-500 to-sky-400 hover:from-blue-600 hover:to-sky-500 text-white px-5 py-2 text-sm font-semibold flex items-center gap-1.5 shadow-[0_2px_12px_rgba(14,165,233,0.35)] hover:shadow-[0_4px_18px_rgba(14,165,233,0.5)] transition duration-200 active:scale-95"
            >
              <span>Get Started</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* Mobile hamburger button */}
          <div className="flex items-center gap-2 md:hidden">
            <Link
              to="/login"
              className="p-2 rounded-full border border-white/25 text-white hover:bg-white/10"
              title="Sign In"
            >
              <User size={18} />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-white hover:bg-white/10 transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Panel */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/10 bg-brand-950/98 px-6 py-5 flex flex-col gap-3"
            >
              <div className="flex flex-col gap-1.5">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon
                  const isActive = activeSection === item.id
                  return (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      onClick={(e) => scrollToSection(e, item.id)}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-full text-sm transition ${
                        isActive
                          ? 'bg-blue-600/35 border border-blue-400/40 text-white font-semibold'
                          : 'text-slate-300 hover:text-white hover:bg-white/10 font-medium'
                      }`}
                    >
                      <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                      <span>{item.label}</span>
                    </a>
                  )
                })}
              </div>
              <div className="h-px w-full bg-white/15 my-1" />
              <div className="flex flex-col gap-2.5">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-full border border-white/30 hover:bg-white/10 text-white px-5 py-2.5 text-sm font-medium flex items-center justify-center gap-2"
                >
                  <User size={15} />
                  <span>Sign In</span>
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-full bg-gradient-to-r from-blue-500 via-sky-500 to-sky-400 text-white px-5 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 shadow-md"
                >
                  <span>Get Started</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
              <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-blue-950/60 hover:bg-blue-900/60 border border-blue-400/30 backdrop-blur-md text-white text-xs sm:text-sm font-medium shadow-[0_0_20px_rgba(59,130,246,0.25)] transition duration-200 mb-6">
                <MapPin size={15} className="text-sky-400 flex-shrink-0" />
                <span className="tracking-wide text-slate-100">Serving Cebu City & surrounding areas</span>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {STEPS.map((s, i) => (
              <AnimFade key={s.n} delay={i * 0.1} className="h-full">
                <div className="h-full flex flex-col items-center text-center p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:border-brand-300 hover:shadow-lg transition-all duration-200">
                  {/* Rounded blue outline icon container (matching user mockup) */}
                  <div className="w-20 h-20 rounded-2xl border-2 border-brand-500 bg-brand-50 flex items-center justify-center text-brand-600 mb-6 shadow-sm flex-shrink-0">
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
