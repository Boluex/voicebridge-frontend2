import { useState, useEffect, useCallback, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { toast } from 'sonner'
import type { Business } from '../types'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

interface Voice { id: string; name: string; gender: string }

const TONES = [
  ['friendly',     '😊 Friendly & Warm'],
  ['professional', '💼 Professional'],
  ['formal',       '🎩 Formal'],
  ['casual',       '🙂 Casual & Relaxed'],
  ['energetic',    '⚡ Energetic & Upbeat'],
]

const LANGUAGES = [
  ['en', '🇺🇸 English'],
  ['fr', '🇫🇷 French'],
  ['es', '🇪🇸 Spanish'],
  ['de', '🇩🇪 German'],
  ['pt', '🇧🇷 Portuguese'],
  ['ar', '🇸🇦 Arabic'],
  ['hi', '🇮🇳 Hindi'],
  ['yo', '🇳🇬 Yoruba'],
  ['ha', '🇳🇬 Hausa'],
  ['ig', '🇳🇬 Igbo'],
  ['sw', '🇰🇪 Swahili'],
  ['zh', '🇨🇳 Chinese'],
]

// ─── Test Call Widget using @11labs/client SDK ────────────────────────────────
function TestCallWidget({ businessId, agentName }: { businessId: string; agentName: string }) {
  const [status, setStatus]         = useState<'idle' | 'connecting' | 'active' | 'ended' | 'error'>('idle')
  const [transcript, setTranscript] = useState<{ role: 'agent' | 'user'; text: string }[]>([])
  const [duration, setDuration]     = useState(0)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const timerRef                    = useRef<ReturnType<typeof setInterval> | null>(null)
  const transcriptEndRef            = useRef<HTMLDivElement>(null)
  const convRef                     = useRef<any>(null)

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      convRef.current?.endSession().catch(() => {})
    }
  }, [])

  async function startCall() {
    setStatus('connecting')
    setTranscript([])
    setDuration(0)

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })

      const token = localStorage.getItem('vb_token')
      const res = await fetch(`${API}/agent/${businessId}/widget-url`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Could not get call token')
      }
      const { signedUrl } = await res.json()

      const { Conversation } = await import('@elevenlabs/client')

      const conv = await Conversation.startSession({
        signedUrl,
        onConnect: () => {
          setStatus('active')
          timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
        },
        onDisconnect: () => {
          if (timerRef.current) clearInterval(timerRef.current)
          setStatus(s => s === 'active' ? 'ended' : s)
          setIsSpeaking(false)
        },
        onMessage: (msg: any) => {
          if (msg.type === 'agent_response' && msg.agent_response) {
            setTranscript(prev => [...prev, { role: 'agent', text: msg.agent_response }])
          }
          if (msg.type === 'user_transcript' && msg.user_transcript) {
            setTranscript(prev => [...prev, { role: 'user', text: msg.user_transcript }])
          }
        },
        onModeChange: (mode: any) => {
          setIsSpeaking(mode?.mode === 'speaking')
        },
        onError: (err: any) => {
          console.error('[TestCall]', err)
          toast.error('Call error — check console')
          setStatus('error')
        },
      })

      convRef.current = conv

    } catch (err) {
      const msg = (err as Error).message
      if (msg.includes('Permission denied') || msg.includes('NotAllowed')) {
        toast.error('Microphone access denied — allow mic in your browser settings')
      } else {
        toast.error('Failed to start: ' + msg)
      }
      setStatus('error')
    }
  }

  async function endCall() {
    await convRef.current?.endSession()
    convRef.current = null
    if (timerRef.current) clearInterval(timerRef.current)
    setStatus('ended')
    setIsSpeaking(false)
  }

  function formatDuration(s: number) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  }

  return (
    <div className="glass rounded-xl overflow-hidden border border-indigo-500/20">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${
            status === 'active'     ? 'bg-green-400 animate-pulse' :
            status === 'connecting' ? 'bg-yellow-400 animate-pulse' :
            status === 'error'      ? 'bg-red-400' : 'bg-gray-600'
          }`} />
          <div>
            <p className="text-sm font-medium text-white">Test Call</p>
            <p className="text-xs text-gray-500">
              {status === 'idle'       && `Talk directly to ${agentName}`}
              {status === 'connecting' && 'Connecting…'}
              {status === 'active'     && `Live · ${formatDuration(duration)}`}
              {status === 'ended'      && 'Call ended'}
              {status === 'error'      && 'Connection failed'}
            </p>
          </div>
        </div>

        {(status === 'idle' || status === 'ended' || status === 'error') ? (
          <button
            onClick={startCall}
            className="flex items-center gap-2 px-4 py-2 gradient-btn text-white text-sm font-medium rounded-xl"
          >
            <span>🎙️</span>
            {status === 'ended' ? 'Call Again' : 'Start Test Call'}
          </button>
        ) : status === 'connecting' ? (
          <button disabled className="px-4 py-2 text-sm text-gray-500 rounded-xl border border-gray-700">
            ⏳ Connecting…
          </button>
        ) : (
          <button
            onClick={endCall}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/40 text-red-400 text-sm font-medium rounded-xl hover:bg-red-500/30 transition-colors"
          >
            <span>📵</span> End Call
          </button>
        )}
      </div>

      {/* Transcript */}
      <div className="h-56 overflow-y-auto px-4 py-3 space-y-2">
        {transcript.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <p className="text-3xl mb-2">🎙️</p>
            <p className="text-sm text-gray-500">Click "Start Test Call" to talk to {agentName}</p>
            <p className="text-xs text-gray-600 mt-1">Your browser will ask for microphone permission</p>
          </div>
        ) : (
          transcript.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs px-3 py-2 rounded-2xl text-sm ${
                msg.role === 'user'
                  ? 'bg-indigo-500/20 text-indigo-200 rounded-br-sm'
                  : 'bg-gray-800 text-gray-200 rounded-bl-sm'
              }`}>
                {msg.role === 'agent' && (
                  <p className="text-xs text-gray-500 mb-0.5">{agentName}</p>
                )}
                {msg.text}
              </div>
            </div>
          ))
        )}
        <div ref={transcriptEndRef} />
      </div>

      {/* Active call footer */}
      {status === 'active' && (
        <div className="px-4 py-2 border-t border-gray-800 flex items-center gap-3">
          <div className="flex gap-0.5 items-end h-5">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`w-1 rounded-full ${isSpeaking ? 'bg-green-400' : 'bg-indigo-400'}`}
                style={{
                  height: isSpeaking ? `${8 + i * 4}px` : '4px',
                  transition: 'height 0.2s ease',
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
          <p className="text-xs text-gray-500">
            {isSpeaking ? `${agentName} is speaking…` : 'Listening… speak naturally'}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Main Agent Page ──────────────────────────────────────────────────────────
export default function AgentPage() {
  const { activeBiz, refetchBusinesses } = useOutletContext<{
    activeBiz: Business | null
    refetchBusinesses: () => void
  }>()

  const [voices, setVoices]               = useState<Voice[]>([])
  const [loadingVoices, setLoadingVoices] = useState(false)
  const [saving, setSaving]               = useState(false)
  const [reprovisioning, setReprovisioning] = useState(false)
  const [genderFilter, setGenderFilter]   = useState<'all' | 'male' | 'female'>('all')

  const [form, setForm] = useState({
    agentName:       'Ava',
    agentGender:     'female',
    agentVoiceId:    '21m00Tcm4TlvDq8ikWAM',
    agentGreeting:   'Hello! Thanks for calling. How can I help you today?',
    agentTone:       'friendly',
    primaryLanguage: 'en',
  })

  useEffect(() => {
    if (!activeBiz) return
    const b = activeBiz as any
    setForm({
      agentName:       b.agentName       || 'Ava',
      agentGender:     b.agentGender     || 'female',
      agentVoiceId:    b.agentVoiceId    || '21m00Tcm4TlvDq8ikWAM',
      agentGreeting:   b.agentGreeting   || 'Hello! Thanks for calling. How can I help you today?',
      agentTone:       b.agentTone       || 'friendly',
      primaryLanguage: b.primaryLanguage || 'en',
    })
  }, [activeBiz?.id])

  const loadVoices = useCallback(async () => {
    setLoadingVoices(true)
    try {
      const token = localStorage.getItem('vb_token')
      const res = await fetch(`${API}/agent/voices`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setVoices(data.voices || [])
    } catch {
      toast.error('Failed to load voices')
    } finally {
      setLoadingVoices(false)
    }
  }, [])

  useEffect(() => { loadVoices() }, [loadVoices])

  async function handleSave() {
    if (!activeBiz) return
    setSaving(true)
    try {
      const token = localStorage.getItem('vb_token')
      const res = await fetch(`${API}/agent/${activeBiz.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success('Agent configuration saved and updated!')
      refetchBusinesses()
    } catch (err) {
      toast.error('Failed to save: ' + (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function handleReprovision() {
    if (!activeBiz) return
    setReprovisioning(true)
    try {
      const token = localStorage.getItem('vb_token')
      const res = await fetch(`${API}/agent/${activeBiz.id}/reprovision`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast.success('Agent created successfully!')
      refetchBusinesses()
    } catch (err) {
      toast.error('Provisioning failed: ' + (err as Error).message)
    } finally {
      setReprovisioning(false)
    }
  }

  if (!activeBiz) return (
    <div className="text-center py-24 text-gray-500">Select a business to configure its AI agent.</div>
  )

  const biz = activeBiz as any
  const agentId = biz.agentId
  const filteredVoices = voices.filter(v => genderFilter === 'all' || v.gender === genderFilter)

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">AI Voice Agent</h2>
        <p className="text-gray-400 text-sm">Configure your AI receptionist, then test it live with a real voice call.</p>
      </div>

      {/* Agent status */}
      <div className={`glass rounded-xl p-4 border ${agentId ? 'border-green-500/20' : 'border-yellow-500/20'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${agentId ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`} />
            <div>
              <p className="text-sm font-medium text-white">
                {agentId ? `${form.agentName} — Agent Active` : 'Agent not yet created'}
              </p>
              <p className="text-xs text-gray-500">
                {agentId
                  ? `Agent ID: ${agentId.slice(0, 16)}…`
                  : 'Click "Create Agent" to provision your AI receptionist'}
              </p>
            </div>
          </div>
          <button
            onClick={handleReprovision}
            disabled={reprovisioning}
            className="px-4 py-2 text-sm font-medium rounded-xl border border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10 transition-colors disabled:opacity-50"
          >
            {reprovisioning ? '⏳ Creating…' : agentId ? '🔄 Recreate' : '🚀 Create Agent'}
          </button>
        </div>
      </div>

      {/* Test call widget */}
      {agentId && (
        <TestCallWidget businessId={activeBiz.id} agentName={form.agentName} />
      )}

      {/* Identity */}
      <div className="glass rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white">Identity</h3>
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1.5">Agent Name</label>
          <input
            type="text"
            value={form.agentName}
            onChange={e => setForm(f => ({ ...f, agentName: e.target.value }))}
            placeholder="e.g. Ava, Max, Zara..."
            className="w-full px-4 py-2.5 bg-gray-900/80 border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1.5">Opening Greeting</label>
          <textarea
            value={form.agentGreeting}
            onChange={e => setForm(f => ({ ...f, agentGreeting: e.target.value }))}
            rows={3}
            placeholder="Hello! Thanks for calling. How can I help you today?"
            className="w-full px-4 py-2.5 bg-gray-900/80 border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 text-sm resize-none"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1.5">Personality Tone</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {TONES.map(([value, label]) => (
              <button
                key={value}
                onClick={() => setForm(f => ({ ...f, agentTone: value }))}
                className={`px-3 py-2 rounded-xl text-sm border transition-all text-left ${
                  form.agentTone === value
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                    : 'border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Language */}
      <div className="glass rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Language</h3>
        <select
          value={form.primaryLanguage}
          onChange={e => setForm(f => ({ ...f, primaryLanguage: e.target.value }))}
          className="w-full px-4 py-2.5 bg-gray-900/80 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 text-sm"
        >
          {LANGUAGES.map(([code, label]) => (
            <option key={code} value={code}>{label}</option>
          ))}
        </select>
        <p className="text-xs text-gray-600 mt-2">Agent responds in this language and switches if caller uses another.</p>
      </div>

      {/* Voice picker */}
      <div className="glass rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Voice</h3>
          <div className="flex gap-1">
            {(['all', 'female', 'male'] as const).map(g => (
              <button
                key={g}
                onClick={() => setGenderFilter(g)}
                className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                  genderFilter === g ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {g === 'all' ? 'All' : g === 'female' ? '👩 Female' : '👨 Male'}
              </button>
            ))}
          </div>
        </div>
        {loadingVoices ? (
          <div className="grid grid-cols-2 gap-2">
            {[1,2,3,4].map(i => <div key={i} className="h-14 bg-gray-800/50 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
            {filteredVoices.map(voice => (
              <button
                key={voice.id}
                onClick={() => setForm(f => ({ ...f, agentVoiceId: voice.id, agentGender: voice.gender }))}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                  form.agentVoiceId === voice.id
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <span className="text-xl">{voice.gender === 'female' ? '👩' : '👨'}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${form.agentVoiceId === voice.id ? 'text-indigo-300' : 'text-white'}`}>
                    {voice.name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{voice.gender}</p>
                </div>
                {form.agentVoiceId === voice.id && <span className="text-indigo-400 text-xs">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Save */}
      <div className="flex items-center justify-between pb-6">
        <p className="text-xs text-gray-600">Saving pushes changes to your live agent immediately.</p>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 gradient-btn text-white text-sm font-medium rounded-xl disabled:opacity-60"
        >
          {saving ? '⏳ Saving…' : '💾 Save Configuration'}
        </button>
      </div>
    </div>
  )
}