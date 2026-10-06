import { supabase } from '@/lib/supabase'

/**
 * Permanently deletes a user account and ALL associated data from:
 * 1. Supabase database tables (profiles, providers, bookings, listings, disputes, reviews, withdrawals)
 * 2. Supabase platform_settings synced JSON arrays & user keys
 * 3. LocalStorage arrays (bookings, listings, withdrawals, transactions, favorites, reviews)
 * 4. LocalStorage user-specific keys
 * 5. Registers user in serviceq_deleted_users and logs to serviceq_audit_log
 *
 * @param {Object} user - The user object containing id, email, full_name/name, role
 * @param {string} initiator - Who triggered the deletion (e.g. 'Admin', 'Self')
 */
export async function deleteAccountCompletely(user, initiator = 'System') {
  if (!user) return { success: false, error: 'No user specified' }

  const userId = user.id ? String(user.id) : null
  const userEmail = (user.email || '').toLowerCase().trim()
  const userName = (user.name || user.full_name || user.business_name || '').toLowerCase().trim()
  const userRole = user.role || 'user'

  console.log(`[deleteAccountCompletely] Deleting account ${userId} (${userEmail}) initiated by ${initiator}...`)

  // ── 1. Database Deletions (Supabase tables) ─────────────────────────
  try {
    // 1a. Profiles
    if (userId) {
      await supabase.from('profiles').delete().eq('id', userId)
    }
    if (userEmail) {
      await supabase.from('profiles').delete().ilike('email', userEmail)
    }

    // 1b. Providers table (if provider)
    if (userId) {
      await supabase.from('providers').delete().eq('user_id', userId)
      await supabase.from('providers').delete().eq('id', userId)
    }
    if (userEmail) {
      await supabase.from('providers').delete().ilike('email', userEmail)
    }

    // 1c. Bookings table (where customer or provider)
    if (userId) {
      await supabase.from('bookings').delete().eq('customer_id', userId)
      await supabase.from('bookings').delete().eq('provider_id', userId)
    }

    // 1d. Listings table (where provider)
    if (userId) {
      await supabase.from('listings').delete().eq('provider_id', userId)
      await supabase.from('listings').delete().eq('user_id', userId)
    }

    // 1e. Disputes table
    if (userId) {
      try {
        await supabase.from('disputes').delete().eq('customer_id', userId)
        await supabase.from('disputes').delete().eq('provider_id', userId)
      } catch {}
    }

    // 1f. Reviews table
    if (userId) {
      try {
        await supabase.from('reviews').delete().eq('customer_id', userId)
        await supabase.from('reviews').delete().eq('provider_id', userId)
      } catch {}
    }

    // 1g. Withdrawals table
    if (userId) {
      try {
        await supabase.from('withdrawals').delete().eq('provider_id', userId)
      } catch {}
    }
  } catch (err) {
    console.warn('[deleteAccountCompletely] Database table deletion warning:', err.message)
  }

  // ── 2. Clean Supabase platform_settings (Global synced arrays) ───────
  try {
    const isTargetBooking = (b) => {
      if (!b) return false
      if (userId && (String(b.customerId) === userId || String(b.providerId) === userId)) return true
      if (userEmail && (b.customerEmail?.toLowerCase() === userEmail || b.providerEmail?.toLowerCase() === userEmail)) return true
      if (userName && (b.customer?.toLowerCase() === userName || b.provider?.toLowerCase() === userName)) return true
      return false
    }

    const isTargetListing = (l) => {
      if (!l) return false
      if (userId && (String(l.providerId) === userId || String(l.userId) === userId)) return true
      if (userEmail && (l.providerEmail?.toLowerCase() === userEmail || l.email?.toLowerCase() === userEmail)) return true
      if (userName && l.provider?.toLowerCase() === userName) return true
      return false
    }

    const isTargetWithdrawal = (w) => {
      if (!w) return false
      if (userId && (String(w.providerId) === userId || String(w.userId) === userId)) return true
      if (userEmail && w.providerEmail?.toLowerCase() === userEmail) return true
      if (userName && (w.providerName?.toLowerCase() === userName || w.provider?.toLowerCase() === userName)) return true
      return false
    }

    const isTargetTxn = (t) => {
      if (!t) return false
      if (userId && (String(t.customerId) === userId || String(t.providerId) === userId)) return true
      if (userEmail && (t.customerEmail?.toLowerCase() === userEmail || t.providerEmail?.toLowerCase() === userEmail)) return true
      if (userName && (t.customer?.toLowerCase() === userName || t.provider?.toLowerCase() === userName)) return true
      return false
    }

    // 2a. Global bookings in platform_settings
    const { data: gBookingsRow } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'serviceq_global_bookings')
      .maybeSingle()

    if (gBookingsRow?.value) {
      try {
        const list = JSON.parse(gBookingsRow.value) || []
        const filtered = list.filter((b) => !isTargetBooking(b))
        await supabase.from('platform_settings').upsert({
          key: 'serviceq_global_bookings',
          value: JSON.stringify(filtered),
          updated_at: new Date().toISOString(),
        })
      } catch {}
    }

    // 2b. Backend listings in platform_settings
    const { data: gListingsRow } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'serviceq_backend_listings')
      .maybeSingle()

    if (gListingsRow?.value) {
      try {
        const list = JSON.parse(gListingsRow.value) || []
        const filtered = list.filter((l) => !isTargetListing(l))
        await supabase.from('platform_settings').upsert({
          key: 'serviceq_backend_listings',
          value: JSON.stringify(filtered),
          updated_at: new Date().toISOString(),
        })
      } catch {}
    }

    // 2c. Backend withdrawals in platform_settings
    const { data: gWdRow } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'serviceq_backend_withdrawals')
      .maybeSingle()

    if (gWdRow?.value) {
      try {
        const list = JSON.parse(gWdRow.value) || []
        const filtered = list.filter((w) => !isTargetWithdrawal(w))
        await supabase.from('platform_settings').upsert({
          key: 'serviceq_backend_withdrawals',
          value: JSON.stringify(filtered),
          updated_at: new Date().toISOString(),
        })
      } catch {}
    }

    // 2d. Delete any platform_settings keys specifically created for this user
    if (userId) {
      await supabase.from('platform_settings').delete().ilike('key', `%${userId}%`)
    }
    if (userEmail) {
      await supabase.from('platform_settings').delete().ilike('key', `%${userEmail}%`)
    }
  } catch (err) {
    console.warn('[deleteAccountCompletely] platform_settings clean warning:', err.message)
  }

  // ── 3. Clean LocalStorage Data ──────────────────────────────────────
  try {
    // 3a. Record in serviceq_deleted_users
    const deletedUsers = JSON.parse(localStorage.getItem('serviceq_deleted_users')) || []
    const identifier = {
      id: userId,
      email: userEmail,
      name: userName,
      deletedAt: new Date().toISOString(),
    }
    // De-duplicate
    const updatedDeletedUsers = [
      identifier,
      ...deletedUsers.filter((u) => u.id !== userId && u.email !== userEmail),
    ]
    localStorage.setItem('serviceq_deleted_users', JSON.stringify(updatedDeletedUsers))

    // 3b. Filter all known array-based keys in localStorage
    const filterLocalStorageArray = (storageKey, filterFn) => {
      try {
        const raw = localStorage.getItem(storageKey)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter(filterFn)
            localStorage.setItem(storageKey, JSON.stringify(filtered))
          }
        }
      } catch {}
    }

    const matchesUser = (item) => {
      if (!item) return false
      const itemCustomerId = item.customerId ? String(item.customerId) : null
      const itemProviderId = item.providerId ? String(item.providerId) : null
      const itemUserId = item.userId ? String(item.userId) : null
      const itemEmail = (item.customerEmail || item.providerEmail || item.email || '').toLowerCase().trim()
      const itemName = (item.customer || item.provider || item.name || item.providerName || '').toLowerCase().trim()

      if (userId && (itemCustomerId === userId || itemProviderId === userId || itemUserId === userId)) return true
      if (userEmail && itemEmail === userEmail) return true
      if (userName && itemName === userName) return true
      return false
    }

    // Bookings
    filterLocalStorageArray('serviceq_all_bookings', (b) => !matchesUser(b))
    filterLocalStorageArray('serviceq_customer_bookings', (b) => !matchesUser(b))
    filterLocalStorageArray('serviceq_backend_bookings', (b) => !matchesUser(b))
    filterLocalStorageArray('serviceq_bookings', (b) => !matchesUser(b))

    // Listings
    filterLocalStorageArray('serviceq_custom_listings', (l) => !matchesUser(l))
    filterLocalStorageArray('serviceq_backend_listings', (l) => !matchesUser(l))
    filterLocalStorageArray('serviceq_provider_listings', (l) => !matchesUser(l))

    // Withdrawals & Transactions
    filterLocalStorageArray('serviceq_backend_withdrawals', (w) => !matchesUser(w))
    filterLocalStorageArray('serviceq_withdrawals', (w) => !matchesUser(w))
    filterLocalStorageArray('serviceq_backend_transactions', (t) => !matchesUser(t))
    filterLocalStorageArray('serviceq_transactions', (t) => !matchesUser(t))

    // Reviews
    filterLocalStorageArray('serviceq_reviews', (r) => !matchesUser(r))

    // 3c. Wipe all user-keyed entries in localStorage
    const allKeys = Object.keys(localStorage)
    allKeys.forEach((key) => {
      const lowerKey = key.toLowerCase()
      const matchId = userId && lowerKey.includes(userId.toLowerCase())
      const matchEmail = userEmail && lowerKey.includes(userEmail)
      if (matchId || matchEmail) {
        localStorage.removeItem(key)
      }
    })

    // Wipe active session profile if deleting currently active user
    try {
      const activeProf = JSON.parse(localStorage.getItem('serviceq_auth_profile') || '{}')
      if (activeProf.id === userId || (activeProf.email && userEmail && activeProf.email.toLowerCase() === userEmail)) {
        localStorage.removeItem('serviceq_auth_profile')
        localStorage.removeItem('serviceq_customer_favorites')
      }
    } catch {}

    // Wipe cached provider registration if email matches
    try {
      const latestReg = JSON.parse(localStorage.getItem('serviceq_latest_provider_registered') || '{}')
      if (latestReg.email && userEmail && latestReg.email.toLowerCase() === userEmail) {
        localStorage.removeItem('serviceq_latest_provider_registered')
      }
    } catch {}

    // 3d. Record in Audit Log
    try {
      const existingAudit = JSON.parse(localStorage.getItem('serviceq_audit_log')) || []
      const logEntry = {
        id: `a-${Date.now()}`,
        staff: initiator,
        role: initiator.toLowerCase().includes('admin') ? 'Admin' : 'System',
        action: 'Account Permanently Deleted',
        target: userEmail || userName || userId,
        desc: `Permanently deleted ${userRole} account "${userName}" (${userEmail}). All database records, bookings, listings, transactions, and local storage caches purged.`,
        before: { status: 'active', email: userEmail, id: userId },
        after: { status: 'deleted_purged' },
        ts: new Date().toISOString(),
      }
      localStorage.setItem('serviceq_audit_log', JSON.stringify([logEntry, ...existingAudit]))
    } catch {}

    // 3e. Dispatch storage & window events so all UI pages update immediately
    window.dispatchEvent(new Event('serviceq_bookings_updated'))
    window.dispatchEvent(new Event('serviceq_listings_updated'))
    window.dispatchEvent(new Event('serviceq_financials_updated'))
    window.dispatchEvent(new Event('storage'))
  } catch (err) {
    console.error('[deleteAccountCompletely] LocalStorage cleaning error:', err)
  }

  return { success: true }
}
