/**
 * Real camera feeds from around the world.
 * Tries Windy (global) then OpenWebcamDB; set env keys (see MANUAL_SETUP.md).
 * Windy API v3: x-windy-api-key header; response has result.webcams and images/urls/location.
 */

const WINDY_WEBCAM_BASES = [
  'https://api.windy.com/webcams/api/v3/webcams',
  'https://api4.windy.com/webcams/api/v3/webcams',
]

/**
 * Fetch webcams near a point. Windy: nearby=lat,lon,radius (km), limit.
 * @param {{ lat: number, lng: number }} point
 * @param {number} [radiusKm]
 * @returns {Promise<Array<{ id: string, lat: number, lng: number, name: string, url: string, thumbnail?: string }>>}
 */
export async function fetchCamerasNearPoint(point, radiusKm = 50) {
  if (!point || typeof point.lat !== 'number' || typeof point.lng !== 'number') {
    return []
  }
  const windyKey = typeof import.meta !== 'undefined' && import.meta.env?.VITE_WINDY_API_KEY
  const owKey = typeof import.meta !== 'undefined' && import.meta.env?.VITE_OPENWEBCAMDB_API_KEY

  let lastWindyError = null
  if (windyKey) {
    for (const base of WINDY_WEBCAM_BASES) {
      try {
        const list = await fetchWindyWebcams(point, radiusKm, windyKey, base)
        if (list.length > 0) return list
      } catch (e) {
        lastWindyError = e
      }
    }
  }
  if (owKey) {
    try {
      const list = await fetchOpenWebcamDB(point, radiusKm, owKey)
      if (list.length > 0) return list
    } catch {
      // ignore
    }
  }
  if (lastWindyError) throw lastWindyError
  return []
}

/** Windy Webcams API v3 – nearby=lat,lon,radius (km), limit. Header: x-windy-api-key. */
async function fetchWindyWebcams(point, radiusKm, apiKey, baseUrl) {
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
  // v3: result.webcams array; each webcam has location, images (not image), urls (not url)
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
    // v3: urls.current.day or urls.day; v2: url, link; fallback: windy webcam page
    const urlObj = w.urls
    const link =
      (typeof urlObj === 'object' && (urlObj?.current?.day ?? urlObj?.day ?? urlObj?.link)) ||
      w.url ||
      w.link ||
      (w.id ? `https://www.windy.com/-/webcams/${w.id}` : '#')
    return {
      id: `windy-${w.id ?? `${lat}-${lng}`}`,
      lat,
      lng,
      name: w.title ?? w.name ?? 'Webcam',
      url: typeof link === 'string' ? link : '#',
      thumbnail: thumbnail || undefined,
    }
  })
}

const OPENWEBCAMDB_BASE = 'https://openwebcamdb.com/api/v1'

/** OpenWebcamDB – use Bearer token, base URL openwebcamdb.com. List webcams and filter by distance if no near endpoint. */
async function fetchOpenWebcamDB(point, radiusKm, apiKey) {
  const headers = {
    Accept: 'application/json',
    Authorization: `Bearer ${apiKey}`,
  }
  // Try list endpoint; API may support search params or we filter by distance
  const res = await fetch(`${OPENWEBCAMDB_BASE}/webcams?per_page=100`, {
    headers,
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) throw new Error(`OpenWebcamDB error: ${res.status}`)
  const data = await res.json()
  const rawList = Array.isArray(data) ? data : data?.data ?? data?.webcams ?? data?.results ?? []
  const withCoords = rawList
    .map((c) => {
      const lat = parseFloat(c.latitude ?? c.lat ?? c.location?.latitude ?? 0)
      const lng = parseFloat(c.longitude ?? c.lng ?? c.location?.longitude ?? 0)
      if (Number.isNaN(lat) || Number.isNaN(lng)) return null
      const distKm = distanceKm(point.lat, point.lng, lat, lng)
      if (distKm > radiusKm) return null
      return {
        ...c,
        lat,
        lng,
        distKm,
      }
    })
    .filter(Boolean)
  withCoords.sort((a, b) => a.distKm - b.distKm)
  return withCoords.slice(0, 15).map((c) => ({
    id: `ow-${c.slug ?? c.id ?? c.camera_id ?? Math.random()}`,
    lat: c.lat,
    lng: c.lng,
    name: c.name ?? c.title ?? 'Camera',
    url: c.stream_url ?? c.url ?? c.link ?? (c.slug ? `${OPENWEBCAMDB_BASE.replace('/api/v1', '')}/webcams/${c.slug}` : '#'),
    thumbnail: c.thumbnail ?? c.image ?? c.preview,
  }))
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
