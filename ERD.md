# ServiceQ — Entity Relationship Diagram (ERD)

> Database: **Supabase PostgreSQL**  
> All tables use **UUID** primary keys. `auth.users` is managed by Supabase Auth.

---

## ERD Diagram

```mermaid
erDiagram
    auth_users {
        uuid id PK
        text email
        jsonb raw_user_meta_data
        timestamptz created_at
    }

    profiles {
        uuid id PK FK
        enum role
        text full_name
        text email
        text phone
        text avatar_url
        text address
        text city
        text province
        text barangay
        text postal_code
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    providers {
        uuid id PK
        uuid user_id FK
        text business_name
        text business_description
        text[] provider_type
        int years_experience
        time operating_hours_from
        time operating_hours_to
        text service_area
        text gov_id_type
        text gov_id_number
        text gov_id_photo_url
        text selfie_url
        enum kyc_status
        enum provider_status
        enum subscription_tier
        numeric subscription_expires_at
        text gcash_number
        text maya_number
        text bank_name
        text bank_account_name
        text bank_account_number
        numeric total_earnings
        numeric available_balance
        timestamptz created_at
        timestamptz updated_at
    }

    listings {
        uuid id PK
        uuid provider_id FK
        text title
        text description
        enum type
        text category
        text[] photos
        numeric price_per_unit
        text price_unit
        text location
        text city
        text province
        numeric rating_avg
        int rating_count
        int min_booking_days
        int max_booking_days
        enum status
        timestamptz created_at
        timestamptz updated_at
    }

    listing_availability {
        uuid id PK
        uuid listing_id FK
        date available_date
        boolean is_available
    }

    listing_blocked_dates {
        uuid id PK
        uuid listing_id FK
        date blocked_date
        text reason
    }

    bookings {
        uuid id PK
        text booking_ref
        uuid customer_id FK
        uuid provider_id FK
        uuid listing_id FK
        date start_date
        date end_date
        int duration_days
        numeric subtotal
        numeric platform_fee
        numeric total_amount
        enum payment_method
        text payment_reference
        enum status
        text cancellation_reason
        text notes
        timestamptz created_at
        timestamptz updated_at
    }

    reviews {
        uuid id PK
        uuid booking_id FK
        uuid reviewer_id FK
        uuid listing_id FK
        int rating
        text comment
        timestamptz created_at
    }

    favorites {
        uuid id PK
        uuid customer_id FK
        uuid listing_id FK
        timestamptz created_at
    }

    withdrawals {
        uuid id PK
        uuid provider_id FK
        numeric amount
        text payout_method
        text account_name
        text account_number
        enum status
        text rejection_reason
        timestamptz requested_at
        timestamptz processed_at
    }

    disputes {
        uuid id PK
        uuid booking_id FK
        uuid raised_by FK
        text reason
        text description
        enum status
        text resolution
        timestamptz created_at
        timestamptz resolved_at
    }

    reports {
        uuid id PK
        uuid reporter_id FK
        uuid listing_id FK
        text reason
        text description
        enum status
        timestamptz created_at
    }

    admin_staff {
        uuid id PK FK
        enum admin_role
        boolean is_active
        timestamptz created_at
    }

    audit_logs {
        uuid id PK
        uuid staff_id FK
        text action
        text target_table
        text target_id
        text description
        jsonb before_data
        jsonb after_data
        text ip_address
        timestamptz created_at
    }

    platform_settings {
        text key PK
        text value
        text description
        timestamptz updated_at
    }

    categories {
        uuid id PK
        text name
        text slug
        text icon
        boolean is_active
    }

    faqs {
        uuid id PK
        text question
        text answer
        int sort_order
        boolean is_published
    }

    auth_users ||--|| profiles : "auto-created on signup"
    profiles ||--o| providers : "1 user = 1 provider profile"
    profiles ||--o{ bookings : "customer_id"
    profiles ||--o{ reviews : "reviewer_id"
    profiles ||--o{ favorites : "customer_id"
    profiles ||--o{ disputes : "raised_by"
    profiles ||--o{ reports : "reporter_id"
    profiles ||--o| admin_staff : "admin account"
    providers ||--o{ listings : "owns many listings"
    providers ||--o{ bookings : "receives bookings"
    providers ||--o{ withdrawals : "requests payouts"
    listings ||--o{ listing_availability : "has availability calendar"
    listings ||--o{ listing_blocked_dates : "has blocked dates"
    listings ||--o{ bookings : "is booked"
    listings ||--o{ reviews : "is reviewed"
    listings ||--o{ favorites : "is favorited"
    listings ||--o{ reports : "is reported"
    bookings ||--o| reviews : "generates 1 review"
    bookings ||--o| disputes : "may have 1 dispute"
    admin_staff ||--o{ audit_logs : "creates log entries"
```

