import { useState, useRef, useEffect } from 'react'
import { useTheme } from '../hooks/useTheme'
import { chat, summariseChat } from '../hooks/useAI'
import { getChat, saveChat } from '../firebase/db'

const MAX_MESSAGES = 50
const SUMMARISE_AFTER = 30
const KEEP_RECENT = 20

const WELCOME = (goal) => `Hi! I'm your coach for "${goal.title}". I remember our past conversations. Ask me anything — how to get unstuck, what to focus on, or how to improve.`

export default function ChatAssistant({ uid, goalId, goal, checkins, tasks }) {
  const { c } = useTheme()
  const [messages, setMessages] = useState(null)
  const [summary, setSummary] = useState(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [showClear, setShowClear] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { loadHistory() }, [goalId])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const loadHistory = async () => {
    setLoadingHistory(true)
    try {
      const snap = await getChat(uid, goalId)
      if (snap.exists()) {
        const data = snap.data()
        setMessages(data.messages?.length > 0 ? data.messages : [{ role: 'assistant', text: WELCOME(goal), ts: new Date().toISOString() }])
        setSummary(data.summary || null)
      } else {
        setMessages([{ role: 'assistant', text: WELCOME(goal), ts: new Date().toISOString() }])
      }
    } catch (e) {
      setMessages([{ role: 'assistant', text: WELCOME(goal), ts: new Date().toISOString() }])
    }
    setLoadingHistory(false)
  }

  const compressIfNeeded = async (msgs) => {
    if (msgs.length < MAX_MESSAGES) return { messages: msgs, summary }
    const toSummarise = msgs.slice(0, SUMMARISE_AFTER)
    const toKeep = msgs.slice(-KEEP_RECENT)
    const newSummary = await summariseChat(toSummarise)
    return { messages: toKeep, summary: newSummary }
  }

  const handleSend = async () => {
    const v = input.trim()
    if (!v || loading) return

    const userMsg = { role: 'user', text: v, ts: new Date().toISOString() }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setLoading(true)

    try {
      const contextMessages = summary
        ? [{ role: 'assistant', text: `[Previous conversation summary: ${summary}]` }, ...updated]
        : updated

      const reply = await chat(contextMessages, goal, checkins, tasks)
      const assistantMsg = { role: 'assistant', text: reply, ts: new Date().toISOString() }
      const withReply = [...updated, assistantMsg]

      const { messages: compressed, summary: newSummary } = await compressIfNeeded(withReply)
      setMessages(compressed)
      setSummary(newSummary)
      await saveChat(uid, goalId, compressed, newSummary)
    } catch (e) {
      const errMsg = { role: 'assistant', text: 'Something went wrong. Try again.', ts: new Date().toISOString() }
      setMessages(prev => [...prev, errMsg])
    }
    setLoading(false)
  }

  const handleClear = async () => {
    const fresh = [{ role: 'assistant', text: WELCOME(goal), ts: new Date().toISOString() }]
    setMessages(fresh)
    setSummary(null)
    setShowClear(false)
    await saveChat(uid, goalId, fresh, null)
  }

  if (loadingHistory) return (
    <div style={{ textAlign: 'center', padding: '40px 0', fontSize: 13, color: c.textFaint }}>Loading...</div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 440 }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: c.label, textTransform: 'uppercase', letterSpacing: '.06em' }}>
          AI Coach · {messages.length - 1} messages
        </div>
        <button
          style={{ background: 'none', border: `0.5px solid ${c.cardBorder}`, borderRadius: 6, padding: '3px 10px', fontSize: 11, color: c.textMuted, cursor: 'pointer', fontFamily: 'inherit' }}
          onClick={() => setShowClear(!showClear)}
        >
          ···
        </button>
      </div>

      {showClear && (
        <div style={{ background: '#FCEBEB', border: '0.5px solid #F7C1C1', borderRadius: 10, padding: '12px 14px', marginBottom: 10 }}>
          <div style={{ fontSize: 13, color: '#A32D2D', marginBottom: 10 }}>Clear all conversation history? This cannot be undone.</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ flex: 1, background: '#A32D2D', color: '#fff', border: 'none', borderRadius: 8, padding: '8px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }} onClick={handleClear}>Clear history</button>
            <button style={{ background: 'none', border: `0.5px solid #F7C1C1`, borderRadius: 8, padding: '8px 14px', fontSize: 13, color: '#A32D2D', cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => setShowClear(false)}>Cancel</button>
          </div>
        </div>
      )}

      {summary && (
        <div style={{ background: c.streak, border: `0.5px solid ${c.cardBorder}`, borderRadius: 10, padding: '10px 12px', marginBottom: 10, fontSize: 12, color: c.textMuted, lineHeight: 1.5 }}>
          <span style={{ fontWeight: 600, color: c.textMuted }}>Past context: </span>{summary}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', marginBottom: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
            <div style={{
              maxWidth: '82%', padding: '10px 13px',
              borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
              background: m.role === 'user' ? c.accent : c.accentBg,
              color: m.role === 'user' ? '#fff' : c.accentText,
              fontSize: 13, lineHeight: 1.6
            }}>
              {m.text}
              <div style={{ fontSize: 10, opacity: 0.4, marginTop: 4 }}>
                {m.ts ? new Date(m.ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10 }}>
            <div style={{ padding: '10px 13px', borderRadius: '14px 14px 14px 4px', background: c.accentBg, color: c.accentText, fontSize: 13 }}>
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          style={{ flex: 1, border: `0.5px solid ${c.inputBorder}`, borderRadius: 10, padding: '10px 12px', fontSize: 16, background: c.input, outline: 'none', fontFamily: 'inherit', color: c.text }}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask your coach..."
          disabled={loading}
        />
        <button
          style={{ background: loading ? c.inputBorder : c.accent, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 14, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
          onClick={handleSend}
          disabled={loading}
        >
          Send
        </button>
      </div>
    </div>
  )
}