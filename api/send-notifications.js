import webpush from 'web-push'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VITE_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

function getAdminDb() {
  if (!getApps().length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ?.replace(/\\n/g, '\n')
      ?.replace(/"/g, '')

    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey
      })
    })
  }
  return getFirestore()
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).end()

  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const db = getAdminDb()
  const today = new Date().toISOString().split('T')[0]

  try {
    const subsSnap = await db.collection('pushSubscriptions').get()
    const results = { sent: 0, skipped: 0, failed: 0 }

    await Promise.all(subsSnap.docs.map(async (subDoc) => {
      const { uid, subscription } = subDoc.data()
      try {
        const userDoc = await db.collection('users').doc(uid).get()
        const userData = userDoc.data()
        const notifTime = userData?.notifTime || '20:00'
        const [h, m] = notifTime.split(':').map(Number)
        const now = new Date()
        const userHour = now.getUTCHours()
        const userMin = now.getUTCMinutes()

        if (userHour !== h || userMin > m + 5) return

        const goalsSnap = await db.collection('users').doc(uid).collection('goals').get()
        let checkedInToday = false

        for (const goalDoc of goalsSnap.docs) {
          const checkinsSnap = await goalDoc.ref.collection('checkins')
            .where('date', '==', today).limit(1).get()
          if (!checkinsSnap.empty) { checkedInToday = true; break }
        }

        if (checkedInToday) { results.skipped++; return }

        await webpush.sendNotification(subscription, JSON.stringify({
          title: 'Momentum',
          body: "Don't forget your daily check-in — keep your streak alive!",
          url: '/'
        }))
        results.sent++
      } catch (e) {
        if (e.statusCode === 410) {
          await db.collection('pushSubscriptions').doc(uid).delete()
        }
        results.failed++
      }
    }))

    res.status(200).json(results)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: e.message })
  }
}