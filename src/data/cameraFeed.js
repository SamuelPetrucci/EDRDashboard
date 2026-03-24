/**
 * Real camera feeds from around the world.
 * If VITE_OPENWEBCAMDB_API_KEY is set, OpenWebcamDB is tried first (direct stream URLs from detail API).
 * Otherwise Windy Webcams API v3 (viewer links; not embeddable in iframes).
 * See MANUAL_SETUP.md.
 */

const WINDY_WEBCAM_BASES = [
  'https://api.windy.com/webcams/api/v3/webcams',
  'https://api4.windy.com/webcams/api/v3/webcams',
]

/** Same-origin proxy (Vercel `api/windy-webcams.js`) avoids browser CORS on Windy. */
function resolveWindyProxyUrl(point, radiusKm) {
  const explicit = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_WINDY_WEBCAM_PROXY_URL : ''
  if (explicit === '0' || explicit === 'false') return null

  const radius = String(Math.min(radiusKm, 200))
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost'

  const build = (pathOrUrl) => {
    try {
      const u = pathOrUrl.startsWith('http') ? new URL(pathOrUrl) : new URL(pathOrUrl, origin)
      u.searchParams.set('lat', String(point.lat))
      u.searchParams.set('lng', String(point.lng))
      u.searchParams.set('radius', radius)
      return u.toString()
    } catch {
      return null
    }
  }

  if (explicit) {
    if (explicit.startsWith('http://') || explicit.startsWith('https://')) return build(explicit)
    const path = explicit.startsWith('/') ? explicit : `/${explicit}`
    return build(path)
  }

  if (typeof import.meta !== 'undefined' && import.meta.env?.PROD) return build('/api/windy-webcams')
  return null
}

/**
 * Fetch webcams near a point. Windy: nearby=lat,lon,radius (km), limit.
 * Key: VITE_WINDY_WEBCAM_API_KEY (or fallback VITE_WINDY_API_KEY).
 * @param {{ lat: number, lng: number }} point
 * @param {number} [radiusKm]
 * @returns {Promise<Array<{ id: string, lat: number, lng: number, name: string, url: string, thumbnail?: string }>>}
 */
export async function fetchCamerasNearPoint(point, radiusKm = 50) {
  if (!point || typeof point.lat !== 'number' || typeof point.lng !== 'number') {
    return []
  }
  const webcamKey = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_WINDY_WEBCAM_API_KEY : null
  const legacyKey = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_WINDY_API_KEY : null
  const windyKey = (webcamKey && String(webcamKey).trim()) || (legacyKey && String(legacyKey).trim()) || null
  const owKeyRaw = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_OPENWEBCAMDB_API_KEY : null
  const owKey = owKeyRaw && String(owKeyRaw).trim()

  let lastWindyError = null
  let lastOwError = null
  const windyProxyUrl = resolveWindyProxyUrl(point, radiusKm)
  if (owKey) {
    try {
      const list = await fetchOpenWebcamDB(point, radiusKm, owKey)
      if (list.length > 0) return list
    } catch (e) {
      lastOwError = e
    }
  }
  if (windyKey || windyProxyUrl) {
    try {
      if (windyProxyUrl) {
        const list = await fetchWindyWebcams(point, radiusKm, windyKey || '', WINDY_WEBCAM_BASES[0])
        if (list.length > 0) return list
      } else if (windyKey) {
        for (const base of WINDY_WEBCAM_BASES) {
          try {
            const list = await fetchWindyWebcams(point, radiusKm, windyKey, base)
            if (list.length > 0) return list
          } catch (e) {
            lastWindyError = e
          }
        }
      }
    } catch (e) {
      lastWindyError = e
    }
  }
  if (lastOwError) throw lastOwError
  if (lastWindyError) throw lastWindyError
  return []
}

/** Windy Webcams API v3 – nearby=lat,lon,radius (km), limit. Header: x-windy-api-key (direct only). */
async function fetchWindyWebcams(point, radiusKm, apiKey, baseUrl) {
  const proxyUrl = resolveWindyProxyUrl(point, radiusKm)
  if (proxyUrl) {
    const res = await fetch(proxyUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(12000),
    })
    if (!res.ok) {
      const text = await res.text()
      if (res.status === 503) throw new Error('Windy: proxy missing server API key')
      throw new Error(`Windy: ${res.status} ${text.slice(0, 80)}`)
    }
    const data = await res.json().catch(() => ({}))
    return parseWindyWebcamJson(data)
  }

  if (!apiKey || !String(apiKey).trim()) {
    throw new Error('Windy: no API key')
  }

  const nearby = `${point.lat},${point.lng},${Math.min(radiusKm, 200)}`
  const url = `${baseUrl}?nearby=${nearby}&limit=20`
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'x-windy-api-key': apiKey.trim() },
    signal: AbortSignal.timeout(12000),
  })
  if (!res.ok) {
    const text = await res.text()
    if (res.status === 401) throw new Error('Windy: invalid API key')
    if (res.status === 403) throw new Error('Windy: access denied or CORS')
    throw new Error(`Windy: ${res.status} ${text.slice(0, 80)}`)
  }
  const data = await res.json().catch(() => ({}))
  return parseWindyWebcamJson(data)
}

