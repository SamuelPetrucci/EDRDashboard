/**
 * GDACS disaster alerts – earthquakes, cyclones, floods, volcanoes, wildfires, droughts.
 * Free API; returns list of events (GeoJSON-style).
 */

const GDACS_API = 'https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH'

/**
 * @param {{ lamin?: number, lomin?: number, lamax?: number, lomax?: number }} [bbox] - optional filter
 * @returns {Promise<Array<{ id: string, lat: number, lng: number, type: string, severity: string, label: string, url?: string }>>}
 */
export async function fetchGdacsEvents(bbox) {
  try {
    const params = new URLSearchParams()
    params.set('eventlist', 'EQ,TC,FL,VO,WF,DR')
    const res = await fetch(`${GDACS_API}?${params}`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return []
    const data = await res.json()
    if (!data?.features && !Array.isArray(data)) return []
    const features = data.features ?? (Array.isArray(data) ? data : [])
    const list = []
    for (const f of features) {
      const geom = f.geometry
      const coords = geom?.coordinates
      if (!coords || coords.length < 2) continue
      const lng = typeof coords[0] === 'number' ? coords[0] : parseFloat(coords[0])
      const lat = typeof coords[1] === 'number' ? coords[1] : parseFloat(coords[1])
      if (bbox && (lat < bbox.lamin || lat > bbox.lamax || lng < bbox.lomin || lng > bbox.lomax)) continue
      const props = f.properties ?? {}
      const type = props.eventtype ?? 'Event'
      const severity = props.alertlevel ?? 'unknown'
      const name = props.name ?? props.eventname ?? `${type} ${lat.toFixed(2)},${lng.toFixed(2)}`
      const url = typeof props.url === 'string' ? props.url : props.url?.report ?? props.url?.details
      list.push({
        id: `${props.eventtype ?? ''}-${props.eventid ?? ''}-${lat}-${lng}`,
        lat,
        lng,
        type,
        severity,
        label: name,
        url,
      })
    }
    return list
  } catch {
    return []
  }
}
