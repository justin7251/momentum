import { useState } from 'react'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { addTask, updateTask, deleteTask, completeTask, uncompleteTask, autoCheckin } from '../firebase/db'
import { useTheme } from '../hooks/useTheme'
import { generateTasks } from '../hooks/useAI'
import { useOnlineStatus } from '../hooks/useOnlineStatus'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const PRIORITIES = [
  { label: 'High', color: '#A32D2D', bg: '#FCEBEB', border: '#F7C1C1' },
  { label: 'Med', color: '#854F0B', bg: '#FAEEDA', border: '#FAC775' },
  { label: 'Low', color: '#3B6D11', bg: '#EAF3DE', border: '#C0DD97' },
]
const TASK_TABS = ['Today', 'All', 'Missed', 'Done']

function parseTaskText(text) {
  const match = text.match(/^\[(\w+)\]\s(.+)/)
  if (match) return { day: match[1], task: match[2] }
  return { day: null, task: text }
}

function todayDow() { return DAYS[new Date().getDay()] }
function todayStr() { return new Date().toISOString().split('T')[0] }

function isPastDay(day) {
  if (!day) return false
  const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  const todayIdx = new Date().getDay()
  const dayIdx = dayMap[day]
  if (dayIdx === undefined) return false
  return dayIdx < todayIdx
}

function isOlderThan7Days(createdAt) {
  if (!createdAt) return false
  const created = createdAt.toDate ? createdAt.toDate() : new Date(createdAt)
  return (Date.now() - created.getTime()) > 7 * 24 * 60 * 60 * 1000
}

function SortableTask({ task, onToggle, onDelete, onExpand, expanded, c, uid, goalId }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }
  const { day, task: taskText } = parseTaskText(task.text)
  const isMissed = day && isPastDay(day) && !task.done
  const p = task.priority !== undefined && task.priority !== null ? PRIORITIES[task.priority] : null
  const isExpanded = expanded === task.id
  const daysUntil = task.dueDate ? Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) : null
  const overdue = daysUntil !== null && daysUntil < 0
  const dueSoon = daysUntil !== null && daysUntil <= 2 && daysUntil >= 0

  return (
    <div ref={setNodeRef} style={style}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 0', borderBottom: `0.5px solid ${c.cardBorder}` }}>
        <div {...attributes} {...listeners} style={{ color: c.textFaint, fontSize: 14, cursor: 'grab', padding: '2px 2px 0', flexShrink: 0, touchAction: 'none' }}>⠿</div>
        <div
          style={{ width: 20, height: 20, borderRadius: 5, border: `1.5px solid ${task.done ? c.accent : isMissed ? '#F09595' : c.inputBorder}`, background: task.done ? c.accent : 'transparent', cursor: 'pointer', flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => onToggle(task)}
        >
          {task.done && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
        </div>

        <div style={{ flex: 1, minWidth: 0 }} onClick={() => onExpand(task.id)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginBottom: 2 }}>
            {day && (
              <span style={{ fontSize: 10, fontWeight: 600, color: isMissed ? '#A32D2D' : c.accentText, background: isMissed ? '#FCEBEB' : c.accentBg, padding: '1px 6px', borderRadius: 4 }}>
                {day}{isMissed ? ' · missed' : ''}
              </span>
            )}
            {p && (
              <span style={{ fontSize: 10, fontWeight: 600, color: p.color, background: p.bg, border: `0.5px solid ${p.border}`, padding: '1px 6px', borderRadius: 4 }}>{p.label}</span>
            )}
            {task.recur && (
              <span style={{ fontSize: 10, fontWeight: 500, color: c.accentText, background: c.accentBg, padding: '1px 6px', borderRadius: 4 }}>↻ {task.recur}</span>
            )}
          </div>
          <div style={{ fontSize: 14, color: task.done ? c.textFaint : c.text, textDecoration: task.done ? 'line-through' : 'none', lineHeight: 1.4 }}>{taskText}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
            {task.dueDate && (
              <span style={{ fontSize: 11, color: overdue ? '#A32D2D' : dueSoon ? '#854F0B' : c.textFaint }}>
                {overdue ? `${Math.abs(daysUntil)}d overdue` : daysUntil === 0 ? 'Due today' : `${daysUntil}d left`}
              </span>
            )}
            {task.notes && <span style={{ fontSize: 11, color: c.textFaint }}>📝</span>}
          </div>
        </div>

        <button style={{ background: 'none', border: 'none', color: c.textFaint, cursor: 'pointer', fontSize: 13, padding: '0 2px', flexShrink: 0 }} onClick={() => onDelete(task.id)}>✕</button>
      </div>

      {isExpanded && <TaskDetail task={task} uid={uid} goalId={goalId} c={c} />}
    </div>
  )
}

