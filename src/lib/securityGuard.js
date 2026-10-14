/**
 * Security Guard: Hardens the client against DevTools inspection,
 * disables dev keyboard shortcuts, right-click inspect, and prevents
 * console tampering with backend clients.
 */

export function initSecurityGuard() {
  if (typeof window === 'undefined') return

  // 1. Explicitly trap window.supabase so any attempt to access or call it throws an error
  try {
    Object.defineProperty(window, 'supabase', {
      get() {
        throw new Error('Access denied: Direct backend access from browser console is strictly disabled.')
      },
      set() {
        // Disallow overriding window.supabase
      },
      configurable: false,
      enumerable: false,
    })
  } catch {}

  // 2. Disable React DevTools inspection hooks
  if (typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ === 'object') {
    try {
      for (const [key, value] of Object.entries(window.__REACT_DEVTOOLS_GLOBAL_HOOK__)) {
        window.__REACT_DEVTOOLS_GLOBAL_HOOK__[key] = typeof value === 'function' ? () => {} : null
      }
    } catch {}
  }

  // 3. Intercept DevTools keyboard shortcuts (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U)
  window.addEventListener(
    'keydown',
    (e) => {
      // F12
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }

      const isModifier = e.ctrlKey || e.metaKey

      // Ctrl/Cmd + Shift + I (Inspect)
      // Ctrl/Cmd + Shift + J (Console)
      // Ctrl/Cmd + Shift + C (Inspect Element)
      if (
        isModifier &&
        e.shiftKey &&
        ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)
      ) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }

      // Ctrl/Cmd + U (View Source)
      if (isModifier && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }

      // Ctrl/Cmd + S (Save Page)
      if (isModifier && (e.key === 'S' || e.key === 's')) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
    },
    true
  )

  // 4. Disable Right Click Context Menu (prevents "Inspect" / "Inspect Element")
  window.addEventListener(
    'contextmenu',
    (e) => {
      // Allow right click inside standard input / textarea fields for copy-paste
      const tag = e.target?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea') return
      e.preventDefault()
    },
    true
  )

  // 5. Console Protection Banner
  try {
    const bannerStyle = 'color: #ef4444; font-size: 24px; font-weight: bold;'
    const textStyle = 'color: #64748b; font-size: 13px;'
    setTimeout(() => {
      console.log('%cStop! Direct Console Access is Disabled', bannerStyle)
      console.log(
        '%cAccessing internal variables, running unauthorized scripts, or attempting database injection from developer tools is strictly prohibited and monitored.',
        textStyle
      )
    }, 100)
  } catch {}
}
