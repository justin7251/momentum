import { useState } from 'react'
import { addCheckin } from '../firebase/db'
import { useTheme } from '../hooks/useTheme'

const MOODS = [
  { e: '😤', l: 'Hard' }, { e: '😐', l: 'Meh' },
  { e: '🙂', l: 'OK' }, { e: '😊', l: 'Good' }, { e: '🔥', l: 'Great' }
]

export default function CheckIn({ uid, goalId, checkins }) {
  const [mood, setMood] = useState(null)
  const [what, setWhat] = useState('')
  const [blocker, setBlocker] = useState('')
  const [saved, setSaved] = useState(false)
  const { c } = useTheme()

  const today = new Date().toISOString().split('T')[0]
  const alreadyDone = checkins.some(ci => ci.date === today)

  const handleSubmit = async () => {
    if (mood === null) return
    await addCheckin(uid, goalId, {
      date: today,
      mood,
      moodEmoji: MOODS[mood].e,
      moodLabel: MOODS[mood].l,
      what,
      blocker
    })
    setMood(null); setWhat(''); setBlocker('')
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const ta = {
    width: '100%', border: `0.5px solid ${c.inputBorder}`, borderRadius: 10,
    padding: '10px 12px', fontSize: 16, background: c.input, outline: 'none',
    fontFamily: 'inherit', resize: 'none', lineHeight: 1.5, color: c.text,
    display: 'block'
  }

  return (
    <div>
      {alreadyDone && (
        <div style={{ background: '#EAF3DE', color: '#3B6D11', border: '0.5px solid #C0DD97', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 14 }}>
          You already checked in today ✓
        </div>
      )}

      <div style={{ fontSize: 13, fontWeight: 500, color: c.text, marginBottom: 10 }}>How did today go?</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {MOODS.map((m, i) => (
          <button key={i} style={{ flex: 1, height: 52, borderRadius: 12, border: `1.5px solid ${mood === i ? c.accent : c.inputBorder}`, background: mood === i ? c.accentBg : c.input, fontSize: 22, cursor: 'pointer', transition: 'all .15s', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }} onClick={() => setMood(i)}>
            {m.e}
            <span style={{ fontSize: 9, color: mood === i ? c.accentText : c.textFaint, fontWeight: 500 }}>{m.l}</span>
          </button>
        ))}
      </div>

      <div style={{ fontSize: 13, fontWeight: 500, color: c.text, marginBottom: 8 }}>What did you do?</div>
      <textarea style={{ ...ta, marginBottom: 14 }} rows={2} value={what} onChange={e => setWhat(e.target.value)} placeholder="Tasks completed, topics covered..." />

      <div style={{ fontSize: 13, fontWeight: 500, color: c.text, marginBottom: 8 }}>Any blockers?</div>
      <textarea style={{ ...ta, marginBottom: 16 }} rows={2} value={blocker} onChange={e => setBlocker(e.target.value)} placeholder="What got in the way?" />

      <button
        style={{ width: '100%', background: mood === null ? c.inputBorder : c.accent, color: mood === null ? c.textFaint : '#fff', border: 'none', borderRadius: 10, padding: '13px', fontSize: 15, fontWeight: 500, cursor: mood === null ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all .2s' }}
        onClick={handleSubmit}
        disabled={mood === null}
      >
        Save check-in
      </button>

      {saved && (
        <div style={{ marginTop: 12, background: '#EAF3DE', color: '#3B6D11', border: '0.5px solid #C0DD97', borderRadius: 10, padding: '10px 14px', fontSize: 13, textAlign: 'center' }}>
          Check-in saved! +5 XP
        </div>
      )}
    </div>
  )
}