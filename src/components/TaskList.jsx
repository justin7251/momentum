import { useState } from 'react'
import { addTask, updateTask, deleteTask, rescheduleTask } from '../firebase/db'
import { useTheme } from '../hooks/useTheme'
import { generateTasks } from '../hooks/useAI'

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const DAY_ORDER = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

function parseTaskText(text) {
  const match = text.match(/^\[(\w+)\]\s(.+)/)
  if (match) return { day: match[1], task: match[2] }
  return { day: null, task: text }
}

function todayDow() { return DAYS[new Date().getDay()] }

function isPastDay(day) {
  if (!day) return false
  const todayIdx = DAY_ORDER.indexOf(todayDow())
  const dayIdx = DAY_ORDER.indexOf(day)
  return dayIdx < todayIdx
}

function isOlderThan7Days(createdAt) {
  if (!createdAt) return false
  const created = createdAt.toDate ? createdAt.toDate() : new Date(createdAt)
  return (Date.now() - created.getTime()) > 7 * 24 * 60 * 60 * 1000
}

const TASK_TABS = ['Today', 'All', 'Missed', 'Done']

export default function TaskList({ uid, goalId, tasks, goal }) {
  const [input, setInput] = useState('')
  const [activeTab, setActiveTab] = useState(0)
  const [generating, setGenerating] = useState(false)
  const [rescheduling, setRescheduling] = useState(null)
  const { c } = useTheme()
  const today = todayDow()

  const handleAdd = async () => {
    const v = input.trim()
    if (!v) return
    await addTask(uid, goalId, { text: v })
    setInput('')
  }

  const handleToggle = (task) =>
    updateTask(uid, goalId, task.id, { done: !task.done })

  const handleDelete = (taskId) =>
    deleteTask(uid, goalId, taskId)

  const handleReschedule = async (task, newDay) => {
    const { task: taskText } = parseTaskText(task.text)
    await rescheduleTask(uid, goalId, task.id, {
      text: `[${newDay}] ${taskText}`,
      done: false
    })
    setRescheduling(null)
  }

  const handleGenerate = async () => {
    if (!goal) return
    setGenerating(true)
    try {
      const data = await generateTasks(goal)
      for (const t of data.tasks) {
        await addTask(uid, goalId, {
          text: t.day ? `[${t.day}] ${t.text}` : t.text,
          estimatedMins: t.estimatedMins
        })
      }
      setActiveTab(1)
    } catch (e) { console.error(e) }
    setGenerating(false)
  }

  const todayTasks = tasks.filter(t => {
    const { day } = parseTaskText(t.text)
    return !t.done && (day === today || day === null)
  })

  const allTasks = tasks.filter(t => {
    const { day } = parseTaskText(t.text)
    return !t.done && !(day && isPastDay(day))
  })

  const missedTasks = tasks.filter(t => {
    const { day } = parseTaskText(t.text)
    return !t.done && day && isPastDay(day)
  })

  const doneTasks = tasks
    .filter(t => t.done && !isOlderThan7Days(t.createdAt))

  const counts = [todayTasks.length, allTasks.length, missedTasks.length, doneTasks.length]

  const visibleTasks = [todayTasks, allTasks, missedTasks, doneTasks][activeTab]

  const emptyMessages = [
    { icon: '✓', title: 'All done for today', sub: 'Great work — check in to log your day' },
    { icon: '📋', title: 'No active tasks', sub: 'Add a task or generate from your goal' },
    { icon: '👍', title: 'No missed tasks', sub: 'You\'re all caught up' },
    { icon: '🎯', title: 'Nothing completed yet', sub: 'Completed tasks appear here for 7 days' }
  ]

  const renderTask = (task) => {
    const { day, task: taskText } = parseTaskText(task.text)
    const isMissed = activeTab === 2

    return (
      <div key={task.id}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: `0.5px solid ${c.cardBorder}` }}>
          <div
            style={{ width: 20, height: 20, borderRadius: 5, border: `1.5px solid ${task.done ? c.accent : isMissed ? '#F09595' : c.inputBorder}`, background: task.done ? c.accent : 'transparent', cursor: 'pointer', flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => handleToggle(task)}
          >
            {task.done && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
              {day && (
                <span style={{ fontSize: 10, fontWeight: 600, color: isMissed ? '#A32D2D' : c.accentText, background: isMissed ? '#FCEBEB' : c.accentBg, padding: '1px 6px', borderRadius: 4 }}>{day}</span>
              )}
              {isMissed && (
                <span style={{ fontSize: 10, color: '#A32D2D', fontWeight: 500 }}>missed</span>
              )}
            </div>
            <span style={{ fontSize: 14, color: task.done ? c.textFaint : c.text, textDecoration: task.done ? 'line-through' : 'none', lineHeight: 1.4 }}>{taskText}</span>
          </div>
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            {isMissed && (
              <button
                style={{ background: c.accentBg, color: c.accentText, border: 'none', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
                onClick={() => setRescheduling(rescheduling === task.id ? null : task.id)}
              >
                Move
              </button>
            )}
            <button style={{ background: 'none', border: 'none', color: c.textFaint, cursor: 'pointer', fontSize: 14, padding: '0 2px' }} onClick={() => handleDelete(task.id)}>✕</button>
          </div>
        </div>

        {rescheduling === task.id && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '8px 0 4px 30px' }}>
            {DAY_ORDER.filter(d => d !== day).map(d => (
              <button key={d} style={{ padding: '4px 10px', borderRadius: 6, border: `0.5px solid ${d === today ? c.accent : c.cardBorder}`, background: d === today ? c.accentBg : 'transparent', color: d === today ? c.accentText : c.textMuted, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => handleReschedule(task, d)}>
                {d}{d === today ? ' (today)' : ''}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 14, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {TASK_TABS.map((t, i) => (
          <button key={t} style={{ padding: '5px 11px', borderRadius: 99, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: `0.5px solid ${activeTab === i ? c.accent : c.cardBorder}`, background: activeTab === i ? c.accent : 'transparent', color: activeTab === i ? '#fff' : i === 2 && counts[2] > 0 ? '#A32D2D' : c.textMuted, fontFamily: 'inherit', transition: 'all .15s', whiteSpace: 'nowrap', flexShrink: 0 }} onClick={() => setActiveTab(i)}>
            {t} ({counts[i]})
          </button>
        ))}
      </div>

      {visibleTasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>{emptyMessages[activeTab].icon}</div>
          <div style={{ fontSize: 13, fontWeight: 500, color: c.text, marginBottom: 4 }}>{emptyMessages[activeTab].title}</div>
          <div style={{ fontSize: 12, color: c.textFaint, marginBottom: activeTab === 1 ? 16 : 0 }}>{emptyMessages[activeTab].sub}</div>
          {activeTab === 1 && (
            <button
              style={{ background: generating ? c.inputBorder : c.accentBg, color: generating ? c.textFaint : c.accentText, border: `0.5px solid ${c.accentText}`, borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 500, cursor: generating ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? 'Generating...' : 'Generate tasks with AI ✦'}
            </button>
          )}
        </div>
      ) : (
        <>
          {visibleTasks.map(renderTask)}
          {activeTab === 1 && (
            <button
              style={{ marginTop: 10, background: 'none', color: c.accentText, border: `0.5px solid ${c.accentText}`, borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 500, cursor: generating ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? 'Generating...' : '+ Generate more tasks ✦'}
            </button>
          )}
        </>
      )}

      {activeTab !== 3 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <input
            style={{ flex: 1, border: `0.5px solid ${c.inputBorder}`, borderRadius: 10, padding: '10px 12px', fontSize: 16, background: c.input, outline: 'none', fontFamily: 'inherit', color: c.text }}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Add a task..."
          />
          <button style={{ background: c.accent, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }} onClick={handleAdd}>Add</button>
        </div>
      )}
    </div>
  )
}