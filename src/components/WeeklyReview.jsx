import { useState } from 'react'
import { useTheme } from '../hooks/useTheme'
import { generateWeeklyReview } from '../hooks/useAI'

const RATING_COLORS = {
  'Good': { bg: '#EAF3DE', text: '#3B6D11', border: '#C0DD97' },
  'OK': { bg: '#FAEEDA', text: '#854F0B', border: '#FAC775' },
  'Needs work': { bg: '#FCEBEB', text: '#A32D2D', border: '#F7C1C1' }
}

export default function WeeklyReview({ goal, tasks, checkins, streak }) {
  const { c } = useTheme()
  const [review, setReview] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const r = await generateWeeklyReview(goal, tasks, checkins, streak)
      setReview(r)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  if (!review) return (
    <div>
      <div style={{ fontSize: 13, color: c.textMuted, marginBottom: 14, lineHeight: 1.6 }}>
        Get an honest AI review of your week — what went well, what to improve, and a specific focus for next week.
      </div>
      <button
        style={{ width: '100%', background: loading ? c.textFaint : c.accent, color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
        onClick={handleGenerate}
        disabled={loading}
      >
        {loading ? 'Analysing your week...' : 'Generate weekly review ✦'}
      </button>
    </div>
  )

  const ratingStyle = RATING_COLORS[review.rating] || RATING_COLORS['OK']

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: c.text }}>Weekly review</div>
        <span style={{ background: ratingStyle.bg, color: ratingStyle.text, border: `0.5px solid ${ratingStyle.border}`, padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
          {review.rating}
        </span>
      </div>

      <div style={{ fontSize: 13, color: c.textMuted, lineHeight: 1.6, marginBottom: 16, padding: '12px 14px', background: c.streak, borderRadius: 10 }}>
        {review.summary}
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 10, padding: '10px 12px', background: '#EAF3DE', borderRadius: 10, marginBottom: 8 }}>
          <div style={{ fontSize: 16, flexShrink: 0 }}>✓</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#3B6D11', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>Went well</div>
            <div style={{ fontSize: 13, color: '#3B6D11', lineHeight: 1.5 }}>{review.wentWell}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, padding: '10px 12px', background: '#FCEBEB', borderRadius: 10, marginBottom: 8 }}>
          <div style={{ fontSize: 16, flexShrink: 0 }}>↑</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#A32D2D', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>Improve</div>
            <div style={{ fontSize: 13, color: '#A32D2D', lineHeight: 1.5 }}>{review.improve}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, padding: '10px 12px', background: c.accentBg, borderRadius: 10 }}>
          <div style={{ fontSize: 16, flexShrink: 0 }}>→</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: c.accentText, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>Next week focus</div>
            <div style={{ fontSize: 13, color: c.accentText, lineHeight: 1.5 }}>{review.nextWeekFocus}</div>
          </div>
        </div>
      </div>

      <div style={{ fontSize: 13, color: c.textMuted, lineHeight: 1.6, fontStyle: 'italic', textAlign: 'center', padding: '10px 0' }}>
        {review.encouragement}
      </div>

      <button
        style={{ width: '100%', background: 'none', color: c.textMuted, border: `0.5px solid ${c.cardBorder}`, borderRadius: 8, padding: '9px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', marginTop: 8 }}
        onClick={() => { setReview(null) }}
      >
        Generate new review
      </button>
    </div>
  )
}