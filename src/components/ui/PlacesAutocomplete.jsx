import { useEffect, useRef, useState } from 'react'
import { MapPin, X, Loader } from 'lucide-react'
import { loadGoogleMaps } from '@/lib/googlemaps'

/**
 * PlacesAutocomplete
 * A text input that shows Google Places suggestions biased to Cebu, Philippines.
 *
 * Props:
 *   value       – controlled string value
 *   onChange    – (placeText, { lat, lng } | null) => void
 *   placeholder – input placeholder
 *   className   – extra classes on the wrapper
 *   restrictToPhilippines – bool (default true)
 */
export default function PlacesAutocomplete({
  value = '',
  onChange,
  placeholder = 'Type a place, barangay, city…',
  className = '',
  restrictToPhilippines = true,
}) {
  const inputRef   = useRef(null)
  const acRef      = useRef(null)   // Autocomplete instance
  const listenerRef = useRef(null)  // place_changed listener

  const [inputVal, setInputVal]   = useState(value)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [suggestions, setSuggestions] = useState([])  // fallback list
  const [showDropdown, setShowDropdown] = useState(false)
  const sessionTokenRef = useRef(null)
  const svcRef = useRef(null)
  const dropdownRef = useRef(null)

  // Sync controlled value → input
  useEffect(() => {
    setInputVal(value)
  }, [value])

  // Boot Google Maps + Places Autocomplete
  useEffect(() => {
    let destroyed = false
    setLoading(true)
    loadGoogleMaps()
      .then(() => {
        if (destroyed || !inputRef.current) return

        const options = {
          componentRestrictions: restrictToPhilippines ? { country: 'ph' } : undefined,
          // Bias toward Cebu
          bounds: new window.google.maps.LatLngBounds(
            { lat: 9.4, lng: 123.2 },   // SW corner of Cebu province
            { lat: 11.3, lng: 124.4 }   // NE corner
          ),
          strictBounds: false,
          fields: ['name', 'formatted_address', 'geometry', 'address_components'],
        }

        acRef.current = new window.google.maps.places.Autocomplete(inputRef.current, options)

        listenerRef.current = acRef.current.addListener('place_changed', () => {
          const place = acRef.current.getPlace()
          if (!place) return
          const lat = place.geometry?.location?.lat()
          const lng = place.geometry?.location?.lng()
          // Build a clean display name: prefer neighborhood/locality name
          const name = place.name || place.formatted_address || ''
          setInputVal(name)
          setShowDropdown(false)
          onChange?.(name, lat && lng ? { lat, lng } : null)
        })

        // Also set up AutocompleteService for manual suggestion list
        sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken()
        svcRef.current = new window.google.maps.places.AutocompleteService()

        setLoading(false)
        setError(null)
      })
      .catch(err => {
        if (!destroyed) {
          setLoading(false)
          setError('Could not load Google Places')
        }
      })

    return () => {
      destroyed = true
      if (listenerRef.current) {
        window.google?.maps?.event?.removeListener(listenerRef.current)
      }
    }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleInputChange = (e) => {
    const val = e.target.value
    setInputVal(val)
    // Propagate text change immediately (lat/lng will come from place_changed)
    onChange?.(val, null)

    // Also fetch suggestions manually for our custom dropdown display
    if (svcRef.current && val.length > 1) {
      svcRef.current.getPlacePredictions(
        {
          input: val,
          sessionToken: sessionTokenRef.current,
          componentRestrictions: restrictToPhilippines ? { country: 'ph' } : undefined,
          bounds: new window.google.maps.LatLngBounds(
            { lat: 9.4, lng: 123.2 },
            { lat: 11.3, lng: 124.4 }
          ),
        },
        (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions)
            setShowDropdown(true)
          } else {
            setSuggestions([])
            setShowDropdown(false)
          }
        }
      )
    } else {
      setSuggestions([])
      setShowDropdown(false)
    }
  }

  const handleSuggestionClick = (prediction) => {
    const desc = prediction.description
    // Extract just the first part (main_text) for cleaner display
    const mainText = prediction.structured_formatting?.main_text || desc
    setInputVal(mainText)
    setSuggestions([])
    setShowDropdown(false)
    onChange?.(mainText, null) // lat/lng resolved later if needed
  }

  const handleClear = () => {
    setInputVal('')
    setSuggestions([])
    setShowDropdown(false)
    onChange?.('', null)
    inputRef.current?.focus()
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={handleInputChange}
          onFocus={() => { if (suggestions.length > 0) setShowDropdown(true) }}
          placeholder={loading ? 'Loading Places…' : placeholder}
          disabled={loading}
          autoComplete="off"
          className="input pl-8 pr-8 text-sm"
        />
        {inputVal && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        )}
        {loading && (
          <Loader size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
        )}
      </div>

      {/* Suggestions dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto"
        >
          {suggestions.map((p, i) => (
            <button
              key={p.place_id || i}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleSuggestionClick(p) }}
              className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors"
            >
              <MapPin size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {p.structured_formatting?.main_text || p.description}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {p.structured_formatting?.secondary_text || ''}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="text-xs text-amber-600 mt-1">{error} — using dropdown instead</p>
      )}
    </div>
  )
}
