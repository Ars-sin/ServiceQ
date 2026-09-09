/** ServiceQ constants — Philippines-localized */

export const APP_NAME = 'ServiceQ'

export const PLATFORM_FEE_PERCENT = 10

// ── Categories ──────────────────────────────────────────
export const CATEGORIES = [
  { id: 'all',           label: 'All',              icon: 'LayoutGrid' },
  { id: 'services',      label: 'Services',          icon: 'Wrench' },
  { id: 'rental_props',  label: 'Rental Properties', icon: 'Home' },
  { id: 'rental_items',  label: 'Rental Items',      icon: 'Package' },
  { id: 'gadgets',       label: 'Gadgets & Tech',    icon: 'Laptop' },
  { id: 'events',        label: 'Events & Equipment',icon: 'PartyPopper' },
  { id: 'vehicles',      label: 'Vehicles',          icon: 'Car' },
  { id: 'tutoring',      label: 'Tutoring & Lessons', icon: 'GraduationCap' },
  { id: 'cleaning',      label: 'Cleaning Services',  icon: 'Sparkles' },
  { id: 'repairs',       label: 'Repairs & Maintenance', icon: 'Hammer' },
]

export const PROVIDER_TYPES = [
  { id: 'services',       label: 'Service Provider' },
  { id: 'rental_props',   label: 'Rental Property Owner' },
  { id: 'rental_items',   label: 'Rental Items Provider' },
  { id: 'both',           label: 'Both Services & Rentals' },
]

// ── User Roles ───────────────────────────────────────────
export const ROLES = {
  CUSTOMER: 'customer',
  PROVIDER: 'provider',
  ADMIN:    'admin',
}

// ── Booking Statuses ─────────────────────────────────────
export const BOOKING_STATUS = {
  PENDING:   'pending',
  SCHEDULED: 'scheduled',
  ACTIVE:    'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}

// ── Provider Verification Statuses ───────────────────────
export const PROVIDER_STATUS = {
  UNDER_VERIFICATION: 'under_verification',
  APPROVED:           'approved',
  REJECTED:           'rejected',
  SUSPENDED:          'suspended',
}

// ── Subscription Tiers ────────────────────────────────────
export const SUBSCRIPTION_TIERS = {
  FREE:    { id: 'free',    label: 'Free',    maxListings: 3,  price: 0 },
  BASIC:   { id: 'basic',   label: 'Basic',   maxListings: 10, price: 199 },
  PREMIUM: { id: 'premium', label: 'Premium', maxListings: 50, price: 499 },
}

// ── Payment Methods ───────────────────────────────────────
export const PAYMENT_METHODS = [
  { id: 'gcash',         label: 'GCash',            icon: '💚' },
  { id: 'maya',          label: 'Maya',             icon: '💙' },
  { id: 'bdo',           label: 'BDO Bank Transfer', icon: '🏦' },
  { id: 'bpi',           label: 'BPI Bank Transfer', icon: '🏦' },
  { id: 'metrobank',     label: 'Metrobank',         icon: '🏦' },
]

// ── Cancellation Reasons ─────────────────────────────────
export const CANCELLATION_REASONS = [
  'Change of plans',
  'Found a better option',
  'Provider not responding',
  'Wrong booking details',
  'Emergency situation',
  'Service no longer needed',
  'OTHERS',
]

// ── Government ID Types (PH) ─────────────────────────────
export const GOV_ID_TYPES = [
  "PhilSys (National ID)",
  "Driver's License",
  "Passport",
  "SSS ID",
  "GSIS ID",
  "PRC ID",
  "Voter's ID",
  "Postal ID",
  "Senior Citizen ID",
  "PWD ID",
]

// ── Admin Roles ───────────────────────────────────────────
export const ADMIN_ROLES = [
  { id: 'superadmin',        label: 'Super Admin' },
  { id: 'financial_staff',   label: 'Financial Staff' },
  { id: 'support_moderator', label: 'Support Moderator' },
]

// ── PH Regions (abbreviated) ─────────────────────────────
export const PH_REGIONS = [
  'NCR – Metro Manila',
  'Region I – Ilocos',
  'Region II – Cagayan Valley',
  'Region III – Central Luzon',
  'Region IV-A – CALABARZON',
  'Region IV-B – MIMAROPA',
  'Region V – Bicol',
  'Region VI – Western Visayas',
  'Region VII – Central Visayas',
  'Region VIII – Eastern Visayas',
  'Region IX – Zamboanga Peninsula',
  'Region X – Northern Mindanao',
  'Region XI – Davao',
  'Region XII – SOCCSKSARGEN',
  'Region XIII – Caraga',
  'BARMM',
  'CAR',
]
