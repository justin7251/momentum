import { useTheme } from '../hooks/useTheme'

export default function StreakBar({ checkins }) {
  const { c } = useTheme()
  const today = new Date().toISOString().split('T')[0]
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  const checkinDates = checkins.map(ci => ci.date)

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {days.map(day => {
        const done = checkinDates.includes(day)
        const isToday = day === today
        const isPast = day < today
        const ci = checkins.find(ci => ci.date === day)
        return (
          <div key={day} style={{
            width: 34, height: 34, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: done ? 16 : 11, fontWeight: 600,
            background: done ? c.accent : isToday ? c.accentBg : c.streak,
            color: done ? '#fff' : isToday ? c.accentText : c.textFaint,
            border: isToday && !done ? `2px solid ${c.accent}` : 'none',
            flexShrink: 0
          }}>
            {done ? (ci?.moodEmoji || '✓') : isPast ? '–' : new Date().getDate()}
          </div>
        )
      })}
    </div>
  )
}