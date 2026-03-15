import { useEffect } from 'react'
import { useMap } from 'react-leaflet'

/**
 * When target changes, fly map to that position and call onComplete.
 */
export default function FlyToTarget({ target, zoom = 10, onComplete }) {
  const map = useMap()

  useEffect(() => {
    if (!target || typeof target.lat !== 'number' || typeof target.lng !== 'number') return
    map.flyTo([target.lat, target.lng], typeof target.zoom === 'number' ? target.zoom : zoom, { duration: 1.5 })
    onComplete?.()
  }, [target?.lat, target?.lng, map, zoom, onComplete])

  return null
}
