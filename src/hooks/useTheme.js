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
    if (val === 'system') {
      localStorage.removeItem('theme')
    } else {
      localStorage.setItem('theme', val)
    }
    window.dispatchEvent(new Event('theme-changed'))
  }

  const currentTheme = () => localStorage.getItem('theme') || 'system'

  return {
    dark, setTheme, currentTheme,
    c: {
      bg: dark ? '#111113' : '#f5f4f0',
      card: dark ? '#1c1c1f' : '#ffffff',
      cardBorder: dark ? '#2a2a2e' : '#e8e6de',
      text: dark ? '#f0f0f0' : '#1a1a1a',
      textMuted: dark ? '#888' : '#888',
      textFaint: dark ? '#555' : '#bbb',
      input: dark ? '#232326' : '#fafaf8',
      inputBorder: dark ? '#333' : '#ddd',
      label: '#888',
      accent: '#534AB7',
      accentBg: dark ? '#2a2860' : '#EEEDFE',
      accentText: dark ? '#a09cf5' : '#534AB7',
      streak: dark ? '#232326' : '#f5f4f0',
    }
  }
}