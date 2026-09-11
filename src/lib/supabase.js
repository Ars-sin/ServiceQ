import { createClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────
//  Supabase client
//  The anon/public key is safe to expose in client-side code.
//  Security is enforced via Supabase Row Level Security (RLS).
// ─────────────────────────────────────────────────────────────

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
  ?? 'https://tgmpyqdulaiwxyqeqxux.supabase.co'

const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY
  ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbXB5cWR1bGFpd3h5cWVxeHV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5NTcyMTgsImV4cCI6MjEwNDUzMzIxOH0.2q7CS_AlIrXHpZQjHiETSqgJVWj3_uKSM1mKyXtVMK4'

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    autoRefreshToken:   true,
    persistSession:     true,
    detectSessionInUrl: true,
  },
})
