self.addEventListener('push', e => {
  const data = e.data?.json() || {}
  self.registration.showNotification(data.title || 'Momentum', {
    body: data.body || "Don't forget your daily check-in!",
    icon: '/icon-192.png',
    badge: '/icon-192.png'
  })
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  e.waitUntil(clients.openWindow('/'))
})