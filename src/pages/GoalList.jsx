import { useState } from 'react'
import { addGoal, archiveGoal } from '../firebase/db'
import { useTheme } from '../hooks/useTheme'
import { useGoalProgress } from '../hooks/useGoal'

const GOAL_EMOJIS = ['🎯','📚','💪','🧠','🚀','🎨','💻','🌱','✍️','🎵']

function GoalCard({ goal, onSelect, onArchive, c }) {
  const progress = useGoalProgress(goal.uid, goal.id)
  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0

  return (
    <div style={{ background: c.card, border: `0.5px solid ${c.cardBorder}`, borderRadius: 14, padding: '14px 16px', marginBottom: 10, cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} onClick={() => onSelect(goal)}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: c.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
          {goal.emoji || '🎯'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: c.text }}>{goal.title}</div>
          {goal.desc && <div style={{ fontSize: 12, color: c.textMuted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{goal.desc}</div>}
          {progress.total > 0 && (
            <div style={{ marginTop: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 10, color: c.textFaint }}>{progress.done}/{progress.total} tasks</span>
                <span style={{ fontSize: 10, color: pct === 100 ? '#3B6D11' : c.accentText, fontWeight: 500 }}>{pct}%</span>
              </div>
              <div style={{ background: c.cardBorder, borderRadius: 99, height: 4 }}>
                <div style={{ width: `${pct}%`, height: 4, borderRadius: 99, background: pct === 100 ? '#639922' : c.accent, transition: 'width .4s' }} />
              </div>
            </div>
          )}
        </div>
        <div style={{ color: c.textFaint, fontSize: 20 }}>›</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <button style={{ background: 'none', border: 'none', fontSize: 11, color: c.textFaint, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => onArchive(goal.id)}>
          Archive
        </button>
      </div>
    </div>
  )
}

export default function GoalList({ uid, goals, onSelect, onLogout, onSettings }) {
  const [input, setInput] = useState('')
  const [desc, setDesc] = useState('')
  const [adding, setAdding] = useState(false)
  const [emoji, setEmoji] = useState('🎯')
  const { c } = useTheme()

  const handleAdd = async () => {
    const v = input.trim()
    if (!v) return
    await addGoal(uid, { title: v, desc, emoji })
    setInput(''); setDesc(''); setAdding(false); setEmoji('🎯')
  }

  const handleArchive = async (goalId) => {
    if (!confirm('Archive this goal? You can restore it later.')) return
    await archiveGoal(uid, goalId)
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ padding: '20px 16px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: c.accent, letterSpacing: '-0.3px' }}>◆ Momentum</span>
        <button style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: c.textMuted, padding: 4 }} onClick={onSettings}>⚙</button>
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
              <GoalCard key={g.id} goal={{ ...g, uid }} onSelect={onSelect} onArchive={handleArchive} c={c} />
            ))}
          </div>
        )}

        {adding && (
          <div style={{ background: c.card, border: `0.5px solid ${c.cardBorder}`, borderRadius: 14, padding: 16, marginTop: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: c.text, marginBottom: 12 }}>New goal</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {GOAL_EMOJIS.map(e => (
                <button key={e} style={{ width: 38, height: 38, borderRadius: 10, border: `1.5px solid ${emoji === e ? c.accent : c.inputBorder}`, background: emoji === e ? c.accentBg : 'transparent', fontSize: 18, cursor: 'pointer' }} onClick={() => setEmoji(e)}>{e}</button>
              ))}
            </div>
            <input style={{ width: '100%', border: `0.5px solid ${c.inputBorder}`, borderRadius: 10, padding: '11px 12px', fontSize: 16, background: c.input, outline: 'none', fontFamily: 'inherit', color: c.text, display: 'block', marginBottom: 8 }} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} placeholder="e.g. Learn AI and LLMs" autoFocus />
            <textarea style={{ width: '100%', border: `0.5px solid ${c.inputBorder}`, borderRadius: 10, padding: '11px 12px', fontSize: 16, background: c.input, outline: 'none', fontFamily: 'inherit', color: c.text, resize: 'none', lineHeight: 1.5, display: 'block', marginBottom: 12 }} rows={2} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Why does this matter? (optional)" />
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ flex: 1, background: c.accent, color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }} onClick={handleAdd}>Add goal</button>
              <button style={{ background: 'none', border: `0.5px solid ${c.cardBorder}`, borderRadius: 10, padding: '12px 16px', fontSize: 14, color: c.textMuted, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => setAdding(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {!adding && (
        <div style={{ padding: '12px 16px 36px' }}>
          <button style={{ width: '100%', background: c.accent, color: '#fff', border: 'none', borderRadius: 14, padding: '15px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => setAdding(true)}>
            + Add a goal
          </button>
        </div>
      )}
    </div>
  )
}