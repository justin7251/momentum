import { useState } from 'react'
import { addCheckin } from '../firebase/db'

const MOODS = [
  { e: '😤', l: 'Hard' }, { e: '😐', l: 'Meh' },
  { e: '🙂', l: 'OK' }, { e: '😊', l: 'Good' }, { e: '🔥', l: 'Great' }
]

export default function CheckIn({ uid, goalId, checkins }) {
  const [mood, setMood] = useState(null)
  const [what, setWhat] = useState('')
  const [blocker, setBlocker] = useState('')
  const [saved, setSaved] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const alreadyDone = checkins.some(c => c.date === today)

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

  return (
    <div>
      <div style={styles.label}>How did today go?</div>

      {alreadyDone && (
        <div style={styles.done}>Check-in done for today ✓</div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {MOODS.map((m, i) => (
          <button key={i} style={{ ...styles.moodBtn, borderColor: mood === i ? '#534AB7' : '#ddd', background: mood === i ? '#EEEDFE' : '#fff' }} onClick={() => setMood(i)}>
            {m.e}
          </button>
        ))}
      </div>

      <div style={styles.label}>What did you do?</div>
      <textarea style={styles.ta} rows={2} value={what} onChange={e => setWhat(e.target.value)} placeholder="Tasks completed, topics covered..." />

      <div style={{ ...styles.label, marginTop: 10 }}>Any blockers?</div>
      <textarea style={styles.ta} rows={2} value={blocker} onChange={e => setBlocker(e.target.value)} placeholder="What got in the way?" />

      <button style={{ ...styles.btnPri, marginTop: 12 }} onClick={handleSubmit} disabled={mood === null}>
        Save check-in
      </button>

      {saved && <div style={styles.success}>Saved!</div>}
    </div>
  )
}

const styles = {
  label: { fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 },
  done: { background: '#EAF3DE', color: '#3B6D11', border: '0.5px solid #C0DD97', borderRadius: 8, padding: '8px 12px', fontSize: 13, marginBottom: 12 },
  moodBtn: { width: 44, height: 44, borderRadius: 10, border: '1.5px solid #ddd', background: '#fff', fontSize: 20, cursor: 'pointer', transition: 'all .15s' },
  ta: { width: '100%', border: '0.5px solid #ddd', borderRadius: 8, padding: '8px 11px', fontSize: 14, background: '#fafaf8', outline: 'none', fontFamily: 'inherit', resize: 'none', lineHeight: 1.5 },
  btnPri: { background: '#534AB7', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  success: { marginTop: 10, background: '#EAF3DE', color: '#3B6D11', border: '0.5px solid #C0DD97', borderRadius: 8, padding: '8px 12px', fontSize: 13 }
}