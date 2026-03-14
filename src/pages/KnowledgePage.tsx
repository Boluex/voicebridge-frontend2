import { useState, useEffect, useRef, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { knowledgeApi } from '../services/api'
import type { Business, KnowledgeSource } from '../types'
import { toast } from 'sonner'

type Tab = 'url' | 'file' | 'faq'

const ACCEPTED_FILES = [
  '.pdf', '.doc', '.docx', '.csv', '.txt', '.xlsx',
  '.jpg', '.jpeg', '.png', '.webp', '.gif'
].join(',')

const FILE_TYPE_ICONS: Record<string, string> = {
  PDF: '📄', DOCX: '📝', CSV: '📊', TXT: '📃', XLSX: '📊',
  IMAGE: '🖼️', URL: '🌐', FAQ: '❓',
}
const STATUS_COLORS: Record<string, string> = {
  PROCESSING: 'bg-yellow-900/50 text-yellow-300',
  INDEXED:    'bg-green-900/50 text-green-300',
  ERROR:      'bg-red-900/50 text-red-300',
}

interface PreviewSource extends KnowledgeSource {
  content?: string
}

function ContentModal({ source, onClose }: { source: PreviewSource; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const hasContent = source.content && source.content.trim().length > 0
  const isPlaceholder = source.content?.startsWith('[') && source.content?.endsWith(']')

  const displayContent = source.type === 'URL' && source.content
    ? source.content.replace(/^\[Content from [^\]]+\]\n\n/, '')
    : source.content

  function handleCopy() {
    if (source.content) {
      navigator.clipboard.writeText(source.content)
      toast.success('Copied to clipboard')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-gray-700 shadow-2xl"
        style={{ background: '#111827' }}
      >
        {/* Header */}
        <div className="flex items-start gap-3 px-5 py-4 border-b border-gray-800 flex-shrink-0">
          <span className="text-2xl mt-0.5 flex-shrink-0">{FILE_TYPE_ICONS[source.type] || '📄'}</span>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-base leading-tight truncate">
              {source.name}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {[
                source.type,
                source.source && source.type === 'URL' ? source.source.slice(0, 50) : null,
                source.chunkCount > 0 ? `${source.chunkCount} chunks indexed` : null,
              ].filter(Boolean).join(' · ')}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {hasContent && !isPlaceholder && (
              <button
                onClick={handleCopy}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
              >
                Copy
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-800 transition-colors text-xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {!hasContent ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-3">⏳</p>
              <p className="text-gray-400 text-sm font-medium">Still processing…</p>
              <p className="text-gray-600 text-xs mt-1">Extracted content will appear here once indexing is complete.</p>
            </div>
          ) : isPlaceholder ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-3">⚠️</p>
              <p className="text-gray-400 text-sm font-medium">Extraction notice</p>
              <p className="text-gray-500 text-xs mt-2 font-mono leading-relaxed">{source.content}</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold">
                  {source.type === 'IMAGE' ? 'OCR — Extracted Text'
                    : source.type === 'URL' ? 'Scraped Content'
                    : source.type === 'FAQ' ? 'FAQ Content'
                    : 'Extracted Text'}
                </span>
                <div className="flex-1 h-px bg-gray-800" />
                <span className="text-xs text-gray-600">
                  {displayContent ? displayContent.length.toLocaleString() : 0} chars
                </span>
              </div>
              <pre
                className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap break-words"
                style={{ fontFamily: "'Courier New', monospace", fontSize: '13px' }}
              >
                {displayContent}
              </pre>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-800 flex-shrink-0">
          <p className="text-xs text-gray-700 text-center">
            This is the text your AI agent has learned from this source · Press Esc to close
          </p>
        </div>
      </div>
    </div>
  )
}

export default function KnowledgePage() {
  const { activeBiz } = useOutletContext<{ activeBiz: Business | null }>()

  const [sources, setSources]               = useState<KnowledgeSource[]>([])
  const [loading, setLoading]               = useState(false)
  const [tab, setTab]                       = useState<Tab>('url')
  const [preview, setPreview]               = useState<PreviewSource | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [url, setUrl]                       = useState('')
  const [urlLoading, setUrlLoading]         = useState(false)
  const fileRef                             = useRef<HTMLInputElement>(null)
  const [fileLoading, setFileLoading]       = useState(false)
  const [dragOver, setDragOver]             = useState(false)
  const [faqName, setFaqName]               = useState('')
  const [faqText, setFaqText]               = useState('')
  const [faqLoading, setFaqLoading]         = useState(false)

  const fetchSources = useCallback(async () => {
    if (!activeBiz) return
    setLoading(true)
    try {
      const { data } = await knowledgeApi.list(activeBiz.id)
      setSources(data.sources)
    } catch {
      toast.error('Failed to load knowledge sources')
    } finally {
      setLoading(false)
    }
  }, [activeBiz?.id])

  useEffect(() => { fetchSources() }, [fetchSources])

  async function openPreview(source: KnowledgeSource) {
    if (source.status === 'PROCESSING') {
      toast.info('Still processing — check back in a moment')
      return
    }
    setPreview(source)
    setPreviewLoading(true)
    try {
      const { data } = await knowledgeApi.getContent(activeBiz!.id, source.id)
      setPreview(data.source)
    } catch {
      toast.error('Could not load content')
      setPreview(null)
    } finally {
      setPreviewLoading(false)
    }
  }

  async function addUrl(e: React.FormEvent) {
    e.preventDefault()
    if (!activeBiz || !url.trim()) return
    setUrlLoading(true)
    try {
      await knowledgeApi.addUrl(activeBiz.id, url.trim())
      toast.success('URL queued for processing')
      setUrl('')
      fetchSources()
    } catch {
      toast.error('Failed to add URL')
    } finally {
      setUrlLoading(false)
    }
  }

  async function uploadFile(file: File) {
    if (!activeBiz) return
    if (file.size > 20 * 1024 * 1024) { toast.error('File must be under 20MB'); return }
    setFileLoading(true)
    try {
      await knowledgeApi.addFile(activeBiz.id, file)
      toast.success(`"${file.name}" uploading…`)
      fetchSources()
    } catch {
      toast.error('Upload failed')
    } finally {
      setFileLoading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }

  async function addFaq(e: React.FormEvent) {
    e.preventDefault()
    if (!activeBiz || !faqText.trim()) return
    setFaqLoading(true)
    try {
      await knowledgeApi.addFaq(activeBiz.id, faqText.trim(), faqName.trim() || undefined)
      toast.success('FAQ added and sent to your AI agent')
      setFaqName('')
      setFaqText('')
      fetchSources()
    } catch {
      toast.error('Failed to add FAQ')
    } finally {
      setFaqLoading(false)
    }
  }

  async function deleteSource(e: React.MouseEvent, sourceId: string) {
    e.stopPropagation()
    if (!activeBiz) return
    try {
      await knowledgeApi.delete(activeBiz.id, sourceId)
      setSources(prev => prev.filter(s => s.id !== sourceId))
      if (preview?.id === sourceId) setPreview(null)
      toast.success('Source removed')
    } catch {
      toast.error('Delete failed')
    }
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  if (!activeBiz) return (
    <div className="text-center py-24 text-gray-500">Select a business to manage its knowledge base.</div>
  )

  return (
    <>
      {preview && (
        <ContentModal source={preview} onClose={() => setPreview(null)} />
      )}

      <div className="max-w-3xl">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-1">Knowledge Base</h2>
          <p className="text-gray-400 text-sm">
            Upload content and your AI agent will learn from it — menus, FAQs, product lists, website pages.
            Click any indexed source to see what was extracted.
          </p>
        </div>

        {/* Tabs */}
        <div className="glass rounded-xl mb-5">
          <div className="flex border-b border-gray-800">
            {([
              { id: 'url',  label: '🌐 Website URL' },
              { id: 'file', label: '📎 Upload File' },
              { id: 'faq',  label: '✏️ FAQ / Text' },
            ] as const).map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  tab === t.id
                    ? 'text-indigo-300 border-b-2 border-indigo-500 -mb-px'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {tab === 'url' && (
              <form onSubmit={addUrl} className="space-y-3">
                <p className="text-xs text-gray-500 mb-3">
                  Enter your business website, menu page, or any public URL. VoiceBridge will scrape and index it.
                </p>
                <div className="flex gap-3">
                  <input
                    type="url"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="https://mamaskitchen.com/menu"
                    required
                    className="flex-1 px-4 py-2.5 bg-gray-900/80 border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={urlLoading || !url.trim()}
                    className="px-5 py-2.5 gradient-btn text-white text-sm font-medium rounded-xl disabled:opacity-60"
                  >
                    {urlLoading ? 'Adding…' : 'Add URL'}
                  </button>
                </div>
              </form>
            )}

            {tab === 'file' && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500 mb-3">
                  Upload menus, price lists, brochures, or photos. Supported: PDF, DOCX, CSV, TXT, XLSX,
                  and images (JPG, PNG, WEBP, GIF). Images are read with OCR.
                </p>
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    dragOver ? 'border-indigo-500 bg-indigo-500/5' : 'border-gray-700 hover:border-gray-600'
                  } ${fileLoading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <div className="text-3xl mb-3">
                    {fileLoading ? '⏳' : dragOver ? '📥' : '📂'}
                  </div>
                  <p className="text-sm text-gray-300 font-medium">
                    {fileLoading ? 'Uploading…' : 'Drop file here or click to browse'}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    PDF · DOCX · CSV · TXT · XLSX · JPG · PNG · WEBP · GIF — max 20MB
                  </p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept={ACCEPTED_FILES}
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f) }}
                />
              </div>
            )}

            {tab === 'faq' && (
              <form onSubmit={addFaq} className="space-y-3">
                <p className="text-xs text-gray-500 mb-3">
                  Type FAQs, business hours, policies, or any text you want your agent to know.
                </p>
                <input
                  type="text"
                  value={faqName}
                  onChange={e => setFaqName(e.target.value)}
                  placeholder="Name (e.g. Business Hours, Return Policy)"
                  className="w-full px-4 py-2.5 bg-gray-900/80 border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 text-sm"
                />
                <textarea
                  value={faqText}
                  onChange={e => setFaqText(e.target.value)}
                  placeholder={'Q: What are your opening hours?\nA: We are open Mon–Sat 8am–9pm, Sunday 10am–6pm.\n\nQ: Do you deliver?\nA: Yes, we deliver within 5km radius.'}
                  rows={7}
                  required
                  className="w-full px-4 py-2.5 bg-gray-900/80 border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 text-sm resize-none font-mono text-xs leading-relaxed"
                />
                <button
                  type="submit"
                  disabled={faqLoading || !faqText.trim()}
                  className="px-6 py-2.5 gradient-btn text-white text-sm font-medium rounded-xl disabled:opacity-60"
                >
                  {faqLoading ? 'Saving…' : '🤖 Save & Update AI Agent'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* How it works */}
        <div className="glass rounded-xl p-4 mb-5 border border-indigo-500/10">
          <p className="text-xs text-indigo-400 font-medium mb-1">🔄 How it works</p>
          <p className="text-xs text-gray-500">
            When you add a source, VoiceBridge extracts its text and automatically updates your AI agent's knowledge.
            Click any indexed source below to see exactly what your agent learned from it.
          </p>
        </div>

        {/* Sources list */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">
              Knowledge Sources
              <span className="text-gray-600 font-normal ml-2">({sources.length})</span>
            </h3>
            {sources.length > 0 && (
              <button onClick={fetchSources} className="text-xs text-gray-600 hover:text-gray-400">
                ↻ Refresh
              </button>
            )}
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-14 glass rounded-xl animate-pulse" />
              ))}
            </div>
          ) : sources.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center">
              <p className="text-3xl mb-2">🧠</p>
              <p className="text-sm text-gray-500">No knowledge sources yet.</p>
              <p className="text-xs text-gray-600 mt-1">Add a URL, file, or FAQ above to train your AI agent.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sources.map(s => (
                <div
                  key={s.id}
                  onClick={() => openPreview(s)}
                  className={`glass rounded-xl px-4 py-3 flex items-center gap-3 transition-all border ${
                    s.status === 'INDEXED'
                      ? 'cursor-pointer hover:border-indigo-500/40 hover:bg-indigo-500/5 border-transparent'
                      : 'border-transparent'
                  }`}
                >
                  <span className="text-xl flex-shrink-0">{FILE_TYPE_ICONS[s.type] || '📄'}</span>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{s.name}</p>
                    <p className="text-xs text-gray-600">
                      {s.type}
                      {s.fileSize != null && ` · ${formatBytes(s.fileSize)}`}
                      {s.chunkCount > 0 && ` · ${s.chunkCount} chunks indexed`}
                    </p>
                  </div>

                  {s.status === 'INDEXED' && (
                    <span className="text-xs text-gray-700 flex-shrink-0 hidden sm:block">
                      click to view ›
                    </span>
                  )}

                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLORS[s.status] || 'bg-gray-800 text-gray-400'}`}>
                    {s.status === 'PROCESSING' ? '⏳ Processing'
                      : s.status === 'INDEXED' ? '✓ Indexed'
                      : '✗ Error'}
                  </span>

                  <button
                    onClick={(e) => deleteSource(e, s.id)}
                    className="text-gray-700 hover:text-red-400 transition-colors text-lg flex-shrink-0 w-6 text-center"
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}