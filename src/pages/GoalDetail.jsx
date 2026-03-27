import { useState } from 'react'
import TaskList from '../components/TaskList'
import CheckIn from '../components/CheckIn'
import StreakBar from '../components/StreakBar'
import { useTasks, useCheckins } from '../hooks/useGoal'

const TABS = ['Tasks', 'Check-in', 'Log']

export default function GoalDetail({ uid, goal, onBack }) {
  const [tab, setTab] = useState(0)
  const tasks = useTasks(uid, goal.id)
  const checkins = useCheckins(uid, goal.id)

  const streak = calcStreak(checkins)
  const xp = (tasks.filter(t => t.done).length * 10) + (checkins.length * 5)

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <button style={styles.back} onClick={onBack}>← Back</button>
        <span style={styles.xp}>{xp} XP</span>
      </div>

      <div style={styles.goalTitle}>{goal.title}</div>
      {goal.desc && <div style={styles.goalDesc}>{goal.desc}</div>}

      <div style={styles.streakWrap}>
        <StreakBar checkins={checkins} />
        <div style={styles.streakMsg}>
          {streak > 0 ? `${streak} day streak 🔥` : 'Check in today to start your streak'}
        </div>
      </div>

      <div style={styles.tabs}>
        {TABS.map((t, i) => (
          <div key={t} style={{ ...styles.tab, ...(tab === i ? styles.tabOn : {}) }} onClick={() => setTab(i)}>
            {t}
          </div>
        ))}
      </div>

      <div style={styles.card}>
        {tab === 0 && <TaskList uid={uid} goalId={goal.id} tasks={tasks} />}
        {tab === 1 && <CheckIn uid={uid} goalId={goal.id} checkins={checkins} />}
        {tab === 2 && <Log checkins={checkins} />}
      </div>
    </div>
  )
}

function Log({ checkins }) {
  if (!checkins.length) return <div style={{ fontSize: 13, color: '#aaa' }}>No check-ins yet</div>
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>History</div>
      {checkins.map(c => (
        <div key={c.id} style={{ paddingBottom: 12, marginBottom: 12, borderBottom: '0.5px solid #f0ede6' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 18 }}>{c.moodEmoji}</span>
            <span style={{ fontWeight: 500, fontSize: 13 }}>{formatDate(c.date)}</span>
            <span style={{ fontSize: 11, color: '#aaa' }}>{c.moodLabel}</span>
          </div>
          {c.what && <div style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>{c.what}</div>}
          {c.blocker && <div style={{ fontSize: 12, color: '#aaa', marginTop: 3 }}>Blocker: {c.blocker}</div>}
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

const styles = {
  wrap: { padding: '20px 16px 80px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  back: { background: 'none', border: 'none', fontSize: 14, color: '#534AB7', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 },
  xp: { background: '#EEEDFE', color: '#534AB7', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 500 },
  goalTitle: { fontSize: 18, fontWeight: 600, marginBottom: 4 },
  goalDesc: { fontSize: 13, color: '#888', marginBottom: 12 },
  streakWrap: { background: '#fff', border: '0.5px solid #e8e6de', borderRadius: 12, padding: '14px 16px', marginBottom: 14 },
  streakMsg: { fontSize: 12, color: '#888', marginTop: 8 },
  tabs: { display: 'flex', gap: 6, marginBottom: 14 },
  tab: { padding: '7px 14px', borderRadius: 99, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '0.5px solid #e0ddd6', background: '#fff', color: '#888' },
  tabOn: { background: '#534AB7', color: '#fff', borderColor: '#534AB7' },
  card: { background: '#fff', border: '0.5px solid #e8e6de', borderRadius: 12, padding: '16px 18px' }
}