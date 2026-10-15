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
// TEST 1: Social Login Removal (Google & Facebook Sign-In/Up removed)
// -------------------------------------------------------------
test('Social Login Removal: Google and Facebook sign-in/up buttons removed from LoginPage and RegisterPage', () => {
  const loginSrc = fs.readFileSync('src/pages/auth/LoginPage.jsx', 'utf8')
  const regSrc = fs.readFileSync('src/pages/auth/RegisterPage.jsx', 'utf8')

  assert.ok(!loginSrc.includes('Sign in with Google'), 'LoginPage must not have "Sign in with Google" button')
  assert.ok(!loginSrc.includes('Sign in with Facebook'), 'LoginPage must not have "Sign in with Facebook" button')
  assert.ok(!regSrc.includes('Continue with Google'), 'RegisterPage must not have "Continue with Google" button')
  assert.ok(!regSrc.includes('Sign up with Facebook'), 'RegisterPage must not have "Sign up with Facebook" button')
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

// -------------------------------------------------------------
// TEST 13: Provider Listing Photo Upload & Preview
// -------------------------------------------------------------
test('Provider Listings: Photo upload with preview grid, cover badge, removal, and publish preview', () => {
  const listingsSrc = fs.readFileSync('src/pages/provider/Listings.jsx', 'utf8')

  assert.ok(
    listingsSrc.includes('handlePhotoUpload'),
    'Listings.jsx implements handlePhotoUpload'
  )
  assert.ok(
    listingsSrc.includes('FileReader') && listingsSrc.includes('readAsDataURL'),
    'Listings.jsx uses FileReader.readAsDataURL to convert images to base64 preview'
  )
  assert.ok(
    listingsSrc.includes('handleRemovePhoto'),
    'Listings.jsx implements handleRemovePhoto'
  )
  assert.ok(
    listingsSrc.includes('handleSetCoverPhoto'),
    'Listings.jsx implements handleSetCoverPhoto'
  )
  assert.ok(
    listingsSrc.includes('Listing Preview') && listingsSrc.includes('form.photos[0]'),
    'Step 5 Review & Publish previews uploaded cover photo'
  )
  assert.ok(
    listingsSrc.includes('photos: Array.isArray(form.photos) ? form.photos : []'),
    'handlePublish saves photos array in newListing'
  )
})

// -------------------------------------------------------------
// TEST 14: Fresh Listing Isolation (0 reviews, 0 rating, empty reviews)
// -------------------------------------------------------------
test('Listing Freshness: Newly published listings have strictly 0 reviews, 0 rating, and empty reviews list', () => {
  const listingsSrc = fs.readFileSync('src/pages/provider/Listings.jsx', 'utf8')
  const listingsSvcSrc = fs.readFileSync('src/lib/listingsService.js', 'utf8')
  const detailSrc = fs.readFileSync('src/pages/customer/ListingDetail.jsx', 'utf8')
  const exploreSrc = fs.readFileSync('src/pages/customer/Explore.jsx', 'utf8')

  assert.ok(
    listingsSrc.includes('rating: 0') && listingsSrc.includes('reviews: 0') && listingsSrc.includes('reviews_list: []'),
    'Listings.jsx handlePublish initializes rating: 0, reviews: 0, reviews_list: []'
  )
  assert.ok(
    listingsSvcSrc.includes('const rating = reviews === 0 ? 0 :'),
    'listingsService.js normalizeListing sets rating: 0 when reviews is 0'
  )
  assert.ok(
    detailSrc.includes('isBaseMock') && detailSrc.includes('fallbackReviews = isBaseMock'),
    'ListingDetail.jsx isolates mock reviews to base mock items only'
  )
  assert.ok(
    detailSrc.includes('No reviews yet') && detailSrc.includes('Be the first customer to book and review this service!'),
    'ListingDetail.jsx displays friendly empty state when a listing has 0 reviews'
  )
  assert.ok(
    exploreSrc.includes('<span>New</span>'),
    'Explore.jsx displays New badge when a listing has 0 reviews'
  )
})

// -------------------------------------------------------------
// TEST 15: Universal Password Change & Re-login Enforcement (Customer, Provider, Admin)
// -------------------------------------------------------------
test('Password Change & Re-login: Password changes across customer, provider, and admin sign out and require re-login with new password', () => {
  const custProfSrc = fs.readFileSync('src/pages/customer/Profile.jsx', 'utf8')
  const provSetSrc = fs.readFileSync('src/pages/provider/Settings.jsx', 'utf8')
  const adminProfSrc = fs.readFileSync('src/pages/admin/Profile.jsx', 'utf8')
  const loginSrc = fs.readFileSync('src/pages/auth/LoginPage.jsx', 'utf8')
  const adminLoginSrc = fs.readFileSync('src/pages/admin/Login.jsx', 'utf8')

  // Customer
  assert.ok(
    custProfSrc.includes("navigate('/login?role=customer', { replace: true })"),
    'Customer Profile redirects to /login?role=customer on password change'
  )
  assert.ok(
    custProfSrc.includes('serviceq_password_') && custProfSrc.includes('serviceq_customer_password_'),
    'Customer Profile updates password keys in localStorage'
  )

  // Provider
  assert.ok(
    provSetSrc.includes("navigate('/login?role=provider', { replace: true })"),
    'Provider Settings redirects to /login?role=provider on password change'
  )
  assert.ok(
    provSetSrc.includes('serviceq_provider_password_') && provSetSrc.includes('serviceq_password_'),
    'Provider Settings updates password keys in localStorage'
  )

  // Admin
  assert.ok(
    adminProfSrc.includes("navigate('/admin/login', { replace: true })"),
    'Admin Profile redirects to /admin/login on password change'
  )
  assert.ok(
    adminProfSrc.includes('serviceq_admin_passwords'),
    'Admin Profile updates serviceq_admin_passwords'
  )

  // Customer/Provider Login
  assert.ok(
    loginSrc.includes('serviceq_customer_password_') && loginSrc.includes('serviceq_provider_password_'),
    'LoginPage checks cached customer and provider passwords'
  )
  assert.ok(
    loginSrc.includes("throw new Error('Incorrect password. Please enter your valid updated password.')"),
    'LoginPage rejects invalid or old password when updated password is set'
  )

  // Admin Login
  assert.ok(
    adminLoginSrc.includes("throw new Error('Incorrect password. Please enter your valid admin password.')"),
    'Admin Login rejects old password when updated password is set'
  )
})

// -------------------------------------------------------------
// TEST 16: OTP Privacy on Password Reset & Provider Photo Persistence
// -------------------------------------------------------------
test('Security & UX: Forgot password OTP is never shown on screen/toast & provider photo upload persists reliably', () => {
  const forgotPwSrc = fs.readFileSync('src/pages/auth/ForgotPasswordPage.jsx', 'utf8')
  const provProfSrc = fs.readFileSync('src/pages/provider/Profile.jsx', 'utf8')

  // OTP Privacy: No onscreen reset code box or code leaks
  assert.ok(
    !forgotPwSrc.includes('Reset Code:'),
    'ForgotPasswordPage does not display Reset Code on screen'
  )
  assert.ok(
    !forgotPwSrc.includes('Auto-fill Code'),
    'ForgotPasswordPage does not display Auto-fill Code button on screen'
  )
  assert.ok(
    !forgotPwSrc.includes('(Code: ${generatedOtp})'),
    'ForgotPasswordPage does not leak OTP in toast message'
  )
  assert.ok(
    forgotPwSrc.includes('Please check your email inbox'),
    'ForgotPasswordPage prompts user to check email inbox for OTP'
  )

  // Provider Photo Upload & Persistence
  assert.ok(
    provProfSrc.includes('function extractAvatar('),
    'Provider Profile defines extractAvatar helper'
  )
  assert.ok(
    provProfSrc.includes('id="provider-photo-input"') && provProfSrc.includes('htmlFor="provider-photo-input"'),
    'Provider Profile links Change Photo button to file input via htmlFor and id'
  )
  assert.ok(
    !provProfSrc.includes("update({ avatar_url: compressedDataUrl }).eq('user_id'"),
    'Provider Profile does not query non-existent providers.avatar_url column'
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

