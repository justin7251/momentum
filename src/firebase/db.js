import { db } from './config'
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, onSnapshot, serverTimestamp
} from 'firebase/firestore'

export const goalsRef = (uid) => collection(db, 'users', uid, 'goals')
export const tasksRef = (uid, goalId) => collection(db, 'users', uid, 'goals', goalId, 'tasks')
export const checkinsRef = (uid, goalId) => collection(db, 'users', uid, 'goals', goalId, 'checkins')

export const addGoal = (uid, data) => addDoc(goalsRef(uid), { ...data, createdAt: serverTimestamp() })
export const addTask = (uid, goalId, data) => addDoc(tasksRef(uid, goalId), { ...data, done: false, createdAt: serverTimestamp() })
export const updateTask = (uid, goalId, taskId, data) => updateDoc(doc(db, 'users', uid, 'goals', goalId, 'tasks', taskId), data)
export const deleteTask = (uid, goalId, taskId) => deleteDoc(doc(db, 'users', uid, 'goals', goalId, 'tasks', taskId))
export const addCheckin = (uid, goalId, data) => addDoc(checkinsRef(uid, goalId), { ...data, createdAt: serverTimestamp() })

export const listenGoals = (uid, cb) =>
  onSnapshot(query(goalsRef(uid), orderBy('createdAt', 'desc')), snap =>
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))))

export const listenTasks = (uid, goalId, cb) =>
  onSnapshot(query(tasksRef(uid, goalId), orderBy('createdAt', 'asc')), snap =>
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))))

export const listenCheckins = (uid, goalId, cb) =>
  onSnapshot(query(checkinsRef(uid, goalId), orderBy('createdAt', 'desc')), snap =>
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))))