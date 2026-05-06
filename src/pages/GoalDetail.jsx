import { useState, useEffect } from 'react'
import TaskList from '../components/TaskList'
import CheckIn from '../components/CheckIn'
import StreakBar from '../components/StreakBar'
import WeeklyPlan from '../components/WeeklyPlan'
import WeeklyReview from '../components/WeeklyReview'
import Projects from '../components/Projects'
import ChatAssistant from '../components/ChatAssistant'
import StreakRescue from '../components/StreakRescue'
import { useTasks, useCheckins, useProjects } from '../hooks/useGoal'
import { useTheme } from '../hooks/useTheme'
import { checkAndNotify } from '../hooks/useNotifications'

const TABS = ['Tasks', 'Projects', 'Plan', 'Check-in', 'Review', 'Chat', 'Log']

export default function GoalDetail({ uid, goal, userData, onBack }) {
  const [tab, setTab] = useState(0)
  const { c } = useTheme()
  const tasks = useTasks(uid, goal.id)
  const checkins = useCheckins(uid, goal.id)
  const projects = useProjects(uid, goal.id)
  const streak = calcStreak(checkins)
  const xp = (tasks.filter(t => t.done).length * 10) + (checkins.length * 5)

  useEffect(() => { checkAndNotify(checkins) }, [checkins])

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ background: c.headerBg, padding: '52px 20px 20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 130, height: 36, background: 'rgba(255,255,255,0.1)', borderRadius: 60, top: 50, left: -10 }} />
        <div style={{ position: 'absolute', width: 90, height: 26, background: 'rgba(255,255,255,0.08)', borderRadius: 60, top: 68, right: 0 }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <button style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 10, padding: '6px 14px', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }} onClick={onBack}>← Back</button>
            <span style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700 }}>{xp} XP</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 2 }}>{goal.emoji || '🎯'} {goal.title}</div>
          {goal.desc && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: 12 }}>{goal.desc}</div>}
          <StreakBar checkins={checkins} />
          <div style={{ fontSize: 12, color: streak > 0 ? '#fff' : 'rgba(255,255,255,0.6)', fontWeight: streak > 0 ? 700 : 400, marginTop: 8 }}>
            {streak > 0 ? `${streak} day streak 🔥` : 'Check in today to start your streak'}
          </div>
        </div>
      </div>

      <div style={{ background: c.bg, padding: '14px 16px 0' }}>
        <StreakRescue uid={uid} goal={goal} checkins={checkins} streak={streak} />
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 14 }}>
          {TABS.map((t, i) => (
            <div key={t} style={{ padding: '8px 16px', borderRadius: 99, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: `0.5px solid ${tab === i ? c.accent : c.cardBorder}`, background: tab === i ? c.accent : c.card, color: tab === i ? '#fff' : c.textMuted, whiteSpace: 'nowrap', flexShrink: 0, transition: 'all .15s' }} onClick={() => setTab(i)}>
              {t}
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, padding: '0 16px 40px', background: c.bg }}>
        <div style={{ background: c.card, border: `0.5px solid ${c.cardBorder}`, borderRadius: 16, padding: '16px 18px' }}>
          {tab === 0 && <TaskList uid={uid} goalId={goal.id} tasks={tasks} goal={goal} />}
          {tab === 1 && <Projects uid={uid} goalId={goal.id} projects={projects} goal={goal} />}
          {tab === 2 && (userData?.isPro ? <WeeklyPlan uid={uid} goal={goal} checkins={checkins} /> : <UpgradePrompt c={c} />)}
          {tab === 3 && <CheckIn uid={uid} goalId={goal.id} checkins={checkins} />}
          {tab === 4 && (userData?.isPro ? <WeeklyReview goal={goal} tasks={tasks} checkins={checkins} streak={streak} /> : <UpgradePrompt c={c} />)}
          {tab === 5 && <ChatAssistant uid={uid} goalId={goal.id} goal={goal} checkins={checkins} tasks={tasks} userData={userData} />}
          {tab === 6 && <Log checkins={checkins} c={c} />}
        </div>
      </div>
    </div>
  )
}

function UpgradePrompt({ c }) {
  return (
    <div style={{ textAlign: 'center', padding: '32px 0' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>✦</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: c.text, marginBottom: 8 }}>Pro feature</div>
      <div style={{ fontSize: 13, color: c.textMuted, lineHeight: 1.6, marginBottom: 20 }}>AI-generated weekly plans that auto-adjust based on your mood and progress.</div>
      <div style={{ background: c.accentBg, color: c.accentText, borderRadius: 10, padding: '12px 16px', fontSize: 13, fontWeight: 700 }}>Contact us to get Pro access</div>
    </div>
  )
}

function Log({ checkins, c }) {
  if (!checkins.length) return (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
      <div style={{ fontSize: 14, color: c.textFaint }}>No check-ins yet</div>
    </div>
  )
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: c.label, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>History</div>
      {checkins.map(ci => (
        <div key={ci.id} style={{ paddingBottom: 14, marginBottom: 14, borderBottom: `0.5px solid ${c.cardBorder}` }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 22 }}>{ci.moodEmoji}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: c.text }}>{formatDate(ci.date)}</div>
              <div style={{ fontSize: 11, color: c.textFaint }}>{ci.moodLabel}</div>
            </div>
          </div>
          {ci.what && <div style={{ fontSize: 13, color: c.textMuted, lineHeight: 1.5 }}>{ci.what}</div>}
          {ci.blocker && <div style={{ fontSize: 12, color: c.textFaint, marginTop: 4, background: c.streak, padding: '4px 8px', borderRadius: 6, display: 'inline-block' }}>Blocker: {ci.blocker}</div>}
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