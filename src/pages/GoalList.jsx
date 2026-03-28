import { useState } from 'react'
import { addGoal } from '../firebase/db'
import { useTheme } from '../hooks/useTheme'

const GOAL_EMOJIS = ['🎯', '📚', '💪', '🧠', '🚀', '🎨', '💻', '🌱']

export default function GoalList({ uid, goals, onSelect, onLogout }) {
  const [input, setInput] = useState('')
  const [desc, setDesc] = useState('')
  const [adding, setAdding] = useState(false)
  const { c } = useTheme()

  const handleAdd = async () => {
    const v = input.trim()
    if (!v) return
    const emoji = GOAL_EMOJIS[Math.floor(Math.random() * GOAL_EMOJIS.length)]
    await addGoal(uid, { title: v, desc, emoji })
    setInput(''); setDesc(''); setAdding(false)
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>

      <div style={{ padding: '20px 16px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: c.accent, letterSpacing: '-0.3px' }}>◆ Momentum</span>
        <button style={{ background: 'none', border: 'none', fontSize: 13, color: c.textMuted, cursor: 'pointer', fontFamily: 'inherit' }} onClick={onLogout}>Sign out</button>
      </div>

      <div style={{ flex: 1, padding: '8px 16px 16px' }}>
        {goals.length === 0 && !adding ? (
          <div style={{ textAlign: 'center', paddingTop: 80 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: c.text, marginBottom: 8 }}>No goals yet</div>
            <div style={{ fontSize: 14, color: c.textMuted, lineHeight: 1.6 }}>Add your first goal and start building momentum</div>
          </div>
        ) : (
          <div>
            {goals.length > 0 && (
              <div style={{ fontSize: 11, fontWeight: 600, color: c.label, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>My goals</div>
            )}
            {goals.map(g => (
              <div key={g.id} style={{ background: c.card, border: `0.5px solid ${c.cardBorder}`, borderRadius: 14, padding: '14px 16px', marginBottom: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }} onClick={() => onSelect(g)}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: c.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                  {g.emoji || '🎯'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 500, color: c.text }}>{g.title}</div>
                  {g.desc && <div style={{ fontSize: 12, color: c.textMuted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.desc}</div>}
                </div>
                <div style={{ color: c.textFaint, fontSize: 20 }}>›</div>
              </div>
            ))}
          </div>
        )}

        {adding && (
          <div style={{ background: c.card, border: `0.5px solid ${c.cardBorder}`, borderRadius: 14, padding: 16, marginTop: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: c.text, marginBottom: 12 }}>New goal</div>
            <input
              style={{ width: '100%', border: `0.5px solid ${c.inputBorder}`, borderRadius: 10, padding: '11px 12px', fontSize: 16, background: c.input, outline: 'none', fontFamily: 'inherit', color: c.text, display: 'block', marginBottom: 8 }}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="e.g. Learn AI and LLMs"
              autoFocus
            />
            <textarea
              style={{ width: '100%', border: `0.5px solid ${c.inputBorder}`, borderRadius: 10, padding: '11px 12px', fontSize: 16, background: c.input, outline: 'none', fontFamily: 'inherit', color: c.text, resize: 'none', lineHeight: 1.5, display: 'block', marginBottom: 12 }}
              rows={2}
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Why does this matter? (optional)"
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ flex: 1, background: c.accent, color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }} onClick={handleAdd}>Add goal</button>
              <button style={{ background: 'none', border: `0.5px solid ${c.cardBorder}`, borderRadius: 10, padding: '12px 16px', fontSize: 14, color: c.textMuted, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => setAdding(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {!adding && (
        <div style={{ padding: '12px 16px 36px' }}>
          <button style={{ width: '100%', background: c.accent, color: '#fff', border: 'none', borderRadius: 14, padding: '15px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.1px' }} onClick={() => setAdding(true)}>
            + Add a goal
          </button>
        </div>
      )}

    </div>
  )
}