-- ============================================================
--  ServiceQ — Supabase Database Schema
--  Run this in your Supabase SQL Editor (Dashboard → SQL)
-- ============================================================

-- ── Enable UUID extension ────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── ENUM types ───────────────────────────────────────────────
CREATE TYPE user_role          AS ENUM ('customer', 'provider', 'admin');
CREATE TYPE provider_status    AS ENUM ('under_verification', 'approved', 'rejected', 'suspended');
CREATE TYPE listing_type       AS ENUM ('service', 'rental_property', 'rental_item');
CREATE TYPE listing_status     AS ENUM ('active', 'inactive', 'pending', 'archived');
CREATE TYPE booking_status     AS ENUM ('pending', 'scheduled', 'active', 'completed', 'cancelled');
CREATE TYPE payment_method     AS ENUM ('gcash', 'maya', 'bdo', 'bpi', 'metrobank');
CREATE TYPE withdrawal_status  AS ENUM ('pending_review', 'verified', 'approved', 'processing', 'completed', 'rejected');
CREATE TYPE subscription_tier  AS ENUM ('free', 'basic', 'premium');
CREATE TYPE admin_role         AS ENUM ('superadmin', 'financial_staff', 'support_moderator');

-- ============================================================
-- 1. PROFILES  (extends auth.users)
-- ============================================================
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role          user_role    NOT NULL DEFAULT 'customer',
  full_name     TEXT         NOT NULL,
  email         TEXT         NOT NULL UNIQUE,
  phone         TEXT,
  avatar_url    TEXT,
  address       TEXT,
  city          TEXT,
  province      TEXT,
  barangay      TEXT,
  postal_code   TEXT,
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. PROVIDERS  (extended provider info)
-- ============================================================
CREATE TABLE providers (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_name        TEXT,
  business_description TEXT,
  provider_type        listing_type[],
  years_experience     INT,
  operating_hours_from TIME,
  operating_hours_to   TIME,
  service_area         TEXT,
  facebook_url         TEXT,
  instagram_url        TEXT,

  -- KYC / Verification
  gov_id_type          TEXT,
  gov_id_number        TEXT,
  gov_id_photo_url     TEXT,
  selfie_url           TEXT,
  status               provider_status  NOT NULL DEFAULT 'under_verification',
  verification_note    TEXT,
  verified_at          TIMESTAMPTZ,
  verified_by          UUID REFERENCES profiles(id),

  -- Payout info
  payout_method        payment_method,
  payout_account_name  TEXT,
  payout_account_number TEXT,
  payout_bank_name     TEXT,

  -- Subscription
  subscription_tier    subscription_tier NOT NULL DEFAULT 'free',
  subscription_expires TIMESTAMPTZ,

  -- Stats (denormalized for speed)
  total_bookings       INT    NOT NULL DEFAULT 0,
  completed_bookings   INT    NOT NULL DEFAULT 0,
  avg_rating           NUMERIC(3,2),
  total_customers      INT    NOT NULL DEFAULT 0,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================
-- 3. LISTINGS
-- ============================================================
CREATE TABLE listings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id     UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  listing_type    listing_type NOT NULL,
  category        TEXT NOT NULL,
  sub_category    TEXT,
  price           NUMERIC(12,2) NOT NULL,
  price_unit      TEXT NOT NULL DEFAULT 'per session', -- per hour / per day / per month etc.
  min_duration    INT,
  max_duration    INT,
  location_text   TEXT,
  city            TEXT,
  province        TEXT,
  barangay        TEXT,
  latitude        NUMERIC(10,7),
  longitude       NUMERIC(10,7),
  photos          TEXT[],
  status          listing_status NOT NULL DEFAULT 'pending',
  is_featured     BOOLEAN NOT NULL DEFAULT FALSE,

  -- Stats
  total_bookings  INT     NOT NULL DEFAULT 0,
  avg_rating      NUMERIC(3,2),
  view_count      INT     NOT NULL DEFAULT 0,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Listing availability (days/hours) ────────────────────────
CREATE TABLE listing_availability (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id  UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  day_of_week INT  NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
  from_time   TIME NOT NULL,
  to_time     TIME NOT NULL
);

-- ── Listing blocked/unavailable dates ───────────────────────
CREATE TABLE listing_blocked_dates (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id  UUID        NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  blocked_date DATE       NOT NULL,
  reason      TEXT
);

-- ============================================================
-- 4. BOOKINGS
-- ============================================================
CREATE TABLE bookings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_ref     TEXT NOT NULL UNIQUE,          -- e.g. SQ-XXXXXXX
  customer_id     UUID NOT NULL REFERENCES profiles(id),
  provider_id     UUID NOT NULL REFERENCES providers(id),
  listing_id      UUID NOT NULL REFERENCES listings(id),

  -- Schedule
  start_date      DATE        NOT NULL,
  end_date        DATE        NOT NULL,
  start_time      TIME,
  end_time        TIME,

  -- Financials
  subtotal        NUMERIC(12,2) NOT NULL,
  platform_fee    NUMERIC(12,2) NOT NULL,
  grand_total     NUMERIC(12,2) NOT NULL,
  fee_percent     INT          NOT NULL DEFAULT 10,

  -- Payment
  payment_method  payment_method,
  payment_status  TEXT         NOT NULL DEFAULT 'pending', -- pending / paid / refunded
  paid_at         TIMESTAMPTZ,

  -- Booking status
  status          booking_status NOT NULL DEFAULT 'pending',

  -- Cancellation
  cancelled_at    TIMESTAMPTZ,
  cancelled_by    UUID REFERENCES profiles(id),
  cancel_reason   TEXT,
  cancel_note     TEXT,

  -- Payout
  payout_status   TEXT DEFAULT 'pending',        -- pending / released
  payout_released_at TIMESTAMPTZ,

  -- Dispute
  has_dispute     BOOLEAN NOT NULL DEFAULT FALSE,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. REVIEWS
-- ============================================================
CREATE TABLE reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id  UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id),
  listing_id  UUID NOT NULL REFERENCES listings(id),
  provider_id UUID NOT NULL REFERENCES providers(id),
  rating      INT  NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(booking_id, reviewer_id)
);

