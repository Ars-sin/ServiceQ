import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind classes safely */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/** Format PHP currency */
export function formatPHP(amount) {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(amount)
}

/** Platform fee calculation */
export function calcFees(subtotal, feePercent = 10) {
  const fee   = (subtotal * feePercent) / 100
  const total = subtotal + fee
  return { subtotal, fee, total, feePercent }
}

/** Truncate text */
export function truncate(str, n = 80) {
  return str?.length > n ? str.slice(0, n) + '…' : str
}

/** Relative time */
export function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

/** Booking status → badge variant */
export function statusVariant(status) {
  const map = {
    pending:   'warning',
    scheduled: 'info',
    active:    'info',
    completed: 'success',
    cancelled: 'danger',
    approved:  'success',
    rejected:  'danger',
    suspended: 'danger',
    under_verification: 'warning',
  }
  return map[status] ?? 'neutral'
}

/** Capitalize first letter */
export function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : ''
}

/** Generate booking ID */
export function genBookingId() {
  return 'SQ-' + Date.now().toString(36).toUpperCase()
}

/**
 * Convert File to optimized base64 Data URL with canvas resizing.
 * Keeps image quality high while reducing size from 5-10MB down to ~150-250KB.
 */
export function fileToDataUrl(file, maxWidth = 1200, maxHeight = 1200, quality = 0.82) {
  return new Promise((resolve) => {
    if (!file) return resolve(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let width = img.width
        let height = img.height
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          } else {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = () => resolve(e.target.result)
      img.src = e.target.result
    }
    reader.onerror = () => resolve(null)
    reader.readAsDataURL(file)
  })
}

