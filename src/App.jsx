import { useAuth } from './hooks/useAuth'
import { useGoals } from './hooks/useGoal'
import Login from './pages/Login'
import GoalList from './pages/GoalList'
import GoalDetail from './pages/GoalDetail'
import { useState } from 'react'

export default function App() {
  const { user, login, logout } = useAuth()
  const goals = useGoals(user?.uid)
  const [selected, setSelected] = useState(null)

  if (user === undefined) return <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 14 }}>Loading...</div>

  if (!user) return <Login onLogin={login} />

  if (selected) return <GoalDetail uid={user.uid} goal={selected} onBack={() => setSelected(null)} />

  return <GoalList uid={user.uid} goals={goals} onSelect={setSelected} onLogout={logout} />
}