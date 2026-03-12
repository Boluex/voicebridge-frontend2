import { useState, useEffect, useCallback } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { businessApi } from '../services/api'
import type { Business } from '../types'
import { toast } from 'sonner'

const NAV = [
  { to: '/dashboard',           label: 'Overview',    icon: '📊' },
  { to: '/dashboard/knowledge', label: 'Knowledge',   icon: '🧠' },
  { to: '/dashboard/billing',   label: 'Billing',     icon: '💳' },
  { to: '/dashboard/settings',  label: 'Settings',    icon: '⚙️' },
]

export default function DashboardPage() {
  const user   = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const navigate = useNavigate()

  const [businesses, setBusinesses] = useState<Business[]>([])
  const [activeBizId, setActiveBizId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchBusinesses = useCallback(() => {
    businessApi.list()
      .then(({ data }) => {
        setBusinesses(data.businesses)
        if (data.businesses.length > 0 && !activeBizId) {
          setActiveBizId(data.businesses[0].id)
        }
      })
      .catch(() => toast.error('Failed to load businesses'))
      .finally(() => setLoading(false))
  }, [activeBizId])

  useEffect(() => { fetchBusinesses() }, [])

  const activeBiz = businesses.find(b => b.id === activeBizId) || null

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-gray-900/80 border-r border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg gradient-btn flex items-center justify-center text-xs font-bold">VB</div>
            <span className="font-bold text-white">VoiceBridge</span>
          </div>
        </div>

        {/* Business selector */}
        <div className="px-4 py-3 border-b border-gray-800">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Business</p>
          {loading ? (
            <div className="h-8 bg-gray-800 rounded animate-pulse" />
          ) : businesses.length === 0 ? (
            <p className="text-xs text-gray-600">No businesses yet</p>
          ) : (
            <select
              value={activeBizId || ''}
              onChange={e => setActiveBizId(e.target.value)}
              className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              {businesses.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`
              }
            >
              <span>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* New Business button */}
        <div className="px-3 py-3 border-t border-gray-800">
          <button
            onClick={() => navigate('/dashboard/settings')}
            className="w-full py-2 rounded-lg gradient-btn text-white text-xs font-medium"
          >
            + New Business
          </button>
        </div>

        {/* User */}
        <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
          <button onClick={logout} className="text-xs text-gray-500 hover:text-white ml-2 flex-shrink-0">
            Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {/* Active biz header strip */}
          {activeBiz && (
            <div className="flex items-center gap-3 mb-6 glass rounded-xl px-4 py-3">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${activeBiz.agentId ? 'bg-green-400' : 'bg-yellow-400'}`} />
              <div className="min-w-0 flex-1">
                <span className="text-sm font-medium text-white">{activeBiz.name}</span>
                <span className="text-xs text-gray-500 ml-2">{activeBiz.category}</span>
              </div>
              {activeBiz.aiPhoneNumber && (
                <span className="text-xs text-indigo-400">📱 {activeBiz.aiPhoneNumber}</span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeBiz.subscriptionStatus === 'active'
                  ? 'bg-green-900/50 text-green-300'
                  : activeBiz.subscriptionStatus === 'trial'
                  ? 'bg-yellow-900/50 text-yellow-300'
                  : 'bg-red-900/50 text-red-300'
              }`}>
                {activeBiz.subscriptionStatus}
              </span>
            </div>
          )}

          {/* Overview page — shown when at /dashboard exactly */}
          <Outlet context={{ activeBiz, businesses, refetchBusinesses: fetchBusinesses, setActiveBizId }} />

          {/* Show overview when no sub-route matched AND we have no Outlet content */}
          {!activeBiz && !loading && (
            <div className="text-center py-24">
              <div className="text-6xl mb-4">📞</div>
              <h2 className="text-xl font-bold text-white mb-2">No businesses yet</h2>
              <p className="text-gray-500 text-sm mb-6">Go to Settings to register your first business and get an AI agent</p>
              <button
                onClick={() => navigate('/dashboard/settings')}
                className="px-6 py-2.5 gradient-btn text-white font-medium rounded-xl"
              >
                Register a Business
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
