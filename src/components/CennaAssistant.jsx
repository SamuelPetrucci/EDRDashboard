import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Sparkles, X, Send } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { sendCennaMessage } from '../data/cennaClient'
import './CennaAssistant.css'

const WELCOME = `I'm Cenna — your DRIS briefing copilot.

Ask for a tight situational read, a preparedness checklist, or a neutral summary of what to verify next. When your Supabase project has the Cenna Edge Function configured with optional web search + a language model, I can ground answers on fresh excerpts (Tavily) before summarizing.

What should we brief first?`

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * @param {{ withFooterBand?: boolean }} props
 * When true, lifts the FAB slightly so it clears the enterprise footer (pages that render it).
 */
export default function CennaAssistant({ withFooterBand = false }) {
  const { session } = useAuth()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [mode, setMode] = useState('')
  const [messages, setMessages] = useState(() => [{ id: uid(), role: 'assistant', content: WELCOME }])
  const listRef = useRef(null)

  const scrollToEnd = useCallback(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [])

  useEffect(() => {
    scrollToEnd()
  }, [messages, open, scrollToEnd])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const submit = useCallback(async () => {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    const userMsg = { id: uid(), role: 'user', content: text }
    setMessages((m) => [...m, userMsg])
    setSending(true)
    setMode('')

    const thread = [...messages, userMsg].filter((x) => x.role === 'user' || x.role === 'assistant').map((x) => ({
      role: x.role,
      content: x.content,
    }))

    const res = await sendCennaMessage(thread)
    setSending(false)

    if (!res.ok) {
      setMessages((m) => [
        ...m,
        { id: uid(), role: 'assistant', content: '', error: res.error || 'Something went wrong.' },
      ])
      setMode(res.mode || 'error')
      return
    }

    setMode(res.mode || '')
    setMessages((m) => [...m, { id: uid(), role: 'assistant', content: res.reply }])
  }, [input, messages, sending])

  if (!session) return null

  const portalTarget = typeof document !== 'undefined' ? document.body : null
  if (!portalTarget) return null

  const fabClass = `cenna-fab${withFooterBand ? ' cenna-fab--above-site-footer' : ''}`

  return createPortal(
    <>
      <button
        type="button"
        className={fabClass}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="cenna-fab__mark" aria-hidden>
          C
        </span>
        <span className="cenna-fab__label">Cenna</span>
      </button>

      {open ? (
        <>
          <button type="button" className="cenna-backdrop" aria-label="Close Cenna" onClick={() => setOpen(false)} />
          <div className="cenna-panel" role="dialog" aria-modal="true" aria-labelledby="cenna-title">
            <div className="cenna-panel__header">
              <div className="cenna-panel__title">
                <h2 id="cenna-title">Cenna</h2>
                <p>Briefings, preparedness framing, and grounded summaries — tuned for duty officers and executives.</p>
              </div>
              <button type="button" className="cenna-panel__close" onClick={() => setOpen(false)} aria-label="Close">
                <X size={20} strokeWidth={2} />
              </button>
            </div>
            {mode ? (
              <div className="cenna-panel__mode" aria-live="polite">
                Mode: {mode}
              </div>
            ) : null}
            <div className="cenna-panel__messages" ref={listRef}>
              {messages.map((m) =>
                m.error ? (
                  <div key={m.id} className="cenna-msg cenna-msg--error" role="alert">
                    {m.error}
                  </div>
                ) : (
                  <div key={m.id} className={`cenna-msg cenna-msg--${m.role}`}>
                    {m.content}
                  </div>
                )
              )}
              {sending ? (
                <div className="cenna-msg cenna-msg--assistant" aria-live="polite">
                  <Sparkles size={16} style={{ display: 'inline', verticalAlign: 'text-top', marginRight: 6 }} />
                  Drafting a brief…
                </div>
              ) : null}
            </div>
            <div className="cenna-panel__composer">
              <p className="cenna-panel__hint">
                Server keys control quality: set <code>OPENAI_API_KEY</code> and optional <code>TAVILY_API_KEY</code> on the{' '}
                <code>cenna-chat</code> Edge Function. Without them, Cenna runs in local stub mode.
              </p>
              <div className="cenna-panel__row">
                <textarea
                  className="cenna-panel__input"
                  rows={2}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="e.g. Brief me on flood readiness for the next 48 hours…"
                  disabled={sending}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      submit()
                    }
                  }}
                />
                <button type="button" className="cenna-panel__send" onClick={submit} disabled={sending || !input.trim()} aria-label="Send">
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </>,
    portalTarget
  )
}
