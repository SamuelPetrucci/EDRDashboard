/**
 * Geocoding via Nominatim (OpenStreetMap). Free; use a descriptive User-Agent and respect rate limits.
 */

const NOMINATIM = 'https://nominatim.openstreetmap.org/search'

/**
 * Single result shape: { lat, lng, displayName, bbox? }
 * @param {string} query - Place name (e.g. "Montego Bay", "Tokyo")
 * @returns {Promise<{ lat: number, lng: number, displayName: string, bbox?: number[] } | null>}
 */
export async function searchPlace(query) {
  const results = await searchPlaces(query, 1)
  return results && results[0] ? results[0] : null
}

/**
 * Return multiple place results for map search / autocomplete.
 * @param {string} query - Place name or address
 * @param {number} [limit=5]
 * @returns {Promise<Array<{ lat: number, lng: number, displayName: string, bbox?: number[] }>>}
 */
export async function searchPlaces(query, limit = 5) {
  const q = query.trim()
  if (!q) return []
  try {
    const params = new URLSearchParams({
      q,
      format: 'json',
      limit: String(Math.min(Math.max(limit, 1), 10)),
    })
    const res = await fetch(`${NOMINATIM}?${params}`, {
      headers: { Accept: 'application/json', 'User-Agent': 'EDR-Dashboard-Intel/1.0' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []
    const data = await res.json()
    if (!Array.isArray(data)) return []
    return data.map((r) => {
      const lat = parseFloat(r.lat)
      const lon = parseFloat(r.lon)
      const bbox = r.boundingbox ? r.boundingbox.map(parseFloat) : undefined
      return {
        lat,
        lng: lon,
        displayName: r.display_name || q,
        bbox,
      }
    })
  } catch {
    return []
  }
}
