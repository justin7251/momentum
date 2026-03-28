import { useState, useEffect } from 'react'
import { useTheme } from '../hooks/useTheme'
import { generateWeeklyPlan, autoAdjustPlan } from '../hooks/useAI'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

export default function WeeklyPlan({ uid, goal, checkins }) {
  const { c } = useTheme()
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [adjustNote, setAdjustNote] = useState(null)
  const [weekNum, setWeekNum] = useState(1)

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
    } catch (e) {
      console.error(e)
    }
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
    } catch (e) {
      console.error(e)
    }
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
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const ta = { fontSize: 13, color: c.textMuted, lineHeight: 1.5 }

  if (!plan) return (
    <div>
      <div style={{ fontSize: 13, color: c.textMuted, marginBottom: 14, lineHeight: 1.5 }}>
        Generate a personalised weekly plan based on your goal. The AI will adjust it automatically based on your check-in moods.
      </div>
      <button
        style={{ background: loading ? c.textFaint : c.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 14, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', width: '100%' }}
        onClick={handleGenerate}
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Generate week 1 plan ✦'}
      </button>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: c.label, textTransform: 'uppercase', letterSpacing: '.06em' }}>Week {weekNum}</div>
          <div style={{ fontSize: 15, fontWeight: 500, color: c.text, marginTop: 2 }}>{plan.weekTheme}</div>
        </div>
        <span style={{ background: c.accentBg, color: c.accentText, padding: '2px 9px', borderRadius: 99, fontSize: 11, fontWeight: 500 }}>Pro</span>
      </div>

      {adjustNote && (
        <div style={{ background: '#FAEEDA', border: '0.5px solid #FAC775', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#633806', marginBottom: 12 }}>
          Plan adjusted: {adjustNote}
        </div>
      )}

      <div style={{ marginBottom: 14 }}>
        {plan.days.map((d, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: `0.5px solid ${c.cardBorder}` }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: c.accentText, minWidth: 30, paddingTop: 1 }}>{d.day}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: c.text, lineHeight: 1.4 }}>{d.task}</div>
              <div style={{ fontSize: 11, color: c.textFaint, marginTop: 2 }}>{d.estimatedMins} min</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          style={{ flex: 1, background: c.accentBg, color: c.accentText, border: `0.5px solid ${c.accentText}`, borderRadius: 8, padding: '8px 12px', fontSize: 13, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
          onClick={handleAdjust}
          disabled={loading}
        >
          {loading ? '...' : 'Auto-adjust ✦'}
        </button>
        <button
          style={{ flex: 1, background: c.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 13, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
          onClick={handleNextWeek}
          disabled={loading}
        >
          {loading ? '...' : 'Next week →'}
        </button>
      </div>
    </div>
  )
}