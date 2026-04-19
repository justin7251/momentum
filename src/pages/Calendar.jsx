import { useState, useEffect } from 'react'
import { useTheme } from '../hooks/useTheme'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase/config'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function Calendar({ uid, goals, onBack }) {
  const { c } = useTheme()
  const [view, setView] = useState('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(null)
  const [allCheckins, setAllCheckins] = useState({})
  const [allTasks, setAllTasks] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAllData() }, [uid])

  const loadAllData = async () => {
    setLoading(true)
    try {
      const checkinMap = {}
      const taskMap = {}

      for (const goal of goals) {
        const checkinsSnap = await getDocs(collection(db, 'users', uid, 'goals', goal.id, 'checkins'))
        checkinsSnap.docs.forEach(d => {
          const data = d.data()
          if (!checkinMap[data.date]) checkinMap[data.date] = []
          checkinMap[data.date].push({ ...data, goalTitle: goal.title })
        })

        const tasksSnap = await getDocs(collection(db, 'users', uid, 'goals', goal.id, 'tasks'))
        tasksSnap.docs.forEach(d => {
          const data = d.data()
          if (data.done && data.dueDate) {
            if (!taskMap[data.dueDate]) taskMap[data.dueDate] = []
            taskMap[data.dueDate].push({ ...data, goalTitle: goal.title })
          }
          if (data.done && data.lastDone) {
            if (!taskMap[data.lastDone]) taskMap[data.lastDone] = []
            taskMap[data.lastDone].push({ ...data, goalTitle: goal.title })
          }
        })
      }

      setAllCheckins(checkinMap)
      setAllTasks(taskMap)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const today = new Date().toISOString().split('T')[0]

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDow = (firstDay.getDay() + 6) % 7
    const days = []
    for (let i = 0; i < startDow; i++) days.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      days.push(dateStr)
    }
    return days
  }

  const getWeekDays = (date) => {
    const d = new Date(date)
    const day = (d.getDay() + 6) % 7
    d.setDate(d.getDate() - day)
    const days = []
    for (let i = 0; i < 7; i++) {
      days.push(d.toISOString().split('T')[0])
      d.setDate(d.getDate() + 1)
    }
    return days
  }

  const DayCell = ({ dateStr, compact = false }) => {
    if (!dateStr) return <div />
    const checkins = allCheckins[dateStr] || []
    const tasks = allTasks[dateStr] || []
    const isToday = dateStr === today
    const isSelected = selectedDay === dateStr
    const d = new Date(dateStr)
    const dayNum = d.getDate()

    return (
      <div
        onClick={() => setSelectedDay(isSelected ? null : dateStr)}
        style={{
          borderRadius: 10, padding: compact ? '6px 4px' : '8px 6px',
          background: isSelected ? c.accentBg : isToday ? c.accentBg : c.card,
          border: `${isSelected ? '2px' : '0.5px'} solid ${isSelected ? c.accent : isToday ? c.accent : c.cardBorder}`,
          cursor: 'pointer', minHeight: compact ? 52 : 70,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3
        }}
      >
        <div style={{ fontSize: compact ? 11 : 13, fontWeight: isToday ? 700 : 400, color: isToday ? c.accent : c.text }}>
          {dayNum}
        </div>
        <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          {checkins.slice(0, 1).map((ci, i) => (
            <span key={i} style={{ fontSize: compact ? 12 : 14 }}>{ci.moodEmoji}</span>
          ))}
          {tasks.length > 0 && (
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.accent, marginTop: 2 }} />
          )}
        </div>
        {!compact && tasks.length > 0 && (
          <div style={{ fontSize: 9, color: c.accentText, fontWeight: 600 }}>{tasks.length} done</div>
        )}
      </div>
    )
  }

  const monthDays = getDaysInMonth(currentDate)
  const weekDays = selectedDay ? getWeekDays(new Date(selectedDay)) : getWeekDays(currentDate)

  const selectedCheckins = selectedDay ? (allCheckins[selectedDay] || []) : []
  const selectedTasks = selectedDay ? (allTasks[selectedDay] || []) : []

  const prevMonth = () => {
    const d = new Date(currentDate)
    d.setMonth(d.getMonth() - 1)
    setCurrentDate(d)
  }

  const nextMonth = () => {
    const d = new Date(currentDate)
    d.setMonth(d.getMonth() + 1)
    setCurrentDate(d)
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <button style={{ background: 'none', border: 'none', fontSize: 14, color: c.accent, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, padding: 0 }} onClick={onBack}>← Back</button>
          <div style={{ display: 'flex', gap: 6 }}>
            {['month', 'week'].map(v => (
              <button key={v} style={{ padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: `0.5px solid ${view === v ? c.accent : c.cardBorder}`, background: view === v ? c.accent : 'transparent', color: view === v ? '#fff' : c.textMuted, fontFamily: 'inherit' }} onClick={() => setView(v)}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <button style={{ background: 'none', border: 'none', fontSize: 18, color: c.textMuted, cursor: 'pointer', padding: '0 8px' }} onClick={prevMonth}>‹</button>
          <div style={{ fontSize: 16, fontWeight: 600, color: c.text }}>
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </div>
          <button style={{ background: 'none', border: 'none', fontSize: 18, color: c.textMuted, cursor: 'pointer', padding: '0 8px' }} onClick={nextMonth}>›</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 6 }}>
          {DAYS.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: c.textFaint, padding: '4px 0' }}>{d}</div>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 16px', flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', fontSize: 13, color: c.textFaint }}>Loading...</div>
        ) : (
          <>
            {view === 'month' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 16 }}>
                {monthDays.map((d, i) => <DayCell key={i} dateStr={d} />)}
              </div>
            )}

            {view === 'week' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 16 }}>
                {weekDays.map((d, i) => <DayCell key={i} dateStr={d} compact />)}
              </div>
            )}

            {selectedDay && (
              <div style={{ background: c.card, border: `0.5px solid ${c.cardBorder}`, borderRadius: 14, padding: '16px 18px', marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: c.text, marginBottom: 12 }}>
                  {new Date(selectedDay).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>

                {selectedCheckins.length === 0 && selectedTasks.length === 0 && (
                  <div style={{ fontSize: 13, color: c.textFaint, textAlign: 'center', padding: '12px 0' }}>Nothing logged this day</div>
                )}

                {selectedCheckins.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: c.label, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Check-ins</div>
                    {selectedCheckins.map((ci, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: `0.5px solid ${c.cardBorder}` }}>
                        <span style={{ fontSize: 20 }}>{ci.moodEmoji}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: c.text }}>{ci.moodLabel} — {ci.goalTitle}</div>
                          {ci.what && <div style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>{ci.what}</div>}
                          {ci.blocker && <div style={{ fontSize: 11, color: c.textFaint, marginTop: 2 }}>Blocker: {ci.blocker}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedTasks.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: c.label, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Tasks completed</div>
                    {selectedTasks.map((t, i) => {
                      const { task } = parseTaskText(t.text)
                      return (
                        <div key={i} style={{ display: 'flex', gap: 8, padding: '7px 0', borderBottom: `0.5px solid ${c.cardBorder}`, alignItems: 'flex-start' }}>
                          <div style={{ width: 16, height: 16, borderRadius: 4, background: c.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                            <span style={{ color: '#fff', fontSize: 9, fontWeight: 700 }}>✓</span>
                          </div>
                          <div>
                            <div style={{ fontSize: 13, color: c.text }}>{task}</div>
                            <div style={{ fontSize: 11, color: c.textFaint }}>{t.goalTitle}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function parseTaskText(text) {
  const match = text.match(/^\[(\w+)\]\s(.+)/)
  if (match) return { day: match[1], task: match[2] }
  return { day: null, task: text }
}