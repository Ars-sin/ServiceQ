/**
 * LocationPicker.jsx
 * Provides address and location fields for registration and onboarding.
 * If VITE_GOOGLE_MAPS_API_KEY is provided, activates Google Maps autocomplete.
 * Otherwise, presents standard manual address fields cleanly without any warning banner.
 */
import { useEffect, useRef, useState } from 'react'
import { MapPin, Search, CheckCircle, AlertCircle } from 'lucide-react'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? ''

// ─── Parse Google Place address_components ─────────────────────────────────
function parsePlace(place) {
  const get = (type) =>
    place.address_components?.find(c => c.types.includes(type))?.long_name ?? ''

  const barangay =
    get('sublocality_level_1') ||
    get('sublocality') ||
    get('neighborhood') ||
    get('locality')

  const city =
    get('locality') ||
    get('administrative_area_level_3') ||
    get('administrative_area_level_2')

  const province =
    get('administrative_area_level_2') ||
    get('administrative_area_level_1')

  const postalCode = get('postal_code')
  const lat = place.geometry?.location?.lat() ?? null
  const lng = place.geometry?.location?.lng() ?? null
  const formattedAddress = place.formatted_address ?? ''

  return { barangay, city, province, postalCode, lat, lng, formattedAddress }
}

// ─── Load Google Maps script once ──────────────────────────────────────────
let mapsLoaded = false
let mapsLoading = false
const mapsCallbacks = []

function loadGoogleMaps(apiKey) {
  return new Promise((resolve, reject) => {
    if (mapsLoaded) return resolve()
    mapsCallbacks.push({ resolve, reject })
    if (mapsLoading) return
    mapsLoading = true

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => {
      mapsLoaded = true
      mapsCallbacks.forEach(cb => cb.resolve())
    }
    script.onerror = () => {
      mapsCallbacks.forEach(cb => cb.reject(new Error('Google Maps failed to load')))
    }
    document.head.appendChild(script)
  })
}

function staticMapUrl(lat, lng, apiKey) {
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=16&size=600x200&markers=color:red%7C${lat},${lng}&key=${apiKey}`
}

// ─── Manual Address Form ───────────────────────────────────────────────────
function ManualFields({ value = {}, onChange }) {
  const f = (key, val) => onChange({ ...value, [key]: val })

  return (
    <div className="space-y-4">
      <div className="form-group">
        <label className="label">Street / Building / Lot Number</label>
        <input
          className="input"
          placeholder="e.g. 123 Osmeña Blvd, Unit 4B"
          value={value.address || ''}
          onChange={e => f('address', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="form-group">
          <label className="label">
            Barangay <span className="text-red-500 font-bold">*</span>
          </label>
          <input
            className="input"
            placeholder="e.g. Lahug"
            value={value.barangay || ''}
            onChange={e => f('barangay', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="label">
            City / Municipality <span className="text-red-500 font-bold">*</span>
          </label>
          <input
            className="input"
            placeholder="e.g. Cebu City"
            value={value.city || ''}
            onChange={e => f('city', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="form-group">
          <label className="label">Province</label>
          <input
            className="input"
            placeholder="e.g. Cebu"
            value={value.province || ''}
            onChange={e => f('province', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="label">Postal Code <span className="text-red-500 font-bold">*</span></label>
          <input
            className="input"
            type="number"
            min="1000"
            max="9999"
            placeholder="6000"
            value={value.postalCode || ''}
            onChange={e => f('postalCode', e.target.value)}
            required
          />
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function LocationPicker({ value = {}, onChange, label = 'Service Address' }) {
  const inputRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [manual, setManual] = useState(false)

  const hasKey = Boolean(API_KEY && API_KEY.trim().length > 0)

  // Load Maps if API key exists
  useEffect(() => {
    if (!hasKey) return
    loadGoogleMaps(API_KEY)
      .then(() => setReady(true))
      .catch(() => {
        setManual(true)
      })
  }, [hasKey])

  // Attach Autocomplete once ready
  useEffect(() => {
    if (!ready || !inputRef.current || manual) return

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'ph' },
      fields: ['address_components', 'geometry', 'formatted_address', 'name'],
    })

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      if (!place.geometry) {
        setError('Location details not found. Please type manually.')
        return
      }
      setError('')
      const parsed = parsePlace(place)
      onChange({
        ...value,
        address: place.name || parsed.formattedAddress,
        barangay: parsed.barangay,
        city: parsed.city,
        province: parsed.province,
        postalCode: parsed.postalCode,
        lat: parsed.lat,
        lng: parsed.lng,
      })
    })

    return () => window.google.maps.event.clearInstanceListeners(autocomplete)
  }, [ready, manual])

  // If no Google Maps API key is configured or manual is toggled, render clean address inputs
  if (!hasKey || manual) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 mb-1">
          <MapPin size={16} className="text-emerald-600" />
          <span className="font-semibold text-sm text-gray-900">{label}</span>
        </div>
        <ManualFields value={value} onChange={onChange} />
      </div>
    )
  }

  const hasPin = value.lat && value.lng

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 mb-1">
        <MapPin size={16} className="text-emerald-600" />
        <span className="font-semibold text-sm text-gray-900">{label}</span>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search your address in Cebu..."
          defaultValue={value.address || ''}
          className="input pl-9"
        />
      </div>

      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle size={12} /> {error}
        </p>
      )}

      {hasPin && (
        <div className="rounded-xl overflow-hidden border border-gray-200">
          <img
            src={staticMapUrl(value.lat, value.lng, API_KEY)}
            alt="Location map"
            className="w-full h-40 object-cover"
            onError={e => { e.target.style.display = 'none' }}
          />
        </div>
      )}

      {hasPin && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-1.5">
          <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5 mb-2">
            <CheckCircle size={13} /> Location confirmed
          </p>
          {[
            ['Barangay', value.barangay],
            ['City / Municipality', value.city],
            ['Province', value.province],
            ['Postal Code', value.postalCode],
          ].map(([lbl, val]) => val ? (
            <div key={lbl} className="flex items-center gap-2 text-xs text-gray-700">
              <span className="text-gray-400 w-32">{lbl}</span>
              <span className="font-medium">{val}</span>
            </div>
          ) : null)}
        </div>
      )}

      <button
        type="button"
        onClick={() => setManual(true)}
        className="text-xs text-gray-400 hover:text-emerald-600 underline"
      >
        Enter address fields manually instead
      </button>
    </div>
  )
}
