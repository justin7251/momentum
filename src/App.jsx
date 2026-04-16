import { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { useGoals } from './hooks/useGoal'
import { useUser } from './hooks/useUser'
import { requestPermission } from './hooks/useNotifications'
import { useOnlineStatus } from './hooks/useOnlineStatus'
import Login from './pages/Login'
import GoalList from './pages/GoalList'
import GoalDetail from './pages/GoalDetail'
import Onboarding from './pages/Onboarding'
import Settings from './pages/Settings'

export default function App() {
  const online = useOnlineStatus()
  const { user, login, logout } = useAuth()
  const userData = useUser(user?.uid)
  const goals = useGoals(user?.uid)
  const [selected, setSelected] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem('onboarded') === 'true')

  useEffect(() => {
    if (user) requestPermission(user.uid)
  }, [user])

  const handleOnboardDone = () => {
    localStorage.setItem('onboarded', 'true')
    setOnboarded(true)
  }

  if (user === undefined) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 14 }}>
      Loading...
    </div>
  )

  if (!user) return <Login onLogin={login} />

  if (!onboarded && goals !== undefined && goals.length === 0) return (
    <Onboarding uid={user.uid} onDone={handleOnboardDone} />
  )

  const content = (() => {
    if (showSettings) return (
      <Settings
        user={user}
        userData={userData}
        onBack={() => setShowSettings(false)}
        onLogout={logout}
      />
    )
    if (selected) return (
      <GoalDetail
        uid={user.uid}
        goal={selected}
        userData={userData}
        onBack={() => setSelected(null)}
      />
    )
    return (
      <GoalList
        uid={user.uid}
        goals={goals}
        onSelect={setSelected}
        onLogout={logout}
        onSettings={() => setShowSettings(true)}
      />
    )
  })()

  return (
    <>
      {!online && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
          background: '#854F0B', color: '#fff', textAlign: 'center',
          padding: '8px 16px', fontSize: 13, fontWeight: 500
        }}>
          Offline — changes will sync when you reconnect
        </div>
      )}
      {content}
    </>
  )
}