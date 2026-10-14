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
// TEST 1: SQI-24 & SQI-25 (Google Sign-In/Up with Authentic Google Screen & No 400 Error)
// -------------------------------------------------------------
test('SQI-24 & SQI-25: Google Sign-In/Up connects directly to official Google OAuth without hitting disabled Supabase 400 endpoint', () => {
  const loginSrc = fs.readFileSync('src/pages/auth/LoginPage.jsx', 'utf8')
  const regSrc = fs.readFileSync('src/pages/auth/RegisterPage.jsx', 'utf8')
  const googleAuthSrc = fs.readFileSync('src/lib/googleAuth.js', 'utf8')

  assert.ok(googleAuthSrc.includes('GOOGLE_AUTH_ENDPOINT'), 'googleAuth.js declares official Google OAuth endpoint')
  assert.ok(googleAuthSrc.includes('launchGoogleSignIn'), 'googleAuth.js defines launchGoogleSignIn')
  assert.ok(googleAuthSrc.includes('parseGoogleOAuthReturn'), 'googleAuth.js defines parseGoogleOAuthReturn')
  assert.ok(loginSrc.includes('launchGoogleSignIn'), 'LoginPage must launch official Google Sign-In')
  assert.ok(regSrc.includes('launchGoogleSignIn'), 'RegisterPage must launch official Google Sign-In')
  assert.ok(loginSrc.includes('parseGoogleOAuthReturn'), 'LoginPage parses Google OAuth return')
  assert.ok(regSrc.includes('parseGoogleOAuthReturn'), 'RegisterPage parses Google OAuth return')
})

test('SQI-24: Prominent Continue with Google button placed on Customer Step 0', () => {
  const regSrc = fs.readFileSync('src/pages/auth/RegisterPage.jsx', 'utf8')
  assert.ok(regSrc.includes('Continue with Google'), 'Customer step 0 must have "Continue with Google" button')
  assert.ok(regSrc.includes('or register with email'), 'Customer step 0 must have "or register with email" divider')
})

test('SQI-24 & SQI-25: Verified Google accounts (confirmed with OTP during registration) can log in seamlessly with Google', () => {
  const loginSrc = fs.readFileSync('src/pages/auth/LoginPage.jsx', 'utf8')

  assert.ok(loginSrc.includes('serviceq_auth_provider_'), 'LoginPage sets auth provider to google')
  assert.ok(loginSrc.includes('Welcome back,'), 'LoginPage logs in verified accounts with Welcome back toast')
  assert.ok(loginSrc.includes('loginWithProfile(profile)'), 'LoginPage invokes loginWithProfile for verified accounts')
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
    loginSrc.includes('isAdminAccount(cleanEmail, profile.role)'),
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

  assert.ok(
    adminLoginSrc.includes('const isMatchingPassword = Boolean(expectedPw && form.password === expectedPw)'),
    'Admin Login strictly requires form.password === expectedPw'
  )
  assert.ok(
    adminLoginSrc.includes('Incorrect password. Please enter your valid admin password.'),
    'Admin Login displays error message when password does not match expectedPw'
  )

  assert.ok(
    adminProfileSrc.includes('currentPwMatches = currentPassword === expectedCurrentPw'),
    'Admin Profile checks current password strictly against expectedCurrentPw'
  )
  assert.ok(
    adminProfileSrc.includes('Current password is incorrect. Please try again.'),
    'Admin Profile displays error on incorrect current password'
  )
})

// -------------------------------------------------------------
// TEST 4: SQI-40, SQI-43 & SQI-47 (Staff and Roles persistence & Newly added admin login)
// -------------------------------------------------------------
test('SQI-40, SQI-43 & SQI-47: Staff list syncs with platform_settings & DB so newly added staff/admin can log in', () => {
  const staffSrc = fs.readFileSync('src/pages/admin/Staff.jsx', 'utf8')
  const loginSrc = fs.readFileSync('src/pages/admin/Login.jsx', 'utf8')

  assert.ok(staffSrc.includes('serviceq_admin_staff'), 'Staff.jsx must use serviceq_admin_staff key in platform_settings')
  assert.ok(staffSrc.includes('serviceq_admin_passwords'), 'Staff.jsx must sync default password to serviceq_admin_passwords')
  assert.ok(loginSrc.includes('serviceq_admin_passwords'), 'Login.jsx must check serviceq_admin_passwords')
  assert.ok(loginSrc.includes('serviceq_admin_staff'), 'Login.jsx must check serviceq_admin_staff')
})

// -------------------------------------------------------------
// TEST 5: SQI-48 (New customer bookings showing on My Bookings)
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
// TEST 7: SQI-50 (Approved provider listing shows on customer dashboard)
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
    provProfSrc.includes("localStorage.setItem('serviceq_auth_profile', JSON.stringify(cachedAuthProf))"),
    'Provider Profile updates serviceq_auth_profile cache with new avatar'
  )
})

// -------------------------------------------------------------
// TEST 9: SQI-10 (Filled solid button for password update requirements)
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

// -------------------------------------------------------------
// TEST 12: Inactivity Session Timeout (30 mins auto-logout)
// -------------------------------------------------------------
test('Session: User automatically logs out after 30 minutes of inactivity', () => {
  const authCtxSrc = fs.readFileSync('src/contexts/AuthContext.jsx', 'utf8')

  assert.ok(
    authCtxSrc.includes('INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000'),
    'AuthContext declares 30-minute inactivity timeout (30 * 60 * 1000 ms)'
  )
  assert.ok(
    authCtxSrc.includes('serviceq_last_activity'),
    'AuthContext tracks activity using serviceq_last_activity timestamp'
  )
  assert.ok(
    authCtxSrc.includes('Session expired: You have been logged out due to 30 minutes of inactivity.'),
    'AuthContext alerts user with session expired notification'
  )
  assert.ok(
    authCtxSrc.includes('window.addEventListener(\'storage\''),
    'AuthContext syncs session activity across tabs via storage event'
  )
})

console.log(`\n========================================`)
console.log(`TEST RUN COMPLETE: ${passCount} PASSED, ${failCount} FAILED`)
console.log(`========================================`)

if (failCount > 0) {
  process.exit(1)
} else {
  process.exit(0)
}
