import { useState } from 'react'
import { addTask, updateTask, deleteTask } from '../firebase/db'

export default function TaskList({ uid, goalId, tasks }) {
  const [input, setInput] = useState('')

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
        <span style={styles.label}>Tasks</span>
        <span style={styles.tag}>{done}/{tasks.length}</span>
      </div>

      {tasks.length === 0 && <div style={styles.empty}>No tasks yet</div>}

      {tasks.map(task => (
        <div key={task.id} style={{ ...styles.taskRow, opacity: task.done ? 0.45 : 1 }}>
          <div
            style={{ ...styles.chk, background: task.done ? '#534AB7' : '#fff', borderColor: task.done ? '#534AB7' : '#ccc' }}
            onClick={() => handleToggle(task)}
          >
            {task.done && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
          </div>
          <div style={{ flex: 1, fontSize: 14, textDecoration: task.done ? 'line-through' : 'none', color: task.done ? '#aaa' : '#1a1a1a' }}>
            {task.text}
          </div>
          <button style={styles.del} onClick={() => handleDelete(task.id)}>✕</button>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <input
          style={styles.input}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Add a task..."
        />
        <button style={styles.btnPri} onClick={handleAdd}>Add</button>
      </div>
    </div>
  )
}

const styles = {
  label: { fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '.06em' },
  tag: { background: '#EEEDFE', color: '#534AB7', padding: '2px 9px', borderRadius: 99, fontSize: 11, fontWeight: 500 },
  empty: { fontSize: 13, color: '#aaa', padding: '6px 0' },
  taskRow: { display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 11px', background: '#fafaf8', borderRadius: 8, border: '0.5px solid #e8e6de', marginBottom: 7 },
  chk: { width: 18, height: 18, borderRadius: 4, border: '1.5px solid #ccc', cursor: 'pointer', flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  del: { background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 12, padding: '2px 4px' },
  input: { flex: 1, border: '0.5px solid #ddd', borderRadius: 8, padding: '8px 11px', fontSize: 14, background: '#fafaf8', outline: 'none', fontFamily: 'inherit' },
  btnPri: { background: '#534AB7', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }
}