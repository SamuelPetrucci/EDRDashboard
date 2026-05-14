/** Base path for authenticated DRIS dashboard (behind Supabase auth when configured). */
export const APP_BASE = '/app'

/**
 * Dashboard URL helper. '/' maps to `/app`.
 * @param {string} [segment='/']
 */
export function appPath(segment = '/') {
  if (!segment || segment === '/') return APP_BASE
  const s = segment.startsWith('/') ? segment : `/${segment}`
  return `${APP_BASE}${s}`
}

/**
 * Parish-scoped dashboard links.
 * @param {string} parishId
 * @param {string} [suffix] e.g. 'scorecard', 'contacts' (no leading slash required)
 */
export function parishPath(parishId, suffix) {
  if (!suffix) return `${APP_BASE}/parish/${parishId}`
  const rest = String(suffix).replace(/^\//, '')
  return `${APP_BASE}/parish/${parishId}/${rest}`
}
