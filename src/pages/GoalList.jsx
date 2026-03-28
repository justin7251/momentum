import { useState } from 'react'
import { useTheme } from '../hooks/useTheme'

export default function GoalList({ uid, goals, onSelect, onLogout }) {
  const [input, setInput] = useState('')
  const [desc, setDesc] = useState('')
  const { c } = useTheme()

  const handleAdd = async () => {
    const v = input.trim()
    if (!v) return
    await addGoal(uid, { title: v, desc })
    setInput(''); setDesc('')
  }

  return (
    <div style={{ padding: '20px 16px 80px', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: c.accent }}>◆ Momentum</span>
        <button style={{ background: 'none', border: 'none', fontSize: 13, color: c.textMuted, cursor: 'pointer', fontFamily: 'inherit' }} onClick={onLogout}>Sign out</button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: c.label, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>My goals</div>
        {goals.length === 0 && <div style={{ fontSize: 14, color: c.textFaint, padding: '12px 0' }}>No goals yet</div>}
        {goals.map(g => (
          <div key={g.id} style={{ background: c.card, border: `0.5px solid ${c.cardBorder}`, borderRadius: 12, padding: '14px 16px', marginBottom: 8, cursor: 'pointer', position: 'relative' }} onClick={() => onSelect(g)}>
            <div style={{ fontSize: 15, fontWeight: 500, color: c.text, marginBottom: 2 }}>{g.title}</div>
            {g.desc && <div style={{ fontSize: 13, color: c.textMuted }}>{g.desc}</div>}
            <div style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: c.textFaint, fontSize: 16 }}>→</div>
          </div>
        ))}
      </div>

      <div style={{ background: c.card, border: `0.5px solid ${c.cardBorder}`, borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: c.label, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Add a goal</div>
        <input style={{ width: '100%', border: `0.5px solid ${c.inputBorder}`, borderRadius: 8, padding: '10px 12px', fontSize: 16, background: c.input, outline: 'none', fontFamily: 'inherit', display: 'block', color: c.text }} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} placeholder="e.g. Learn AI and LLMs" />
        <textarea style={{ width: '100%', border: `0.5px solid ${c.inputBorder}`, borderRadius: 8, padding: '10px 12px', fontSize: 16, background: c.input, outline: 'none', fontFamily: 'inherit', display: 'block', color: c.text, marginTop: 8, resize: 'none', lineHeight: 1.5 }} rows={2} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Why does this matter? (optional)" />
        <button style={{ marginTop: 10, background: c.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', width: '100%' }} onClick={handleAdd}>Add goal</button>
      </div>
    </div>
  )
}