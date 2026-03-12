import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { businessApi } from '../services/api'
import type { Business, BusinessStats } from '../types'

export default function OverviewPage() {
  const { activeBiz } = useOutletContext<{
    activeBiz: Business | null
  }>()

  const [stats, setStats] = useState<BusinessStats | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!activeBiz) return
    setLoading(true)
    businessApi.stats(activeBiz.id)
      .then(({ data }) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [activeBiz?.id])

  if (!activeBiz) return null

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-6">Overview</h2>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Calls Today',    value: stats?.callsToday ?? '—',  icon: '📞' },
          { label: 'Orders Today',   value: stats?.ordersToday ?? '—', icon: '📦' },
          { label: 'Total Orders',   value: stats?.totalOrders ?? '—', icon: '🛒' },
          { label: 'Revenue (Paid)', value: stats?.totalRevenue != null ? `₦${stats.totalRevenue.toLocaleString()}` : '—', icon: '💰' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="glass rounded-xl p-4">
            <div className="text-2xl mb-1">{icon}</div>
            <p className="text-2xl font-bold text-white">{loading ? '…' : value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Agent status */}
      <div className="glass rounded-xl p-5 mb-4">
        <h3 className="text-white font-semibold mb-3">🤖 AI Agent Status</h3>
        <div className="flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full ${activeBiz.agentId ? 'bg-green-400' : 'bg-yellow-400'}`} />
          <div>
            <p className="text-sm text-white font-medium">
              {activeBiz.agentId ? `${activeBiz.agentName} — Active` : 'Agent provisioning…'}
            </p>
            <p className="text-xs text-gray-500">
              {activeBiz.aiPhoneNumber
                ? `Phone: ${activeBiz.aiPhoneNumber}`
                : 'Phone number not yet assigned — requires paid ElevenLabs plan'}
            </p>
          </div>
        </div>
        {activeBiz.agentId && (
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-gray-400">
            <div>Voice: <span className="text-white">{activeBiz.agentName}</span></div>
            <div>Language: <span className="text-white">{activeBiz.primaryLanguage?.toUpperCase()}</span></div>
            <div>Tone: <span className="text-white">{activeBiz.agentTone}</span></div>
            <div>Schedule: <span className="text-white">{activeBiz.agentScheduleType === 'always_on' ? '24/7' : 'Custom'}</span></div>
          </div>
        )}
      </div>

      {/* Recent calls */}
      {stats?.recentCalls && stats.recentCalls.length > 0 && (
        <div className="glass rounded-xl p-5">
          <h3 className="text-white font-semibold mb-3">📞 Recent Calls</h3>
          <div className="space-y-2">
            {stats.recentCalls.map(call => (
              <div key={call.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <div>
                  <p className="text-sm text-white">{call.callerNumber}</p>
                  <p className="text-xs text-gray-500">{call.intent || 'inquiry'} · {call.language}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    call.status === 'COMPLETED' ? 'bg-green-900/50 text-green-300' :
                    call.status === 'ESCALATED' ? 'bg-yellow-900/50 text-yellow-300' :
                    'bg-red-900/50 text-red-300'
                  }`}>{call.status}</span>
                  {call.duration && (
                    <p className="text-xs text-gray-600 mt-0.5">{call.duration}s</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
