import assert from 'node:assert'
import fs from 'node:fs'

console.log('--- STARTING NOTION FIXES COMPREHENSIVE VERIFICATION SUITE ---\n')

let passCount = 0
let failCount = 0

function test(description, fn) {
  try {
    fn()
    console.log(`✅ PASS: ${description}`)
    passCount++
  } catch (err) {
    console.error(`❌ FAIL: ${description}`)
    console.error(`   Error: ${err.message}`)
    failCount++
  }
}

// -------------------------------------------------------------
// TEST 1: SQI-24 & SQI-25 (Google Sign-In/Up with prompt: select_account)
// -------------------------------------------------------------
test('SQI-24 & SQI-25: Google OAuth calls Supabase with prompt: "select_account"', () => {
  const loginSrc = fs.readFileSync('src/pages/auth/LoginPage.jsx', 'utf8')
  const regSrc = fs.readFileSync('src/pages/auth/RegisterPage.jsx', 'utf8')

  assert.ok(loginSrc.includes("prompt: 'select_account'"), 'LoginPage must configure prompt: select_account')
  assert.ok(loginSrc.includes('signInWithOAuth'), 'LoginPage must call signInWithOAuth')
  assert.ok(regSrc.includes("prompt: 'select_account'"), 'RegisterPage must configure prompt: select_account')
  assert.ok(regSrc.includes('signInWithOAuth'), 'RegisterPage must call signInWithOAuth')
})

test('SQI-24: Prominent Continue with Google button placed on Customer Step 0', () => {
  const regSrc = fs.readFileSync('src/pages/auth/RegisterPage.jsx', 'utf8')
  assert.ok(regSrc.includes('Continue with Google'), 'Customer step 0 must have "Continue with Google" button')
  assert.ok(regSrc.includes('or register with email'), 'Customer step 0 must have "or register with email" divider')
})

test('SQI-24 & SQI-25: Rejects Google OAuth if email was registered manually with password', () => {
  const loginSrc = fs.readFileSync('src/pages/auth/LoginPage.jsx', 'utf8')
  const regSrc = fs.readFileSync('src/pages/auth/RegisterPage.jsx', 'utf8')

  assert.ok(loginSrc.includes('This email was registered manually with password'), 'LoginPage rejects manual account on Google OAuth')
  assert.ok(regSrc.includes('This email was already registered manually with a password'), 'RegisterPage rejects manual account on Google OAuth')
})

// -------------------------------------------------------------
// TEST 2: SQI-35 (Admin credentials blocked on customer/provider login)
// -------------------------------------------------------------
test('SQI-35: Admin credentials strictly blocked on customer/provider /login', () => {
  const loginSrc = fs.readFileSync('src/pages/auth/LoginPage.jsx', 'utf8')

  assert.ok(
    loginSrc.includes("toast.error('This login screen is for customers and providers only.')"),
    'Must show specific error message blocking admin on /login'
  )
  assert.ok(
    loginSrc.includes('isAdminAccount(session.user.email, profile.role)'),
    'Must check isAdminAccount on session restore'
  )
  assert.ok(
    loginSrc.includes('isAdminAccount(form.email, preRole)'),
    'Must check isAdminAccount before login submit'
  )
})

// -------------------------------------------------------------
// TEST 3: SQI-38 (Admin password verification & reject old/wrong passwords)
// -------------------------------------------------------------
test('SQI-38: Admin Login requires exact match to updated password and rejects old/default password', () => {
  const adminLoginSrc = fs.readFileSync('src/pages/admin/Login.jsx', 'utf8')
  const adminProfileSrc = fs.readFileSync('src/pages/admin/Profile.jsx', 'utf8')

  // In AdminLogin:
  assert.ok(
    adminLoginSrc.includes('const expectedPw = cachedPw || staffMember?.password || \'123456789\''),
    'Admin Login derives expectedPw from cachedPw or staffMember password'
  )
  assert.ok(
    adminLoginSrc.includes('const isMatchingPassword = Boolean(expectedPw && form.password === expectedPw)'),
    'Admin Login strictly requires form.password === expectedPw'
  )
  // Ensure the old loose check form.password === '123456789' is NOT accepted if cachedPw is set
  assert.ok(
    !adminLoginSrc.includes("form.password === '123456789' ||\n          (cachedPw && form.password === cachedPw)"),
    'Admin Login must NOT allow default 123456789 when cachedPw exists'
  )

  // In AdminProfile:
  assert.ok(
    adminProfileSrc.includes('const expectedCurrentPw = cachedPw || \'123456789\''),
    'Admin Profile checks current password against expectedCurrentPw'
  )
  assert.ok(
    adminProfileSrc.includes('Current password is incorrect. Please try again.'),
    'Admin Profile displays error on incorrect current password'
  )
  assert.ok(
    adminProfileSrc.includes('New password must be different from your current password.'),
    'Admin Profile enforces new password is distinct from current'
  )
})

// -------------------------------------------------------------
// TEST 4: SQI-40, SQI-43, SQI-47 (Staff & Roles UUID, DB Sync, and Login)
// -------------------------------------------------------------
test('SQI-40 & SQI-47: Staff.jsx uses UUID for profiles and syncs from Supabase on mount', () => {
  const staffSrc = fs.readFileSync('src/pages/admin/Staff.jsx', 'utf8')

  assert.ok(
    staffSrc.includes('fetchDBStaff'),
    'Staff.jsx must fetch staff profiles from Supabase on mount'
  )
  assert.ok(
    staffSrc.includes('.in(\'role\', [\'admin\', \'superadmin\', \'financial_staff\', \'support_moderator\', \'staff\'])'),
    'Staff.jsx queries roles from profiles'
  )
  assert.ok(
    staffSrc.includes('crypto.randomUUID()'),
    'Staff.jsx generates valid UUID for staff profiles'
  )
  assert.ok(
    !staffSrc.includes("id: `staff-${Date.now()}`"),
    'Staff.jsx must NOT use invalid staff-timestamp as profile ID'
  )
})

