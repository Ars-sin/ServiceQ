/**
 * googleMaps.js
 * Centralized Google Maps & Geolocation services for ServiceQ.
 */

export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

// Default to Cebu City Center (Fuente Osmeña Circle)
export const CEBU_CENTER = {
  lat: 10.3157,
  lng: 123.8854,
}

let mapsLoadingPromise = null

/**
 * Loads the Google Maps JavaScript API with Places library once.
 */
export function loadGoogleMaps(apiKey = GOOGLE_MAPS_API_KEY) {
  if (typeof window === 'undefined') return Promise.reject(new Error('Window not available'))
  if (window.google?.maps) return Promise.resolve(window.google.maps)

  if (mapsLoadingPromise) return mapsLoadingPromise

  const key = apiKey || GOOGLE_MAPS_API_KEY
  if (!key) {
    return Promise.reject(new Error('Google Maps API key is not configured.'))
  }

  mapsLoadingPromise = new Promise((resolve, reject) => {
    // Check if script element already exists
    const existing = document.querySelector('script[data-serviceq-gmaps="true"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google.maps))
      existing.addEventListener('error', (e) => reject(e))
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places`
    script.async = true
    script.defer = true
    script.setAttribute('data-serviceq-gmaps', 'true')

    script.onload = () => {
      if (window.google?.maps) {
        resolve(window.google.maps)
      } else {
        reject(new Error('Google Maps loaded but window.google.maps is undefined'))
      }
    }

    script.onerror = (err) => {
      mapsLoadingPromise = null
      reject(err)
    }

    document.head.appendChild(script)
  })

  return mapsLoadingPromise
}

/**
 * Calculate geographical distance in kilometers between two coordinates using the Haversine formula.
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (
    lat1 === undefined || lat1 === null ||
    lon1 === undefined || lon1 === null ||
    lat2 === undefined || lat2 === null ||
    lon2 === undefined || lon2 === null
  ) {
    return null
  }

  const p1Lat = parseFloat(lat1)
  const p1Lon = parseFloat(lon1)
  const p2Lat = parseFloat(lat2)
  const p2Lon = parseFloat(lon2)

  if (isNaN(p1Lat) || isNaN(p1Lon) || isNaN(p2Lat) || isNaN(p2Lon)) return null

  const R = 6371 // Earth's mean radius in km
  const dLat = (p2Lat - p1Lat) * (Math.PI / 180)
  const dLon = (p2Lon - p1Lon) * (Math.PI / 180)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(p1Lat * (Math.PI / 180)) *
    Math.cos(p2Lat * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const d = R * c
  return Math.round(d * 10) / 10 // Rounded to 1 decimal place (e.g. 1.2 km)
}

/**
 * Request user's current GPS position via browser Geolocation API.
 */
export function getCurrentUserCoordinates() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error('Geolocation is not supported by your browser'))
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        })
      },
      (err) => {
        reject(err)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  })
}
