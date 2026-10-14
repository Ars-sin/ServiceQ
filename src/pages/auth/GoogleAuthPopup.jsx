import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { launchGoogleSignIn } from '@/lib/googleAuth'

/**
 * GoogleAuthPopup — Gateway route for Google authentication
 * Purely connects to Google's official OAuth flow via ServiceQ's Supabase project.
 */
export default function GoogleAuthPopup() {
  const [searchParams] = useSearchParams()
  const role = searchParams.get('role') || 'customer'

  useEffect(() => {
    document.title = 'Connecting to Google...'
    launchGoogleSignIn({ role })
  }, [role])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-base font-semibold text-gray-800">Redirecting to Google...</h2>
        <p className="text-xs text-gray-500 mt-1">Connecting to official Google Account Chooser</p>
      </div>
    </div>
  )
}
