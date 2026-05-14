/**
 * Read Vite env with fallbacks (first non-empty wins).
 * @param {...string} keys
 * @returns {string}
 */
export function readViteEnv(...keys) {
  if (typeof import.meta === 'undefined') return ''
  for (const key of keys) {
    const raw = import.meta.env?.[key]
    const s = raw != null ? String(raw).trim() : ''
    if (s) return s
  }
  return ''
}

/** Mapbox default public token (see account.mapbox.com). */
export function getMapboxAccessToken() {
  return readViteEnv('VITE_MAPBOX_ACCESS_TOKEN', 'VITE_MAPBOX_TOKEN')
}
