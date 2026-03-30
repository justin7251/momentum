import { useState, useEffect } from 'react'
import { listenGoals, listenTasks, listenCheckins, listenProjects, updateTask } from '../firebase/db'

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
    return listenTasks(uid, goalId, async (incoming) => {
      const today = new Date().toISOString().split('T')[0]
      const resets = []

      for (const task of incoming) {
        if (!task.recur || !task.done) continue
        const lastDone = task.lastDone || ''
        const shouldReset =
          (task.recur === 'daily' && lastDone !== today) ||
          (task.recur === 'weekly' && Math.floor((Date.now() - new Date(lastDone).getTime()) / (1000 * 60 * 60 * 24)) >= 7)
        if (shouldReset) resets.push(task.id)
      }

      if (resets.length > 0) {
        await Promise.all(resets.map(id => updateTask(uid, goalId, id, { done: false })))
      }

      setTasks(incoming)
    })
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

export function useProjects(uid, goalId) {
  const [projects, setProjects] = useState([])
  useEffect(() => {
    if (!uid || !goalId) return
    return listenProjects(uid, goalId, setProjects)
  }, [uid, goalId])
  return projects
}

export function useGoalProgress(uid, goalId) {
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  useEffect(() => {
    if (!uid || !goalId) return
    return listenTasks(uid, goalId, (tasks) => {
      setProgress({
        done: tasks.filter(t => t.done).length,
        total: tasks.length
      })
    })
  }, [uid, goalId])
  return progress
}