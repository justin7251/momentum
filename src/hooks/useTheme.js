import { useState, useEffect } from 'react'

const getSystemDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches

function getInitialDark() {
  const saved = localStorage.getItem('theme')
  if (saved === 'dark') return true
  if (saved === 'light') return false
  return getSystemDark()
}

export function useTheme() {
  const [dark, setDark] = useState(getInitialDark)

  useEffect(() => {
    const handler = () => setDark(getInitialDark())
    window.addEventListener('theme-changed', handler)
    return () => window.removeEventListener('theme-changed', handler)
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = e => setDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const setTheme = (val) => {
    if (val === 'system') localStorage.removeItem('theme')
    else localStorage.setItem('theme', val)
    window.dispatchEvent(new Event('theme-changed'))
  }

  const currentTheme = () => localStorage.getItem('theme') || 'system'

  const c = {
    bg: dark ? '#0f0f14' : '#f5f6fa',
    card: dark ? '#1c1c24' : '#ffffff',
    cardBorder: dark ? '#2a2a38' : '#e8e6de',
    headerBg: dark ? 'linear-gradient(160deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)' : 'linear-gradient(160deg,#56CCF2 0%,#2F80ED 55%,#1a5fad 100%)',
    text: dark ? '#f0f0f0' : '#1a1a1a',
    textMuted: dark ? '#888' : '#666',
    textFaint: dark ? '#444' : '#bbb',
    input: dark ? '#232330' : '#fafaf8',
    inputBorder: dark ? '#333' : '#ddd',
    label: dark ? '#666' : '#999',
    accent: '#2F80ED',
    accentBg: dark ? '#1a2a4a' : '#e8f0fe',
    accentText: dark ? '#6BAAF5' : '#2F80ED',
    success: dark ? '#1a3a1a' : '#EAF3DE',
    successText: dark ? '#5fba5f' : '#3B6D11',
    danger: '#e53935',
    dangerBg: dark ? '#2a1a1a' : '#FCEBEB',
    streak: dark ? '#1e1e2a' : '#f5f4f0',
  }

  return { dark, setTheme, currentTheme, c }
}