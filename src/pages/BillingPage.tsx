import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { billingApi } from '../services/api'
import type { Business } from '../types'
import { toast } from 'sonner'

const DAYS_ALL = ['mon','tue','wed','thu','fri','sat','sun'] as const
type DayKey = typeof DAYS_ALL[number]
const DAY_LABELS: Record<DayKey, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu',
  fri: 'Fri', sat: 'Sat', sun: 'Sun',
}

const PLANS = [
  {
    id: 'STARTER',
    name: 'Starter',
    pricePerDay: 500,
    description: 'Perfect for small businesses',
    features: ['Up to 100 calls/month', 'Basic AI agent', 'Paystack payments', 'Email notifications'],
    color: 'border-gray-700',
    badge: '',
  },
  {
    id: 'PROFESSIONAL',
    name: 'Professional',
    pricePerDay: 1500,
    description: 'For growing businesses',
    features: ['Unlimited calls', 'Premium AI voice', 'Priority support', 'Analytics dashboard', 'Custom agent tone'],
    color: 'border-indigo-500',
    badge: 'Most Popular',
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    pricePerDay: 3000,
    description: 'Full scale operations',
    features: ['Everything in Pro', 'Dedicated phone number', 'Multi-language support', 'White-label option', 'SLA guarantee'],
    color: 'border-purple-500',
    badge: 'Best Value',
  },
] as const

type PlanId = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'

interface BillingStatus {
  status: string
  plan: string
  isActive: boolean
  daysLeft: number
  subscriptionExpiry: string | null
  trialEndsAt: string | null
  agentScheduleType: string | null
  agentActiveDays: string[] | null
  agentStartTime: string | null
  agentEndTime: string | null
}

