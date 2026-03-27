import { useState } from 'react'
import { addGoal } from '../firebase/db'

export default function GoalList({ uid, goals, onSelect, onLogout }) {
  const [input, setInput] = useState('')
  const [desc, setDesc] = useState('')

  const handleAdd = async () => {
    const v = input.trim()
    if (!v) return
    const ref = await addGoal(uid, { title: v, desc })
    setInput(''); setDesc('')
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <span style={styles.title}>My goals</span>
        <button style={styles.logout} onClick={onLogout}>Sign out</button>
      </div>

      {goals.length === 0 && (
        <div style={styles.empty}>No goals yet — add one below</div>
      )}

      {goals.map(g => (
        <div key={g.id} style={styles.goalCard} onClick={() => onSelect(g)}>
          <div style={styles.goalTitle}>{g.title}</div>
          {g.desc && <div style={styles.goalDesc}>{g.desc}</div>}
        </div>
      ))}

      <div style={styles.addCard}>
        <div style={styles.label}>New goal</div>
        <input
          style={styles.input}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="e.g. Learn AI and LLMs"
        />
        <textarea
          style={{ ...styles.input, marginTop: 8, resize: 'none', lineHeight: 1.5 }}
          rows={2}
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Why does this matter? (optional)"
        />
        <button style={styles.btnPri} onClick={handleAdd}>Add goal</button>
      </div>
    </div>
  )
}

const styles = {
  wrap: { padding: '20px 16px 80px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 600 },
  logout: { background: 'none', border: 'none', fontSize: 13, color: '#888', cursor: 'pointer', fontFamily: 'inherit' },
  empty: { fontSize: 13, color: '#aaa', padding: '16px 0' },
  goalCard: { background: '#fff', border: '0.5px solid #e8e6de', borderRadius: 12, padding: '14px 16px', marginBottom: 10, cursor: 'pointer' },
  goalTitle: { fontSize: 15, fontWeight: 500 },
  goalDesc: { fontSize: 13, color: '#888', marginTop: 4 },
  addCard: { background: '#fff', border: '0.5px solid #e8e6de', borderRadius: 12, padding: '16px' },
  label: { fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 },
  input: { width: '100%', border: '0.5px solid #ddd', borderRadius: 8, padding: '9px 12px', fontSize: 14, background: '#fafaf8', outline: 'none', fontFamily: 'inherit', display: 'block' },
  btnPri: { marginTop: 10, background: '#534AB7', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }
}