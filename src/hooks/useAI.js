async function callClaude(prompt) {
  const r = await fetch('/api/generate-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  })
  const d = await r.json()
  return d.text || ''
}

export async function generateWeeklyPlan(goal, weekNum, checkins) {
  const recentMoods = checkins.slice(0, 5).map(c => c.moodLabel).join(', ')
  const prompt = `You are a productivity coach. User goal: "${goal.title}". ${goal.desc ? `Context: "${goal.desc}".` : ''}
Week number: ${weekNum}. Recent moods: ${recentMoods || 'none yet'}.

Generate a 7-day weekly plan. Return ONLY valid JSON, no markdown:
{"weekTheme":"short theme","days":[{"day":"Mon","task":"very specific actionable task under 15 words","estimatedMins":30}]}

Rules:
- All 7 days included (Mon-Sun)
- Tasks must be VERY specific, not generic
- Difficulty matches week number (harder each week)
- If recent moods are low, make tasks shorter and easier
- estimatedMins between 15-60`

  const resp = await callClaude(prompt)
  const clean = resp.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

export async function autoAdjustPlan(goal, plan, checkins) {
  const recent = checkins.slice(0, 3)
  if (recent.length < 2) return null

  const avgMood = recent.reduce((s, c) => s + c.mood, 0) / recent.length
  if (avgMood > 2) return null

  const prompt = `User goal: "${goal.title}". Current week theme: "${plan.weekTheme}".
Current tasks: ${JSON.stringify(plan.days.map(d => d.task))}.
Recent moods (0=Hard, 4=Great): ${recent.map(c => c.mood).join(', ')}.
User is struggling. Simplify the remaining tasks. Return ONLY valid JSON:
{"weekTheme":"${plan.weekTheme}","days":[{"day":"Mon","task":"simpler task","estimatedMins":20}],"adjustNote":"one sentence why adjusted"}`

  const resp = await callClaude(prompt)
  const clean = resp.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}