function parseWindyWebcamJson(data) {
  const raw = data?.result?.webcams ?? data?.result ?? data?.webcams ?? data
  const items = Array.isArray(raw) ? raw : (raw?.webcams ?? [])
  return items.slice(0, 15).map((w) => {
    const loc = w.location ?? w
    const lat = parseFloat(loc?.latitude ?? loc?.lat ?? w?.lat ?? 0)
    const lng = parseFloat(loc?.longitude ?? loc?.lng ?? w?.lon ?? w?.lng ?? 0)
    // v3: images.current.preview or images.preview; fallback to v2-style image.preview
    const img = w.images ?? w.image ?? w.preview ?? w
    const thumbnail =
      typeof img === 'string'
        ? img
        : img?.current?.preview ?? img?.current?.icon ?? img?.preview ?? img?.icon
    // Always use Windy webcam page for viewing; API urls.current.day are often image URLs that expire
    const windyPageUrl = w.id ? `https://www.windy.com/-/webcams/${w.id}` : '#'
    return {
      id: `windy-${w.id ?? `${lat}-${lng}`}`,
      lat,
      lng,
      name: w.title ?? w.name ?? 'Webcam',
      url: windyPageUrl,
      thumbnail: thumbnail || undefined,
    }
  })
}

const OPENWEBCAMDB_BASE = 'https://openwebcamdb.com/api/v1'
const OPENWEBCAMDB_SITE = 'https://openwebcamdb.com'

function extractOpenWebcamListPayload(data) {
  if (Array.isArray(data)) return { items: data, lastPage: 1 }
  const items = data?.data ?? data?.webcams ?? data?.results ?? []
  const lastPageRaw = data?.meta?.last_page ?? data?.last_page ?? 1
  const lastPage = Math.max(1, Number(lastPageRaw) || 1)
  return { items: Array.isArray(items) ? items : [], lastPage }
}

/** OpenWebcamDB – Bearer token. List has no stream_url (v1); we GET /webcams/{slug} for each nearby cam. */
async function fetchOpenWebcamDB(point, radiusKm, apiKey) {
  const headers = {
    Accept: 'application/json',
    Authorization: `Bearer ${apiKey}`,
  }
  const rawList = []
  const maxPages = 1
  for (let page = 1; page <= maxPages; page++) {
    const res = await fetch(`${OPENWEBCAMDB_BASE}/webcams?per_page=100&page=${page}`, {
      headers,
      signal: AbortSignal.timeout(12000),
    })
    if (!res.ok) {
      const text = await res.text()
      if (res.status === 401) throw new Error('OpenWebcamDB: invalid API key')
      if (res.status === 429) throw new Error('OpenWebcamDB: rate limited (429)')
      throw new Error(`OpenWebcamDB: ${res.status} ${text.slice(0, 120)}`)
    }
    const data = await res.json()
    const { items, lastPage } = extractOpenWebcamListPayload(data)
    rawList.push(...items)
    if (page >= lastPage || items.length < 100) break
  }

  const withCoords = rawList
    .map((c) => {
      const slug = c.slug ?? c.id
      if (!slug) return null
      const lat = parseFloat(c.latitude ?? c.lat ?? c.location?.latitude ?? 0)
      const lng = parseFloat(c.longitude ?? c.lng ?? c.location?.longitude ?? 0)
      if (Number.isNaN(lat) || Number.isNaN(lng)) return null
      const distKm = distanceKm(point.lat, point.lng, lat, lng)
      if (distKm > radiusKm) return null
      return { ...c, slug, lat, lng, distKm }
    })
    .filter(Boolean)
  withCoords.sort((a, b) => a.distKm - b.distKm)
  const nearest = withCoords.slice(0, 8)

  const out = []
  for (const row of nearest) {
    const detail = await fetchOpenWebcamDetail(row.slug, headers)
    const d = detail ?? row
    const slug = row.slug
    const pageUrl = `${OPENWEBCAMDB_SITE}/webcams/${encodeURIComponent(slug)}`
    const streamUrl =
      d.stream_url ??
      d.streamUrl ??
      d.embed_url ??
      d.embedUrl ??
      d.player_url ??
      d.hls_url ??
      d.mjpeg_url ??
      d.website_url ??
      d.link
    const thumb = d.thumbnail ?? d.image ?? d.preview ?? row.thumbnail ?? row.image ?? row.preview
    out.push({
      id: `ow-${slug}`,
      lat: row.lat,
      lng: row.lng,
      name: d.title ?? d.name ?? row.title ?? row.name ?? 'Camera',
      url: typeof streamUrl === 'string' && streamUrl.trim() ? streamUrl.trim() : pageUrl,
      thumbnail: typeof thumb === 'string' ? thumb : undefined,
    })
  }
  return out
}

async function fetchOpenWebcamDetail(slug, headers) {
  try {
    const res = await fetch(`${OPENWEBCAMDB_BASE}/webcams/${encodeURIComponent(slug)}`, {
      headers,
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.data ?? data
  } catch {
    return null
  }
}

function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
