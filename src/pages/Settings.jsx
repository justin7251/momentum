import { useState } from 'react'
import { useTheme } from '../hooks/useTheme'
import { doc, updateDoc, deleteDoc, collection, getDocs } from 'firebase/firestore'
import { db, auth } from '../firebase/config'
import { deleteUser } from 'firebase/auth'
import { requestPermission, disableNotifications } from '../hooks/useNotifications'

const THEME_OPTIONS = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
]

export default function Settings({ user, userData, onBack, onLogout }) {
  const { c, setTheme, currentTheme } = useTheme()
  const [name, setName] = useState(userData?.name || '')
  const [notifTime, setNotifTime] = useState(localStorage.getItem('notifTime') || '20:00')
  const [notifEnabled, setNotifEnabled] = useState(Notification.permission === 'granted')
  const [saved, setSaved] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const initials = name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : user?.email?.[0]?.toUpperCase() || '?'

  const handleSaveProfile = async () => {
    await updateDoc(doc(db, 'users', user.uid), { name })
    localStorage.setItem('notifTime', notifTime)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const handleToggleNotif = async () => {
    if (notifEnabled) {
      await disableNotifications(user.uid)
      setNotifEnabled(false)
    } else {
      const granted = await requestPermission(user.uid)
      setNotifEnabled(granted)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('This will delete all your data permanently. Are you sure?')) return
    if (!confirm('Are you absolutely sure? This cannot be undone.')) return
    setDeleting(true)
    try {
      const goalsSnap = await getDocs(collection(db, 'users', user.uid, 'goals'))
      for (const goal of goalsSnap.docs) {
        await deleteDoc(doc(db, 'users', user.uid, 'goals', goal.id))
      }
      await deleteDoc(doc(db, 'users', user.uid))
      await deleteUser(auth.currentUser)
    } catch (e) {
      console.error(e)
      alert('Could not delete account. Please sign out and sign back in first, then try again.')
    }
    setDeleting(false)
  }

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: c.label, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>{title}</div>
      <div style={{ background: c.card, border: `0.5px solid ${c.cardBorder}`, borderRadius: 14, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  )

  const Row = ({ label, children, last }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderBottom: last ? 'none' : `0.5px solid ${c.cardBorder}` }}>
      <div style={{ fontSize: 14, color: c.text }}>{label}</div>
      <div>{children}</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ padding: '16px 16px 0', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button style={{ background: 'none', border: 'none', fontSize: 14, color: c.accent, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, padding: 0 }} onClick={onBack}>← Back</button>
        <div style={{ fontSize: 17, fontWeight: 600, color: c.text }}>Settings</div>
      </div>

      <div style={{ flex: 1, padding: '0 16px 40px' }}>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: c.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 700, color: c.accentText, marginBottom: 8 }}>
            {initials}
          </div>
          <div style={{ fontSize: 13, color: c.textMuted }}>{user?.email}</div>
          {userData?.isPro && (
            <span style={{ marginTop: 6, background: c.accentBg, color: c.accentText, padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>Pro</span>
          )}
        </div>

        <Section title="Profile">
          <div style={{ padding: '13px 16px' }}>
            <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 6 }}>Display name</div>
            <input
              style={{ width: '100%', border: `0.5px solid ${c.inputBorder}`, borderRadius: 10, padding: '10px 12px', fontSize: 16, background: c.input, outline: 'none', fontFamily: 'inherit', color: c.text }}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
        </Section>

        <Section title="Notifications">
          <Row label="Push notifications">
            <button
              style={{ background: notifEnabled ? '#EAF3DE' : c.accent, color: notifEnabled ? '#3B6D11' : '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
              onClick={handleToggleNotif}
            >
              {notifEnabled ? 'Enabled ✓' : 'Enable'}
            </button>
          </Row>
          <Row label="Reminder time" last>
            <input
              type="time"
              style={{ border: `0.5px solid ${c.inputBorder}`, borderRadius: 8, padding: '6px 10px', fontSize: 14, background: c.input, outline: 'none', fontFamily: 'inherit', color: c.text }}
              value={notifTime}
              onChange={e => setNotifTime(e.target.value)}
            />
          </Row>
        </Section>

        <Section title="Appearance">
          <div style={{ padding: '13px 16px' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {THEME_OPTIONS.map(t => (
                <button key={t.value} style={{ flex: 1, padding: '9px 4px', borderRadius: 10, border: `1.5px solid ${currentTheme() === t.value ? c.accent : c.inputBorder}`, background: currentTheme() === t.value ? c.accentBg : 'transparent', color: currentTheme() === t.value ? c.accentText : c.textMuted, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }} onClick={() => setTheme(t.value)}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </Section>

        <Section title="Plan">
          <Row label="Current plan">
            <span style={{ fontSize: 13, color: c.text, fontWeight: 500 }}>{userData?.isPro ? 'Pro' : 'Free'}</span>
          </Row>
          {!userData?.isPro && (
            <Row label="Upgrade to Pro" last>
              <button style={{ background: c.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => alert('Contact us to upgrade to Pro.')}>
                Upgrade
              </button>
            </Row>
          )}
        </Section>

        <button
          style={{ width: '100%', background: 'none', border: `0.5px solid ${c.cardBorder}`, borderRadius: 14, padding: '13px', fontSize: 14, color: c.textMuted, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 12 }}
          onClick={() => { handleSaveProfile(); }}
        >
          {saved ? 'Saved ✓' : 'Save changes'}
        </button>

        <button
          style={{ width: '100%', background: 'none', border: `0.5px solid ${c.cardBorder}`, borderRadius: 14, padding: '13px', fontSize: 14, color: c.textMuted, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 12 }}
          onClick={onLogout}
        >
          Sign out
        </button>

        <button
          style={{ width: '100%', background: 'none', border: '0.5px solid #F09595', borderRadius: 14, padding: '13px', fontSize: 14, color: '#A32D2D', cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
          onClick={handleDeleteAccount}
          disabled={deleting}
        >
          {deleting ? 'Deleting...' : 'Delete account'}
        </button>

      </div>
    </div>
  )
}