-- ============================================================
-- 6. FAVORITES
-- ============================================================
CREATE TABLE favorites (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id  UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(customer_id, listing_id)
);

-- ============================================================
-- 7. WITHDRAWALS
-- ============================================================
CREATE TABLE withdrawals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id     UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  amount          NUMERIC(12,2) NOT NULL,
  payout_method   payment_method NOT NULL,
  account_name    TEXT,
  account_number  TEXT,
  bank_name       TEXT,
  status          withdrawal_status NOT NULL DEFAULT 'pending_review',
  rejection_note  TEXT,
  processed_by    UUID REFERENCES profiles(id),
  processed_at    TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 8. DISPUTES
-- ============================================================
CREATE TABLE disputes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id    UUID NOT NULL REFERENCES bookings(id),
  raised_by     UUID NOT NULL REFERENCES profiles(id),
  reason        TEXT NOT NULL,
  evidence_urls TEXT[],
  status        TEXT NOT NULL DEFAULT 'open',   -- open / resolved / dismissed
  resolution    TEXT,
  resolved_by   UUID REFERENCES profiles(id),
  resolved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 9. REPORTS (listing/user reports)
-- ============================================================
CREATE TABLE reports (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id  UUID NOT NULL REFERENCES profiles(id),
  target_type  TEXT NOT NULL,  -- 'listing' | 'user' | 'provider'
  target_id    UUID NOT NULL,
  reason       TEXT NOT NULL,
  details      TEXT,
  status       TEXT NOT NULL DEFAULT 'pending',  -- pending / reviewed / dismissed
  reviewed_by  UUID REFERENCES profiles(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 10. ADMIN STAFF
-- ============================================================
CREATE TABLE admin_staff (
  id          UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  admin_role  admin_role NOT NULL DEFAULT 'support_moderator',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  last_active TIMESTAMPTZ,
  created_by  UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 11. AUDIT LOGS  (immutable — no UPDATE/DELETE allowed)
-- ============================================================
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id    UUID REFERENCES profiles(id),
  action_type TEXT NOT NULL,
  target_type TEXT,             -- 'user' | 'provider' | 'listing' | 'booking' | 'withdrawal' | 'system'
  target_id   UUID,
  description TEXT NOT NULL,
  before_data JSONB,
  after_data  JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevent any modifications to audit_logs
CREATE RULE no_update_audit AS ON UPDATE TO audit_logs DO INSTEAD NOTHING;
CREATE RULE no_delete_audit AS ON DELETE TO audit_logs DO INSTEAD NOTHING;

-- ============================================================
-- 12. PLATFORM SETTINGS
-- ============================================================
CREATE TABLE platform_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_by  UUID REFERENCES profiles(id),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default settings
INSERT INTO platform_settings (key, value) VALUES
  ('platform_fee_percent', '10'),
  ('platform_name', 'ServiceQ'),
  ('platform_email', 'support@serviceq.ph'),
  ('maintenance_mode', 'false'),
  ('max_free_listings', '3'),
  ('max_basic_listings', '10'),
  ('max_premium_listings', '50');

-- ============================================================
-- 13. CATEGORIES
-- ============================================================
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  icon        TEXT,
  parent_id   UUID REFERENCES categories(id),
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed categories
INSERT INTO categories (name, slug, icon, sort_order) VALUES
  ('Services',             'services',       'Wrench',       1),
  ('Rental Properties',    'rental-props',   'Home',         2),
  ('Rental Items',         'rental-items',   'Package',      3),
  ('Gadgets & Tech',       'gadgets',        'Laptop',       4),
  ('Events & Equipment',   'events',         'PartyPopper',  5),
  ('Vehicles',             'vehicles',       'Car',          6),
  ('Tutoring & Lessons',   'tutoring',       'GraduationCap',7),
  ('Cleaning Services',    'cleaning',       'Sparkles',     8),
  ('Repairs & Maintenance','repairs',        'Hammer',       9);

-- ============================================================
-- 14. FAQs
-- ============================================================
CREATE TABLE faqs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question    TEXT NOT NULL,
  answer      TEXT NOT NULL,
  sort_order  INT  NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_listings_provider     ON listings(provider_id);
CREATE INDEX idx_listings_status       ON listings(status);
CREATE INDEX idx_listings_category     ON listings(category);
CREATE INDEX idx_listings_city         ON listings(city);
CREATE INDEX idx_bookings_customer     ON bookings(customer_id);
CREATE INDEX idx_bookings_provider     ON bookings(provider_id);
CREATE INDEX idx_bookings_listing      ON bookings(listing_id);
CREATE INDEX idx_bookings_status       ON bookings(status);
CREATE INDEX idx_reviews_listing       ON reviews(listing_id);
CREATE INDEX idx_reviews_provider      ON reviews(provider_id);
CREATE INDEX idx_withdrawals_provider  ON withdrawals(provider_id);
CREATE INDEX idx_audit_logs_staff      ON audit_logs(staff_id);
CREATE INDEX idx_audit_logs_created    ON audit_logs(created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews     ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites   ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports     ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs  ENABLE ROW LEVEL SECURITY;

-- ── Profiles ─────────────────────────────────────────────────
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public profiles readable for listings"
  ON profiles FOR SELECT USING (TRUE);  -- restrict further as needed

-- ── Listings ─────────────────────────────────────────────────
CREATE POLICY "Active listings are public"
  ON listings FOR SELECT USING (status = 'active');

CREATE POLICY "Providers manage own listings"
  ON listings FOR ALL USING (
    provider_id IN (
      SELECT id FROM providers WHERE user_id = auth.uid()
    )
  );

-- ── Bookings ─────────────────────────────────────────────────
CREATE POLICY "Customers view own bookings"
  ON bookings FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "Providers view their bookings"
  ON bookings FOR SELECT USING (
    provider_id IN (
      SELECT id FROM providers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Customers can create bookings"
  ON bookings FOR INSERT WITH CHECK (customer_id = auth.uid());

-- ── Reviews ──────────────────────────────────────────────────
CREATE POLICY "Reviews are public"
  ON reviews FOR SELECT USING (TRUE);

CREATE POLICY "Customers submit own reviews"
  ON reviews FOR INSERT WITH CHECK (reviewer_id = auth.uid());

-- ── Favorites ────────────────────────────────────────────────
CREATE POLICY "Customers manage own favorites"
  ON favorites FOR ALL USING (customer_id = auth.uid());

-- ── Withdrawals ──────────────────────────────────────────────
CREATE POLICY "Providers view own withdrawals"
  ON withdrawals FOR SELECT USING (
    provider_id IN (
      SELECT id FROM providers WHERE user_id = auth.uid()
    )
  );

-- ── Audit Logs ───────────────────────────────────────────────
CREATE POLICY "Admin staff can view audit logs"
  ON audit_logs FOR SELECT USING (
    auth.uid() IN (SELECT id FROM admin_staff WHERE is_active = TRUE)
  );

-- ============================================================
-- TRIGGERS — auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_providers_updated_at
  BEFORE UPDATE ON providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_withdrawals_updated_at
  BEFORE UPDATE ON withdrawals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TRIGGER — auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
