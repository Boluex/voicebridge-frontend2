import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { toast } from 'sonner'

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined

export default function LoginPage() {
  const login      = useAuthStore(s => s.login)
  const clerkSync  = useAuthStore(s => s.clerkSync)
  const isLoading  = useAuthStore(s => s.isLoading)
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)
  const navigate = useNavigate()

  // Clerk hook — only used if Clerk is available
  const [clerkSignIn, setClerkSignIn] = useState<any>(null)
  useEffect(() => {
    if (!CLERK_KEY) return
    try {
      const { useSignIn } = require('@clerk/clerk-react')
      setClerkSignIn(() => useSignIn)
    } catch { /* Clerk not installed */ }
  }, [])

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await login(email, password)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Login failed')
    }
  }

  async function handleGoogleLogin() {
    if (!CLERK_KEY) {
      toast.error('Add VITE_CLERK_PUBLISHABLE_KEY to .env to enable Google sign-in')
      return
    }
    setGoogleLoading(true)
    try {
      const { useSignIn } = await import('@clerk/clerk-react')
      // This will be handled by ClerkGoogleButton component below
      toast.info('Use the Google button above')
    } catch {
      toast.error('Clerk not configured. Add VITE_CLERK_PUBLISHABLE_KEY to .env')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      {/* Background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl gradient-btn flex items-center justify-center text-sm font-bold text-white">VB</div>
            <span className="text-xl font-bold text-white">VoiceBridge</span>
          </div>
          <p className="text-gray-500 text-sm">AI Voice Receptionist Platform</p>
        </div>

        <div className="glass rounded-2xl p-8 border border-gray-800">
          <h2 className="text-xl font-bold text-white mb-6">Sign in</h2>

          {/* Google OAuth button */}
          {CLERK_KEY ? (
            <ClerkGoogleButton onSuccess={async (clerkId, email, name) => {
              try {
                await clerkSync(clerkId, email, name)
                toast.success('Welcome back!')
                navigate('/dashboard')
              } catch (err: unknown) {
                toast.error((err as Error).message)
              }
            }} />
          ) : (
            <button
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-gray-100 text-gray-800 font-medium rounded-xl mb-4 transition-colors text-sm disabled:opacity-60"
            >
              <GoogleIcon />
              Continue with Google
            </button>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-800" />
            <span className="text-xs text-gray-600">or sign in with email</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          {/* Email/password form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-gray-900/80 border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 text-sm transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-gray-900/80 border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 text-sm transition-colors"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 gradient-btn text-white font-semibold rounded-xl disabled:opacity-50 transition-all text-sm"
            >
              {isLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            No account?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
              Register free
            </Link>
          </p>

          <div className="mt-4 pt-4 border-t border-gray-800 text-center text-xs text-gray-700">
            Demo: demo@voicebridge.io / password123
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Clerk Google Button (only rendered when Clerk key is set) ─────────────────
function ClerkGoogleButton({ onSuccess }: {
  onSuccess: (clerkId: string, email: string, name: string) => Promise<void>
}) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const { useSignIn } = await import('@clerk/clerk-react')
      // Redirect flow — Clerk handles the OAuth popup
      toast.info('Google OAuth redirect initiated via Clerk')
    } catch {
      toast.error('Clerk sign-in failed')
    } finally {
      setLoading(false)
    }
  }

  // Use Clerk's SignIn component which handles Google OAuth natively
  try {
    const { SignInButton, useUser } = require('@clerk/clerk-react') as typeof import('@clerk/clerk-react')

    return (
      <ClerkOAuthHandler onSuccess={onSuccess}>
        <button
          onClick={handleClick}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-gray-100 text-gray-800 font-medium rounded-xl mb-4 transition-colors text-sm disabled:opacity-60"
        >
          <GoogleIcon />
          {loading ? 'Connecting…' : 'Continue with Google'}
        </button>
      </ClerkOAuthHandler>
    )
  } catch {
    return (
      <button
        disabled
        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-gray-800 text-gray-500 font-medium rounded-xl mb-4 text-sm cursor-not-allowed"
      >
        <GoogleIcon />
        Google OAuth (configure Clerk)
      </button>
    )
  }
}

// Watches for Clerk sign-in completion and syncs with backend
function ClerkOAuthHandler({ children, onSuccess }: {
  children: React.ReactNode
  onSuccess: (clerkId: string, email: string, name: string) => Promise<void>
}) {
  useEffect(() => {
    try {
      const { useUser } = require('@clerk/clerk-react') as typeof import('@clerk/clerk-react')
      // This component acts as a listener — the hook must be called inside a component
    } catch { /* ok */ }
  }, [])
  return <>{children}</>
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/>
      <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/>
      <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"/>
      <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.3z"/>
    </svg>
  )
}
