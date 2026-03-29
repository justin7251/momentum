import { useState } from 'react'
import { useTheme } from '../hooks/useTheme'
import { addProject, updateProject, deleteProject } from '../firebase/db'
import { breakdownProject } from '../hooks/useAI'

const PRIORITIES = [
  { label: 'High', color: '#A32D2D', bg: '#FCEBEB', border: '#F7C1C1' },
  { label: 'Med', color: '#854F0B', bg: '#FAEEDA', border: '#FAC775' },
  { label: 'Low', color: '#3B6D11', bg: '#EAF3DE', border: '#C0DD97' },
]

export default function Projects({ uid, goalId, projects, goal }) {
  const { c } = useTheme()
  const [adding, setAdding] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [form, setForm] = useState({ title: '', deadline: '', priority: 0 })
  const [generating, setGenerating] = useState(false)

  const active = projects.filter(p => !p.done)
  const done = projects.filter(p => p.done)

  const handleAdd = async () => {
    if (!form.title.trim()) return
    await addProject(uid, goalId, {
      title: form.title,
      deadline: form.deadline,
      priority: form.priority,
      subtasks: []
    })
    setForm({ title: '', deadline: '', priority: 0 })
    setAdding(false)
  }

  const handleBreakdown = async (project) => {
    setGenerating(project.id)
    try {
      const data = await breakdownProject(project.title, goal)
      const subtasks = data.subtasks.map((s, i) => ({
        id: `st_${Date.now()}_${i}`,
        text: s.text,
        done: false
      }))
      await updateProject(uid, goalId, project.id, { subtasks })
    } catch (e) { console.error(e) }
    setGenerating(null)
  }

  const toggleSubtask = async (project, subtaskId) => {
    const updated = project.subtasks.map(s =>
      s.id === subtaskId ? { ...s, done: !s.done } : s
    )
    await updateProject(uid, goalId, project.id, { subtasks: updated })
    const allDone = updated.every(s => s.done)
    if (allDone && updated.length > 0) {
      await updateProject(uid, goalId, project.id, { done: true })
    }
  }

  const toggleProject = (project) =>
    updateProject(uid, goalId, project.id, { done: !project.done })

  const daysUntil = (deadline) => {
    if (!deadline) return null
    const diff = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24))
    return diff
  }

  const deadlineColor = (days) => {
    if (days === null) return c.textFaint
    if (days < 0) return '#A32D2D'
    if (days <= 3) return '#854F0B'
    return c.textFaint
  }

  const deadlineLabel = (days) => {
    if (days === null) return ''
    if (days < 0) return `${Math.abs(days)}d overdue`
    if (days === 0) return 'Due today'
    if (days === 1) return 'Due tomorrow'
    return `${days}d left`
  }

  const renderProject = (project) => {
    const p = PRIORITIES[project.priority] || PRIORITIES[1]
    const days = daysUntil(project.deadline)
    const isExpanded = expanded === project.id
    const subtasksDone = project.subtasks?.filter(s => s.done).length || 0
    const subtasksTotal = project.subtasks?.length || 0

    return (
      <div key={project.id} style={{ background: c.input, border: `0.5px solid ${c.cardBorder}`, borderRadius: 12, marginBottom: 10, overflow: 'hidden' }}>
        <div style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div
              style={{ width: 20, height: 20, borderRadius: 5, border: `1.5px solid ${project.done ? c.accent : c.inputBorder}`, background: project.done ? c.accent : 'transparent', cursor: 'pointer', flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => toggleProject(project)}
            >
              {project.done && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
            </div>

            <div style={{ flex: 1, minWidth: 0 }} onClick={() => setExpanded(isExpanded ? null : project.id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: project.done ? c.textFaint : c.text, textDecoration: project.done ? 'line-through' : 'none' }}>{project.title}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: p.color, background: p.bg, border: `0.5px solid ${p.border}`, padding: '1px 6px', borderRadius: 4 }}>{p.label}</span>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                {project.deadline && (
                  <span style={{ fontSize: 11, color: deadlineColor(days) }}>
                    {deadlineLabel(days)}
                  </span>
                )}
                {subtasksTotal > 0 && (
                  <span style={{ fontSize: 11, color: c.textFaint }}>
                    {subtasksDone}/{subtasksTotal} subtasks
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button style={{ background: 'none', border: 'none', color: c.textFaint, cursor: 'pointer', fontSize: 13 }} onClick={() => setExpanded(isExpanded ? null : project.id)}>
                {isExpanded ? '▲' : '▼'}
              </button>
              <button style={{ background: 'none', border: 'none', color: c.textFaint, cursor: 'pointer', fontSize: 13 }} onClick={() => deleteProject(uid, goalId, project.id)}>✕</button>
            </div>
          </div>
        </div>

        {isExpanded && (
        <div style={{ borderTop: `0.5px solid ${c.cardBorder}`, padding: '12px 14px' }}>
            {project.subtasks?.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '7px 0', borderBottom: `0.5px solid ${c.cardBorder}` }}>
                <div
                style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${s.done ? c.accent : c.inputBorder}`, background: s.done ? c.accent : 'transparent', cursor: 'pointer', flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => toggleSubtask(project, s.id)}
                >
                {s.done && <span style={{ color: '#fff', fontSize: 9, fontWeight: 700 }}>✓</span>}
                </div>
                <span style={{ flex: 1, fontSize: 13, color: s.done ? c.textFaint : c.text, textDecoration: s.done ? 'line-through' : 'none', lineHeight: 1.4 }}>{s.text}</span>
                <button style={{ background: 'none', border: 'none', color: c.textFaint, cursor: 'pointer', fontSize: 12, padding: '0 2px' }} onClick={() => {
                const updated = project.subtasks.filter(x => x.id !== s.id)
                updateProject(uid, goalId, project.id, { subtasks: updated })
                }}>✕</button>
            </div>
            ))}

            <AddSubtask project={project} uid={uid} goalId={goalId} c={c} />

            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button
                style={{ background: generating === project.id ? c.inputBorder : c.accentBg, color: generating === project.id ? c.textFaint : c.accentText, border: `0.5px solid ${c.accentText}`, borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 500, cursor: generating === project.id ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                onClick={() => handleBreakdown(project)}
                disabled={!!generating}
            >
                {generating === project.id ? 'Generating...' : project.subtasks?.length ? 'Regenerate ✦' : 'AI breakdown ✦'}
            </button>
            </div>
        </div>
        )}
      </div>
    )
  }

  function AddSubtask({ project, uid, goalId, c }) {
    const [text, setText] = useState('')

    const handleAdd = async () => {
        const v = text.trim()
        if (!v) return
        const newSubtask = { id: `st_${Date.now()}`, text: v, done: false }
        const updated = [...(project.subtasks || []), newSubtask]
        await updateProject(uid, goalId, project.id, { subtasks: updated })
        setText('')
    }

    return (
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        <input
            style={{ flex: 1, border: `0.5px solid ${c.inputBorder}`, borderRadius: 8, padding: '7px 10px', fontSize: 14, background: c.input, outline: 'none', fontFamily: 'inherit', color: c.text }}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Add a sub-task..."
        />
        <button
            style={{ background: c.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
            onClick={handleAdd}
        >
            Add
        </button>
        </div>
    )
    }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: c.label, textTransform: 'uppercase', letterSpacing: '.06em' }}>Projects</span>
        <span style={{ background: c.accentBg, color: c.accentText, padding: '2px 9px', borderRadius: 99, fontSize: 11, fontWeight: 500 }}>{active.length} active</span>
      </div>

      {active.length === 0 && !adding && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📁</div>
          <div style={{ fontSize: 13, fontWeight: 500, color: c.text, marginBottom: 4 }}>No projects yet</div>
          <div style={{ fontSize: 12, color: c.textFaint }}>One-off tasks with deadlines and sub-tasks</div>
        </div>
      )}

      {active.map(renderProject)}

      {done.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: c.label, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Completed</div>
          {done.map(renderProject)}
        </div>
      )}

      {adding ? (
        <div style={{ background: c.card, border: `0.5px solid ${c.cardBorder}`, borderRadius: 12, padding: 14, marginTop: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: c.text, marginBottom: 10 }}>New project</div>

          <input
            style={{ width: '100%', border: `0.5px solid ${c.inputBorder}`, borderRadius: 10, padding: '10px 12px', fontSize: 16, background: c.input, outline: 'none', fontFamily: 'inherit', color: c.text, display: 'block', marginBottom: 8 }}
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="Project name..."
            autoFocus
          />

          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 4 }}>Deadline</div>
              <input
                type="date"
                style={{ width: '100%', border: `0.5px solid ${c.inputBorder}`, borderRadius: 10, padding: '9px 12px', fontSize: 14, background: c.input, outline: 'none', fontFamily: 'inherit', color: c.text }}
                value={form.deadline}
                onChange={e => setForm({ ...form, deadline: e.target.value })}
              />
            </div>
            <div>
              <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 4 }}>Priority</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {PRIORITIES.map((p, i) => (
                  <button key={i} style={{ padding: '8px 10px', borderRadius: 8, border: `1.5px solid ${form.priority === i ? p.color : c.inputBorder}`, background: form.priority === i ? p.bg : 'transparent', color: form.priority === i ? p.color : c.textMuted, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => setForm({ ...form, priority: i })}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ flex: 1, background: c.accent, color: '#fff', border: 'none', borderRadius: 10, padding: '11px', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }} onClick={handleAdd}>Add project</button>
            <button style={{ background: 'none', border: `0.5px solid ${c.cardBorder}`, borderRadius: 10, padding: '11px 16px', fontSize: 14, color: c.textMuted, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <button
          style={{ marginTop: 12, width: '100%', background: 'none', border: `0.5px solid ${c.cardBorder}`, borderRadius: 10, padding: '10px', fontSize: 13, color: c.textMuted, cursor: 'pointer', fontFamily: 'inherit' }}
          onClick={() => setAdding(true)}
        >
          + Add project
        </button>
      )}
    </div>
  )
}