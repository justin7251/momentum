import { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { useGoals } from './hooks/useGoal'
import { useUser } from './hooks/useUser'
import { requestPermission } from './hooks/useNotifications'
import Login from './pages/Login'
import GoalList from './pages/GoalList'
import GoalDetail from './pages/GoalDetail'
import Onboarding from './pages/Onboarding'

export default function App() {
  const { user, login, logout } = useAuth()
  const userData = useUser(user?.uid)
  const goals = useGoals(user?.uid)
  const [selected, setSelected] = useState(null)
  const [onboarded, setOnboarded] = useState(false)

  useEffect(() => {
    if (user) requestPermission()
  }, [user])

  if (user === undefined) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 14 }}>
      Loading...
    </div>
  )

  if (!user) return <Login onLogin={login} />

  if (goals !== undefined && goals.length === 0 && !onboarded) return (
    <Onboarding uid={user.uid} onDone={() => setOnboarded(true)} />
  )

  if (selected) return (
    <GoalDetail
      uid={user.uid}
      goal={selected}
      userData={userData}
      onBack={() => setSelected(null)}
    />
  )

  return <GoalList uid={user.uid} goals={goals} onSelect={setSelected} onLogout={logout} />
}