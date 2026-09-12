# ServiceQ — Entity Relationship Diagram (ERD)

> Database: **Supabase PostgreSQL**  
> All tables use **UUID** primary keys. `auth.users` is managed by Supabase Auth.

---

## ERD Diagram

```mermaid
erDiagram
    AUTH_USERS {
        uuid id PK
        string email
        json raw_user_meta_data
        timestamp created_at
    }

    PROFILES {
        uuid id PK
        string role
        string full_name
        string email
        string phone
        string avatar_url
        string address
        string city
        string province
        string barangay
        string postal_code
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    PROVIDERS {
        uuid id PK
        uuid user_id FK
        string business_name
        string business_description
        string provider_type
        int years_experience
        string operating_hours_from
        string operating_hours_to
        string service_area
        string gov_id_type
        string gov_id_number
        string gov_id_photo_url
        string selfie_url
        string kyc_status
        string provider_status
        string subscription_tier
        string gcash_number
        string maya_number
        string bank_name
        string bank_account_name
        string bank_account_number
        numeric total_earnings
        numeric available_balance
        timestamp created_at
        timestamp updated_at
    }

    LISTINGS {
        uuid id PK
        uuid provider_id FK
        string title
        string description
        string type
        string category
        string photos
        numeric price_per_unit
        string price_unit
        string location
        string city
        string province
        numeric rating_avg
        int rating_count
        int min_booking_days
        int max_booking_days
        string status
        timestamp created_at
        timestamp updated_at
    }

    LISTING_AVAILABILITY {
        uuid id PK
        uuid listing_id FK
        date available_date
        boolean is_available
    }

    LISTING_BLOCKED_DATES {
        uuid id PK
        uuid listing_id FK
        date blocked_date
        string reason
    }

    BOOKINGS {
        uuid id PK
        string booking_ref
        uuid customer_id FK
        uuid provider_id FK
        uuid listing_id FK
        date start_date
        date end_date
        int duration_days
        numeric subtotal
        numeric platform_fee
        numeric total_amount
        string payment_method
        string payment_reference
        string status
        string cancellation_reason
        string notes
        timestamp created_at
        timestamp updated_at
    }

    REVIEWS {
        uuid id PK
        uuid booking_id FK
        uuid reviewer_id FK
        uuid listing_id FK
        int rating
        string comment
        timestamp created_at
    }

    FAVORITES {
        uuid id PK
        uuid customer_id FK
        uuid listing_id FK
        timestamp created_at
    }

    WITHDRAWALS {
        uuid id PK
        uuid provider_id FK
        numeric amount
        string payout_method
        string account_name
        string account_number
        string status
        string rejection_reason
        timestamp requested_at
        timestamp processed_at
    }

    DISPUTES {
        uuid id PK
        uuid booking_id FK
        uuid raised_by FK
        string reason
        string description
        string status
        string resolution
        timestamp created_at
        timestamp resolved_at
    }

    REPORTS {
        uuid id PK
        uuid reporter_id FK
        uuid listing_id FK
        string reason
        string description
        string status
        timestamp created_at
    }

    ADMIN_STAFF {
        uuid id PK
        string admin_role
        boolean is_active
        timestamp created_at
    }

    AUDIT_LOGS {
        uuid id PK
        uuid staff_id FK
        string action
        string target_table
        string target_id
        string description
        json before_data
        json after_data
        string ip_address
        timestamp created_at
    }

    PLATFORM_SETTINGS {
        string key PK
        string value
        string description
        timestamp updated_at
    }

    CATEGORIES {
        uuid id PK
        string name
        string slug
        string icon
        boolean is_active
    }

    FAQS {
        uuid id PK
        string question
        string answer
        int sort_order
        boolean is_published
    }

    AUTH_USERS ||--|| PROFILES : "auto-created on signup"
    PROFILES ||--o| PROVIDERS : "1 user = 1 provider profile"
    PROFILES ||--o{ BOOKINGS : "places as customer"
    PROFILES ||--o{ REVIEWS : "writes review"
    PROFILES ||--o{ FAVORITES : "saves listing"
    PROFILES ||--o{ DISPUTES : "raises dispute"
    PROFILES ||--o{ REPORTS : "reports listing"
    PROFILES ||--o| ADMIN_STAFF : "admin account"
    PROVIDERS ||--o{ LISTINGS : "owns many listings"
    PROVIDERS ||--o{ BOOKINGS : "receives bookings"
    PROVIDERS ||--o{ WITHDRAWALS : "requests payouts"
    LISTINGS ||--o{ LISTING_AVAILABILITY : "availability calendar"
    LISTINGS ||--o{ LISTING_BLOCKED_DATES : "blocked dates"
    LISTINGS ||--o{ BOOKINGS : "is booked"
    LISTINGS ||--o{ REVIEWS : "is reviewed"
    LISTINGS ||--o{ FAVORITES : "is favorited"
    LISTINGS ||--o{ REPORTS : "is reported"
    BOOKINGS ||--o| REVIEWS : "generates 1 review"
    BOOKINGS ||--o| DISPUTES : "may have 1 dispute"
    ADMIN_STAFF ||--o{ AUDIT_LOGS : "creates log entries"
```

---

## Table Descriptions

| Table | Purpose | Key Relationships |
|---|---|---|
| **`auth.users`** | Supabase Auth — stores login credentials | Auto-links to `profiles` via trigger |
| **`profiles`** | All user info (customer / provider / admin) | Extends `auth.users` 1:1 |
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
| **`admin_staff`** | Admin accounts with roles | Extends `profiles` |
| **`audit_logs`** | Immutable record of every admin action | Belongs to `admin_staff` |
| **`platform_settings`** | Key-value store for global settings (fee %, etc.) | Standalone |
| **`categories`** | Listing categories (Services, Gadgets, etc.) | Standalone |
| **`faqs`** | Frequently asked questions content | Standalone |

---

## Relationship Summary

```
AUTH_USERS (Supabase Auth)
    └── PROFILES (1:1)
            ├── PROVIDERS (1:1) — role = provider
            │       ├── LISTINGS (1:many)
            │       │       ├── LISTING_AVAILABILITY (1:many)
            │       │       ├── LISTING_BLOCKED_DATES (1:many)
            │       │       ├── REVIEWS (1:many)
            │       │       ├── FAVORITES (1:many)
            │       │       └── REPORTS (1:many)
            │       ├── BOOKINGS (1:many) ← receives
            │       └── WITHDRAWALS (1:many)
            ├── BOOKINGS (1:many) ← places as customer
            │       ├── REVIEWS (1:1)
            │       └── DISPUTES (1:1)
            ├── FAVORITES (1:many)
            ├── REPORTS (1:many)
            └── ADMIN_STAFF (1:1) — role = admin
                    └── AUDIT_LOGS (1:many)
```

---

## ENUM Reference

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
