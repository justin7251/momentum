async function callAI(prompt) {
  const r = await fetch('/api/generate-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  })
  const d = await r.json()
  if (!r.ok) throw new Error(d.error || 'API error')
  return d.text || ''
}

function parseJSON(text) {
  const clean = text.replace(/```json/g, '').replace(/```/g, '').trim()
  const start = clean.indexOf('{')
  const end = clean.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON found in response')
  return JSON.parse(clean.slice(start, end + 1))
}

export async function generateWeeklyPlan(goal, weekNum, checkins) {
  const recentMoods = checkins.slice(0, 5).map(c => c.moodLabel).join(', ')
  const prompt = `You are a productivity coach. User goal: "${goal.title}".${goal.desc ? ` Context: "${goal.desc}".` : ''}
Week number: ${weekNum}. Recent moods: ${recentMoods || 'none yet'}.

Return ONLY a valid JSON object, no markdown, no explanation:
{"weekTheme":"short theme name","days":[{"day":"Mon","task":"very specific actionable task under 15 words","estimatedMins":30},{"day":"Tue","task":"...","estimatedMins":25},{"day":"Wed","task":"...","estimatedMins":30},{"day":"Thu","task":"...","estimatedMins":20},{"day":"Fri","task":"...","estimatedMins":30},{"day":"Sat","task":"...","estimatedMins":25},{"day":"Sun","task":"...","estimatedMins":20}]}

Rules:
- Include all 7 days Mon through Sun
- Tasks must be very specific and actionable
- Difficulty increases with week number
- If recent moods are low, make tasks shorter and simpler
- estimatedMins between 15 and 60`

  const resp = await callAI(prompt)
  return parseJSON(resp)
}

export async function generateWeeklyReview(goal, tasks, checkins, streak) {
  const totalTasks = tasks.length
  const doneTasks = tasks.filter(t => t.done).length
  const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
  const moodSummary = checkins.slice(0, 7).map(c => `${c.date}: ${c.moodLabel}${c.what ? ` — ${c.what}` : ''}${c.blocker ? ` (blocker: ${c.blocker})` : ''}`).join('\n')

  const prompt = `You are an honest productivity coach reviewing someone's week.

Goal: "${goal.title}"${goal.desc ? `. Context: "${goal.desc}"` : ''}.
Tasks completed: ${doneTasks}/${totalTasks} (${pct}%).
Current streak: ${streak} days.
Check-ins this week:
${moodSummary || 'No check-ins this week.'}

Write a weekly review in exactly this JSON format, no markdown, no extra text:
{"rating":"Good|OK|Needs work","summary":"2 sentences on overall week performance","wentWell":"1 specific thing that went well","improve":"1 specific thing to improve","nextWeekFocus":"one concrete actionable focus for next week","encouragement":"one short motivating closing sentence"}`

  const resp = await callAI(prompt)
  return parseJSON(resp)
}

export async function autoAdjustPlan(goal, plan, checkins) {
  const recentMoods = checkins.slice(0, 3).map(c => c.moodLabel).join(', ') || 'none yet'
  const prompt = `User goal: "${goal.title}". Current week theme: "${plan.weekTheme}".
Current tasks: ${JSON.stringify(plan.days.map(d => d.task))}.
Recent moods: ${recentMoods}.
Simplify and adjust the plan to be more achievable.

Return ONLY a valid JSON object, no markdown, no explanation:
{"weekTheme":"${plan.weekTheme}","days":[{"day":"Mon","task":"simpler specific task","estimatedMins":20},{"day":"Tue","task":"...","estimatedMins":15},{"day":"Wed","task":"...","estimatedMins":20},{"day":"Thu","task":"...","estimatedMins":15},{"day":"Fri","task":"...","estimatedMins":20},{"day":"Sat","task":"...","estimatedMins":15},{"day":"Sun","task":"...","estimatedMins":15}],"adjustNote":"one sentence explaining why tasks were simplified"}`

  const resp = await callAI(prompt)
  return parseJSON(resp)
}