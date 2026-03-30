import { useState } from 'react'
import { useTheme } from '../hooks/useTheme'
import { addGoal } from '../firebase/db'

const TIMELINES = [
  { label: '2 weeks', desc: 'Intense sprint', weeks: 2 },
  { label: '1 month', desc: 'Focused push', weeks: 4 },
  { label: '3 months', desc: 'Steady progress', weeks: 12 },
  { label: '6 months', desc: 'Deep mastery', weeks: 24 },
]

const EMOJIS = ['🎯','📚','💪','🧠','🚀','🎨','💻','🌱','✍️','🎵']

export default function Onboarding({ uid, onDone }) {
  const { c } = useTheme()
  const [step, setStep] = useState(0)
  const [goal, setGoal] = useState('')
  const [why, setWhy] = useState('')
  const [timeline, setTimeline] = useState(null)
  const [emoji, setEmoji] = useState('🎯')
  const [loading, setLoading] = useState(false)

  const canNext = [
    goal.trim().length > 0,
    why.trim().length > 0,
    timeline !== null
  ]

  const handleFinish = async () => {
    setLoading(true)
    try {
      await addGoal(uid, { title: goal, desc: why, emoji, weeks: TIMELINES[timeline].weeks })
      setLoading(false)
      onDone()
    } catch(e) {
      console.error(e)
      setLoading(false)
    }
  }

  const s = {
    wrap: { minHeight: '100dvh', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto', padding: '0 20px' },
    top: { paddingTop: 48, marginBottom: 40 },
    step: { fontSize: 12, fontWeight: 600, color: c.accentText, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 },
    title: { fontSize: 24, fontWeight: 700, color: c.text, lineHeight: 1.2, marginBottom: 8 },
    sub: { fontSize: 14, color: c.textMuted, lineHeight: 1.6 },
    input: { width: '100%', border: `0.5px solid ${c.inputBorder}`, borderRadius: 12, padding: '14px 16px', fontSize: 16, background: c.input, outline: 'none', fontFamily: 'inherit', color: c.text, display: 'block' },
    btn: { width: '100%', background: c.accent, color: '#fff', border: 'none', borderRadius: 12, padding: '15px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
    btnDisabled: { width: '100%', background: c.inputBorder, color: c.textFaint, border: 'none', borderRadius: 12, padding: '15px', fontSize: 15, fontWeight: 600, cursor: 'not-allowed', fontFamily: 'inherit' },
    back: { background: 'none', border: 'none', fontSize: 14, color: c.textMuted, cursor: 'pointer', fontFamily: 'inherit', padding: '0 0 24px' },
    progress: { display: 'flex', gap: 6, marginBottom: 40 }
  }

  return (
    <div style={s.wrap}>
      <div style={s.top}>
        <div style={{ fontSize: 22, fontWeight: 700, color: c.accent, marginBottom: 32 }}>◆ Momentum</div>

        <div style={s.progress}>
          {[0,1,2].map(i => (
            <div key={i} style={{ height: 3, flex: 1, borderRadius: 99, background: i <= step ? c.accent : c.cardBorder, transition: 'background .3s' }} />
          ))}
        </div>

        {step === 0 && (
          <>
            <div style={s.step}>Step 1 of 3</div>
            <div style={s.title}>What do you want to achieve?</div>
            <div style={s.sub}>Be specific — a clear goal is easier to plan for.</div>
          </>
        )}
        {step === 1 && (
          <>
            <div style={s.step}>Step 2 of 3</div>
            <div style={s.title}>Why does this matter to you?</div>
            <div style={s.sub}>Your reason is what keeps you going when motivation drops.</div>
          </>
        )}
        {step === 2 && (
          <>
            <div style={s.step}>Step 3 of 3</div>
            <div style={s.title}>How long do you want to give it?</div>
            <div style={s.sub}>Pick a realistic timeline. You can always extend it later.</div>
          </>
        )}
      </div>

      <div style={{ flex: 1 }}>
        {step === 0 && (
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {EMOJIS.map(e => (
                <button key={e} style={{ width: 42, height: 42, borderRadius: 10, border: `1.5px solid ${emoji === e ? c.accent : c.inputBorder}`, background: emoji === e ? c.accentBg : 'transparent', fontSize: 20, cursor: 'pointer', transition: 'all .15s' }} onClick={() => setEmoji(e)}>
                  {e}
                </button>
              ))}
            </div>
            <input
              style={s.input}
              value={goal}
              onChange={e => setGoal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && canNext[0] && setStep(1)}
              placeholder="e.g. Learn AI and build a chatbot"
              autoFocus
            />
          </div>
        )}

        {step === 1 && (
          <textarea
            style={{ ...s.input, resize: 'none', lineHeight: 1.6, minHeight: 120 }}
            value={why}
            onChange={e => setWhy(e.target.value)}
            placeholder="e.g. I want to switch into a tech role within the year and AI skills will give me an edge..."
            autoFocus
          />
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {TIMELINES.map((t, i) => (
              <div key={i} style={{ background: timeline === i ? c.accentBg : c.card, border: `1.5px solid ${timeline === i ? c.accent : c.cardBorder}`, borderRadius: 12, padding: '14px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all .15s' }} onClick={() => setTimeline(i)}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: timeline === i ? c.accentText : c.text }}>{t.label}</div>
                  <div style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>{t.desc}</div>
                </div>
                <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${timeline === i ? c.accent : c.inputBorder}`, background: timeline === i ? c.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {timeline === i && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '24px 0 40px' }}>
        {step > 0 && (
          <button style={s.back} onClick={() => setStep(step - 1)}>← Back</button>
        )}
        {step < 2 ? (
          <button style={canNext[step] ? s.btn : s.btnDisabled} onClick={() => canNext[step] && setStep(step + 1)} disabled={!canNext[step]}>
            Continue →
          </button>
        ) : (
          <button style={timeline === null || loading ? s.btnDisabled : s.btn} onClick={handleFinish} disabled={timeline === null || loading}>
            {loading ? 'Setting up...' : "Let's go →"}
          </button>
        )}
      </div>
    </div>
  )
}