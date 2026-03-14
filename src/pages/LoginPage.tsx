import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { toast } from 'sonner'
import GoogleAuthButton from '../components/GoogleAuthButton'

export default function LoginPage() {
  const login     = useAuthStore(s => s.login)
  const isLoading = useAuthStore(s => s.isLoading)
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await login(email, password)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
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

          {/* Google OAuth */}
          <GoogleAuthButton mode="login" />

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-800" />
            <span className="text-xs text-gray-600">or sign in with email</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          {/* Email/password */}
          <form onSubmit={handleSubmit} className="space-y-4">
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