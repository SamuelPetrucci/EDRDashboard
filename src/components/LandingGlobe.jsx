/**
 * Landing hero — same Mapbox 3D globe as Intel (projection + satellite / standard tiles).
 * Spin resumes after the intro fly; drag to pan, scroll to zoom.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import GlobeView from './GlobeView'
import { getMapboxAccessToken } from '../lib/env'
import { useRegion } from '../context/RegionContext'
import './LandingGlobe.css'

export default function LandingGlobe({ className = '' }) {
  const { catalog } = useRegion()
  const mapboxToken = getMapboxAccessToken()
  const globeVs = catalog.globeInitialViewState
  const [mapReady, setMapReady] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const onChange = () => setReducedMotion(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const initialViewState = useMemo(
    () => ({
      longitude: globeVs.longitude,
      latitude: globeVs.latitude,
      zoom: globeVs.zoom,
      pitch: globeVs.pitch,
      bearing: globeVs.bearing ?? 0,
    }),
    [globeVs.bearing, globeVs.latitude, globeVs.longitude, globeVs.pitch, globeVs.zoom]
  )

  const onMapReady = useCallback(() => {
    setMapReady(true)
  }, [])

  useEffect(() => {
    if (!mapboxToken) setMapReady(true)
  }, [mapboxToken])

  return (
    <div className={`landing-globe ${mapReady ? 'landing-globe--ready' : ''} ${className}`.trim()}>
      <div className="landing-globe__glow" aria-hidden="true" />
      <div className="landing-globe__canvas-wrap">
        {!mapReady ? <div className="landing-globe__map-loading" aria-hidden="true" /> : null}
        <GlobeView
          className="landing-globe__mapbox"
          mapboxAccessToken={mapboxToken}
          initialViewState={initialViewState}
          mapStyleKey="satellite"
          spawnFlyToDuration={reducedMotion ? 0 : 2600}
          showDataLayers={false}
          showTraffic={false}
          ambientBearingSpin={!reducedMotion}
          ambientBearingDegPerSec={3.2}
          mapMinHeight={200}
          onMapReady={onMapReady}
        />
      </div>
    </div>
  )
}
