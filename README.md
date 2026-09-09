# ServiceQ – Rental & Services Marketplace

A location-based, multi-sided rental and services marketplace for the Philippines. Built with React + Vite, Tailwind CSS, Framer Motion, and Supabase.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS v3 |
| Animations | Framer Motion |
| Icons | Lucide React |
| Routing | React Router v6 |
| Backend / DB | Supabase (PostgreSQL + Auth + Storage) |
| Notifications | React Hot Toast |
| Utilities | date-fns, clsx, tailwind-merge |

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js v18+ (LTS recommended)
- A Supabase project ([supabase.com](https://supabase.com))

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
```
Fill in your Supabase URL and anon key from your Supabase project dashboard.

### 4. Set up the database
Go to your Supabase project → SQL Editor → paste the contents of `supabase/schema.sql` and run.

### 5. Start the dev server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173)

---

## 🔐 Portals & Role Switching

ServiceQ has **3 portals** accessible via the floating **Dev Role Switcher** (bottom-right corner in development):

| Portal | Path | Role |
|---|---|---|
| Customer | `/customer/dashboard` | Browse, book, manage bookings |
| Provider | `/provider/dashboard` | Manage listings, bookings, earnings |
| Admin | `/admin/dashboard` | Full platform management |

---

## 📁 Project Structure

```
src/
├── App.jsx                   # Root router
├── main.jsx                  # Entry point
├── index.css                 # Global styles + Tailwind
├── contexts/
│   └── AuthContext.jsx       # Auth state + dev role switcher
├── lib/
│   ├── supabase.js           # Supabase client
│   ├── utils.js              # Helpers (formatPHP, cn, etc.)
│   └── constants.js          # App-wide constants
├── components/
│   ├── dev/
│   │   └── DevRoleSwitcher.jsx
│   └── ui/
│       ├── Badge.jsx
│       ├── Button.jsx
│       ├── Input.jsx
│       ├── Modal.jsx
│       ├── Select.jsx
│       ├── StatCard.jsx
│       ├── Tabs.jsx
│       └── EmptyState.jsx
├── layouts/
│   ├── CustomerLayout.jsx
│   ├── ProviderLayout.jsx
│   └── AdminLayout.jsx
└── pages/
    ├── Landing.jsx
    ├── NotFound.jsx
    ├── auth/
    │   ├── LoginPage.jsx
    │   ├── RegisterPage.jsx
    │   └── ForgotPasswordPage.jsx
    ├── customer/
    │   ├── Dashboard.jsx
    │   ├── Listings.jsx
    │   ├── ListingDetail.jsx
    │   ├── Checkout.jsx
    │   ├── Bookings.jsx
    │   ├── Favorites.jsx
    │   └── Profile.jsx
    ├── provider/
    │   ├── Onboarding.jsx
    │   ├── Dashboard.jsx
    │   ├── Listings.jsx
    │   ├── Bookings.jsx
    │   ├── Earnings.jsx
    │   ├── Subscription.jsx
    │   └── Profile.jsx
    └── admin/
        ├── Dashboard.jsx
        ├── Users.jsx
        ├── Providers.jsx
        ├── Listings.jsx
        ├── Bookings.jsx
        ├── Financials.jsx
        ├── Staff.jsx
        ├── Settings.jsx
        └── AuditLog.jsx

supabase/
└── schema.sql                # Full DB schema + RLS + triggers
```

---

## 🇵🇭 Philippines Localization

- Currency: PHP (₱) via `formatPHP()` utility
- Payment: GCash, Maya, BDO, BPI, Metrobank
- Address: Province / City / Barangay / Postal Code
- Phone format: 09xxxxxxxxx
- Government ID types: PhilSys, Driver's License, Passport, SSS, GSIS, PRC, etc.

---

## 🏗️ Build for Production

```bash
npm run build
```
Output goes to `dist/`. Deploy to Vercel, Netlify, or any static host.

---

## 📋 License

Academic project — ServiceQ Group, 2026.
