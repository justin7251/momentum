export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const body = {
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: 'You are a concise news assistant.' },
      { role: 'user', content: `Search news about: ${req.body}` }
    ],
    max_tokens: 1024,
  };
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify(body)
  })

  const data = await r.json()
  if (!r.ok) {
    console.error('Groq error:', data)
    return res.status(r.status).json({ error: data.error?.message || 'API error' })
  }

  res.status(200).json({ text: data.choices?.[0]?.message?.content || '' })
}