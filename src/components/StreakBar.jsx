export default function StreakBar({ checkins }) {
  const today = new Date().toISOString().split('T')[0]
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  const checkinDates = checkins.map(c => c.date)

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {days.map(day => {
        const done = checkinDates.includes(day)
        const isToday = day === today
        const isPast = day < today
        return (
          <div key={day} style={{
            width: 34, height: 34, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: done ? 16 : 11, fontWeight: 600,
            background: done ? '#534AB7' : isToday ? '#EEEDFE' : '#ebe9e3',
            color: done ? '#fff' : isToday ? '#534AB7' : '#aaa',
            border: isToday && !done ? '2px solid #534AB7' : 'none'
          }}>
            {done
              ? checkins.find(c => c.date === day)?.moodEmoji || '✓'
              : isPast ? '–' : new Date().getDate()}
          </div>
        )
      })}
    </div>
  )
}