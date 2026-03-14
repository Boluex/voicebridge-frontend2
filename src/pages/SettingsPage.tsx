import { useState, useEffect, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { businessApi } from '../services/api'

interface Biz {
  id: string; name: string; category: string; description?: string; phone?: string;
  email?: string; address?: string; city?: string; deliveryRadius?: number;
  bankName?: string; accountName?: string; accountNumber?: string; orderWebhookUrl?: string;
  notificationEmail?: string; escalationPhone?: string
}

const CATEGORIES = ['RESTAURANT','CAFE','BAKERY','PHARMACY','SALON','BARBERSHOP',
  'PLUMBER','ELECTRICIAN','CLEANING','HOTEL','GYM','CLINIC','DENTAL','GROCERY','FASHION','OTHER']

// ─── Field components defined OUTSIDE the parent to prevent re-creation ───────
// Keeps cursor from jumping on every keystroke
const InputField = ({
  label, value, onChange, type = 'text', placeholder, hint
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; hint?: string
}) => (
  <div>
    <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1.5">{label}</label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-2.5 bg-gray-900/80 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 text-sm transition-colors"
    />
    {hint && <p className="text-xs text-gray-600 mt-1">{hint}</p>}
  </div>
)

const SelectField = ({
  label, value, onChange, options
}: {
  label: string; value: string; onChange: (v: string) => void; options: [string, string][]
}) => (
  <div>
    <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1.5">{label}</label>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-4 py-2.5 bg-gray-900/80 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 text-sm"
    >
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  </div>
)

export default function SettingsPage() {
  const { activeBiz, refetchBusinesses } = useOutletContext<{
    activeBiz: Biz | null; refetchBusinesses: () => void
  }>()

  const [form, setForm] = useState({
    name: '', category: 'RESTAURANT', description: '', phone: '', email: '',
    address: '', city: '', deliveryRadius: '5',
    bankName: '', accountName: '', accountNumber: '',
    orderWebhookUrl: '', notificationEmail: '', escalationPhone: '',
  })
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [newBiz, setNewBiz]     = useState({ name: '', category: 'RESTAURANT', city: '' })
  const [bizSaving, setBizSaving] = useState(false)
  const [bizError, setBizError] = useState<string | null>(null)

  // Populate form when active business changes
  useEffect(() => {
    if (!activeBiz) return
    setForm({
      name:              activeBiz.name || '',
      category:          activeBiz.category || 'RESTAURANT',
      description:       activeBiz.description || '',
      phone:             activeBiz.phone || '',
      email:             activeBiz.email || '',
      address:           activeBiz.address || '',
      city:              activeBiz.city || '',
      deliveryRadius:    String(activeBiz.deliveryRadius ?? 5),
      bankName:          activeBiz.bankName || '',
      accountName:       activeBiz.accountName || '',
      accountNumber:     activeBiz.accountNumber || '',
      orderWebhookUrl:   activeBiz.orderWebhookUrl || '',
      notificationEmail: activeBiz.notificationEmail || '',
      escalationPhone:   activeBiz.escalationPhone || '',
    })
  }, [activeBiz?.id])

  // Stable setters — avoid stale closures that cause the cursor-jump bug
  const setField = useCallback((k: keyof typeof form) => (v: string) => {
    setForm(prev => ({ ...prev, [k]: v }))
  }, [])

  const setNewBizField = useCallback((k: keyof typeof newBiz) => (v: string) => {
    setNewBiz(prev => ({ ...prev, [k]: v }))
  }, [])

  const save = async () => {
    if (!activeBiz) return
    setSaving(true)
    setSaveError(null)
    try {
      await businessApi.update(activeBiz.id, {
        ...form,
        deliveryRadius: parseInt(form.deliveryRadius) || 5,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      refetchBusinesses()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Save failed'
      setSaveError(msg)
    } finally {
      setSaving(false)
    }
  }

  const createBusiness = async () => {
    if (!newBiz.name.trim()) return
    setBizSaving(true)
    setBizError(null)
    try {
      await businessApi.create(newBiz)
      setCreating(false)
      setNewBiz({ name: '', category: 'RESTAURANT', city: '' })
      refetchBusinesses()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Creation failed'
      setBizError(msg)
    } finally {
      setBizSaving(false)
    }
  }

  const catOptions = CATEGORIES.map(
    c => [c, c.charAt(0) + c.slice(1).toLowerCase()] as [string, string]
  )

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Settings</h2>
          <p className="text-gray-400 text-sm">
            Business profile, Paystack configuration, and notifications.
          </p>
        </div>
        <button
          onClick={() => { setCreating(true); setBizError(null) }}
          className="px-4 py-2 rounded-xl gradient-btn text-white text-sm font-medium"
        >
          + New Business
        </button>
      </div>

      {/* New business form */}
      {creating && (
        <div className="glass rounded-xl p-5 mb-5 border border-indigo-500/20">
          <h3 className="text-white font-semibold mb-4">Register New Business</h3>
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <InputField
              label="Business Name"
              value={newBiz.name}
              onChange={setNewBizField('name')}
              placeholder="e.g. Mama's Kitchen"
            />
            <SelectField
              label="Category"
              value={newBiz.category}
              onChange={setNewBizField('category')}
              options={catOptions}
            />
            <InputField
              label="City"
              value={newBiz.city}
              onChange={setNewBizField('city')}
              placeholder="e.g. Lagos"
            />
          </div>

          {bizError && (
            <p className="text-red-400 text-xs mb-3">⚠ {bizError}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={createBusiness}
              disabled={bizSaving || !newBiz.name.trim()}
              className="px-6 py-2.5 rounded-xl gradient-btn text-white text-sm font-medium disabled:opacity-60"
            >
              {bizSaving ? 'Creating…' : '🤖 Create Business + AI Agent'}
            </button>
            <button
              onClick={() => { setCreating(false); setBizError(null) }}
              className="px-4 py-2.5 rounded-xl glass-light text-gray-400 text-sm hover:text-white"
            >
              Cancel
            </button>
          </div>
          <p className="text-xs text-indigo-400 mt-3">
            ✨ This will automatically create an ElevenLabs AI agent for this business.
          </p>
        </div>
      )}

      {activeBiz ? (
        <>
          {/* Business Profile */}
          <div className="glass rounded-xl p-5 mb-4">
            <h3 className="text-white font-semibold mb-4">📋 Business Profile</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <InputField
                label="Business Name"
                value={form.name}
                onChange={setField('name')}
                placeholder="Your business name"
              />
              <SelectField
                label="Category"
                value={form.category}
                onChange={setField('category')}
                options={catOptions}
              />
              <InputField
                label="Phone Number"
                value={form.phone}
                onChange={setField('phone')}
                placeholder="+234 800 000 0000"
              />
              <InputField
                label="Business Email"
                value={form.email}
                onChange={setField('email')}
                type="email"
                placeholder="hello@business.com"
              />
              <InputField
                label="Street Address"
                value={form.address}
                onChange={setField('address')}
                placeholder="14 Allen Avenue, Ikeja"
              />
              <InputField
                label="City"
                value={form.city}
                onChange={setField('city')}
                placeholder="Lagos"
              />
              <InputField
                label="Delivery Radius (km)"
                value={form.deliveryRadius}
                onChange={setField('deliveryRadius')}
                type="number"
                placeholder="5"
              />
              <InputField
                label="Human Escalation Number"
                value={form.escalationPhone}
                onChange={setField('escalationPhone')}
                placeholder="+234 800 000 0001"
              />
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1.5">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={2}
                  placeholder="Short description of your business..."
                  className="w-full px-4 py-2.5 bg-gray-900/80 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-sm resize-none"
                />
              </div>
            </div>
          </div>

          {/* Payout Bank Details */}
          <div className="glass rounded-xl p-5 mb-4 mt-8">
            <h3 className="text-white font-semibold mb-1">🏦 Payout Bank Details</h3>
            <p className="text-gray-500 text-xs mb-4">
              Where VoiceBridge will transfer your funds after processing customer payments via AI calls.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <InputField
                label="Bank Name"
                value={form.bankName}
                onChange={setField('bankName')}
                placeholder="e.g. Guarantee Trust Bank"
              />
              <InputField
                label="Account Number"
                value={form.accountNumber}
                onChange={setField('accountNumber')}
                placeholder="0000000000"
              />
              <div className="md:col-span-2">
                <InputField
                  label="Account Name"
                  value={form.accountName}
                  onChange={setField('accountName')}
                  placeholder="e.g. Mama's Kitchen Enterpise"
                />
              </div>
            </div>
          </div>
          
          {/* Notifications */}
          <div className="glass rounded-xl p-5 mb-4 mt-8">
            <h3 className="text-white font-semibold mb-1">🔔 Order Notifications</h3>
            <p className="text-gray-500 text-xs mb-4">
              How you want to be notified when the VoiceBridge AI processes a paid order.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <InputField
                label="Notification Email"
                value={form.notificationEmail}
                onChange={setField('notificationEmail')}
                type="email"
                placeholder="orders@yourbusiness.com"
              />
              <InputField
                label="Order Webhook URL"
                value={form.orderWebhookUrl}
                onChange={setField('orderWebhookUrl')}
                placeholder="https://yourbiz.com/webhook"
              />
            </div>
          </div>

          {saveError && (
            <p className="text-red-400 text-xs mb-3">⚠ {saveError}</p>
          )}

          <button
            onClick={save}
            disabled={saving}
            className="px-8 py-3 rounded-xl gradient-btn text-white font-medium disabled:opacity-60 transition-all"
          >
            {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Settings'}
          </button>
        </>
      ) : (
        <div className="glass rounded-xl p-10 text-center">
          <p className="text-gray-400 text-sm">
            No business selected. Create your first business above.
          </p>
        </div>
      )}
    </div>
  )
}
