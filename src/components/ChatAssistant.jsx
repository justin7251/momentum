import { useState, useRef, useEffect } from 'react'
import { useTheme } from '../hooks/useTheme'
import { chat, summariseChat } from '../hooks/useAI'
import { getChat, saveChat } from '../firebase/db'

const MAX_MESSAGES = 50
const SUMMARISE_AFTER = 30
const KEEP_RECENT = 20

const WELCOME = (goal) => `Hi! I'm your coach for "${goal.title}". I remember our past conversations. Ask me anything — how to get unstuck, what to focus on, or how to improve. You can also ask me for today's news!`

export default function ChatAssistant({ uid, goalId, goal, checkins, tasks }) {
  const { c } = useTheme()
  const [messages, setMessages] = useState(null)
  const [summary, setSummary] = useState(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [showClear, setShowClear] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { loadHistory() }, [goalId])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const loadHistory = async () => {
    setLoadingHistory(true)
    const snap = await getChat(uid, goalId)
    if (snap.exists()) {
      const data = snap.data()
      setMessages(data.messages || [])
      setSummary(data.summary || null)
    } else {
      setMessages([])
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

    // Detect news request to show "Searching the web..." indicator
    const isNews = /news|today|latest|current events|what's happening|headlines/i.test(v)
    if (isNews) setIsSearching(true)

    try {
      // chat() now handles both normal and news flows internally
      // It returns { text: string } in both cases
      const response = await chat(updated, goal, checkins, tasks)

      let rawText = response.text;

      let cleanText = rawText.replace(/(\*\*How I gathered information\*\*[\s\S]*?---)/gi, '');
      cleanText = cleanText.replace(/### Quick Takeaways/gi, '');
      cleanText = cleanText.replace(/🔍 Live news/gi, '');

      const assistantMsg = {
        role: 'assistant',
        text: cleanText,
        ts: new Date().toISOString(),
        isNews: isNews  // flag so we can style news replies differently
      }

      const nextMessages = [...updated, assistantMsg]

      // Compress history if needed
      const { messages: compressed, summary: newSummary } = await compressIfNeeded(nextMessages)
      setMessages(compressed)
      setSummary(newSummary)

      // Persist to Firebase
      await saveChat(uid, goalId, compressed, newSummary)
    } catch (e) {
      console.error('Chat error:', e)
      const errMsg = {
        role: 'assistant',
        text: "Sorry, I ran into an issue. Please try again.",
        ts: new Date().toISOString()
      }
      setMessages(prev => [...prev, errMsg])
    }

    setIsSearching(false)
    setLoading(false)
  }

  const handleClear = async () => {
    const fresh = [{ role: 'assistant', text: WELCOME(goal), ts: new Date().toISOString() }]
    setMessages(fresh)
    setSummary(null)
    setShowClear(false)
    await saveChat(uid, goalId, fresh, null)
  }

  const MessageContent = ({ m, c }) => {
    if (m.isNews) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8,
            borderBottom: `1px solid rgba(255,255,255,0.1)`,
            paddingBottom: '8px'
          }}>
            <span style={{ fontSize: '14px' }}>📡</span>
            <div style={{ 
              fontSize: 10, 
              fontWeight: 800, 
              color: c.accent, 
              textTransform: 'uppercase', 
              letterSpacing: '0.1em' 
            }}>
              Live Intelligence Feed
            </div>
          </div>

          {/* News Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {m.text.split('\n')
              .filter(t => t.trim() && t.length > 5) // Filter out empty or tiny lines
              .map((line, idx) => {
                // Clean up markdown asterisks and numbers
                const cleanLine = line.replace(/[\*\#]/g, '').replace(/^\d+\.\s*/, '').trim();
                
                // Split into Bold Title and Body if a colon exists
                const [title, ...rest] = cleanLine.split(':');
                const body = rest.join(':');

                return (
                  <div key={idx} style={{ position: 'relative', paddingLeft: '12px' }}>
                    {/* Vertical Accent Line */}
                    <div style={{ 
                      position: 'absolute', 
                      left: 0, 
                      top: '4px', 
                      bottom: '4px', 
                      width: '2px', 
                      background: c.accent, 
                      opacity: 0.6,
                      borderRadius: '2px'
                    }} />
                    
                    {body ? (
                      <>
                        <div style={{ fontWeight: '700', fontSize: '13px', color: '#fff', marginBottom: '2px' }}>
                          {title}
                        </div>
                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.5' }}>
                          {body}
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: '13px', color: '#fff', lineHeight: '1.5' }}>
                        {cleanLine}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      );
    }
    return <span style={{ whiteSpace: 'pre-wrap' }}>{m.text}</span>;
  };

  if (loadingHistory) return (
    <div style={{ textAlign: 'center', padding: '40px 0', fontSize: 13, color: c.textFaint }}>Loading...</div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 440 }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: c.label, textTransform: 'uppercase', letterSpacing: '.06em' }}>
          AI Coach · {Math.max(0, messages.length - 1)} messages
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
        {messages.length === 0 && (
          <div style={{ fontSize: 13, color: c.textMuted, padding: '10px 0', lineHeight: 1.6 }}>
            {WELCOME(goal)}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
            <div style={{
              maxWidth: '82%', padding: '10px 13px',
              borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
              background: m.role === 'user' ? c.accent : c.accentBg,
              color: m.role === 'user' ? '#fff' : c.accentText,
              fontSize: 13, lineHeight: 1.6,
              // Give news replies a subtle left border accent
              borderLeft: m.isNews ? `3px solid ${c.accent}` : undefined
            }}>
              {m.isNews && (
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', opacity: 0.5, marginBottom: 4 }}>
                  🔍 Live news
                </div>
              )}
              <MessageContent m={m} c={c} />
              <div style={{ fontSize: 10, opacity: 0.4, marginTop: 4 }}>
                {m.ts ? new Date(m.ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10 }}>
            <div style={{ padding: '10px 13px', borderRadius: '14px 14px 14px 4px', background: c.accentBg, color: c.accentText, fontSize: 13 }}>
              {isSearching ? '🔍 Searching the web...' : 'Thinking...'}
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
          placeholder="Ask your coach or 'get me news for today'..."
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