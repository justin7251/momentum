import { useState } from 'react'
import { addTask, updateTask, deleteTask } from '../firebase/db'
import { useTheme } from '../hooks/useTheme'

export default function TaskList({ uid, goalId, tasks }) {
  const [input, setInput] = useState('')
  const { c } = useTheme()

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

  const done = tasks.filter(t => t.done).length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: c.label, textTransform: 'uppercase', letterSpacing: '.06em' }}>Tasks</span>
        <span style={{ background: c.accentBg, color: c.accentText, padding: '2px 9px', borderRadius: 99, fontSize: 11, fontWeight: 500 }}>{done}/{tasks.length}</span>
      </div>

      {tasks.length === 0 && (
        <div style={{ fontSize: 13, color: c.textFaint, padding: '6px 0' }}>No tasks yet</div>
      )}

      {tasks.map(task => (
        <div key={task.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 11px', background: c.input, borderRadius: 8, border: `0.5px solid ${c.inputBorder}`, marginBottom: 7, opacity: task.done ? 0.45 : 1 }}>
          <div
            style={{ width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${task.done ? c.accent : c.inputBorder}`, background: task.done ? c.accent : c.card, cursor: 'pointer', flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => handleToggle(task)}
          >
            {task.done && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
          </div>
          <div style={{ flex: 1, fontSize: 14, color: task.done ? c.textFaint : c.text, textDecoration: task.done ? 'line-through' : 'none', lineHeight: 1.4 }}>
            {task.text}
          </div>
          <button style={{ background: 'none', border: 'none', color: c.textFaint, cursor: 'pointer', fontSize: 12, padding: '2px 4px' }} onClick={() => handleDelete(task.id)}>✕</button>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <input
          style={{ flex: 1, border: `0.5px solid ${c.inputBorder}`, borderRadius: 8, padding: '9px 12px', fontSize: 16, background: c.input, outline: 'none', fontFamily: 'inherit', color: c.text }}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Add a task..."
        />
        <button style={{ background: c.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }} onClick={handleAdd}>Add</button>
      </div>
    </div>
  )
}