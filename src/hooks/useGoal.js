import { useState, useEffect } from 'react'
import { listenGoals, listenTasks, listenCheckins } from '../firebase/db'

export function useGoals(uid) {
  const [goals, setGoals] = useState([])
  useEffect(() => {
    if (!uid) return
    return listenGoals(uid, setGoals)
  }, [uid])
  return goals
}

export function useTasks(uid, goalId) {
  const [tasks, setTasks] = useState([])
  useEffect(() => {
    if (!uid || !goalId) return
    return listenTasks(uid, goalId, setTasks)
  }, [uid, goalId])
  return tasks
}

export function useCheckins(uid, goalId) {
  const [checkins, setCheckins] = useState([])
  useEffect(() => {
    if (!uid || !goalId) return
    return listenCheckins(uid, goalId, setCheckins)
  }, [uid, goalId])
  return checkins
}