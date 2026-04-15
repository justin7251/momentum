export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { prompt, messages: incomingMessages, tools: enabledTools = [] } = req.body

  const TOOLS = {
    search_web: {
      type: 'function',
      function: {
        name: 'search_web',
        description: 'Search the web for up-to-date information',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query'
            }
          },
          required: ['query']
        }
      }
    },
    get_current_date: {
      type: 'function',
      function: {
        name: 'get_current_date',
        description: 'Get the current date and time',
        parameters: { type: 'object', properties: {} }
      }
    },
    calculate: {
      type: 'function',
      function: {
        name: 'calculate',
        description: 'Perform a mathematical calculation',
        parameters: {
          type: 'object',
          properties: {
            expression: { type: 'string', description: 'Math expression to evaluate e.g. "25 * 4 + 10"' }
          },
          required: ['expression']
        }
      }
    }
  }

  const tools = enabledTools.map(t => TOOLS[t]).filter(Boolean)

  try {
    const messages = incomingMessages 
    ? incomingMessages
    : [{ role: 'user', content: prompt }]
    let finalText = ''
    let iterations = 0

    while (iterations < 5) {
      iterations++
      const body = {
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1000,
        messages
      }
      if (tools.length > 0) {
        body.tools = tools
        body.tool_choice = 'auto'
      }

      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify(body)
      })

      const data = await r.json()
      if (!r.ok) throw new Error(data.error?.message || 'Groq error')

      const choice = data.choices?.[0]
      messages.push({ 
        role: 'assistant', 
        content: choice.message.content ?? '',
        tool_calls: choice.message.tool_calls 
      })
      if (choice.finish_reason === 'tool_calls') {
        for (const toolCall of choice.message.tool_calls) {
          const args = JSON.parse(toolCall.function.arguments)
          let result = ''

          if (toolCall.function.name === 'search_web') {
            result = await runSearchWeb(args.query)
          } else if (toolCall.function.name === 'get_current_date') {
            result = new Date().toISOString()
          } else if (toolCall.function.name === 'calculate') {
            try {
              result = String(Function('"use strict"; return (' + args.expression + ')')())
            } catch {
              result = 'Invalid expression'
            }
          }

          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: result
          })
        }
      } else {
        finalText = choice.message.content || ''
        break
      }
    }

    res.status(200).json({ text: finalText })
  } catch (e) {
    console.error('Error:', e)
    res.status(500).json({ error: e.message })
  }
}

async function runSearchWeb(query) {
  if (!process.env.TAVILY_API_KEY) return 'Search unavailable'
  try {
    const r = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query,
        max_results: 4,
        search_depth: 'basic',
        include_answer: true
      })
    })
    const data = await r.json()
    const answer = data.answer ? `Summary: ${data.answer}\n\n` : ''
    const sources = data.results?.map((r, i) => `[${i + 1}] ${r.title}\n${r.content?.slice(0, 300)}`).join('\n\n') || ''
    return answer + sources
  } catch (e) {
    return 'Search failed'
  }
}