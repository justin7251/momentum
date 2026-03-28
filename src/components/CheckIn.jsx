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

  const ta = { width: '100%', border: `0.5px solid ${c.inputBorder}`, borderRadius: 8, padding: '9px 12px', fontSize: 16, background: c.input, outline: 'none', fontFamily: 'inherit', resize: 'none', lineHeight: 1.5, color: c.text }

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: c.label, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>How did today go?</div>

      {alreadyDone && (
        <div style={{ background: '#EAF3DE', color: '#3B6D11', border: '0.5px solid #C0DD97', borderRadius: 8, padding: '8px 12px', fontSize: 13, marginBottom: 12 }}>
          Check-in done for today ✓
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {MOODS.map((m, i) => (
          <button key={i} style={{ width: 44, height: 44, borderRadius: 10, border: `1.5px solid ${mood === i ? c.accent : c.inputBorder}`, background: mood === i ? c.accentBg : c.card, fontSize: 20, cursor: 'pointer', transition: 'all .15s' }} onClick={() => setMood(i)}>
            {m.e}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 11, fontWeight: 600, color: c.label, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>What did you do?</div>
      <textarea style={ta} rows={2} value={what} onChange={e => setWhat(e.target.value)} placeholder="Tasks completed, topics covered..." />

      <div style={{ fontSize: 11, fontWeight: 600, color: c.label, textTransform: 'uppercase', letterSpacing: '.06em', margin: '10px 0 8px' }}>Any blockers?</div>
      <textarea style={ta} rows={2} value={blocker} onChange={e => setBlocker(e.target.value)} placeholder="What got in the way?" />

      <button
        style={{ marginTop: 12, background: mood === null ? c.textFaint : c.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 14, fontWeight: 500, cursor: mood === null ? 'not-allowed' : 'pointer', fontFamily: 'inherit', width: '100%', transition: 'background .15s' }}
        onClick={handleSubmit}
        disabled={mood === null}
      >
        Save check-in
      </button>

      {saved && (
        <div style={{ marginTop: 10, background: '#EAF3DE', color: '#3B6D11', border: '0.5px solid #C0DD97', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}>
          Saved!
        </div>
      )}
    </div>
  )
}