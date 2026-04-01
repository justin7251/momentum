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

export async function generateTasks(goal, userPrompt = '') {
  const prompt = `You are a productivity coach.
Goal: "${goal.title}".${goal.desc ? ` Why it matters: "${goal.desc}".` : ''}${goal.weeks ? ` Timeline: ${goal.weeks} weeks.` : ''}
${userPrompt ? `User wants tasks focused on: "${userPrompt}".` : ''}

Generate exactly 7 specific tasks. Return ONLY valid JSON, no markdown:
{"tasks":[{"text":"specific task","estimatedMins":30,"day":"Mon"}]}

Rules:
- Each task must name a specific resource, tool, or action
- Bad: "Study grammar" — Good: "Complete Duolingo lesson 1 and write 5 example sentences"
- Spread across Mon-Sun, one task per day
- estimatedMins between 20-45
- Order from easiest to hardest
- Tasks must be completable in one sitting`

  const resp = await callAI(prompt)
  return parseJSON(resp)
}

export async function breakdownProject(title, goal) {
  const prompt = `You are a productivity coach. 
Goal: "${goal.title}". Project task: "${title}".

Break this project into 5-8 specific sub-tasks. Return ONLY valid JSON, no markdown:
{"subtasks":[{"text":"specific sub-task"}]}

Rules:
- Sub-tasks must be very specific and actionable
- Order them logically from first to last
- Each sub-task should take 15-60 minutes`

  const resp = await callAI(prompt)
  return parseJSON(resp)
}

export async function chat(messages, goal, checkins, tasks) {
  const context = `You are a dedicated productivity coach inside the Momentum app. You have memory of all past conversations with this user about their goal.

Goal: "${goal.title}".${goal.desc ? ` Context: "${goal.desc}".` : ''}
Tasks done: ${tasks.filter(t => t.done).length}/${tasks.length}.
Recent check-ins: ${checkins.slice(0, 5).map(c => `${c.date}: ${c.moodLabel}${c.what ? ` — ${c.what}` : ''}${c.blocker ? ` (blocker: ${c.blocker})` : ''}`).join('\n') || 'none'}.

Use the conversation history below to give contextual, personalised responses. Reference past conversations when relevant. Be concise, warm, and direct. Max 3 sentences unless the user asks for more detail.`

  const history = messages
    .slice(-20)
    .map(m => `${m.role === 'user' ? 'User' : 'Coach'}: ${m.text}`)
    .join('\n')

  const resp = await callAI(`${context}\n\nConversation history:\n${history}\n\nCoach:`)
  return resp.trim()
}

export async function generateRescueTask(goal, streak, checkins) {
  const prompt = `User goal: "${goal.title}". They missed a check-in and their ${streak} day streak is at risk.
Recent mood: ${checkins[0]?.moodLabel || 'unknown'}.

Generate ONE very easy rescue task they can do RIGHT NOW in under 15 minutes to save their streak.
Return ONLY valid JSON: {"task":"specific task under 10 words","estimatedMins":10,"encouragement":"one motivating sentence"}`

  const resp = await callAI(prompt)
  return parseJSON(resp)
}

export async function summariseChat(messages) {
  const history = messages.map(m => `${m.role === 'user' ? 'User' : 'Coach'}: ${m.text}`).join('\n')
  const prompt = `Summarise this coaching conversation in 3-5 bullet points. Focus on: what the user is working on, key challenges mentioned, advice given, and any commitments made. Be concise.

Conversation:
${history}

Return ONLY a plain text summary, no JSON, no markdown headers.`

  const resp = await callAI(prompt)
  return resp.trim()
}