const MINDSET = `You coach using these proven principles:
1. Three-Wins Rule: Every recommendation must benefit the user, advance their goal, AND produce a measurable result. Never suggest effort with no return.
2. Valley vs Dead End: Distinguish between hard-but-progressing (encourage) and fundamentally broken (challenge to pivot). Grit alone does not fix a broken system.
3. Accumulable Assets: Push toward skills and habits that compound over time, not one-off tasks that reset to zero.
4. Trend + People + Return: When advising, consider — is this gaining momentum? Who can help? Is it actually working?
5. High Resilience Trap: If someone has been stuck for weeks with no progress, challenge them directly. High tolerance for stagnation is a liability, not a virtue.`

const COACHING_STYLE = `Be direct, warm, and specific. No generic motivation. No fluff. Challenge comfortable stagnation. Celebrate real wins. Reference past context when relevant.`

async function callAI(prompt, tools = []) {
  const r = await fetch('/api/generate-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, tools })
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

function detectTools(message) {
  const tools = []
  if (/find|search|resource|tutorial|article|how to|recommend|best|latest|news|learn|guide/i.test(message)) {
    tools.push('search_web')
  }
  if (/today|date|day|schedule|when|deadline|time|week|month/i.test(message)) {
    tools.push('get_current_date')
  }
  if (/calculate|how many|how much|percent|hours|minutes|days|math|\d+\s*[\+\-\*\/]/i.test(message)) {
    tools.push('calculate')
  }
  return tools
}

function formatMemoryForPrompt(memory) {
  if (!memory) return ''
  const lines = []
  if (memory.profile?.name) lines.push(`Name: ${memory.profile.name}`)
  if (memory.profile?.motivationStyle) lines.push(`Motivation style: ${memory.profile.motivationStyle}`)
  if (memory.profile?.communicationStyle) lines.push(`Communication style: ${memory.profile.communicationStyle}`)
  if (memory.goals?.length) {
    lines.push(`Goals: ${memory.goals.map(g => `${g.title} (${g.status})${g.progress ? ' — ' + g.progress : ''}${g.blockers?.length ? ', blockers: ' + g.blockers.join(', ') : ''}`).join('; ')}`)
  }
  if (memory.patterns?.strengths?.length) lines.push(`Strengths: ${memory.patterns.strengths.join(', ')}`)
  if (memory.patterns?.struggles?.length) lines.push(`Struggles: ${memory.patterns.struggles.join(', ')}`)
  if (memory.patterns?.whatWorks?.length) lines.push(`What works: ${memory.patterns.whatWorks.join(', ')}`)
  if (memory.patterns?.whatDoesnt?.length) lines.push(`What doesn't work: ${memory.patterns.whatDoesnt.join(', ')}`)
  if (memory.recentWins?.length) {
    lines.push(`Recent wins: ${memory.recentWins.slice(0, 3).map(w => `${w.description} (${w.date})`).join(', ')}`)
  }
  if (memory.openLoops?.length) lines.push(`Open loops (follow up on these): ${memory.openLoops.join('; ')}`)
  if (memory.sessionHistory?.length) {
    const last = memory.sessionHistory[memory.sessionHistory.length - 1]
    lines.push(`Last session (${last.date}): ${last.summary}${last.commitments?.length ? ' — commitments: ' + last.commitments.join(', ') : ''}`)
  }
  return lines.join('\n')
}

export function defaultMemory(uid) {
  return {
    userId: uid,
    lastUpdated: new Date().toISOString(),
    profile: { name: '', motivationStyle: '', communicationStyle: '' },
    goals: [],
    patterns: { strengths: [], struggles: [], whatWorks: [], whatDoesnt: [] },
    recentWins: [],
    openLoops: [],
    sessionHistory: []
  }
}

export async function generateWeeklyPlan(goal, weekNum, checkins) {
  const recentMoods = checkins.slice(0, 5).map(c => c.moodLabel).join(', ')
  const moodTrend = checkins.slice(0, 3).every(c => c.mood <= 1) ? 'consistently low — simplify tasks' : 'acceptable'

  const prompt = `You are a productivity coach building a weekly plan.

Goal: "${goal.title}"${goal.desc ? `. Why it matters: "${goal.desc}"` : ''}.
Week: ${weekNum}. Recent moods: ${recentMoods || 'none yet'} (trend: ${moodTrend}).

Return ONLY valid JSON, no markdown:
{"weekTheme":"short motivating theme","days":[{"day":"Mon","task":"specific actionable task naming exact resource or action","estimatedMins":30},{"day":"Tue","task":"...","estimatedMins":25},{"day":"Wed","task":"...","estimatedMins":30},{"day":"Thu","task":"...","estimatedMins":20},{"day":"Fri","task":"...","estimatedMins":30},{"day":"Sat","task":"...","estimatedMins":25},{"day":"Sun","task":"...","estimatedMins":20}]}

Rules:
- All 7 days Mon-Sun
- Each task names a specific resource, tool, or action
- Bad: "Practice speaking" — Good: "Record a 2-min voice memo and replay it"
- Difficulty ramps with week number
- If mood trend is low: tasks under 20 min
- estimatedMins between 15-60`

  const raw = await callAI(prompt)
  const draft = parseJSON(raw)

  const criteria = `
- every task must name a specific resource, tool, or measurable action
- no vague verbs like "study", "practice", "review" without saying exactly what
- tasks should get harder from Mon to Sun
- estimatedMins should be realistic for the task described
- weekTheme should reflect the actual skill being built, not generic motivation`

  const improved = await reflectAndImprove(draft, criteria, 2)
  return typeof improved === 'string' ? parseJSON(improved) : improved
}

export async function autoAdjustPlan(goal, plan, checkins) {
  const recentMoods = checkins.slice(0, 3).map(c => `${c.moodLabel}${c.blocker ? ' (blocker: ' + c.blocker + ')' : ''}`).join(', ') || 'none'

  const prompt = `You are a productivity coach adjusting a plan because the user is struggling.

Goal: "${goal.title}". Week theme: "${plan.weekTheme}".
Current tasks: ${JSON.stringify(plan.days.map(d => d.task))}.
Recent moods: ${recentMoods}.

Apply the Valley vs Dead End principle: if they're in a valley, simplify tasks to rebuild momentum. Keep the goal direction but reduce resistance.

Return ONLY valid JSON, no markdown:
{"weekTheme":"${plan.weekTheme}","days":[{"day":"Mon","task":"easier specific task","estimatedMins":15},{"day":"Tue","task":"...","estimatedMins":15},{"day":"Wed","task":"...","estimatedMins":20},{"day":"Thu","task":"...","estimatedMins":15},{"day":"Fri","task":"...","estimatedMins":20},{"day":"Sat","task":"...","estimatedMins":15},{"day":"Sun","task":"...","estimatedMins":15}],"adjustNote":"one sentence explaining the adjustment using Valley/Dead End framing"}`

  const resp = await callAI(prompt)
  return parseJSON(resp)
}

export async function generateWeeklyReview(goal, tasks, checkins, streak) {
  const totalTasks = tasks.length
  const doneTasks = tasks.filter(t => t.done).length
  const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
  const moodSummary = checkins.slice(0, 7).map(c =>
    `${c.date}: ${c.moodLabel}${c.what ? ' — ' + c.what : ''}${c.blocker ? ' (blocker: ' + c.blocker + ')' : ''}`
  ).join('\n')

  const prompt = `You are an honest productivity coach giving a weekly review. Be direct — no generic praise.

Goal: "${goal.title}"${goal.desc ? `. Context: "${goal.desc}"` : ''}.
Tasks completed: ${doneTasks}/${totalTasks} (${pct}%).
Streak: ${streak} days.
Check-ins:
${moodSummary || 'No check-ins this week.'}

Apply these principles:
- If stuck with no progress: is this a Valley or Dead End? Say it directly.
- Identify if they are building accumulable skills or just doing disposable tasks.
- Celebrate real wins, not just effort.

Return ONLY valid JSON, no markdown:
{"rating":"Good|OK|Needs work","summary":"2 honest sentences","wentWell":"1 specific concrete win","improve":"1 specific thing to change","nextWeekFocus":"one concrete actionable focus","encouragement":"one direct sentence","mindsetNote":"one sentence applying Valley/Dead End or Accumulable Asset or Three-Wins to their specific situation"}`

  const raw = await callAI(prompt)
  const draft = parseJSON(raw)

  const criteria = `
- rating must match the actual data (${pct}% completion, ${streak} day streak)
- summary must reference specific numbers or events, not generic statements
- wentWell must name something concrete, not "you showed up"
- improve must be actionable, not vague like "be more consistent"
- mindsetNote must apply a specific principle to THIS user's situation, not generic advice
- no empty motivation or filler phrases`

  const improved = await reflectAndImprove(draft, criteria, 2)
  return typeof improved === 'string' ? parseJSON(improved) : improved
}

export async function generateTasks(goal, userPrompt = '') {
  const prompt = `You are a productivity coach generating starter tasks.

Goal: "${goal.title}"${goal.desc ? `. Why it matters: "${goal.desc}"` : ''}${goal.weeks ? `. Timeline: ${goal.weeks} weeks` : ''}.
${userPrompt ? `User focus: "${userPrompt}".` : ''}

Generate exactly 7 tasks that build toward the goal. Each task must be an accumulable action.

Return ONLY valid JSON, no markdown:
{"tasks":[{"text":"specific task naming exact tool or action","estimatedMins":30,"day":"Mon"}]}

Rules:
- Name exact resources, tools, or actions
- Bad: "Study grammar" — Good: "Complete Duolingo Unit 1 Lesson 3 and write 5 example sentences"
- One task per day, spread Mon-Sun
- estimatedMins 20-45
- Easiest first, hardest last`

  const raw = await callAI(prompt)
  const draft = parseJSON(raw)

  const criteria = `
- every task text must name a specific tool, resource, or measurable deliverable
- no task should use vague verbs without specifying exactly what
- tasks must be ordered easiest to hardest
- each task must be completable in one sitting
- estimatedMins must be realistic`

  const improved = await reflectAndImprove(draft, criteria, 2)
  return typeof improved === 'string' ? parseJSON(improved) : improved
}

export async function breakdownProject(title, goal) {
  const prompt = `You are a productivity coach breaking down a project into steps.

Goal: "${goal.title}". Project: "${title}".

Apply the Accumulable Asset principle: order sub-tasks so each one builds on the last and produces something usable.

Return ONLY valid JSON, no markdown:
{"subtasks":[{"text":"specific sub-task"}]}

Rules:
- 5-8 sub-tasks
- Each names a specific action or deliverable
- Ordered logically — each step builds on the previous
- Each completable in 15-60 minutes`

  const resp = await callAI(prompt)
  return parseJSON(resp)
}

export async function generateRescueTask(goal, streak, checkins) {
  const recentBlockers = checkins.slice(0, 3).map(c => c.blocker).filter(Boolean).join(', ')

  const prompt = `You are a direct productivity coach. User goal: "${goal.title}". Their ${streak}-day streak is at risk.
Recent mood: ${checkins[0]?.moodLabel || 'unknown'}.
Recent blockers: ${recentBlockers || 'none mentioned'}.

Apply Valley vs Dead End:
- If they seem in a valley (effort exists, just lost momentum): generate a rescue task.
- If they seem stuck at a dead end (same blockers repeating, no progress pattern): generate a reflection prompt instead.

Return ONLY valid JSON:
{"type":"rescue|reflect","task":"specific task or reflection question under 15 words","estimatedMins":10,"encouragement":"one direct sentence — no empty motivation"}`

  const resp = await callAI(prompt)
  return parseJSON(resp)
}

export async function summariseChat(messages) {
  const history = messages.map(m => `${m.role === 'user' ? 'User' : 'Coach'}: ${m.text}`).join('\n')

  const prompt = `Summarise this coaching conversation in 3-5 bullet points.
Focus on: what the user is working toward, key challenges or blockers mentioned, advice given, commitments made, and any open loops.
Be specific — capture actual content, not generic descriptions.

Conversation:
${history}

Return ONLY plain text bullet points. No JSON, no headers, no markdown.`

  const resp = await callAI(prompt)
  return resp.trim()
}

export async function extractMemory(currentMemory, transcript) {
  const prompt = `You are a memory extraction assistant for a coaching app. Be precise — only record what was clearly stated.

Current memory:
${JSON.stringify(currentMemory, null, 2)}

Conversation transcript:
${transcript}

Update the memory following these rules:
- Add/update goals only if explicitly mentioned with new information
- Update progress and blockers based on what was discussed
- Add to recentWins only if user reported a real achievement
- Add to openLoops if user mentioned something unresolved or intended but uncommitted
- Remove from openLoops if it was resolved in this conversation
- Update patterns (strengths/struggles/whatWorks/whatDoesnt) only with strong evidence — minimum 2 data points
- Add sessionHistory entry: today's date, one-sentence summary, explicit commitments only
- Update lastUpdated to today
- Do NOT invent or infer — only record clearly stated facts

Return ONLY the updated JSON object. No explanation, no markdown.`

  const resp = await callAI(prompt, [])
  return parseJSON(resp)
}

export async function chat(messages, goal, checkins, tasks, memory = null) {
  const lastMessage = messages[messages.length - 1]?.text || ''
  const tools = detectTools(lastMessage)

  const memoryBlock = memory ? `
--- USER MEMORY ---
${formatMemoryForPrompt(memory)}
--- END MEMORY ---
Use this naturally. Don't recite it. Reference open loops and past commitments when relevant.
` : ''

  const taskContext = `Tasks done: ${tasks.filter(t => t.done).length}/${tasks.length}.${
    tasks.filter(t => t.done).length === 0 && tasks.length > 0 ? ' (no tasks completed yet)' : ''
  }`

  const checkinContext = checkins.length > 0
    ? `Recent check-ins:\n${checkins.slice(0, 3).map(c => `${c.date}: ${c.moodLabel}${c.blocker ? ' — blocker: ' + c.blocker : ''}`).join('\n')}`
    : 'No check-ins yet.'

  const context = `You are a direct productivity coach in the Momentum app.
${memoryBlock}
${MINDSET}

Goal: "${goal.title}"${goal.desc ? `. Context: "${goal.desc}"` : ''}.
${taskContext}
${checkinContext}

RESPONSE RULES — follow strictly:
- Max 3 sentences for simple questions
- Max 5 sentences for complex questions
- If listing items: max 4 items, each one line only
- No bold headers like **Exercise 1:** or **Critical Thinking:**
- No nested bullet points
- No preamble like "Here are some..." or "Great question!"
- Start your response directly with the answer
- Use plain conversational language
- If asked for exercises or steps: number them simply (1. 2. 3.) — no headers`

  const history = messages
    .slice(-20)
    .map(m => `${m.role === 'user' ? 'User' : 'Coach'}: ${m.text}`)
    .join('\n')

  const resp = await callAI(`${context}\n\nConversation:\n${history}\nCoach:`, tools)
  return { text: resp.trim() }
}

async function reflectAndImprove(output, criteria, maxIterations = 2) {
  let current = output
  for (let i = 0; i < maxIterations; i++) {
    const critiquePrompt = `You are a quality reviewer for a coaching app.

Review this output against these criteria:
${criteria}

Output to review:
${typeof current === 'string' ? current : JSON.stringify(current, null, 2)}

Is this output good enough? Be strict.
Return ONLY valid JSON:
{"pass":true|false,"issues":["issue 1","issue 2"],"suggestions":["improvement 1"]}`

    const critiqueResp = await callAI(critiquePrompt, [])
    let critique
    try { critique = parseJSON(critiqueResp) } catch { break }

    if (critique.pass) break

    const rewritePrompt = `You are a productivity coach. Rewrite the following output to fix these issues:
Issues: ${critique.issues.join(', ')}
Suggestions: ${critique.suggestions.join(', ')}

Original output:
${typeof current === 'string' ? current : JSON.stringify(current, null, 2)}

Return ONLY the improved output in the same format. No explanation, no markdown.`

    const rewritten = await callAI(rewritePrompt, [])
    try {
      current = typeof current === 'string' ? rewritten.trim() : parseJSON(rewritten)
    } catch { break }
  }
  return current
}