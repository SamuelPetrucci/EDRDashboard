import { createClient } from '@supabase/supabase-js'
import { readViteEnv } from './env'

/**
 * Project URL must be the API host root (e.g. `https://xxxx.supabase.co`), not `/rest/v1` or `/auth/v1`.
 * Otherwise the client builds paths like `/auth/v1/auth/v1/token` and the gateway returns
 * "Invalid path specified in request URL".
 * @param {string} raw
 * @returns {string}
 */
function normalizeSupabaseProjectUrl(raw) {
  const s = String(raw ?? '').trim()
  if (!s) return ''
  try {
    const withProto = /^https?:\/\//i.test(s) ? s : `https://${s}`
    const u = new URL(withProto)
    const { origin, hostname, pathname } = u
    const path = pathname.replace(/\/+$/, '') || '/'

    if (hostname.endsWith('.supabase.co') && path !== '/' && path !== '') {
      return `${origin}/`
    }

    const apiRoots = ['/rest/v1', '/auth/v1', '/storage/v1', '/functions/v1', '/realtime/v1', '/graphql/v1']
    for (const prefix of apiRoots) {
      if (path === prefix || path.startsWith(`${prefix}/`)) {
        return `${origin}/`
      }
    }

    return s
  } catch {
    return s
  }
}

const rawSupabaseUrl = readViteEnv('VITE_SUPABASE_URL')
const url = normalizeSupabaseProjectUrl(rawSupabaseUrl)
if (import.meta.env.DEV && rawSupabaseUrl.trim() && url !== rawSupabaseUrl.trim()) {
  console.warn(
    '[DRIS] VITE_SUPABASE_URL should be the project root only (e.g. https://xxxx.supabase.co). A pasted /rest/v1 or /auth/v1 path was stripped — update .env to avoid this warning.'
  )
}
/** Publishable (`sb_publishable_…`) preferred; legacy JWT anon if unset. */
const publishableKey = readViteEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'VITE_SUPABASE_ANON_KEY')

export const isSupabaseConfigured = Boolean(url && publishableKey)

/** @type {ReturnType<typeof createClient>|null} */
export const supabase = isSupabaseConfigured ? createClient(url, publishableKey) : null