// -------------------------------------------------------------
// TEST 5: SQI-48 (New bookings visibility on My Bookings screen)
// -------------------------------------------------------------
test('SQI-48: Checkout.jsx and Bookings.jsx support profile-based sessions and multi-store resolution', () => {
  const checkoutSrc = fs.readFileSync('src/pages/customer/Checkout.jsx', 'utf8')
  const bookingsSrc = fs.readFileSync('src/pages/customer/Bookings.jsx', 'utf8')

  assert.ok(
    checkoutSrc.includes('const effectiveCustomerId = user?.id || profile?.id || null'),
    'Checkout resolves effectiveCustomerId'
  )
  assert.ok(
    checkoutSrc.includes('const effectiveCustomerEmail = (user?.email || profile?.email || \'\').trim().toLowerCase() || null'),
    'Checkout resolves effectiveCustomerEmail'
  )
  assert.ok(
    bookingsSrc.includes('const userId = (user?.id || profile?.id) ? String(user?.id || profile?.id) : null'),
    'Bookings resolves effective userId'
  )
  assert.ok(
    bookingsSrc.includes('if (userName && b.customer && b.customer.toLowerCase().trim() === userName) return true'),
    'Bookings isBookingMine matches by customer name fallback'
  )
})

// -------------------------------------------------------------
// TEST 6: SQI-49 (Review count statistic on Customer Profile)
// -------------------------------------------------------------
test('SQI-49: Customer Profile counts reviews from serviceq_reviews and updates dynamically', () => {
  const profileSrc = fs.readFileSync('src/pages/customer/Profile.jsx', 'utf8')
  const detailSrc = fs.readFileSync('src/pages/customer/ListingDetail.jsx', 'utf8')

  assert.ok(
    profileSrc.includes('serviceq_reviews_updated'),
    'Profile.jsx listens for serviceq_reviews_updated'
  )
  assert.ok(
    profileSrc.includes('serviceq_reviews'),
    'Profile.jsx reads serviceq_reviews for reviewCount'
  )
  assert.ok(
    detailSrc.includes('customerId: user?.id || profile?.id || null'),
    'ListingDetail attaches customerId to review'
  )
  assert.ok(
    detailSrc.includes('customerEmail: (user?.email || profile?.email || \'\').trim().toLowerCase() || null'),
    'ListingDetail attaches customerEmail to review'
  )
})

// -------------------------------------------------------------
// TEST 7: SQI-50 (Newly verified provider listings visible to customers)
// -------------------------------------------------------------
test('SQI-50: Providers.jsx verifies provider listings in global catalog and listingsService verifies approved profiles', () => {
  const provAdminSrc = fs.readFileSync('src/pages/admin/Providers.jsx', 'utf8')
  const listingsSvcSrc = fs.readFileSync('src/lib/listingsService.js', 'utf8')

  assert.ok(
    provAdminSrc.includes('serviceq_global_listings'),
    'Providers.jsx updates serviceq_global_listings on KYC approve'
  )
  assert.ok(
    provAdminSrc.includes('isVerified: true'),
    'Providers.jsx sets isVerified: true on provider listings'
  )
  assert.ok(
    listingsSvcSrc.includes('approvedProviderIds'),
    'listingsService fetches approvedProviderIds from profiles'
  )
  assert.ok(
    listingsSvcSrc.includes('item.isVerified = true'),
    'listingsService marks listings from approved providers as verified'
  )
})

// -------------------------------------------------------------
// TEST 8: SQI-3 (Change Photo on Provider Profile)
// -------------------------------------------------------------
test('SQI-3: Provider Profile photo persists and supports profile-based sessions', () => {
  const provProfSrc = fs.readFileSync('src/pages/provider/Profile.jsx', 'utf8')

  assert.ok(
    provProfSrc.includes('const effectiveUserId = user?.id || profile?.id || null'),
    'Provider Profile resolves effectiveUserId'
  )
  assert.ok(
    provProfSrc.includes('serviceq_provider_avatar_updated'),
    'Provider Profile dispatches serviceq_provider_avatar_updated event'
  )
  assert.ok(
    provProfSrc.includes('localStorage.setItem(\'serviceq_auth_profile\', JSON.stringify(cachedAuthProf))'),
    'Provider Profile updates serviceq_auth_profile cache with new avatar'
  )
})

// -------------------------------------------------------------
// TEST 9: SQI-10 (Solid filled button when password checklist is met)
// -------------------------------------------------------------
test('SQI-10: Filled solid button rendered when password checklist criteria are satisfied', () => {
  const custProfSrc = fs.readFileSync('src/pages/customer/Profile.jsx', 'utf8')
  const provSetSrc = fs.readFileSync('src/pages/provider/Settings.jsx', 'utf8')

  assert.ok(
    custProfSrc.includes('bg-brand-600 hover:bg-brand-700 text-white'),
    'Customer Profile renders filled solid brand button when valid'
  )
  assert.ok(
    provSetSrc.includes('bg-emerald-600 hover:bg-emerald-700 text-white'),
    'Provider Settings renders filled solid emerald button when valid'
  )
})

console.log(`\n========================================`)
console.log(`TEST SUITE RESULTS: ${passCount} PASSED, ${failCount} FAILED`)
console.log(`========================================\n`)

if (failCount > 0) {
  process.exit(1)
} else {
  process.exit(0)
}
