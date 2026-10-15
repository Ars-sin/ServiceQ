import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Navigation, Star, ArrowRight, X, AlertTriangle, Layers } from 'lucide-react'
import { loadGoogleMaps, CEBU_CENTER, calculateDistanceKm, getCurrentUserCoordinates } from '@/lib/googleMaps'
import { formatPHP } from '@/lib/utils'

export default function MapView({
  listings = [],
  userCoords = null,
  onUserCoordsChange = null,
  selectedListing = null,
  onSelectListing = null,
  height = '600px'
}) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const userMarkerRef = useRef(null)
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [activeListing, setActiveListing] = useState(selectedListing)
  const [locating, setLocating] = useState(false)

  // Sync external selection
  useEffect(() => {
    setActiveListing(selectedListing)
  }, [selectedListing])

  // Initialize Google Map
  useEffect(() => {
    let isMounted = true

    loadGoogleMaps()
      .then((googleMaps) => {
        if (!isMounted || !mapRef.current) return

        const initialCenter = userCoords || CEBU_CENTER
        const map = new googleMaps.Map(mapRef.current, {
          center: initialCenter,
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        })

        mapInstanceRef.current = map
        setLoading(false)
      })
      .catch((err) => {
        if (!isMounted) return
        console.error('Failed to load Google Maps:', err)
        setLoadError(err.message || 'Could not load Google Maps.')
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  // Render or update listing markers on the map
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !window.google?.maps) return

    // Clear previous markers
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = []

    const bounds = new window.google.maps.LatLngBounds()
    let hasValidCoords = false

    listings.forEach((item) => {
      const lat = parseFloat(item.lat)
      const lng = parseFloat(item.lng)
      if (isNaN(lat) || isNaN(lng)) return

      const pos = { lat, lng }
      bounds.extend(pos)
      hasValidCoords = true

      const isSelected = activeListing?.id === item.id
      const isRental = String(item.type).toLowerCase().includes('rental')

      // Pin Color: Emerald for Rental, Blue for Service, Amber/Rose for Active
      const markerColor = isSelected ? '#ef4444' : isRental ? '#059669' : '#2563eb'

      // SVG Pin icon with price
      const marker = new window.google.maps.Marker({
        position: pos,
        map,
        title: item.title,
        animation: isSelected ? window.google.maps.Animation.BOUNCE : null,
        icon: {
          path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: isSelected ? 6 : 5,
          fillColor: markerColor,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        }
      })

      marker.addListener('click', () => {
        setActiveListing(item)
        if (onSelectListing) onSelectListing(item)
        map.panTo(pos)
      })

      markersRef.current.push(marker)
    })

    // If user has coords, extend bounds to include user
    if (userCoords) {
      bounds.extend(userCoords)
    }

    // Auto-fit bounds if we have coordinates
    if (hasValidCoords && listings.length > 1) {
      map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 })
    }
  }, [listings, activeListing])

  // Update user GPS location marker
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !window.google?.maps || !userCoords) return

    if (userMarkerRef.current) {
      userMarkerRef.current.setPosition(userCoords)
    } else {
      userMarkerRef.current = new window.google.maps.Marker({
        position: userCoords,
        map,
        title: 'You are here',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#3b82f6',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        }
      })
    }
  }, [userCoords])

  // Locate current user
  const handleLocateMe = async () => {
    setLocating(true)
    try {
      const coords = await getCurrentUserCoordinates()
      if (onUserCoordsChange) onUserCoordsChange(coords)
      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo({ lat: coords.lat, lng: coords.lng })
        mapInstanceRef.current.setZoom(14)
      }
    } catch (err) {
      console.warn('Geolocation error:', err)
    } finally {
      setLocating(false)
    }
  }

  // Compute live distance if user coordinates are known
  const currentDistance = (item) => {
    if (userCoords && item.lat && item.lng) {
      return calculateDistanceKm(userCoords.lat, userCoords.lng, item.lat, item.lng)
    }
    return item.distance
  }

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50" style={{ height }}>
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-10">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-gray-700">Connecting to Google Maps...</p>
        </div>
      )}

      {/* Error state */}
      {loadError && !loading && (
        <div className="absolute inset-0 bg-white p-6 flex flex-col items-center justify-center text-center gap-3 z-10">
          <AlertTriangle className="text-amber-500" size={32} />
          <h4 className="font-bold text-gray-900 text-sm">Google Maps Could Not Load</h4>
          <p className="text-xs text-gray-500 max-w-md">
            {loadError}. Please ensure that the <strong>Maps JavaScript API</strong> is enabled on your Google Cloud Console for your key.
          </p>
        </div>
      )}

      {/* Top Floating Controls */}
      {!loading && !loadError && (
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
          <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md border border-gray-200 text-xs font-semibold text-gray-700 flex items-center gap-1.5 pointer-events-auto">
            <Layers size={14} className="text-emerald-600" />
            <span>Showing {listings.length} verified listings in Cebu</span>
          </div>

          <button
            onClick={handleLocateMe}
            disabled={locating}
            className="bg-white/95 hover:bg-white active:scale-95 transition-all text-xs font-semibold text-gray-800 px-3.5 py-2 rounded-full shadow-md border border-gray-200 flex items-center gap-2 pointer-events-auto"
            title="Use current GPS location"
          >
            <Navigation size={14} className={`text-blue-600 ${locating ? 'animate-spin' : ''}`} />
            <span>{locating ? 'Locating...' : 'My Location'}</span>
          </button>
        </div>
      )}

      {/* Active Listing Popup Card at Bottom */}
      {activeListing && (
        <div className="absolute bottom-4 left-4 right-4 max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 p-3.5 flex items-center gap-3 z-20 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Thumbnail */}
          <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 relative">
            {activeListing.photos?.[0] && !activeListing.photos[0].startsWith('from-') ? (
              <img src={activeListing.photos[0]} alt={activeListing.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg">
                {activeListing.title.charAt(0)}
              </div>
            )}
            <span className={`absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${
              activeListing.type === 'services' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
            }`}>
              {activeListing.type === 'services' ? 'Service' : 'Rental'}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1">
              <h4 className="font-bold text-gray-900 text-xs truncate leading-snug">
                {activeListing.title}
              </h4>
              <button
                onClick={() => setActiveListing(null)}
                className="text-gray-400 hover:text-gray-600 p-0.5 -mr-1"
              >
                <X size={14} />
              </button>
            </div>

            <p className="text-[11px] text-gray-500 truncate mt-0.5">
              {activeListing.provider || 'Verified Provider'}
            </p>

            <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-600">
              <span className="font-bold text-emerald-700">{formatPHP(activeListing.price)}</span>
              <span className="text-gray-400 text-[10px]">{activeListing.unit}</span>
              <span className="text-gray-300">•</span>
              <span className="flex items-center gap-0.5 text-gray-500 text-[10px]">
                <MapPin size={10} className="text-gray-400" />
                {currentDistance(activeListing) ? `${currentDistance(activeListing)} km` : 'Cebu'}
              </span>
              {activeListing.reviews > 0 && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="flex items-center gap-0.5 text-amber-600 text-[10px] font-semibold">
                    <Star size={10} className="fill-amber-400" />
                    {activeListing.rating}
                  </span>
                </>
              )}
            </div>

            <button
              onClick={() => navigate(`/customer/listings/${activeListing.id}`)}
              className="mt-2 w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
            >
              <span>View Details & Book</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
