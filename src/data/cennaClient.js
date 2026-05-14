import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

/**
 * @param {{ role: 'user' | 'assistant', content: string }[]} messages
 * @returns {Promise<{ ok: boolean, reply?: string, mode?: string, error?: string }>}
 */
export async function sendCennaMessage(messages) {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error: 'Cenna needs a configured Supabase project (Edge Function `cenna-chat`).',
      mode: 'offline',
    }
  }

  const { data, error } = await supabase.functions.invoke('cenna-chat', {
    body: { messages },
  })

  if (error) {
    return {
      ok: false,
      error: error.message || 'Could not reach Cenna. Deploy `cenna-chat` and sign in again.',
      mode: 'error',
    }
  }

  if (data && typeof data.error === 'string') {
    return { ok: false, error: data.error, mode: 'error' }
  }

  const reply = typeof data?.reply === 'string' ? data.reply : ''
  if (!reply) {
    return { ok: false, error: 'Empty response from Cenna.', mode: 'error' }
  }

  return { ok: true, reply, mode: data?.mode ?? 'unknown' }
}
