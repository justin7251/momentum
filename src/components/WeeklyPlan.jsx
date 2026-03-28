import { useState, useEffect } from 'react'
import { useTheme } from '../hooks/useTheme'
import { generateWeeklyPlan, autoAdjustPlan } from '../hooks/useAI'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { addTask } from '../firebase/db'

const TODAY_DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()]

export default function WeeklyPlan({ uid, goal, checkins }) {
  const { c } = useTheme()
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [adjustNote, setAdjustNote] = useState(null)
  const [weekNum, setWeekNum] = useState(1)
  const [saved, setSaved] = useState(false)

  const planRef = doc(db, 'users', uid, 'goals', goal.id, 'weeklyPlan', 'current')

  useEffect(() => { loadPlan() }, [goal.id])

  const loadPlan = async () => {
    const snap = await getDoc(planRef)
    if (snap.exists()) {
      const data = snap.data()
      setPlan(data.plan)
      setWeekNum(data.weekNum || 1)
      setAdjustNote(data.adjustNote || null)
    }
  }

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const generated = await generateWeeklyPlan(goal, weekNum, checkins)
      await setDoc(planRef, { plan: generated, weekNum, adjustNote: null, updatedAt: new Date().toISOString() })
      setPlan(generated)
      setAdjustNote(null)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const handleAdjust = async () => {
    if (!plan) return
    setLoading(true)
    try {
      const adjusted = await autoAdjustPlan(goal, plan, checkins)
      if (adjusted) {
        await setDoc(planRef, { plan: adjusted, weekNum, adjustNote: adjusted.adjustNote, updatedAt: new Date().toISOString() })
        setPlan(adjusted)
        setAdjustNote(adjusted.adjustNote)
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const handleNextWeek = async () => {
    const next = weekNum + 1
    setWeekNum(next)
    setLoading(true)
    try {
      const generated = await generateWeeklyPlan(goal, next, checkins)
      await setDoc(planRef, { plan: generated, weekNum: next, adjustNote: null, updatedAt: new Date().toISOString() })
      setPlan(generated)
      setAdjustNote(null)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const handleSaveToTasks = async () => {
    if (!plan) return
    setLoading(true)
    try {
      for (const day of plan.days) {
        await addTask(uid, goal.id, {
          text: `[${day.day}] ${day.task}`,
          estimatedMins: day.estimatedMins
        })
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const handleSaveTodayTask = async () => {
    if (!plan) return
    const todayTask = plan.days.find(d => d.day === TODAY_DOW)
    if (!todayTask) return
    setLoading(true)
    try {
      await addTask(uid, goal.id, {
        text: todayTask.task,
        estimatedMins: todayTask.estimatedMins
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  if (!plan) return (
    <div>
      <div style={{ fontSize: 13, color: c.textMuted, marginBottom: 14, lineHeight: 1.5 }}>
        Generate a personalised weekly plan based on your goal. Auto-adjusts based on your check-in moods.
      </div>
      <button
        style={{ background: loading ? c.textFaint : c.accent, color: '#fff', border: 'none', borderRadius: 10, padding: '12px 18px', fontSize: 14, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', width: '100%' }}
        onClick={handleGenerate}
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Generate week 1 plan ✦'}
      </button>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: c.label, textTransform: 'uppercase', letterSpacing: '.06em' }}>Week {weekNum}</div>
          <div style={{ fontSize: 15, fontWeight: 500, color: c.text, marginTop: 2 }}>{plan.weekTheme}</div>
        </div>
        <span style={{ background: c.accentBg, color: c.accentText, padding: '2px 9px', borderRadius: 99, fontSize: 11, fontWeight: 500 }}>Pro</span>
      </div>

      {adjustNote && (
        <div style={{ background: '#FAEEDA', border: '0.5px solid #FAC775', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#633806', marginBottom: 12 }}>
          Adjusted: {adjustNote}
        </div>
      )}

      {saved && (
        <div style={{ background: '#EAF3DE', border: '0.5px solid #C0DD97', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#3B6D11', marginBottom: 12 }}>
          Saved to tasks!
        </div>
      )}

      <div style={{ marginBottom: 14 }}>
        {plan.days.map((d, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: `0.5px solid ${c.cardBorder}`, alignItems: 'flex-start' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: d.day === TODAY_DOW ? c.accent : c.accentText, minWidth: 32, paddingTop: 1 }}>{d.day}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: d.day === TODAY_DOW ? c.text : c.textMuted, lineHeight: 1.4, fontWeight: d.day === TODAY_DOW ? 500 : 400 }}>{d.task}</div>
              <div style={{ fontSize: 11, color: c.textFaint, marginTop: 2 }}>{d.estimatedMins} min</div>
            </div>
            {d.day === TODAY_DOW && (
              <button
                style={{ background: c.accentBg, color: c.accentText, border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
                onClick={handleSaveTodayTask}
              >
                + Task
              </button>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <button
          style={{ flex: 1, background: c.accentBg, color: c.accentText, border: `0.5px solid ${c.accentText}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
          onClick={handleAdjust}
          disabled={loading}
        >
          {loading ? '...' : 'Auto-adjust ✦'}
        </button>
        <button
          style={{ flex: 1, background: c.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 12px', fontSize: 13, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
          onClick={handleNextWeek}
          disabled={loading}
        >
          {loading ? '...' : 'Next week →'}
        </button>
      </div>

      <button
        style={{ width: '100%', background: 'none', color: c.textMuted, border: `0.5px solid ${c.cardBorder}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
        onClick={handleSaveToTasks}
        disabled={loading}
      >
        Save all to tasks
      </button>
    </div>
  )
}