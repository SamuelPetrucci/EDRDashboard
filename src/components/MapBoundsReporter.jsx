import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import { boundsToBbox } from '../data/intelSources'

/**
 * Reports current map bounds to parent (debounced). Use for driving feed fetches by visible area.
 */
export default function MapBoundsReporter({ onBoundsChange, debounceMs = 700 }) {
  const map = useMap()
  const timeoutRef = useRef(null)

  useEffect(() => {
    const report = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        const bbox = boundsToBbox(map.getBounds())
        if (bbox) onBoundsChange(bbox)
        timeoutRef.current = null
      }, debounceMs)
    }
    report()
    map.on('moveend', report)
    return () => {
      map.off('moveend', report)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [map, onBoundsChange, debounceMs])

  return null
}
