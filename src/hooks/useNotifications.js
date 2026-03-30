export async function requestPermission() {
  if (!('Notification' in window)) return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function checkAndNotify(checkins) {
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  const today = new Date().toISOString().split('T')[0]
  const alreadyDone = checkins.some(c => c.date === today)
  if (alreadyDone) return

  const savedTime = localStorage.getItem('notifTime') || '20:00'
  const [h, m] = savedTime.split(':').map(Number)
  const now = new Date()
  if (now.getHours() < h || (now.getHours() === h && now.getMinutes() < m)) return

  new Notification('Momentum', {
    body: "You haven't checked in today — 2 minutes is all it takes.",
    icon: '/icon-192.png'
  })
}