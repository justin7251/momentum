import { useTheme } from '../hooks/useTheme'

const DAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export default function StreakBar({ checkins }) {
  const { c } = useTheme()
  const today = new Date().toISOString().split('T')[0]
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push({ date: d.toISOString().split('T')[0], dow: d.getDay() })
  }
  const checkinDates = checkins.map(ci => ci.date)

  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between' }}>
      {days.map(({ date, dow }) => {
        const done = checkinDates.includes(date)
        const isToday = date === today
        const isPast = date < today
        const ci = checkins.find(ci => ci.date === date)
        return (
          <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <div style={{ fontSize: 10, fontWeight: 500, color: isToday ? c.accentText : c.textFaint }}>
              {DAY_INITIALS[dow]}
            </div>
            <div style={{
              width: '100%', aspectRatio: '1', borderRadius: 10, maxWidth: 40,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: done ? 18 : 12, fontWeight: 600,
              background: done ? c.accent : isToday ? c.accentBg : c.streak,
              color: done ? '#fff' : isToday ? c.accentText : c.textFaint,
              border: isToday && !done ? `2px solid ${c.accent}` : 'none',
            }}>
              {done ? (ci?.moodEmoji || '✓') : isPast ? '–' : '·'}
            </div>
          </div>
        )
      })}
    </div>
  )
}