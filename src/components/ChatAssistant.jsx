import { useState, useRef, useEffect } from 'react'
import { useTheme } from '../hooks/useTheme'
import { chat } from '../hooks/useAI'
import { getChat, saveChat } from '../firebase/db'

const WELCOME = (goal) => `Hi! I'm your coach for "${goal.title}". I remember our past conversations so you don't have to repeat yourself. Ask me anything — how to get unstuck, what to focus on, or how to improve your approach.`

export default function ChatAssistant({ uid, goalId, goal, checkins, tasks }) {
  const { c } = useTheme()
  const [messages, setMessages] = useState(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => { loadHistory() }, [goalId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadHistory = async () => {
    setLoadingHistory(true)
    try {
      const snap = await getChat(uid, goalId)
      if (snap.exists() && snap.data().messages?.length > 0) {
        setMessages(snap.data().messages)
      } else {
        setMessages([{ role: 'assistant', text: WELCOME(goal) }])
      }
    } catch (e) {
      setMessages([{ role: 'assistant', text: WELCOME(goal) }])
    }
    setLoadingHistory(false)
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
      const reply = await chat(updated, goal, checkins, tasks)
      const assistantMsg = { role: 'assistant', text: reply, ts: new Date().toISOString() }
      const final = [...updated, assistantMsg]
      setMessages(final)
      await saveChat(uid, goalId, final)
    } catch (e) {
      const errMsg = { role: 'assistant', text: 'Something went wrong. Try again.', ts: new Date().toISOString() }
      const final = [...updated, errMsg]
      setMessages(final)
    }
    setLoading(false)
  }

  const handleClear = async () => {
    if (!confirm('Clear conversation history?')) return
    const fresh = [{ role: 'assistant', text: WELCOME(goal), ts: new Date().toISOString() }]
    setMessages(fresh)
    await saveChat(uid, goalId, fresh)
  }

  if (loadingHistory) return (
    <div style={{ textAlign: 'center', padding: '40px 0', fontSize: 13, color: c.textFaint }}>Loading conversation...</div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 440 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: c.label, textTransform: 'uppercase', letterSpacing: '.06em' }}>
          AI Coach · {messages.length - 1} messages
        </div>
        <button style={{ background: 'none', border: 'none', fontSize: 11, color: c.textFaint, cursor: 'pointer', fontFamily: 'inherit' }} onClick={handleClear}>
          Clear history
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', marginBottom: 12, paddingRight: 2 }}>
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
              {m.ts && (
                <div style={{ fontSize: 10, opacity: 0.5, marginTop: 4 }}>
                  {new Date(m.ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
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