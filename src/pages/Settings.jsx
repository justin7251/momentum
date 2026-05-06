import { useState, useEffect } from 'react'
import { useTheme } from '../hooks/useTheme'
import { doc, updateDoc, deleteDoc, collection, getDocs } from 'firebase/firestore'
import { db, auth } from '../firebase/config'
import { deleteUser } from 'firebase/auth'
import { requestPermission, disableNotifications } from '../hooks/useNotifications'

export default function Settings({ user, userData, onBack, onLogout }) {
  const { c, setTheme, currentTheme } = useTheme()
  const [name, setName] = useState(userData?.name || '')
  const [notifTime, setNotifTime] = useState(userData?.notifTime || localStorage.getItem('notifTime') || '20:00')
  const [notifEnabled, setNotifEnabled] = useState(Notification.permission === 'granted')
  const [saved, setSaved] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (userData?.notifTime) {
      setNotifTime(userData.notifTime)
      localStorage.setItem('notifTime', userData.notifTime)
    }
  }, [userData])

  const handleSave = async () => {
    await updateDoc(doc(db, 'users', user.uid), { name, notifTime })
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

  const handleDelete = async () => {
    if (!confirm('Delete all data permanently?')) return
    if (!confirm('Are you absolutely sure?')) return
    setDeleting(true)
    try {
      const goalsSnap = await getDocs(collection(db, 'users', user.uid, 'goals'))
      for (const g of goalsSnap.docs) await deleteDoc(doc(db, 'users', user.uid, 'goals', g.id))
      await deleteDoc(doc(db, 'users', user.uid))
      await deleteUser(auth.currentUser)
    } catch (e) {
      alert('Sign out and sign back in first, then try again.')
    }
    setDeleting(false)
  }

  const initials = name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : user?.email?.[0]?.toUpperCase() || '?'

  const Row = ({ label, children, last }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderBottom: last ? 'none' : `0.5px solid ${c.cardBorder}` }}>
      <div style={{ fontSize: 14, color: c.text, fontWeight: 600 }}>{label}</div>
      <div>{children}</div>
    </div>
  )

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: c.label, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8, paddingLeft: 4 }}>{title}</div>
      <div style={{ background: c.card, border: `0.5px solid ${c.cardBorder}`, borderRadius: 16, overflow: 'hidden' }}>{children}</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ background: c.headerBg, padding: '52px 20px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
          <button style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 10, padding: '6px 14px', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }} onClick={onBack}>← Back</button>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>Settings</div>
        </div>
      </div>

      <div style={{ flex: 1, padding: '24px 16px 40px', background: c.bg }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#2F80ED,#1a5fad)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 900, color: '#fff', marginBottom: 8 }}>{initials}</div>
          <div style={{ fontSize: 13, color: c.textMuted }}>{user?.email}</div>
          {userData?.isPro && <span style={{ marginTop: 6, background: c.accentBg, color: c.accentText, padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>Pro</span>}
        </div>

        <Section title="Profile">
          <div style={{ padding: '13px 16px' }}>
            <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 6, fontWeight: 600 }}>Display name</div>
            <input style={{ width: '100%', border: `0.5px solid ${c.inputBorder}`, borderRadius: 10, padding: '10px 12px', fontSize: 16, background: c.input, outline: 'none', fontFamily: 'inherit', color: c.text }} value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
          </div>
        </Section>

        <Section title="Notifications">
          <Row label="Push notifications">
            <button style={{ background: notifEnabled ? '#EAF3DE' : 'linear-gradient(135deg,#2F80ED,#1a5fad)', color: notifEnabled ? '#3B6D11' : '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }} onClick={handleToggleNotif}>
              {notifEnabled ? 'Enabled ✓' : 'Enable'}
            </button>
          </Row>
          <Row label="Reminder time" last>
            <input type="time" style={{ border: `0.5px solid ${c.inputBorder}`, borderRadius: 8, padding: '6px 10px', fontSize: 14, background: c.input, outline: 'none', fontFamily: 'inherit', color: c.text }} value={notifTime} onChange={e => setNotifTime(e.target.value)} />
          </Row>
        </Section>

        <Section title="Appearance">
          <div style={{ padding: '13px 16px', display: 'flex', gap: 8 }}>
            {['system', 'light', 'dark'].map(t => (
              <button key={t} style={{ flex: 1, padding: '9px 4px', borderRadius: 10, border: `1.5px solid ${currentTheme() === t ? c.accent : c.inputBorder}`, background: currentTheme() === t ? c.accentBg : 'transparent', color: currentTheme() === t ? c.accentText : c.textMuted, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' }} onClick={() => setTheme(t)}>
                {t}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Plan">
          <Row label="Current plan">
            <span style={{ fontSize: 13, fontWeight: 700, color: c.text }}>{userData?.isPro ? 'Pro' : 'Free'}</span>
          </Row>
          {!userData?.isPro && (
            <Row label="Upgrade to Pro" last>
              <button style={{ background: 'linear-gradient(135deg,#2F80ED,#1a5fad)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => alert('Contact us to upgrade.')}>Upgrade</button>
            </Row>
          )}
        </Section>

        <button style={{ width: '100%', background: 'linear-gradient(135deg,#2F80ED,#1a5fad)', color: '#fff', border: 'none', borderRadius: 14, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10, boxShadow: '0 4px 16px rgba(47,128,237,0.3)' }} onClick={handleSave}>
          {saved ? 'Saved ✓' : 'Save changes'}
        </button>
        <button style={{ width: '100%', background: 'none', border: `0.5px solid ${c.cardBorder}`, borderRadius: 14, padding: '13px', fontSize: 14, color: c.textMuted, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10 }} onClick={onLogout}>Sign out</button>
        <button style={{ width: '100%', background: 'none', border: '0.5px solid #e53935', borderRadius: 14, padding: '13px', fontSize: 14, color: '#e53935', cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }} onClick={handleDelete} disabled={deleting}>
          {deleting ? 'Deleting...' : 'Delete account'}
        </button>
      </div>
    </div>
  )
}