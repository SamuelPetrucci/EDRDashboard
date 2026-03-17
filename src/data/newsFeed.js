/**
 * News feed – simple wrapper around a configurable API.
 * Uses VITE_NEWS_API_URL and VITE_NEWS_API_KEY so dev/prod (Vercel) can point
 * at any aggregator (e.g. NewsAPI, custom gateway) without changing code.
 *
 * Expected backend contract (example):
 *   GET <VITE_NEWS_API_URL>?bbox=lamin,lomin,lamax,lomax&limit=20
 *   Authorization: Bearer <VITE_NEWS_API_KEY>
 *   → [{ id, title, url, source, publishedAt, summary, category }]
 *
 * If env vars are missing, returns an empty list; the UI will show a hint.
 */

/**
 * @typedef {Object} NewsArticle
 * @property {string} id
 * @property {string} title
 * @property {string} [summary]
 * @property {string} [source]
 * @property {string} [url]
 * @property {string} [publishedAt] ISO timestamp
 * @property {string} [category]
 */

/**
 * Fetch news for the given bounding box.
 * @param {{ lamin: number, lomin: number, lamax: number, lomax: number }} bbox
 * @param {number} [limit]
 * @returns {Promise<NewsArticle[]>}
 */
export async function fetchNewsForBounds(bbox, limit = 20) {
  if (!bbox || typeof bbox.lamin !== 'number' || typeof bbox.lomin !== 'number') {
    return []
  }
  const apiUrl =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_NEWS_API_URL) || ''
  const apiKey =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_NEWS_API_KEY) || ''

  if (!apiUrl) {
    // No news backend configured – UI will show a setup hint.
    return []
  }

  const params = new URLSearchParams({
    bbox: [bbox.lamin, bbox.lomin, bbox.lamax, bbox.lomax].join(','),
    limit: String(limit),
  })

  const headers = { Accept: 'application/json' }
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`
  }

  try {
    const res = await fetch(`${apiUrl}?${params.toString()}`, {
      headers,
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) {
      // Silently fail to avoid breaking the dashboard; caller can show generic error.
      return []
    }
    const data = await res.json().catch(() => [])
    const list = Array.isArray(data) ? data : data?.articles || data?.items || []
    return list
      .map((a, idx) => ({
        id: String(a.id || a.url || `news-${idx}`),
        title: a.title || 'Untitled',
        summary: a.summary || a.description || '',
        source: a.source?.name || a.source || '',
        url: a.url || '',
        publishedAt: a.publishedAt || a.date || '',
        category: a.category || '',
      }))
      .filter((a) => !!a.title)
  } catch {
    return []
  }
}

