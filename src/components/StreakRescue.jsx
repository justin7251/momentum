import { useState, useEffect } from 'react'
import { useTheme } from '../hooks/useTheme'
import { generateRescueTask } from '../hooks/useAI'
import { addTask } from '../firebase/db'

export default function StreakRescue({ uid, goal, checkins, streak }) {
  const { c } = useTheme()
  const [rescue, setRescue] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const checkedInToday = checkins.some(c => c.date === today)
  const checkedInYesterday = checkins.some(c => c.date === yesterday)
  const streakAtRisk = streak > 0 && !checkedInToday && !checkedInYesterday

  if (!streakAtRisk) return null

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const data = await generateRescueTask(goal, streak, checkins)
      setRescue(data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const handleSave = async () => {
    await addTask(uid, goal.id, { text: rescue.task, estimatedMins: rescue.estimatedMins })
    setSaved(true)
  }

  return (
    <div style={{ background: '#FAEEDA', border: '0.5px solid #FAC775', borderRadius: 14, padding: '14px 16px', marginBottom: 14 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ fontSize: 22, flexShrink: 0 }}>⚡</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#633806', marginBottom: 4 }}>
            Streak at risk — {streak} days
          </div>
          {!rescue ? (
            <>
              <div style={{ fontSize: 12, color: '#854F0B', marginBottom: 10, lineHeight: 1.5 }}>
                You haven't checked in recently. Get a quick rescue task to keep your streak alive.
              </div>
              <button
                style={{ background: '#854F0B', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading ? 'Generating...' : 'Get rescue task ✦'}
              </button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 13, color: '#633806', marginBottom: 4, lineHeight: 1.5, fontWeight: 500 }}>{rescue.task}</div>
              <div style={{ fontSize: 12, color: '#854F0B', marginBottom: 10 }}>{rescue.estimatedMins} min · {rescue.encouragement}</div>
              {!saved ? (
                <button
                  style={{ background: '#854F0B', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
                  onClick={handleSave}
                >
                  Add to tasks
                </button>
              ) : (
                <span style={{ fontSize: 12, color: '#3B6D11', fontWeight: 500 }}>Added to tasks ✓</span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}