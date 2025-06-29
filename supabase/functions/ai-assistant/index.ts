const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface GroqResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
  error?: {
    message: string
    type: string
    code: string
  }
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    let requestBody
    try {
      requestBody = await req.json()
    } catch (parseError) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const { message, context, type } = requestBody

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check for API key
    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
    
    if (!GROQ_API_KEY || !GROQ_API_KEY.startsWith('gsk_')) {
      return new Response(
        JSON.stringify({ 
          success: true,
          response: getGrowwlyFallbackResponse(type || 'general'),
          fallback: true,
          error: 'Growwly AI is temporarily offline'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Enhanced Growwly system prompt
    const systemPrompt = `You are Growwly, an enthusiastic and supportive AI assistant for a daily progress tracking app called Growwly. Your personality is:

🌱 **Growth-Focused**: You believe everyone can grow and improve
💪 **Motivational**: You're encouraging and positive, but realistic
🎯 **Goal-Oriented**: You help break down big dreams into actionable steps
✨ **Inspiring**: You use emojis and positive language naturally
🤝 **Supportive**: You celebrate wins and help through challenges

Your expertise includes:
- **Progress Analysis**: Help users identify patterns and insights
- **Goal Setting**: Break down large goals into daily actions
- **Motivation**: Provide encouragement and overcome obstacles
- **Productivity**: Share practical tips and strategies
- **Reflection**: Ask thoughtful questions for self-discovery

Communication style:
- Use emojis naturally (but not excessively)
- Be conversational and warm
- Keep responses concise but meaningful (2-4 sentences)
- Ask follow-up questions to engage users
- Celebrate progress and achievements
- Use "you" and "your" to make it personal

Current context: ${context || 'General conversation about personal growth'}`

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: message
      }
    ]

    // Try multiple models for reliability
    const models = [
      'llama-3.1-8b-instant',
      'llama3-70b-8192',
      'llama3-8b-8192', 
      'mixtral-8x7b-32768'
    ]

    for (const model of models) {
      try {
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model,
            messages: messages,
            max_tokens: 300,
            temperature: 0.8, // Slightly higher for more personality
            top_p: 0.9,
            stream: false
          }),
        })

        if (groqResponse.ok) {
          const data: GroqResponse = await groqResponse.json()

          if (data.error) {
            continue
          }

          const aiResponse = data.choices?.[0]?.message?.content

          if (aiResponse) {
            return new Response(
              JSON.stringify({
                success: true,
                response: aiResponse,
                model: model,
                fallback: false
              }),
              {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            )
          }
        } else {
          continue
        }
      } catch (fetchError) {
        continue
      }
    }

    // All models failed - return Growwly fallback
    return new Response(
      JSON.stringify({ 
        success: true,
        response: getGrowwlyFallbackResponse(type || 'general'),
        fallback: true,
        error: 'Growwly AI is temporarily offline, but still here to help!'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: true,
        response: getGrowwlyFallbackResponse('general'),
        fallback: true,
        error: 'Growwly encountered an issue, but I\'m still here!'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

// Enhanced Growwly fallback responses with personality
function getGrowwlyFallbackResponse(type: string): string {
  const fallbacks = {
    progress_analysis: "Hey there! 🌟 I love that you're tracking your progress - that's already a huge win! 📊 While I'm having some technical hiccups, I can still share that consistency is your superpower. What's one pattern you've noticed in your most successful days? Let's build on that! 💪",
    
    goal_setting: "Goal setting is one of my favorite topics! 🎯 Even though I'm running in offline mode, here's what I know works: Start with ONE specific goal and break it into tiny daily actions. Think 'What's the smallest step I can take today?' What's the big dream you're working toward? ✨",
    
    motivation: "I see you're looking for some motivation - and honestly? The fact that you're here asking means you're already on the right track! 🚀 Every small step counts, every day you show up matters. You've got this! What's one thing you accomplished recently that you're proud of? 🌟",
    
    general: "Hi! I'm Growwly, your growth companion! 🌱 While I'm having some connection issues, I'm still excited to help you on your journey! Whether it's setting goals, staying motivated, or celebrating wins - I'm here for it all. What would you like to grow in your life today? ✨"
  }
  
  return fallbacks[type] || fallbacks.general
}
</invoke>