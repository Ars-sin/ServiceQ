/**
 * clearDatabase.mjs
 * Clears all non-admin data from the ServiceQ Supabase database.
 * Keeps: profiles where role = 'admin' | 'superadmin'
 * Keeps: platform_settings keys starting with 'serviceq_admin_'
 * Deletes: providers, listings, bookings, reviews, all other platform_settings
 * Run: node scripts/clearDatabase.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = 'https://tgmpyqdulaiwxyqeqxux.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbXB5cWR1bGFpd3h5cWVxeHV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5NTcyMTgsImV4cCI6MjEwNDUzMzIxOH0.2q7CS_AlIrXHpZQjHiETSqgJVWj3_uKSM1mKyXtVMK4'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

async function run() {
  console.log('🧹 Starting ServiceQ database cleanup...\n')

  // ── 1. profiles — delete all non-admin rows ──────────────────────────────
  try {
    const { data: adminRows } = await supabase
      .from('profiles')
      .select('id, email, role')
      .in('role', ['admin', 'superadmin'])

    console.log(`✅ Keeping ${adminRows?.length ?? 0} admin profile(s):`)
    adminRows?.forEach(r => console.log(`   • ${r.email} (${r.role})`))

    const adminIds = (adminRows || []).map(r => r.id)

    const { error: delProfErr, count: delProfCount } = await supabase
      .from('profiles')
      .delete({ count: 'exact' })
      .not('id', 'in', adminIds.length > 0 ? `(${adminIds.join(',')})` : '(00000000-0000-0000-0000-000000000000)')

    if (delProfErr) console.warn('  profiles delete warning:', delProfErr.message)
    else console.log(`🗑  Deleted ${delProfCount ?? '?'} non-admin profile(s)\n`)
  } catch (e) { console.warn('profiles step error:', e.message) }

  // ── 2. providers — delete all rows ──────────────────────────────────────
  try {
    const { error, count } = await supabase
      .from('providers')
      .delete({ count: 'exact' })
      .neq('id', '00000000-0000-0000-0000-000000000000') // match all

    if (error) console.warn('  providers delete warning:', error.message)
    else console.log(`🗑  Deleted ${count ?? 'all'} provider row(s)`)
  } catch (e) { console.warn('providers step error:', e.message) }

  // ── 3. listings — delete all rows ───────────────────────────────────────
  try {
    const { error, count } = await supabase
      .from('listings')
      .delete({ count: 'exact' })
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (error) console.warn('  listings delete warning (table may not exist):', error.message)
    else console.log(`🗑  Deleted ${count ?? 'all'} listing row(s)`)
  } catch (e) { console.warn('listings step error:', e.message) }

  // ── 4. bookings — delete all rows ────────────────────────────────────────
  try {
    const { error, count } = await supabase
      .from('bookings')
      .delete({ count: 'exact' })
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (error) console.warn('  bookings delete warning (table may not exist):', error.message)
    else console.log(`🗑  Deleted ${count ?? 'all'} booking row(s)`)
  } catch (e) { console.warn('bookings step error:', e.message) }

  // ── 5. reviews — delete all rows ─────────────────────────────────────────
  try {
    const { error, count } = await supabase
      .from('reviews')
      .delete({ count: 'exact' })
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (error) console.warn('  reviews delete warning (table may not exist):', error.message)
    else console.log(`🗑  Deleted ${count ?? 'all'} review row(s)`)
  } catch (e) { console.warn('reviews step error:', e.message) }

  // ── 6. platform_settings — delete non-admin keys ─────────────────────────
  try {
    const { data: allSettings } = await supabase
      .from('platform_settings')
      .select('key')

    const adminKeys = (allSettings || [])
      .map(r => r.key)
      .filter(k => k?.startsWith('serviceq_admin_'))

    const nonAdminKeys = (allSettings || [])
      .map(r => r.key)
      .filter(k => !k?.startsWith('serviceq_admin_'))

    console.log(`\n✅ Keeping ${adminKeys.length} admin platform_settings key(s):`)
    adminKeys.forEach(k => console.log(`   • ${k}`))

    if (nonAdminKeys.length > 0) {
      const { error, count } = await supabase
        .from('platform_settings')
        .delete({ count: 'exact' })
        .in('key', nonAdminKeys)

      if (error) console.warn('  platform_settings delete warning:', error.message)
      else console.log(`🗑  Deleted ${count ?? nonAdminKeys.length} non-admin setting(s)`)
    } else {
      console.log('   (no non-admin settings to delete)')
    }
  } catch (e) { console.warn('platform_settings step error:', e.message) }

  console.log('\n✅ Database cleanup complete!')
  console.log('ℹ️  Note: Auth users (Supabase Auth) require the Service Role key to delete.')
  console.log('   Go to Supabase Dashboard → Authentication → Users to manually remove non-admin auth accounts.\n')
}

run().catch(console.error)
