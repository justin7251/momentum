import { useState, useEffect } from 'react'

export function useTheme() {
  const [dark, setDark] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = e => setDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return {
    dark,
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