function TaskDetail({ task, uid, goalId, c }) {
  const [notes, setNotes] = useState(task.notes || '')
  const [dueDate, setDueDate] = useState(task.dueDate || '')
  const [priority, setPriority] = useState(task.priority ?? -1)
  const [recur, setRecur] = useState(task.recur ?? null)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    await updateTask(uid, goalId, task.id, {
      notes,
      dueDate,
      priority: priority === -1 ? null : priority,
      recur
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div style={{ background: c.accentBg, borderRadius: 10, padding: '12px 14px', marginBottom: 4 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 4 }}>Due date</div>
          <input
            type="date"
            style={{ width: '100%', border: `0.5px solid ${c.inputBorder}`, borderRadius: 8, padding: '7px 10px', fontSize: 13, background: c.input, outline: 'none', fontFamily: 'inherit', color: c.text }}
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
          />
        </div>
        <div>
          <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 4 }}>Priority</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {PRIORITIES.map((p, i) => (
              <button key={i} style={{ flex: 1, padding: '6px 2px', borderRadius: 6, border: `1.5px solid ${priority === i ? p.color : c.inputBorder}`, background: priority === i ? p.bg : 'transparent', color: priority === i ? p.color : c.textMuted, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                onClick={() => setPriority(priority === i ? -1 : i)}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 4 }}>Repeat</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            { label: 'None', value: null },
            { label: 'Daily', value: 'daily' },
            { label: 'Weekly', value: 'weekly' }
          ].map((r) => (
            <button
              key={r.label}
              style={{ flex: 1, padding: '7px 4px', borderRadius: 6, border: `0.5px solid ${recur === r.value ? c.accent : c.inputBorder}`, background: recur === r.value ? c.accent : 'transparent', color: recur === r.value ? '#fff' : c.textMuted, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
              onClick={() => setRecur(r.value)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 4 }}>Notes</div>
        <textarea
          style={{ width: '100%', border: `0.5px solid ${c.inputBorder}`, borderRadius: 8, padding: '8px 10px', fontSize: 13, background: c.input, outline: 'none', fontFamily: 'inherit', color: c.text, resize: 'none', lineHeight: 1.5 }}
          rows={2}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Add notes..."
        />
      </div>

      <button
        style={{ width: '100%', background: c.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '9px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
        onClick={handleSave}
      >
        {saved ? 'Saved ✓' : 'Save'}
      </button>
    </div>
  )
}

export default function TaskList({ uid, goalId, tasks, goal }) {
  const [input, setInput] = useState('')
  const [activeTab, setActiveTab] = useState(0)
  const [generating, setGenerating] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [orderedIds, setOrderedIds] = useState(null)
  const [showGenerate, setShowGenerate] = useState(false)
  const [generatePrompt, setGeneratePrompt] = useState('')
  const { c } = useTheme()
  const online = useOnlineStatus()
  const today = todayDow()

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const handleAdd = async () => {
    const v = input.trim()
    if (!v) return
    await addTask(uid, goalId, { text: v, priority: null, dueDate: '', notes: '', recur: null })
    setInput('')
  }

  const handleToggle = async (task) => {
    const nowDone = !task.done
    if (task.recur) {
      if (nowDone) {
        await completeTask(uid, goalId, task.id, task.recur ? { lastDone: todayStr() } : {})
        await updateTask(uid, goalId, task.id, { lastDone: todayStr() })
      } else {
        await uncompleteTask(uid, goalId, task.id)
      }
    } else {
      if (nowDone) {
        await completeTask(uid, goalId, task.id)
      } else {
        await uncompleteTask(uid, goalId, task.id)
      }
    }
    if (nowDone) await autoCheckin(uid, goalId)
  }

  const handleDelete = (taskId) => deleteTask(uid, goalId, taskId)
  const handleExpand = (id) => setExpanded(expanded === id ? null : id)

  const handleGenerate = async () => {
    if (!online) return
    setGenerating(true)
    try {
      const data = await generateTasks(goal, generatePrompt)
      for (const t of data.tasks) {
        await addTask(uid, goalId, {
          text: t.day ? `[${t.day}] ${t.text}` : t.text,
          estimatedMins: t.estimatedMins,
          priority: null, dueDate: '', notes: '', recur: null
        })
      }
      setActiveTab(1)
      setGeneratePrompt('')
      setShowGenerate(false)
    } catch (e) { console.error(e) }
    setGenerating(false)
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = orderedTasks.findIndex(t => t.id === active.id)
    const newIndex = orderedTasks.findIndex(t => t.id === over.id)
    setOrderedIds(arrayMove(orderedTasks, oldIndex, newIndex).map(t => t.id))
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
  const doneTasks = tasks.filter(t => t.done && !isOlderThan7Days(t.createdAt))

  const counts = [todayTasks, allTasks, missedTasks, doneTasks].map(a => a.length)
  const visibleTasks = [todayTasks, allTasks, missedTasks, doneTasks][activeTab]
  const orderedTasks = orderedIds
    ? orderedIds.map(id => visibleTasks.find(t => t.id === id)).filter(Boolean)
    : visibleTasks

  const emptyMessages = [
    { icon: '✓', title: 'All done for today', sub: 'Great work — check in to log your day' },
    { icon: '📋', title: 'No active tasks', sub: 'Add a task below or generate with AI' },
    { icon: '👍', title: 'No missed tasks', sub: "You're all caught up" },
    { icon: '🎯', title: 'Nothing completed yet', sub: 'Completed tasks appear here for 7 days' }
  ]

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 14, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {TASK_TABS.map((t, i) => (
          <button key={t} style={{ padding: '5px 11px', borderRadius: 99, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: `0.5px solid ${activeTab === i ? c.accent : c.cardBorder}`, background: activeTab === i ? c.accent : 'transparent', color: activeTab === i ? '#fff' : i === 2 && counts[2] > 0 ? '#A32D2D' : c.textMuted, fontFamily: 'inherit', transition: 'all .15s', whiteSpace: 'nowrap', flexShrink: 0 }}
            onClick={() => { setActiveTab(i); setOrderedIds(null) }}>
            {t} ({counts[i]})
          </button>
        ))}
      </div>

      {orderedTasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>{emptyMessages[activeTab].icon}</div>
          <div style={{ fontSize: 13, fontWeight: 500, color: c.text, marginBottom: 4 }}>{emptyMessages[activeTab].title}</div>
          <div style={{ fontSize: 12, color: c.textFaint }}>{emptyMessages[activeTab].sub}</div>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={orderedTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            {orderedTasks.map(task => (
              <SortableTask
                key={task.id}
                task={task}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onExpand={handleExpand}
                expanded={expanded}
                c={c}
                uid={uid}
                goalId={goalId}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}

      {activeTab !== 3 && (
        <>
          {showGenerate ? (
            <div style={{ marginTop: 12, background: c.accentBg, border: `0.5px solid ${c.accentText}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: c.accentText, marginBottom: 8 }}>What do you want tasks for?</div>
              <textarea
                style={{ width: '100%', border: `0.5px solid ${c.inputBorder}`, borderRadius: 8, padding: '9px 12px', fontSize: 14, background: c.input, outline: 'none', fontFamily: 'inherit', color: c.text, resize: 'none', lineHeight: 1.5, display: 'block', marginBottom: 8 }}
                rows={2}
                value={generatePrompt}
                onChange={e => setGeneratePrompt(e.target.value)}
                placeholder="e.g. Focus on speaking practice, or beginner grammar exercises..."
                autoFocus
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  style={{ flex: 1, background: generating || !online ? c.inputBorder : c.accent, color: generating || !online ? c.textFaint : '#fff', border: 'none', borderRadius: 8, padding: '9px', fontSize: 13, fontWeight: 500, cursor: generating || !online ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                  onClick={handleGenerate}
                  disabled={generating || !online}
                >
                  {!online ? 'Unavailable offline' : generating ? 'Generating...' : 'Generate ✦'}
                </button>
                <button
                  style={{ background: 'none', border: `0.5px solid ${c.cardBorder}`, borderRadius: 8, padding: '9px 14px', fontSize: 13, color: c.textMuted, cursor: 'pointer', fontFamily: 'inherit' }}
                  onClick={() => setShowGenerate(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              style={{ marginTop: 10, width: '100%', background: 'none', border: `0.5px solid ${c.cardBorder}`, borderRadius: 8, padding: '8px', fontSize: 13, color: online ? c.textMuted : c.textFaint, cursor: online ? 'pointer' : 'not-allowed', fontFamily: 'inherit', opacity: online ? 1 : 0.5 }}
              onClick={() => online && setShowGenerate(true)}
            >
              {online ? 'Generate tasks with AI ✦' : 'AI unavailable offline'}
            </button>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <input
              style={{ flex: 1, border: `0.5px solid ${c.inputBorder}`, borderRadius: 10, padding: '10px 12px', fontSize: 16, background: c.input, outline: 'none', fontFamily: 'inherit', color: c.text }}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="Add a task..."
            />
            <button
              style={{ background: c.accent, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
              onClick={handleAdd}
            >
              Add
            </button>
          </div>
        </>
      )}
    </div>
  )
}