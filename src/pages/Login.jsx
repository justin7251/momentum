export default function Login({ onLogin }) {
  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.icon}>◆</div>
        <h1 style={styles.title}>Momentum</h1>
        <p style={styles.sub}>Daily goals. Small steps. Real progress.</p>
        <button style={styles.btn} onClick={onLogin}>
          <img src="https://www.google.com/favicon.ico" width={16} height={16} style={{ borderRadius: 2 }} />
          Sign in with Google
        </button>
      </div>
    </div>
  )
}

const styles = {
  wrap: { minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { background: '#fff', border: '0.5px solid #e8e6de', borderRadius: 16, padding: '40px 32px', textAlign: 'center', width: '100%', maxWidth: 340 },
  icon: { fontSize: 32, color: '#534AB7', marginBottom: 12 },
  title: { fontSize: 26, fontWeight: 600, marginBottom: 6 },
  sub: { fontSize: 14, color: '#888', marginBottom: 32, lineHeight: 1.5 },
  btn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', padding: '12px 20px', background: '#fff', border: '0.5px solid #ddd', borderRadius: 10, fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }
}