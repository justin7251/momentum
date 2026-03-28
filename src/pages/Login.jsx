import { useTheme } from '../hooks/useTheme'

export default function Login({ onLogin }) {
  const { c } = useTheme()
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: c.bg }}>
      <div style={{ background: c.card, border: `0.5px solid ${c.cardBorder}`, borderRadius: 16, padding: '40px 32px', textAlign: 'center', width: '100%', maxWidth: 340 }}>
        <div style={{ fontSize: 32, color: c.accent, marginBottom: 12 }}>◆</div>
        <h1 style={{ fontSize: 26, fontWeight: 600, marginBottom: 6, color: c.text }}>Momentum</h1>
        <p style={{ fontSize: 14, color: c.textMuted, marginBottom: 32, lineHeight: 1.5 }}>Daily goals. Small steps. Real progress.</p>
        <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', padding: '12px 20px', background: c.card, border: `0.5px solid ${c.cardBorder}`, borderRadius: 10, fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', color: c.text }} onClick={onLogin}>
          <span style={{ fontSize: 16 }}>G</span>
          Sign in with Google
        </button>
      </div>
    </div>
  )
}