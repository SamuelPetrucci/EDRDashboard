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
    return data.states.map((s) => normalizeState(s, time))
  } catch {
    return []
  }
}

/**
 * OpenSky state array: 0 icao24, 1 callsign, 2 origin_country, 3 time_position, 4 last_contact,
 * 5 longitude, 6 latitude, 7 baro_altitude, 8 on_ground, 9 velocity, 10 heading, 11 vertical_rate, ...
 */
function normalizeState(s, time) {
  const lat = s[6]
  const lng = s[5]
  const velocity = s[9] != null ? s[9] : 0
  const heading = s[10] != null ? s[10] : 0
  const baroAltitude = s[7]
  const lastContact = s[4] != null ? s[4] : time
  const callsign = (s[1] || '').trim() || null
  const originCountry = s[2] || null
  return {
    id: s[0] || '',
    lat,
    lng,
    type: 'flight',
    speed: velocity,
    heading,
    altitude: baroAltitude,
    label: callsign || s[0],
    lastSeen: lastContact,
    meta: { callsign, originCountry },
  }
}
