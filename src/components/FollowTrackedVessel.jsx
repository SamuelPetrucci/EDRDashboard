import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'

/**
 * When tracking a vessel, smoothly pans the map so the vessel stays in view at a "chase" angle:
 * map center is offset behind the vessel in the direction opposite to its heading, so the vessel
 * appears in the lower third and the path ahead is visible.
 */
const OFFSET_DEG = 0.025 // ~2.8 km behind vessel
const PAN_DURATION = 1.2

export default function FollowTrackedVessel({ trackedEntity, flights, ships }) {
  const map = useMap()
  const lastPosRef = useRef(null)

  useEffect(() => {
    if (!trackedEntity || (!flights?.length && !ships?.length)) return

    const list = trackedEntity.type === 'flight' ? flights : ships
    const entity = list.find((x) => x.id === trackedEntity.id)
    if (!entity || entity.lat == null || entity.lng == null) return

    const lat = entity.lat
    const lng = entity.lng
    const heading = entity.heading != null ? entity.heading : 0
    const rad = (heading * Math.PI) / 180
    // Offset center "behind" the vessel so it sits in the lower third (cinematic)
    const centerLat = lat + OFFSET_DEG * Math.cos(rad)
    const centerLng = lng + OFFSET_DEG * Math.sin(rad)

    const key = `${lat.toFixed(5)}-${lng.toFixed(5)}`
    if (lastPosRef.current === key) return
    lastPosRef.current = key

    map.panTo([centerLat, centerLng], { animate: true, duration: PAN_DURATION })
  }, [map, trackedEntity, flights, ships])

  return null
}
