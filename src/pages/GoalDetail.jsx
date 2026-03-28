import { useState, useEffect } from 'react'
import TaskList from '../components/TaskList'
import CheckIn from '../components/CheckIn'
import StreakBar from '../components/StreakBar'
import { useTasks, useCheckins } from '../hooks/useGoal'
import { useTheme } from '../hooks/useTheme'
import { checkAndNotify } from '../hooks/useNotifications'

const TABS = ['Tasks', 'Check-in', 'Log']

export default function GoalDetail({ uid, goal, onBack }) {
  const [tab, setTab] = useState(0)
  const { c } = useTheme()
  const tasks = useTasks(uid, goal.id)
  const checkins = useCheckins(uid, goal.id)
  const streak = calcStreak(checkins)
  const xp = (tasks.filter(t => t.done).length * 10) + (checkins.length * 5)

  useEffect(() => {
    checkAndNotify(checkins)
  }, [checkins])

  return (
    <div style={{ padding: '20px 16px 80px', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <button style={{ background: 'none', border: 'none', fontSize: 14, color: c.accent, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }} onClick={onBack}>← Back</button>
        <span style={{ background: c.accentBg, color: c.accentText, padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 500 }}>{xp} XP</span>
      </div>

      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4, color: c.text }}>{goal.title}</div>
      {goal.desc && <div style={{ fontSize: 13, color: c.textMuted, marginBottom: 12 }}>{goal.desc}</div>}

      <div style={{ background: c.card, border: `0.5px solid ${c.cardBorder}`, borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
        <StreakBar checkins={checkins} />
        <div style={{ fontSize: 12, color: c.textMuted, marginTop: 8 }}>
          {streak > 0 ? `${streak} day streak 🔥` : 'Check in today to start your streak'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {TABS.map((t, i) => (
          <div key={t} style={{ padding: '7px 14px', borderRadius: 99, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: `0.5px solid ${tab === i ? c.accent : c.cardBorder}`, background: tab === i ? c.accent : c.card, color: tab === i ? '#fff' : c.textMuted }} onClick={() => setTab(i)}>
            {t}
          </div>
        ))}
      </div>

      <div style={{ background: c.card, border: `0.5px solid ${c.cardBorder}`, borderRadius: 12, padding: '16px 18px' }}>
        {tab === 0 && <TaskList uid={uid} goalId={goal.id} tasks={tasks} />}
        {tab === 1 && <CheckIn uid={uid} goalId={goal.id} checkins={checkins} />}
        {tab === 2 && <Log checkins={checkins} c={c} />}
      </div>
    </div>
  )
}

function Log({ checkins, c }) {
  if (!checkins.length) return <div style={{ fontSize: 13, color: c.textFaint }}>No check-ins yet</div>
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: c.label, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>History</div>
      {checkins.map(ci => (
        <div key={ci.id} style={{ paddingBottom: 12, marginBottom: 12, borderBottom: `0.5px solid ${c.cardBorder}` }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 18 }}>{ci.moodEmoji}</span>
            <span style={{ fontWeight: 500, fontSize: 13, color: c.text }}>{formatDate(ci.date)}</span>
            <span style={{ fontSize: 11, color: c.textFaint }}>{ci.moodLabel}</span>
          </div>
          {ci.what && <div style={{ fontSize: 13, color: c.textMuted, lineHeight: 1.5 }}>{ci.what}</div>}
          {ci.blocker && <div style={{ fontSize: 12, color: c.textFaint, marginTop: 3 }}>Blocker: {ci.blocker}</div>}
        </div>
      ))}
    </div>
  )
}

function calcStreak(checkins) {
  const dates = checkins.map(c => c.date).sort().reverse()
  if (!dates.length) return 0
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 60; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const ds = d.toISOString().split('T')[0]
    if (dates.includes(ds)) streak++
    else if (i > 0) break
  }
  return streak
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}