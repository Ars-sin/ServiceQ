import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnon) {
  console.warn(
    '⚠️  Supabase env vars not set. ' +
    'Copy .env.example → .env and fill in your project credentials.'
  )
}

export const supabase = createClient(
  supabaseUrl  ?? 'https://placeholder.supabase.co',
  supabaseAnon ?? 'placeholder-anon-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession:   true,
      detectSessionInUrl: true,
    },
  }
)
