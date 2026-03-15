/**
 * Maritime (ship) feed – real AIS only when VITE_AISHUB_USERNAME + VITE_AISHUB_KEY are set.
 * Without those env vars returns empty array. See MANUAL_SETUP.md for real AIS.
 */

export function isRealAISEnabled() {
  return !!(typeof import.meta !== 'undefined' && import.meta.env?.VITE_AISHUB_USERNAME && import.meta.env?.VITE_AISHUB_KEY)
}

/**
 * Fetch ships in bbox. Returns real AIS when VITE_AISHUB_USERNAME and VITE_AISHUB_KEY are set (see MANUAL_SETUP.md).
 * Otherwise returns [].
 * @param {{ lamin: number, lomin: number, lamax: number, lomax: number }} bbox
 */
export async function fetchShipsInBounds(bbox) {
  const username = typeof import.meta !== 'undefined' && import.meta.env?.VITE_AISHUB_USERNAME
  const key = typeof import.meta !== 'undefined' && import.meta.env?.VITE_AISHUB_KEY
  if (!username || !key) return []
  try {
    return await fetchAishubShips(bbox, username, key)
  } catch {
    return []
  }
}

/** AISHub REST – 1 request/min free tier. Requires sharing AIS to get key. */
async function fetchAishubShips(bbox, username, key) {
  const params = new URLSearchParams({
    username,
    key,
    latmin: String(bbox.lamin),
    latmax: String(bbox.lamax),
    lonmin: String(bbox.lomin),
    lonmax: String(bbox.lomax),
    format: '1',
  })
  const res = await fetch(`https://data.aishub.net/ws.php?${params}`, { signal: AbortSignal.timeout(10000) })
  if (!res.ok) throw new Error('AISHub request failed')
  const text = await res.text()
  const rows = text.trim().split('\n')
  if (rows.length < 2) return []
  const headers = rows[0].split(',')
  const ships = []
  for (let i = 1; i < rows.length; i++) {
    const vals = rows[i].split(',')
    const lat = parseFloat(vals[headers.indexOf('LAT')] ?? vals[2])
    const lng = parseFloat(vals[headers.indexOf('LON')] ?? vals[3])
    const mmsi = vals[headers.indexOf('MMSI')] ?? vals[0] ?? `ship-${i}`
    const name = (vals[headers.indexOf('NAME')] ?? vals[4] ?? '').trim() || `Ship ${mmsi}`
    const speed = parseFloat(vals[headers.indexOf('SPEED')] ?? vals[5] ?? 0)
    const course = parseFloat(vals[headers.indexOf('COURSE')] ?? vals[6] ?? 0)
    ships.push({
      id: String(mmsi),
      lat,
      lng,
      type: 'ship',
      speed,
      heading: course,
      label: name,
      lastSeen: Math.floor(Date.now() / 1000),
      meta: { name, shipType: 'Vessel', mmsi },
    })
  }
  return ships
}
