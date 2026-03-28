import { useState } from 'react'
import { addGoal } from '../firebase/db'
import { useTheme } from '../hooks/useTheme'

export default function GoalList({ uid, goals, onSelect, onLogout }) {
  const [input, setInput] = useState('')
  const [desc, setDesc] = useState('')
  const [adding, setAdding] = useState(false)
  const { c } = useTheme()

  const handleAdd = async () => {
    const v = input.trim()
    if (!v) return
    await addGoal(uid, { title: v, desc })
    setInput(''); setDesc(''); setAdding(false)
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', padding: '0 16px', maxWidth: 480, margin: '0 auto' }}>

      <div style={{ padding: '20px 0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `0.5px solid ${c.cardBorder}` }}>
        <span style={{ fontSize: 17, fontWeight: 600, color: c.accent }}>◆ Momentum</span>
        <button style={{ background: 'none', border: 'none', fontSize: 13, color: c.textMuted, cursor: 'pointer', fontFamily: 'inherit' }} onClick={onLogout}>Sign out</button>
      </div>

      <div style={{ flex: 1, paddingTop: 24 }}>
        {goals.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🎯</div>
            <div style={{ fontSize: 16, fontWeight: 500, color: c.text, marginBottom: 6 }}>No goals yet</div>
            <div style={{ fontSize: 13, color: c.textMuted }}>Add your first goal below to get started</div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: c.label, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>My goals</div>
            {goals.map(g => (
              <div key={g.id} style={{ background: c.card, border: `0.5px solid ${c.cardBorder}`, borderRadius: 14, padding: '16px 18px', marginBottom: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }} onClick={() => onSelect(g)}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: c.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🎯</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 500, color: c.text, marginBottom: g.desc ? 2 : 0 }}>{g.title}</div>
                  {g.desc && <div style={{ fontSize: 12, color: c.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.desc}</div>}
                </div>
                <div style={{ color: c.textFaint, fontSize: 18, flexShrink: 0 }}>›</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '16px 0 32px' }}>
        {!adding ? (
          <button style={{ width: '100%', background: c.accent, color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => setAdding(true)}>
            + Add a goal
          </button>
        ) : (
          <div style={{ background: c.card, border: `0.5px solid ${c.cardBorder}`, borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: c.text, marginBottom: 10 }}>New goal</div>
            <input
              style={{ width: '100%', border: `0.5px solid ${c.inputBorder}`, borderRadius: 10, padding: '10px 12px', fontSize: 16, background: c.input, outline: 'none', fontFamily: 'inherit', color: c.text, marginBottom: 8, display: 'block' }}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="e.g. Learn AI and LLMs"
              autoFocus
            />
            <textarea
              style={{ width: '100%', border: `0.5px solid ${c.inputBorder}`, borderRadius: 10, padding: '10px 12px', fontSize: 16, background: c.input, outline: 'none', fontFamily: 'inherit', color: c.text, resize: 'none', lineHeight: 1.5, display: 'block', marginBottom: 10 }}
              rows={2}
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Why does this matter? (optional)"
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ flex: 1, background: c.accent, color: '#fff', border: 'none', borderRadius: 10, padding: '11px', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }} onClick={handleAdd}>Add goal</button>
              <button style={{ background: 'none', border: `0.5px solid ${c.cardBorder}`, borderRadius: 10, padding: '11px 16px', fontSize: 14, color: c.textMuted, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => setAdding(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}