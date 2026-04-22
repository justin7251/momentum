import { db } from './config'
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, onSnapshot, serverTimestamp,
  getDoc, setDoc, getDocs
} from 'firebase/firestore'

export const goalsRef = (uid) => collection(db, 'users', uid, 'goals')
export const tasksRef = (uid, goalId) => collection(db, 'users', uid, 'goals', goalId, 'tasks')
export const checkinsRef = (uid, goalId) => collection(db, 'users', uid, 'goals', goalId, 'checkins')

export const addGoal = (uid, data) => addDoc(goalsRef(uid), { ...data, createdAt: serverTimestamp() })
export const addTask = (uid, goalId, data) => addDoc(tasksRef(uid, goalId), { ...data, done: false, createdAt: serverTimestamp() })
export const updateTask = (uid, goalId, taskId, data) => updateDoc(doc(db, 'users', uid, 'goals', goalId, 'tasks', taskId), data)
export const completeTask = (uid, goalId, taskId, extraFields = {}) =>
  updateDoc(doc(db, 'users', uid, 'goals', goalId, 'tasks', taskId), {
    done: true,
    completedAt: serverTimestamp(),
    ...extraFields
  })

export const uncompleteTask = (uid, goalId, taskId) =>
  updateDoc(doc(db, 'users', uid, 'goals', goalId, 'tasks', taskId), {
    done: false,
    completedAt: null
  })
export const deleteTask = (uid, goalId, taskId) => deleteDoc(doc(db, 'users', uid, 'goals', goalId, 'tasks', taskId))
export const addCheckin = async (uid, goalId, data) => {
  const ref = await addDoc(checkinsRef(uid, goalId), { ...data, createdAt: serverTimestamp() })

  const weekStart = getWeekStart()
  const moodAggRef = doc(db, 'users', uid, 'goals', goalId, 'moodAggregates', weekStart)
  const snap = await getDoc(moodAggRef)

  if (snap.exists()) {
    const existing = snap.data()
    const newCount = existing.count + 1
    const newAvg = ((existing.avgMood * existing.count) + data.mood) / newCount
    await updateDoc(moodAggRef, {
      count: newCount,
      avgMood: Math.round(newAvg * 10) / 10,
      moods: [...(existing.moods || []), { date: data.date, mood: data.mood }],
      updatedAt: serverTimestamp()
    })
  } else {
    await setDoc(moodAggRef, {
      weekStart,
      count: 1,
      avgMood: data.mood,
      moods: [{ date: data.date, mood: data.mood }],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  }

  return ref
}

function getWeekStart() {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}
export const projectsRef = (uid, goalId) => collection(db, 'users', uid, 'goals', goalId, 'projects')
export const addProject = (uid, goalId, data) => addDoc(projectsRef(uid, goalId), { ...data, done: false, createdAt: serverTimestamp() })
export const updateProject = (uid, goalId, projectId, data) => updateDoc(doc(db, 'users', uid, 'goals', goalId, 'projects', projectId), data)
export const deleteProject = (uid, goalId, projectId) => deleteDoc(doc(db, 'users', uid, 'goals', goalId, 'projects', projectId))
export const listenProjects = (uid, goalId, cb) =>
  onSnapshot(query(projectsRef(uid, goalId), orderBy('createdAt', 'desc')), snap =>
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))))

export const listenGoals = (uid, cb) =>
  onSnapshot(query(goalsRef(uid), orderBy('createdAt', 'desc')), snap =>
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(g => !g.archived)))

export const listenTasks = (uid, goalId, cb) =>
  onSnapshot(query(tasksRef(uid, goalId), orderBy('createdAt', 'asc')), snap =>
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))))

export const listenCheckins = (uid, goalId, cb) =>
  onSnapshot(query(checkinsRef(uid, goalId), orderBy('createdAt', 'desc')), snap =>
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))))

export const rescheduleTask = (uid, goalId, taskId, data) =>
  updateDoc(doc(db, 'users', uid, 'goals', goalId, 'tasks', taskId), data)

export const archiveGoal = (uid, goalId) =>
  updateDoc(doc(db, 'users', uid, 'goals', goalId), { archived: true })

export const unarchiveGoal = (uid, goalId) =>
  updateDoc(doc(db, 'users', uid, 'goals', goalId), { archived: false })

export const chatRef = (uid, goalId) => doc(db, 'users', uid, 'goals', goalId, 'chat', 'history')
export const getChat = (uid, goalId) => getDoc(chatRef(uid, goalId))
export const saveChat = (uid, goalId, messages, summary = null) =>
  setDoc(chatRef(uid, goalId), { messages, summary, updatedAt: serverTimestamp() })

export const savePushSubscription = (uid, subscription) =>
  setDoc(doc(db, 'pushSubscriptions', uid), {
    subscription: JSON.parse(JSON.stringify(subscription)),
    uid,
    updatedAt: serverTimestamp()
  })

export const removePushSubscription = (uid) =>
  deleteDoc(doc(db, 'pushSubscriptions', uid))

export const autoCheckin = async (uid, goalId) => {
  const today = new Date().toISOString().split('T')[0]
  const ref = collection(db, 'users', uid, 'goals', goalId, 'checkins')
  const q = query(ref, where('date', '==', today))
  const snap = await getDocs(q)
  if (!snap.empty) return
  await addDoc(ref, {
    date: today,
    mood: 2,
    moodEmoji: '🙂',
    moodLabel: 'OK',
    what: 'Completed a task',
    blocker: '',
    auto: true,
    createdAt: serverTimestamp()
  })
}

export const memoryRef = (uid) => doc(db, 'users', uid, 'coaching', 'memory')
export const getMemory = (uid) => getDoc(memoryRef(uid))
export const saveMemory = (uid, memory) => setDoc(memoryRef(uid), memory)