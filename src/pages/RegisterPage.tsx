import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { toast } from 'sonner'
import GoogleAuthButton from '../components/GoogleAuthButton'

export default function RegisterPage() {
  const register  = useAuthStore(s => s.register)
  const isLoading = useAuthStore(s => s.isLoading)
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    try {
      await register(name, email, password)
      toast.success('Account created! Welcome to VoiceBridge 🎙️')
      navigate('/dashboard')
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Registration failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl" />
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
          <h2 className="text-xl font-bold text-white mb-1">Create your account</h2>
          <p className="text-gray-500 text-sm mb-6">Free to start — no credit card needed</p>

          {/* Google OAuth */}
          <GoogleAuthButton mode="register" />

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-800" />
            <span className="text-xs text-gray-600">or register with email</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          {/* Email/password form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-gray-900/80 border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 text-sm transition-colors"
                placeholder="Your full name"
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
                minLength={8}
                className="w-full px-4 py-2.5 bg-gray-900/80 border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 text-sm transition-colors"
                placeholder="Min. 8 characters"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 gradient-btn text-white font-semibold rounded-xl disabled:opacity-50 transition-all text-sm"
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

          <p className="mt-4 text-center text-xs text-gray-700 leading-relaxed">
            By registering you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  )
}