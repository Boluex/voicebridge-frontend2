/**
 * Google OAuth button using @react-oauth/google.
 * Directly launches the Google consent popup and sends the token
 * to our backend for verification and JWT issuance.
 */
import { useGoogleLogin } from '@react-oauth/google'
import { useState } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'

export default function GoogleAuthButton({ mode }: { mode: 'login' | 'register' }) {
  const [loading, setLoading] = useState(false)
  const loginWithGoogle = useAuthStore(s => s.loginWithGoogle)
  const navigate = useNavigate()

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true)
      try {
        await loginWithGoogle(tokenResponse.access_token)
        toast.success(mode === 'login' ? 'Welcome back!' : 'Account created!')
        navigate('/dashboard')
      } catch (err: unknown) {
        console.error('[Google Auth Error]', err)
        toast.error((err as Error).message || 'Google authentication failed')
      } finally {
        setLoading(false)
      }
    },
    onError: () => {
      console.error('[Google Auth Error]: User closed popup or failed.')
      toast.error('Google sign-in was cancelled or failed.')
    },
  })

  return (
    <button
      onClick={() => handleGoogleLogin()}
      disabled={loading}
      type="button"
      className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white/5 border border-gray-700 rounded-xl text-white text-sm font-medium hover:bg-white/10 hover:border-gray-600 transition-all mb-2 disabled:opacity-40"
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          Authenticating...
        </span>
      ) : (
        <>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.07A8 8 0 008.98 17z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </>
      )}
    </button>
  )
}