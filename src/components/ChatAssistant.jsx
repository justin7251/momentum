import { useState, useRef, useEffect } from 'react'
import { useTheme } from '../hooks/useTheme'
import { chat, extractMemory, summariseChat, defaultMemory } from '../hooks/useAI'
import { getChat, saveChat, getMemory, saveMemory } from '../firebase/db'

const MAX_MESSAGES = 50
const SUMMARISE_AFTER = 30
const KEEP_RECENT = 20
const EXTRACT_EVERY = 10

const WELCOME = (goal) => `Hi! I'm your coach for "${goal.title}". I remember our past conversations and learn about you over time. Ask me anything.`

export default function ChatAssistant({ uid, goalId, goal, checkins, tasks, userData }) {
  const { c } = useTheme()
  const [messages, setMessages] = useState(null)
  const [summary, setSummary] = useState(null)
  const [memory, setMemory] = useState(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [showClear, setShowClear] = useState(false)
  const messagesSinceExtract = useRef(0)
  const bottomRef = useRef(null)

  useEffect(() => { loadHistory() }, [goalId])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const loadHistory = async () => {
    setLoadingHistory(true)
    try {
      const [chatSnap, memSnap] = await Promise.all([
        getChat(uid, goalId),
        getMemory(uid)
      ])
      if (chatSnap.exists() && chatSnap.data().messages?.length > 0) {
        setMessages(chatSnap.data().messages)
        setSummary(chatSnap.data().summary || null)
      } else {
        setMessages([{ role: 'assistant', text: WELCOME(goal), ts: new Date().toISOString() }])
      }
      if (memSnap.exists()) {
        const memData = memSnap.data()
        if (!memData.profile?.name && userData?.name) {
          const seeded = { ...memData, profile: { ...memData.profile, name: userData.name } }
          await saveMemory(uid, seeded)
          setMemory(seeded)
        } else {
          setMemory(memData)
        }
      } else {
        const fresh = { ...defaultMemory(uid), profile: { name: userData?.name || '', motivationStyle: '', communicationStyle: '' } }
        await saveMemory(uid, fresh)
        setMemory(fresh)
      }
    } catch (e) {
      setMessages([{ role: 'assistant', text: WELCOME(goal), ts: new Date().toISOString() }])
    }
    setLoadingHistory(false)
  }
  
  function MessageText({ text, isUser }) {
    const lines = text.split('\n').filter(l => l.trim())

    const parsed = lines.map(line => {
      const trimmed = line.trim()
      const numbered = trimmed.match(/^(\d+)\.\s+(.+)/)
      const bullet = trimmed.match(/^[-•*]\s+(.+)/)
      const clean = trimmed
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/#{1,3}\s/g, '')

      if (numbered) return { type: 'numbered', num: numbered[1], text: numbered[2].replace(/\*\*(.*?)\*\*/g, '$1') }
      if (bullet) return { type: 'bullet', text: bullet[1].replace(/\*\*(.*?)\*\*/g, '$1') }
      if (clean) return { type: 'text', text: clean }
      return null
    }).filter(Boolean)

    const color = isUser ? '#fff' : 'inherit'

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {parsed.map((item, i) => {
          if (item.type === 'numbered') return (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color, opacity: 0.7, flexShrink: 0, minWidth: 16, paddingTop: 1 }}>{item.num}.</span>
              <span style={{ fontSize: 13, lineHeight: 1.5, color }}>{item.text}</span>
            </div>
          )
          if (item.type === 'bullet') return (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 10, color, opacity: 0.5, flexShrink: 0, paddingTop: 3 }}>●</span>
              <span style={{ fontSize: 13, lineHeight: 1.5, color }}>{item.text}</span>
            </div>
          )
          return (
            <p key={i} style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color }}>{item.text}</p>
          )
        })}
      </div>
    )
  }

  const compressIfNeeded = async (msgs) => {
    if (msgs.length < MAX_MESSAGES) return { messages: msgs, summary }
    const toSummarise = msgs.slice(0, SUMMARISE_AFTER)
    const toKeep = msgs.slice(-KEEP_RECENT)
    const newSummary = await summariseChat(toSummarise)
    return { messages: toKeep, summary: newSummary }
  }

  const maybeExtractMemory = async (msgs) => {
    messagesSinceExtract.current += 1
    if (messagesSinceExtract.current < EXTRACT_EVERY) return
    messagesSinceExtract.current = 0
    try {
      const transcript = msgs.slice(-EXTRACT_EVERY).map(m => `${m.role === 'user' ? 'User' : 'Coach'}: ${m.text}`).join('\n')
      const updated = await extractMemory(memory || defaultMemory(uid), transcript)
      setMemory(updated)
      await saveMemory(uid, updated)
    } catch (e) {
      console.error('Memory extraction failed:', e)
    }
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
      const response = await chat(updated, goal, checkins, tasks, memory)
      const assistantMsg = { role: 'assistant', text: response.text, ts: new Date().toISOString() }
      const withReply = [...updated, assistantMsg]
      const { messages: compressed, summary: newSummary } = await compressIfNeeded(withReply)
      setMessages(compressed)
      setSummary(newSummary)
      await saveChat(uid, goalId, compressed, newSummary)
      await maybeExtractMemory(withReply)
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Something went wrong. Try again.', ts: new Date().toISOString() }])
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: c.label, textTransform: 'uppercase', letterSpacing: '.06em' }}>
            AI Coach · {messages.length - 1} messages
          </div>
          {memory?.sessionHistory?.length > 0 && (
            <span style={{ fontSize: 10, background: c.accentBg, color: c.accentText, padding: '1px 6px', borderRadius: 4, fontWeight: 500 }}>
              {memory.sessionHistory.length} sessions
            </span>
          )}
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
          <div style={{ fontSize: 13, color: '#A32D2D', marginBottom: 10 }}>Clear conversation history? Memory about you is kept separately.</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ flex: 1, background: '#A32D2D', color: '#fff', border: 'none', borderRadius: 8, padding: '8px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }} onClick={handleClear}>Clear chat</button>
            <button style={{ background: 'none', border: '0.5px solid #F7C1C1', borderRadius: 8, padding: '8px 14px', fontSize: 13, color: '#A32D2D', cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => setShowClear(false)}>Cancel</button>
          </div>
        </div>
      )}

      {summary && (
        <div style={{ background: c.streak, border: `0.5px solid ${c.cardBorder}`, borderRadius: 10, padding: '10px 12px', marginBottom: 10, fontSize: 12, color: c.textMuted, lineHeight: 1.5 }}>
          <span style={{ fontWeight: 600, color: c.textMuted }}>Earlier: </span>{summary}
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
              <MessageText text={m.text} isUser={m.role === 'user'} />
              <div style={{ fontSize: 10, opacity: 0.4, marginTop: 6, textAlign: m.role === 'user' ? 'right' : 'left' }}>
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