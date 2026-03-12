import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { toast } from 'sonner'

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined

export default function RegisterPage() {
  const register   = useAuthStore(s => s.register)
  const clerkSync  = useAuthStore(s => s.clerkSync)
  const isLoading  = useAuthStore(s => s.isLoading)
  const navigate   = useNavigate()
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { toast.error('Passwords do not match'); return }
    if (password.length < 8)  { toast.error('Password must be at least 8 characters'); return }
    try {
      await register(name, email, password)
      toast.success('Account created!')
      navigate('/dashboard')
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Registration failed')
    }
  }

  async function handleGoogleRegister() {
    if (!CLERK_KEY) {
      toast.error('Add VITE_CLERK_PUBLISHABLE_KEY to .env to enable Google sign-up')
      return
    }
    try {
      const { SignUp } = await import('@clerk/clerk-react')
      toast.info('Use the Google button to continue')
    } catch {
      toast.error('Clerk not configured')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4 py-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl gradient-btn flex items-center justify-center text-sm font-bold text-white">VB</div>
            <span className="text-xl font-bold text-white">VoiceBridge</span>
          </div>
          <p className="text-gray-500 text-sm">Create your AI receptionist account</p>
        </div>

        <div className="glass rounded-2xl p-8 border border-gray-800">
          <h2 className="text-xl font-bold text-white mb-6">Create account</h2>

          {/* Google OAuth */}
          {CLERK_KEY ? (
            <ClerkGoogleSignUp onSuccess={async (clerkId, email, name) => {
              try {
                await clerkSync(clerkId, email, name)
                toast.success('Account created!')
                navigate('/dashboard')
              } catch (err: unknown) {
                toast.error((err as Error).message)
              }
            }} />
          ) : (
            <button
              onClick={handleGoogleRegister}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-gray-100 text-gray-800 font-medium rounded-xl mb-4 transition-colors text-sm"
            >
              <GoogleIcon />
              Sign up with Google
            </button>
          )}

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-800" />
            <span className="text-xs text-gray-600">or register with email</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-gray-900/80 border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 text-sm transition-colors"
                placeholder="Emeka Okafor"
              />
            </div>
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
                placeholder="Min. 8 characters"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1.5">Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-gray-900/80 border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 text-sm transition-colors"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 gradient-btn text-white font-semibold rounded-xl disabled:opacity-50 text-sm"
            >
              {isLoading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function ClerkGoogleSignUp({ onSuccess }: {
  onSuccess: (clerkId: string, email: string, name: string) => Promise<void>
}) {
  const [loading, setLoading] = useState(false)
  return (
    <button
      onClick={() => {
        setLoading(true)
        // Clerk handles Google OAuth — onSuccess triggered via ClerkOAuthWatcher in App
        try {
          const { SignUpButton } = require('@clerk/clerk-react') as typeof import('@clerk/clerk-react')
          toast.info('Complete Google sign-up in the popup')
        } catch { toast.error('Clerk not configured') }
        setLoading(false)
      }}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-gray-100 text-gray-800 font-medium rounded-xl mb-4 transition-colors text-sm disabled:opacity-60"
    >
      <GoogleIcon />
      {loading ? 'Connecting…' : 'Sign up with Google'}
    </button>
  )
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
