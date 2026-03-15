import { useEffect } from 'react'
import { useMap } from 'react-leaflet'

/**
 * Calls onMapClick when the user clicks the map (latlng).
 */
export default function MapClickHandler({ onMapClick }) {
  const map = useMap()

  useEffect(() => {
    if (!onMapClick) return
    const handler = (e) => onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng })
    map.on('click', handler)
    return () => map.off('click', handler)
  }, [map, onMapClick])

  return null
}
