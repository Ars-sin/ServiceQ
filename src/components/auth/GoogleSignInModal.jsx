import { useEffect } from 'react'
import { launchGoogleSignIn } from '@/lib/googleAuth'

/**
 * Deprecated mock modal — immediately redirects to official Google OAuth
 */
export default function GoogleSignInModal({ isOpen, onClose, loginRole = 'customer' }) {
  useEffect(() => {
    if (isOpen) {
      launchGoogleSignIn({ role: loginRole })
      onClose?.()
    }
  }, [isOpen, loginRole, onClose])

  return null
}
