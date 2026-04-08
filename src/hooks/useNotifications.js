import { savePushSubscription, removePushSubscription } from '../firebase/db'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return new Uint8Array([...rawData].map(c => c.charCodeAt(0)))
}

export async function requestPermission(uid) {
  console.log('requestPermission called, uid:', uid)

  if (!('Notification' in window)) {
    console.log('Notifications not supported')
    return false
  }

  if (!('serviceWorker' in navigator)) {
    console.log('Service worker not supported')
    return false
  }

  const result = await Notification.requestPermission()
  console.log('Permission result:', result)
  if (result !== 'granted') return false

  if (!VAPID_PUBLIC_KEY) {
    console.error('VITE_VAPID_PUBLIC_KEY is not set')
    return false
  }

  try {
    const reg = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, reject) => setTimeout(() => reject(new Error('SW timeout')), 10000))
    ])
    console.log('Service worker ready:', reg)

    let subscription = await reg.pushManager.getSubscription()
    console.log('Existing subscription:', subscription)

    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      })
      console.log('New subscription created:', subscription)
    }

    await savePushSubscription(uid, subscription)
    console.log('Subscription saved to Firestore')
    return true
  } catch (e) {
    console.error('Push subscription failed:', e)
    return false
  }
}

export async function disableNotifications(uid) {
  try {
    const reg = await navigator.serviceWorker.ready
    const subscription = await reg.pushManager.getSubscription()
    if (subscription) await subscription.unsubscribe()
    await removePushSubscription(uid)
  } catch (e) {
    console.error('Failed to disable notifications:', e)
  }
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