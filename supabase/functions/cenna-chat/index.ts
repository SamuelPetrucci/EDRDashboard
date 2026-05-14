/**
 * Cenna — DRIS briefing assistant (Edge Function).
 *
 * Secrets (Supabase Dashboard → Edge Functions → cenna-chat → Secrets):
 *   OPENAI_API_KEY   — optional; enables GPT briefs (model via OPENAI_MODEL, default gpt-4o-mini)
 *   TAVILY_API_KEY   — optional; pulls recent web excerpts to ground answers (tavily.com)
 *
 * Without OPENAI_API_KEY the function returns a concise local stub (still useful for demos).
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string }

const CENNA_SYSTEM = `You are Cenna, the in-app resilience briefing assistant for DRIS (Disaster Resilience Intelligence Scorecard).

Voice: calm, professional, concise. Prefer short paragraphs and bullet lists. Lead with what matters for duty officers and executives.

Focus areas:
- Preparedness and readiness framing (what to verify, monitor, or rehearse—not unverified panic).
- Situational awareness: synthesize any "Relevant web excerpts" provided below; if none, say you are working from general guidance and name 2–3 concrete verification steps (official sources, local EOC, meteorology, etc.).
- Never invent statistics, casualty counts, or named ongoing incidents unless they appear in the excerpts or the user pasted them. If uncertain, say so.

When web excerpts are present, cite themes (e.g. "reports highlight…") not raw URLs unless the user asked for links.`

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function tavilyContext(apiKey: string, query: string): Promise<string> {
  const q = query.trim().slice(0, 420)
  if (!q) return ''
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query: q,
        search_depth: 'basic',
        max_results: 6,
        include_answer: true,
      }),
    })
    if (!res.ok) return ''
    const data = (await res.json()) as {
      answer?: string
      results?: { title?: string; content?: string; url?: string }[]
    }
    const parts: string[] = []
    if (data.answer) parts.push(`Summary: ${data.answer}`)
    for (const r of (data.results ?? []).slice(0, 6)) {
      const line = [r.title, r.content?.replace(/\s+/g, ' ').trim().slice(0, 320)].filter(Boolean).join(' — ')
      if (line) parts.push(line)
    }
    return parts.join('\n').slice(0, 6000)
  } catch {
    return ''
  }
}

function localStubReply(lastUser: string): string {
  const t = lastUser.toLowerCase()
  let focus = 'general resilience posture'
  if (/hurricane|flood|storm|weather|rain|wind/.test(t)) focus = 'hydromet / severe weather posture'
  if (/earthquake|seismic|tsunami/.test(t)) focus = 'seismic readiness and lifeline verification'
  if (/fire|wildfire|haze/.test(t)) focus = 'wildfire smoke and evacuation readiness'
  if (/news|headline|situation|what is happening|brief/.test(t)) focus = 'situational briefing discipline (sources + verification)'

  return [
    'Cenna (local mode)',
    '',
    `You asked about: "${lastUser.slice(0, 200)}${lastUser.length > 200 ? '…' : ''}"`,
    '',
    `**${focus}** — quick briefing skeleton:`,
    '• Confirm official channels (national disaster office, meteorology, EOC) before acting on social summaries.',
    '• Snapshot critical dependencies: power, water, telecoms, transport corridors, hospitals/shelters status lines.',
    '• Pre-position decision points: trigger thresholds, who can commit resources, and how you will record assumptions.',
    '',
    '**Enable live AI + web grounding:** deploy this function with secrets `OPENAI_API_KEY` and optionally `TAVILY_API_KEY` in Supabase (see `supabase/functions/cenna-chat/index.ts` header).',
    '',
    'I stay short on purpose. When server keys are set, I return model-written briefs grounded on Tavily excerpts when available.',
  ].join('\n')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  if (!supabaseUrl || !anonKey) {
    return json({ error: 'Server misconfigured' }, 500)
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  const jwt = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!jwt) {
    return json({ error: 'Missing Authorization' }, 401)
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const {
    data: { user },
    error: userErr,
  } = await userClient.auth.getUser(jwt)
  if (userErr || !user) {
    return json({ error: userErr?.message || 'Invalid session' }, 401)
  }

  let body: { messages?: ChatMessage[] }
  try {
    body = (await req.json()) as { messages?: ChatMessage[] }
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const raw = Array.isArray(body.messages) ? body.messages : []
  const messages = raw
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content.trim() }))
    .filter((m) => m.content.length > 0)
    .slice(-24)

  if (messages.length === 0) {
    return json({ error: 'messages[] required' }, 400)
  }

  const lastUser = [...messages].reverse().find((m) => m.role === 'user')
  if (!lastUser) {
    return json({ error: 'Last user message required' }, 400)
  }

  const openaiKey = Deno.env.get('OPENAI_API_KEY') ?? ''
  const tavilyKey = Deno.env.get('TAVILY_API_KEY') ?? ''

  let webBlock = ''
  if (tavilyKey) {
    webBlock = await tavilyContext(tavilyKey, lastUser.content)
  }

  if (!openaiKey) {
    return json({
      mode: 'local',
      reply: localStubReply(lastUser.content),
    })
  }

  const model = Deno.env.get('OPENAI_MODEL')?.trim() || 'gpt-4o-mini'
  const systemContent =
    webBlock.length > 0 ? `${CENNA_SYSTEM}\n\n--- Relevant web excerpts (may be incomplete) ---\n${webBlock}` : CENNA_SYSTEM

  const openaiMessages: { role: string; content: string }[] = [
    { role: 'system', content: systemContent },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ]

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: openaiMessages,
        temperature: 0.35,
        max_tokens: 900,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('OpenAI error', res.status, errText)
      return json(
        {
          mode: 'error',
          reply:
            'Cenna could not reach the language model. Check `OPENAI_API_KEY`, billing, and model name (`OPENAI_MODEL`).',
        },
        200
      )
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[]
    }
    const reply = data.choices?.[0]?.message?.content?.trim()
    if (!reply) {
      return json({ mode: 'error', reply: 'Empty model response. Try again or shorten the thread.' }, 200)
    }

    return json({
      mode: tavilyKey ? 'openai+tavily' : 'openai',
      reply,
    })
  } catch (e) {
    console.error(e)
    return json({ mode: 'error', reply: 'Network error calling Cenna. Try again shortly.' }, 200)
  }
})
