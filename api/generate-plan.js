export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { prompt } = req.body

  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  const data = await r.json()
  if (!r.ok) {
    console.error('Groq error:', data)
    return res.status(r.status).json({ error: data.error?.message || 'API error' })
  }

  res.status(200).json({ text: data.choices?.[0]?.message?.content || '' })
}