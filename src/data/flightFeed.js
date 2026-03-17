/**
 * Flight feed – OpenSky Network API.
 * Fetches state vectors for aircraft in a bounding box and normalizes to movement shape.
 */

const OPENSKY_BASE = 'https://opensky-network.org/api'

/**
 * @param {{ lamin: number, lomin: number, lamax: number, lomax: number }} bbox
 * @returns {Promise<Array<{ id: string, lat: number, lng: number, type: 'flight', speed?: number, heading?: number, altitude?: number, label?: string, meta?: object, lastSeen?: number }>>}
 */
export async function fetchFlightsInBounds(bbox) {
  const params = new URLSearchParams({
    lamin: String(bbox.lamin),
    lomin: String(bbox.lomin),
    lamax: String(bbox.lamax),
    lomax: String(bbox.lomax),
  })
  try {
    const res = await fetch(`${OPENSKY_BASE}/states/all?${params}`, {
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return []
    const data = await res.json()
    if (!data.states || !Array.isArray(data.states)) return []
    const time = data.time || Math.floor(Date.now() / 1000)
    return data.states
      .map((s, i) => normalizeState(s, time, i))
      .filter((f) => f != null && typeof f.lat === 'number' && typeof f.lng === 'number' && !Number.isNaN(f.lat) && !Number.isNaN(f.lng))
  } catch {
    return []
  }
}

/**
 * OpenSky state array: 0 icao24, 1 callsign, 2 origin_country, 3 time_position, 4 last_contact,
 * 5 longitude, 6 latitude, 7 baro_altitude, 8 on_ground, 9 velocity, 10 true_track, 11 vertical_rate, ...
 * @param {number} [index] - Used for fallback id when icao24 is missing
 */
function normalizeState(s, time, index = 0) {
  const lat = s[6]
  const lng = s[5]
  if (lat == null || lng == null || typeof lat !== 'number' || typeof lng !== 'number' || Number.isNaN(lat) || Number.isNaN(lng)) {
    return null
  }
  const velocity = s[9] != null ? s[9] : 0
  const heading = s[10] != null ? s[10] : 0
  const baroAltitude = s[7]
  const lastContact = s[4] != null ? s[4] : time
  const callsign = (s[1] || '').trim() || null
  const originCountry = s[2] || null
  const icao24 = (s[0] && String(s[0]).trim()) || ''
  const onGround = !!s[8]
  const verticalRate = s[11] != null ? s[11] : null
  const id = icao24 || `flight-${index}-${lat.toFixed(4)}-${lng.toFixed(4)}`
  return {
    id,
    lat,
    lng,
    type: 'flight',
    speed: velocity,
    heading,
    altitude: baroAltitude,
    verticalRate,
    onGround,
    label: callsign || id,
    lastSeen: lastContact,
    meta: { callsign, originCountry, icao24: icao24 || id },
  }
}