---

## Table Descriptions

| Table | Purpose | Key Relationships |
|---|---|---|
| **`auth.users`** | Supabase Auth — stores login credentials | Auto-links to `profiles` via trigger |
| **`profiles`** | All user info (customer/provider/admin) | Extends `auth.users` 1:1 |
| **`providers`** | Provider-specific data (KYC, payout, subscription) | 1:1 with `profiles` |
| **`listings`** | All service and rental listings | Belongs to `providers` |
| **`listing_availability`** | Day-by-day availability calendar per listing | Belongs to `listings` |
| **`listing_blocked_dates`** | Dates blocked by provider (holidays, etc.) | Belongs to `listings` |
| **`bookings`** | Booking transactions linking customer ↔ provider ↔ listing | Links 3 tables |
| **`reviews`** | Customer ratings and comments after a booking | 1:1 with `bookings` |
| **`favorites`** | Customer wishlists / saved listings | Links `profiles` ↔ `listings` |
| **`withdrawals`** | Provider payout requests | Belongs to `providers` |
| **`disputes`** | Booking disputes raised by customers or providers | 1:1 with `bookings` |
| **`reports`** | Content reports on listings | Links `profiles` ↔ `listings` |
| **`admin_staff`** | Admin accounts with roles (superadmin, financial, support) | Extends `profiles` |
| **`audit_logs`** | Immutable record of every admin action | Belongs to `admin_staff` |
| **`platform_settings`** | Key-value store for global settings (fee %, etc.) | Standalone |
| **`categories`** | Listing categories (Services, Gadgets, etc.) | Standalone |
| **`faqs`** | Frequently asked questions content | Standalone |

---

## Key Relationships Summary

```
auth.users (Supabase Auth)
    └── profiles (1:1) — all users
            ├── providers (1:1) — if role = provider
            │       ├── listings (1:many)
            │       │       ├── listing_availability (1:many)
            │       │       ├── listing_blocked_dates (1:many)
            │       │       ├── reviews (1:many)
            │       │       ├── favorites (1:many)
            │       │       └── reports (1:many)
            │       ├── bookings (1:many) ← receives
            │       └── withdrawals (1:many)
            ├── bookings (1:many) ← places (as customer)
            │       ├── reviews (1:1)
            │       └── disputes (1:1)
            ├── favorites (1:many)
            ├── reports (1:many)
            └── admin_staff (1:1) — if role = admin
                    └── audit_logs (1:many)
```

---

## ENUMs Used

| ENUM | Values |
|---|---|
| `user_role` | `customer`, `provider`, `admin` |
| `provider_status` | `under_verification`, `approved`, `rejected`, `suspended` |
| `listing_type` | `service`, `rental_property`, `rental_item` |
| `listing_status` | `active`, `inactive`, `pending`, `archived` |
| `booking_status` | `pending`, `scheduled`, `active`, `completed`, `cancelled` |
| `payment_method` | `gcash`, `maya`, `bdo`, `bpi`, `metrobank` |
| `withdrawal_status` | `pending_review`, `verified`, `approved`, `processing`, `completed`, `rejected` |
| `subscription_tier` | `free`, `basic`, `premium` |
| `admin_role` | `superadmin`, `financial_staff`, `support_moderator` |
