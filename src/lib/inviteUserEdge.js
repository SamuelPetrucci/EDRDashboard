import { readViteEnv } from './env'

/**
 * @param {{ accessToken: string, body: Record<string, unknown> }} opts
 * @returns {Promise<{ ok?: boolean, error?: string, invitationId?: string }>}
 */
export async function postInviteUserEdge({ accessToken, body }) {
  const base = readViteEnv('VITE_SUPABASE_URL').replace(/\/+$/, '')
  const key = readViteEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'VITE_SUPABASE_ANON_KEY')
  if (!base || !key || !accessToken) {
    return { error: 'Supabase URL, publishable key, and session are required to send invites.' }
  }
  const res = await fetch(`${base}/functions/v1/invite-user`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  let payload = {}
  try {
    payload = await res.json()
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    return { error: typeof payload.error === 'string' ? payload.error : res.statusText || 'Invite failed' }
  }
  return { ok: true, invitationId: payload.invitationId }
}
