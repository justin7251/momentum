import { useState, useEffect } from 'react'
import { useTheme } from '../hooks/useTheme'
import { useTasks, useCheckins } from '../hooks/useGoal'
import { addCheckin, autoCheckin } from '../firebase/db'
import { callDailyFocus } from '../hooks/useAI'

const MOODS = [
  { e: '😴', l: 'Tired' },
  { e: '😐', l: 'Meh' },
  { e: '🙂', l: 'OK' },
  { e: '😊', l: 'Good' },
  { e: '🔥', l: 'Great' }
]

const HOUR = new Date().getHours()
const GREETING = HOUR < 12 ? 'Good morning' : HOUR < 17 ? 'Good afternoon' : 'Good evening'

export default function Today({ uid, goals, userData, onGoals, onSettings }) {
  const { c, dark } = useTheme()
  const [step, setStep] = useState('home') // home | checkin | celebrate
  const [mood, setMood] = useState(null)
  const [note, setNote] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [dailyFocus, setDailyFocus] = useState(null)
  const [loadingFocus, setLoadingFocus] = useState(false)
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState(goals?.[0] || null)

  const tasks = useTasks(uid, selectedGoal?.id)
  const checkins = useCheckins(uid, selectedGoal?.id)

  const today = new Date().toISOString().split('T')[0]
  const checkedInToday = checkins.some(c => c.date === today)
  const streak = calcStreak(checkins)
  const todayTasks = tasks.filter(t => {
    const dow = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()]
    const match = t.text.match(/^\[(\w+)\]/)
    return !t.done && (!match || match[1] === dow)
  }).slice(0, 3)
  const doneTasks = tasks.filter(t => t.done).length

  useEffect(() => {
    if (selectedGoal && !dailyFocus) loadFocus()
  }, [selectedGoal])

  useEffect(() => {
    if (goals?.length && !selectedGoal) setSelectedGoal(goals[0])
  }, [goals])

  const loadFocus = async () => {
    if (!selectedGoal) return
    setLoadingFocus(true)
    try {
      const focus = await callDailyFocus(selectedGoal, checkins, tasks)
      setDailyFocus(focus)
    } catch (e) { console.error(e) }
    setLoadingFocus(false)
  }

  const handleSubmitCheckin = async () => {
    if (mood === null || !selectedGoal) return
    setLoadingSubmit(true)
    try {
      await addCheckin(uid, selectedGoal.id, {
        date: today,
        mood,
        moodEmoji: MOODS[mood].e,
        moodLabel: MOODS[mood].l,
        what: note,
        blocker: ''
      })
      const { generateCheckinResponse } = await import('../hooks/useAI')
      const resp = await generateCheckinResponse(selectedGoal, mood, note, streak, tasks)
      setAiResponse(resp)
      setStep('celebrate')
    } catch (e) { console.error(e) }
    setLoadingSubmit(false)
  }

  const name = userData?.name || 'Hero'

  const bg = dark
    ? 'linear-gradient(160deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)'
    : 'linear-gradient(160deg,#56CCF2 0%,#2F80ED 55%,#1a5fad 100%)'

  if (step === 'checkin') return (
    <CheckinScreen
      c={c} dark={dark}
      mood={mood} setMood={setMood}
      note={note} setNote={setNote}
      onSubmit={handleSubmitCheckin}
      onBack={() => setStep('home')}
      loading={loadingSubmit}
      goal={selectedGoal}
    />
  )

  if (step === 'celebrate') return (
    <CelebrateScreen
      c={c} dark={dark}
      streak={streak + 1}
      mood={mood}
      aiResponse={aiResponse}
      onDone={() => { setStep('home'); setMood(null); setNote('') }}
    />
  )

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ background: bg, padding: '52px 20px 32px', position: 'relative', overflow: 'hidden' }}>
        {!dark && (
          <>
            <div style={{ position: 'absolute', width: 120, height: 36, background: 'rgba(255,255,255,0.65)', borderRadius: 60, top: 55, left: -10, filter: 'blur(1px)' }} />
            <div style={{ position: 'absolute', width: 90, height: 28, background: 'rgba(255,255,255,0.55)', borderRadius: 60, top: 45, left: 80 }} />
            <div style={{ position: 'absolute', width: 110, height: 32, background: 'rgba(255,255,255,0.6)', borderRadius: 60, top: 68, right: 0 }} />
          </>
        )}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 700, marginBottom: 2 }}>{GREETING},</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>{name} 👋</div>
            </div>
            <button style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 12, width: 36, height: 36, color: '#fff', fontSize: 16, cursor: 'pointer' }} onClick={onSettings}>⚙</button>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.35)', borderRadius: 18, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ fontSize: 32 }}>🔥</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{streak} day streak</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 700, marginTop: 2 }}>
                {checkedInToday ? 'Logged today ✓' : "Don't break it — log today!"}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {getLast5Days(checkins).map((done, i) => (
                <div key={i} style={{ width: 24, height: 24, borderRadius: 7, background: done ? '#fff' : 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: done ? '#2F80ED' : 'rgba(255,255,255,0.4)' }}>
                  {done ? '✓' : '·'}
                </div>
              ))}
            </div>
          </div>

          {goals?.length > 1 && (
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
              {goals.map(g => (
                <button key={g.id} style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 99, border: '1.5px solid rgba(255,255,255,0.4)', background: selectedGoal?.id === g.id ? '#fff' : 'rgba(255,255,255,0.15)', color: selectedGoal?.id === g.id ? '#2F80ED' : '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => { setSelectedGoal(g); setDailyFocus(null) }}>
                  {g.emoji || '🎯'} {g.title}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ flex: 1, padding: '20px 16px 32px', background: c.bg }}>
        <div style={{ background: c.card, border: `0.5px solid ${c.cardBorder}`, borderRadius: 16, padding: '14px 16px', marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: c.label, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Today's focus ✦</div>
          {loadingFocus ? (
            <div style={{ fontSize: 13, color: c.textFaint, fontStyle: 'italic' }}>Getting your focus for today...</div>
          ) : dailyFocus ? (
            <div style={{ fontSize: 15, fontWeight: 700, color: c.text, lineHeight: 1.5 }}>{dailyFocus}</div>
          ) : (
            <div style={{ fontSize: 13, color: c.textFaint }}>Set a goal to get your daily focus</div>
          )}
        </div>

        <div style={{ background: c.card, border: `0.5px solid ${c.cardBorder}`, borderRadius: 16, padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: c.label, textTransform: 'uppercase', letterSpacing: '.05em' }}>Up next</div>
            <div style={{ fontSize: 11, color: c.accentText, fontWeight: 700 }}>{doneTasks} done today</div>
          </div>
          {todayTasks.length === 0 ? (
            <div style={{ fontSize: 13, color: c.textFaint, padding: '4px 0' }}>No tasks for today — add some in Goals</div>
          ) : (
            todayTasks.map((t, i) => {
              const text = t.text.replace(/^\[\w+\]\s/, '')
              return (
                <div key={t.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderBottom: i < todayTasks.length - 1 ? `0.5px solid ${c.cardBorder}` : 'none' }}>
                  <div style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${c.inputBorder}`, flexShrink: 0, marginTop: 1 }} />
                  <div style={{ fontSize: 14, color: c.text, lineHeight: 1.4 }}>{text}</div>
                </div>
              )
            })
          )}
        </div>

        {!checkedInToday ? (
          <button
            style={{ width: '100%', border: 'none', borderRadius: 18, padding: '17px', background: 'linear-gradient(135deg,#2F80ED,#1a5fad)', color: '#fff', fontFamily: 'inherit', fontSize: 17, fontWeight: 900, cursor: 'pointer', boxShadow: '0 6px 24px rgba(47,128,237,0.35)', marginBottom: 12 }}
            onClick={() => setStep('checkin')}
          >
            ✅ I'm done for today
          </button>
        ) : (
          <div style={{ background: '#EAF3DE', border: '0.5px solid #C0DD97', borderRadius: 16, padding: '14px 16px', textAlign: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>🌟</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#3B6D11' }}>Logged today!</div>
            <div style={{ fontSize: 12, color: '#639922', fontWeight: 600, marginTop: 2 }}>Come back tomorrow to keep your streak</div>
          </div>
        )}

        <button
          style={{ width: '100%', border: `0.5px solid ${c.cardBorder}`, borderRadius: 14, padding: '13px', background: 'none', color: c.textMuted, fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          onClick={onGoals}
        >
          View all goals →
        </button>
      </div>
    </div>
  )
}

function CheckinScreen({ c, dark, mood, setMood, note, setNote, onSubmit, onBack, loading, goal }) {
  const bg = dark ? '#1a1a2e' : '#fff'
  const PROMPTS = [
    'What did you actually work on today?',
    'What was the hardest part of today?',
    'What small win can you count today?',
    'What would you do differently tomorrow?',
    'What did you learn today?'
  ]
  const prompt = PROMPTS[new Date().getDay() % PROMPTS.length]

  return (
    <div style={{ minHeight: '100dvh', maxWidth: 480, margin: '0 auto', background: bg, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '52px 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <button style={{ background: 'none', border: `0.5px solid ${c.cardBorder}`, borderRadius: 10, width: 36, height: 36, fontSize: 16, cursor: 'pointer', color: c.textMuted }} onClick={onBack}>‹</button>
          <div>
            <div style={{ fontSize: 11, color: c.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>Daily log</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: c.text }}>{goal?.title || 'Today'}</div>
          </div>
        </div>

        <div style={{ fontSize: 22, fontWeight: 900, color: c.text, marginBottom: 6 }}>How did today feel?</div>
        <div style={{ fontSize: 14, color: c.textMuted, fontWeight: 600, marginBottom: 20 }}>Tap one</div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          {MOODS.map((m, i) => (
            <button key={i} onClick={() => setMood(i)} style={{ flex: 1, border: `2px solid ${mood === i ? '#2F80ED' : c.cardBorder}`, borderRadius: 16, padding: '12px 4px', fontSize: 24, background: mood === i ? '#e8f0fe' : c.card, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transition: 'all .15s' }}>
              {m.e}
              <span style={{ fontSize: 9, fontWeight: 800, color: mood === i ? '#2F80ED' : c.textFaint }}>{m.l}</span>
            </button>
          ))}
        </div>

        <div style={{ fontSize: 13, fontWeight: 800, color: '#2F80ED', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>
          {prompt}
        </div>
        <textarea
          style={{ width: '100%', border: `2px solid ${c.cardBorder}`, borderRadius: 16, padding: '14px', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, color: c.text, background: c.input, resize: 'none', outline: 'none', lineHeight: 1.5 }}
          rows={4}
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="One sentence is enough..."
          autoFocus
        />
      </div>

      <div style={{ padding: '0 20px 40px', marginTop: 'auto' }}>
        <button
          style={{ width: '100%', border: 'none', borderRadius: 18, padding: '17px', background: mood === null ? c.inputBorder : 'linear-gradient(135deg,#2F80ED,#1a5fad)', color: mood === null ? c.textFaint : '#fff', fontFamily: 'inherit', fontSize: 17, fontWeight: 900, cursor: mood === null ? 'not-allowed' : 'pointer', boxShadow: mood !== null ? '0 6px 24px rgba(47,128,237,0.35)' : 'none', transition: 'all .2s' }}
          onClick={onSubmit}
          disabled={mood === null || loading}
        >
          {loading ? 'Saving...' : 'Done ✨'}
        </button>
      </div>
    </div>
  )
}

function CelebrateScreen({ c, dark, streak, mood, aiResponse, onDone }) {
  const bg = dark ? 'linear-gradient(160deg,#1a1a2e,#0f3460)' : 'linear-gradient(160deg,#f0f7ff,#e8f0fe)'
  const moodEmoji = MOODS[mood]?.e || '🌟'

  useEffect(() => {
    const t = setTimeout(onDone, 5000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{ minHeight: '100dvh', maxWidth: 480, margin: '0 auto', background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 72, marginBottom: 12, filter: 'drop-shadow(0 4px 16px rgba(47,128,237,0.3))' }}>🌟</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: c.text, marginBottom: 6 }}>Streak: {streak} days!</div>
      <div style={{ fontSize: 15, color: c.textMuted, fontWeight: 700, marginBottom: 28 }}>{moodEmoji} Keep showing up</div>

      {aiResponse && (
        <div style={{ background: c.card, border: `0.5px solid ${c.cardBorder}`, borderRadius: 18, padding: '16px 18px', marginBottom: 20, textAlign: 'left', width: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#2F80ED,#1a5fad)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>⭐</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: c.text, lineHeight: 1.6 }}>{aiResponse}</div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 5, marginBottom: 28 }}>
        {Array.from({ length: Math.min(streak, 7) }).map((_, i) => (
          <div key={i} style={{ width: 30, height: 30, borderRadius: 9, background: '#2F80ED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff', fontWeight: 800 }}>✓</div>
        ))}
      </div>

      <button style={{ width: '100%', border: `0.5px solid ${c.cardBorder}`, borderRadius: 14, padding: '13px', background: 'none', color: c.textMuted, fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer' }} onClick={onDone}>
        Back to home
      </button>
      <div style={{ fontSize: 11, color: c.textFaint, fontWeight: 600, marginTop: 10 }}>Auto-returning in 5 seconds</div>
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

function getLast5Days(checkins) {
  const dates = checkins.map(c => c.date)
  return Array.from({ length: 5 }).map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (4 - i))
    return dates.includes(d.toISOString().split('T')[0])
  })
}