export default function BillingPage() {
  const { activeBiz } = useOutletContext<{ activeBiz: Business | null }>()

  const [status, setStatus]       = useState<BillingStatus | null>(null)
  const [loading, setLoading]     = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('PROFESSIONAL')
  const [days, setDays]           = useState(30)
  const [scheduleType, setScheduleType] = useState<'always_on' | 'scheduled'>('always_on')
  const [activeDays, setActiveDays] = useState<DayKey[]>([...DAYS_ALL])
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime]     = useState('22:00')
  const [schedSaving, setSchedSaving] = useState(false)
  const [payLoading, setPayLoading] = useState(false)

  const fetchStatus = async () => {
    if (!activeBiz) return
    setLoading(true)
    try {
      const { data } = await billingApi.status(activeBiz.id)
      setStatus(data)
      if (data.agentScheduleType) setScheduleType(data.agentScheduleType as any)
      if (data.agentActiveDays?.length) setActiveDays(data.agentActiveDays as DayKey[])
      if (data.agentStartTime) setStartTime(data.agentStartTime)
      if (data.agentEndTime) setEndTime(data.agentEndTime)
    } catch { /* ok */ }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchStatus() }, [activeBiz?.id])

  function toggleDay(d: DayKey) {
    setActiveDays(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    )
  }

  function selectAllDays() { setActiveDays([...DAYS_ALL]) }
  function selectWeekdays() { setActiveDays(['mon','tue','wed','thu','fri']) }
  function selectWeekends() { setActiveDays(['sat','sun']) }

  async function saveSchedule() {
    if (!activeBiz) return
    setSchedSaving(true)
    try {
      await billingApi.updateSchedule(activeBiz.id, {
        agentScheduleType: scheduleType,
        agentActiveDays: activeDays,
        agentStartTime: startTime,
        agentEndTime: endTime,
      })
      toast.success('Agent schedule updated')
    } catch { toast.error('Failed to save schedule') }
    finally { setSchedSaving(false) }
  }

  async function handleActivate() {
    if (!activeBiz) return
    const plan = PLANS.find(p => p.id === selectedPlan)!
    setPayLoading(true)
    try {
      const { data } = await billingApi.activate(activeBiz.id, {
        days,
        plan: selectedPlan,
      })
      toast.success('Payment link created! Redirecting…')
      setTimeout(() => window.open(data.paymentUrl, '_blank'), 500)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create payment'
      toast.error(msg)
    } finally { setPayLoading(false) }
  }

  const selectedPlanData = PLANS.find(p => p.id === selectedPlan)!
  const totalCost = selectedPlanData.pricePerDay * days

  if (!activeBiz) return (
    <div className="text-center py-24 text-gray-500">Select a business to manage billing.</div>
  )

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Billing & Agent Schedule</h2>
        <p className="text-gray-400 text-sm">Activate your AI agent and control when it runs.</p>
      </div>

      {/* Current status banner */}
      {!loading && status && (
        <div className={`glass rounded-xl p-4 flex items-center gap-4 border ${
          status.isActive ? 'border-green-500/20' : 'border-yellow-500/20'
        }`}>
          <span className={`w-3 h-3 rounded-full flex-shrink-0 ${status.isActive ? 'bg-green-400' : 'bg-yellow-400'}`} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">
              {status.isActive
                ? `Agent active — ${status.daysLeft} day${status.daysLeft !== 1 ? 's' : ''} remaining`
                : status.status === 'trial'
                ? `Free trial active`
                : 'Agent inactive — activate to receive calls'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {status.subscriptionExpiry
                ? `Expires: ${new Date(status.subscriptionExpiry).toLocaleDateString()}`
                : status.trialEndsAt
                ? `Trial ends: ${new Date(status.trialEndsAt).toLocaleDateString()}`
                : 'No active subscription'}
            </p>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
            status.isActive ? 'bg-green-900/50 text-green-300' :
            status.status === 'trial' ? 'bg-yellow-900/50 text-yellow-300' :
            'bg-red-900/50 text-red-300'
          }`}>
            {status.status}
          </span>
        </div>
      )}

      {/* Agent Schedule */}
      <div className="glass rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4">🕐 Agent Active Hours</h3>
        <p className="text-xs text-gray-500 mb-4">
          Control when your AI agent answers calls. Outside these hours, calls will go to voicemail or escalate.
        </p>

        {/* Schedule type */}
        <div className="flex gap-3 mb-5">
          {([
            { id: 'always_on', label: '24/7 Always On', icon: '🔁' },
            { id: 'scheduled', label: 'Custom Schedule', icon: '📅' },
          ] as const).map(opt => (
            <button
              key={opt.id}
              onClick={() => setScheduleType(opt.id)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                scheduleType === opt.id
                  ? 'border-indigo-500 bg-indigo-500/10 text-white'
                  : 'border-gray-700 text-gray-400 hover:border-gray-600'
              }`}
            >
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>

        {/* Custom schedule options */}
        {scheduleType === 'scheduled' && (
          <div className="space-y-4">
            {/* Quick select */}
            <div className="flex gap-2 flex-wrap">
              {[
                { label: 'Everyday', fn: selectAllDays },
                { label: 'Weekdays', fn: selectWeekdays },
                { label: 'Weekends', fn: selectWeekends },
              ].map(({ label, fn }) => (
                <button
                  key={label}
                  onClick={fn}
                  className="px-3 py-1.5 text-xs rounded-lg glass-light text-gray-400 hover:text-white border border-gray-700 transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Day toggles */}
            <div className="flex gap-2">
              {DAYS_ALL.map(d => (
                <button
                  key={d}
                  onClick={() => toggleDay(d)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                    activeDays.includes(d)
                      ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300'
                      : 'border-gray-700 text-gray-600 hover:text-gray-400'
                  }`}
                >
                  {DAY_LABELS[d]}
                </button>
              ))}
            </div>

            {/* Time range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1.5">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-900/80 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1.5">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-900/80 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>
            </div>
          </div>
        )}

        <button
          onClick={saveSchedule}
          disabled={schedSaving}
          className="mt-4 px-6 py-2.5 gradient-btn text-white text-sm font-medium rounded-xl disabled:opacity-60"
        >
          {schedSaving ? 'Saving…' : 'Save Schedule'}
        </button>
      </div>

      {/* Plan selection */}
      <div className="glass rounded-xl p-5">
        <h3 className="text-white font-semibold mb-2">💳 Activate / Top Up Agent</h3>
        <p className="text-xs text-gray-500 mb-5">Choose how many days to run your AI agent.</p>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-3 mb-5">
          {PLANS.map(plan => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id as PlanId)}
              className={`relative cursor-pointer rounded-xl border p-4 transition-all ${
                selectedPlan === plan.id
                  ? `${plan.color} bg-indigo-500/5`
                  : 'border-gray-800 hover:border-gray-700'
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-600 text-white whitespace-nowrap">
                  {plan.badge}
                </span>
              )}
              <p className="text-white font-semibold text-sm mb-0.5">{plan.name}</p>
              <p className="text-xs text-gray-500 mb-3">{plan.description}</p>
              <p className="text-lg font-bold text-white">
                ₦{plan.pricePerDay.toLocaleString()}
                <span className="text-xs font-normal text-gray-500"> /day</span>
              </p>
              <ul className="mt-3 space-y-1">
                {plan.features.map(f => (
                  <li key={f} className="text-xs text-gray-400 flex items-start gap-1.5">
                    <span className="text-green-400 mt-0.5">✓</span>{f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Days slider */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-gray-500 uppercase tracking-widest">Active Days</label>
            <span className="text-sm font-bold text-white">{days} days</span>
          </div>
          <input
            type="range"
            min={1}
            max={30}
            value={days}
            onChange={e => setDays(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer accent-indigo-500"
          />
          <div className="flex justify-between text-xs text-gray-700 mt-1">
            <span>1 day</span><span>15 days</span><span>30 days</span>
          </div>
        </div>

        {/* Quick day buttons */}
        <div className="flex gap-2 mb-5">
          {[7, 14, 30].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${
                days === d
                  ? 'border-indigo-500 bg-indigo-500/10 text-white'
                  : 'border-gray-700 text-gray-500 hover:text-gray-300'
              }`}
            >
              {d} days
            </button>
          ))}
        </div>

        {/* Cost summary */}
        <div className="glass-light rounded-xl p-4 mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Total cost</p>
            <p className="text-2xl font-bold text-white mt-0.5">
              ₦{totalCost.toLocaleString()}
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              {selectedPlanData.name} · {days} days · ₦{selectedPlanData.pricePerDay.toLocaleString()}/day
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Agent active until</p>
            <p className="text-sm font-medium text-indigo-300 mt-0.5">
              {new Date(Date.now() + days * 86400000).toLocaleDateString('en-NG', {
                day: 'numeric', month: 'short', year: 'numeric'
              })}
            </p>
          </div>
        </div>

        <button
          onClick={handleActivate}
          disabled={payLoading}
          className="w-full py-3 gradient-btn text-white font-semibold rounded-xl disabled:opacity-60 text-sm"
        >
          {payLoading ? 'Creating payment…' : `🔒 Pay ₦${totalCost.toLocaleString()} with Paystack`}
        </button>
        <p className="text-xs text-center text-gray-700 mt-2">
          Secure payment via Paystack · Agent activates immediately after payment
        </p>
      </div>
    </div>
  )
}
