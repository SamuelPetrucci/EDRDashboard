/**
 * USGS earthquake feed – real-time and recent events. Free, no key.
 */

const USGS_QUERY = 'https://earthquake.usgs.gov/fdsnws/event/1/query'

/**
 * @param {{ lamin?: number, lomin?: number, lamax?: number, lomax?: number }} [bbox]
 * @param {number} [minMagnitude] - default 3.5
 * @returns {Promise<Array<{ id: string, lat: number, lng: number, magnitude: number, place: string, time: number }>>}
 */
export async function fetchEarthquakes(bbox, minMagnitude = 3.5) {
  try {
    const params = new URLSearchParams({
      format: 'geojson',
      starttime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      minmagnitude: String(minMagnitude),
    })
    if (bbox) {
      params.set('minlatitude', String(bbox.lamin))
      params.set('maxlatitude', String(bbox.lamax))
      params.set('minlongitude', String(bbox.lomin))
      params.set('maxlongitude', String(bbox.lomax))
    }
    const res = await fetch(`${USGS_QUERY}?${params}`, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) return []
    const data = await res.json()
    const features = data?.features ?? []
    return features.map((f) => {
      const [lng, lat] = f.geometry?.coordinates ?? [0, 0]
      const props = f.properties ?? {}
      return {
        id: f.id ?? `${lat}-${lng}-${props.time}`,
        lat,
        lng,
        magnitude: props.mag ?? 0,
        place: props.place ?? '',
        time: props.time ?? 0,
      }
    })
  } catch {
    return []
  }
}
