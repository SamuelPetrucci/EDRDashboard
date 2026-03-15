/**
 * 3D globe view using Mapbox GL (globe projection + terrain).
 * Requires VITE_MAPBOX_TOKEN. Renders flights and ships as point layers.
 */
import { useRef, useEffect, useMemo } from 'react'
import mapboxgl from 'mapbox-gl'
import { Map, Source, Layer, useMap } from 'react-map-gl/mapbox-legacy'
import 'mapbox-gl/dist/mapbox-gl.css'

const MAPBOX_STYLES = {
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  standard: 'mapbox://styles/mapbox/standard',
}

/** Convert flights/ships to GeoJSON FeatureCollection for Mapbox */
function toMovementGeoJSON(flights, ships, showFlights, showShips) {
  const features = []
  if (showFlights && Array.isArray(flights)) {
    for (const f of flights) {
      if (f.lat == null || f.lng == null) continue
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [f.lng, f.lat] },
        properties: {
          id: f.id,
          type: 'flight',
          isAnomaly: !!f.isAnomaly,
        },
      })
    }
  }
  if (showShips && Array.isArray(ships)) {
    for (const s of ships) {
      if (s.lat == null || s.lng == null) continue
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
        properties: {
          id: s.id,
          type: 'ship',
          isAnomaly: !!s.isAnomaly,
        },
      })
    }
  }
  return { type: 'FeatureCollection', features }
}

/** Sync terrain, fog, and optional 3D buildings after style load. Standard style has its own 3D buildings. */
function GlobeStyleSync({ mapStyleKey }) {
  const mapContext = useMap()
  const map = mapContext?.current?.getMap?.()
  useEffect(() => {
    if (!map) return
    const onStyleData = () => {
      if (!map.isStyleLoaded()) return
      try {
        const demSource = map.getSource('mapbox-dem')
        if (demSource) map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.6 })
      } catch (_) {}
      try {
        map.setFog({
          color: 'rgb(186, 210, 235)',
          'high-color': 'rgb(36, 92, 223)',
          'horizon-blend': 0.02,
          'space-color': 'rgb(11, 11, 25)',
          'star-intensity': 0.35,
        })
      } catch (_) {}
      if (mapStyleKey === 'standard') return
      // Satellite: add 3D building extrusion after style is ready (composite = Mapbox Streets v8)
      const addBuildings = () => {
        try {
          if (map.getLayer('add-3d-buildings')) return
          const composite = map.getSource('composite')
          if (!composite) return
          const layers = map.getStyle().layers || []
          const labelLayerId = layers.find((l) => l.type === 'symbol' && l.layout && l.layout['text-field'])?.id
          map.addLayer(
            {
              id: 'add-3d-buildings',
              source: 'composite',
              'source-layer': 'building',
              filter: ['==', ['get', 'extrude'], 'true'],
              type: 'fill-extrusion',
              minzoom: 12,
              paint: {
                'fill-extrusion-color': '#a8a8a8',
                'fill-extrusion-height': [
                  'interpolate', ['linear'], ['zoom'],
                  12, 0,
                  12.08, ['coalesce', ['get', 'height'], 10],
                ],
                'fill-extrusion-base': [
                  'interpolate', ['linear'], ['zoom'],
                  12, 0,
                  12.08, ['coalesce', ['get', 'min_height'], 0],
                ],
                'fill-extrusion-opacity': 0.92,
              },
            },
            labelLayerId || undefined
          )
        } catch (_) {}
      }
      setTimeout(addBuildings, 100)
    }
    if (map.isStyleLoaded()) onStyleData()
    map.on('style.load', onStyleData)
    return () => map.off('style.load', onStyleData)
  }, [map, mapStyleKey])
  return null
}

/** Add/remove Mapbox Traffic v1 layer (congestion on roads). Re-adds when style loads (e.g. after style switch). */
function GlobeTrafficSync({ showTraffic }) {
  const mapContext = useMap()
  const map = mapContext?.current?.getMap?.()
  useEffect(() => {
    if (!map) return
    const addTraffic = () => {
      if (!showTraffic || !map.isStyleLoaded()) return
      try {
        if (map.getSource('mapbox-traffic')) return
        map.addSource('mapbox-traffic', {
          type: 'vector',
          url: 'mapbox://mapbox.mapbox-traffic-v1',
        })
        const layers = map.getStyle().layers || []
        const beforeId = layers.find((l) => l.type === 'symbol' && l.layout?.['text-field'])?.id
        map.addLayer(
          {
            id: 'traffic-congestion',
            type: 'line',
            source: 'mapbox-traffic',
            'source-layer': 'traffic',
            minzoom: 10,
            paint: {
              'line-color': [
                'match',
                ['get', 'congestion'],
                'low', '#22c55e',
                'moderate', '#eab308',
                'heavy', '#f97316',
                'severe', '#ef4444',
                'closed', '#64748b',
                '#94a3b8',
              ],
              'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1.5, 14, 3, 18, 5],
              'line-opacity': 0.85,
            },
          },
          beforeId
        )
      } catch (_) {}
    }
    const onStyleLoad = () => setTimeout(addTraffic, 150)
    if (showTraffic && map.isStyleLoaded()) setTimeout(addTraffic, 150)
    map.on('style.load', onStyleLoad)
    return () => {
      map.off('style.load', onStyleLoad)
      try {
        if (map.getLayer('traffic-congestion')) map.removeLayer('traffic-congestion')
        if (map.getSource('mapbox-traffic')) map.removeSource('mapbox-traffic')
      } catch (_) {}
    }
  }, [map, showTraffic])
  return null
}

/** Apply pitch and bearing from parent (view presets) */
function GlobeCameraSync({ pitch, bearing }) {
  const mapContext = useMap()
  const map = mapContext?.current?.getMap?.()
  useEffect(() => {
    if (!map || !map.isStyleLoaded()) return
    if (typeof pitch === 'number') map.setPitch(pitch)
    if (typeof bearing === 'number') map.setBearing(bearing)
  }, [map, pitch, bearing])
  return null
}

/** Fly map to target when parent triggers search (same as Leaflet FlyToTarget) */
function GlobeFlyTo({ target, onComplete }) {
  const mapContext = useMap()
  const map = mapContext?.current?.getMap?.()
  useEffect(() => {
    if (!map || !target || typeof target.lat !== 'number' || typeof target.lng !== 'number') return
    const zoom = typeof target.zoom === 'number' ? target.zoom : 10
    map.flyTo({ center: [target.lng, target.lat], zoom, duration: 1.5, essential: true })
    onComplete?.()
  }, [map, target?.lat, target?.lng, target?.zoom, onComplete])
  return null
}

export default function GlobeView({
  mapboxAccessToken,
  initialViewState,
  pitch = 0,
  bearing = 0,
  flyToTarget,
  onFlyToComplete,
  mapStyleKey = 'standard',
  flights = [],
  ships = [],
  showFlights = true,
  showShips = true,
  showTraffic = false,
  onClick,
  onBoundsChange,
  style,
  className,
}) {
  const mapRef = useRef(null)
  const mapStyle = MAPBOX_STYLES[mapStyleKey] || MAPBOX_STYLES.standard

  const movementData = useMemo(
    () => toMovementGeoJSON(flights, ships, showFlights, showShips),
    [flights, ships, showFlights, showShips]
  )

  const defaultView = useMemo(
    () => ({
      longitude: initialViewState?.longitude ?? -77.3,
      latitude: initialViewState?.latitude ?? 18.1,
      zoom: initialViewState?.zoom ?? 3,
      pitch: typeof initialViewState?.pitch === 'number' ? initialViewState.pitch : 0,
      bearing: typeof initialViewState?.bearing === 'number' ? initialViewState.bearing : 0,
    }),
    [
      initialViewState?.longitude,
      initialViewState?.latitude,
      initialViewState?.zoom,
      initialViewState?.pitch,
      initialViewState?.bearing,
    ]
  )

  if (!mapboxAccessToken) {
    return (
      <div className={className} style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#94a3b8', borderRadius: 14 }}>
        <div style={{ textAlign: 'center', padding: 24 }}>
          <p style={{ marginBottom: 8 }}>3D Globe requires a Mapbox access token.</p>
          <p style={{ fontSize: 14 }}>Set <code>VITE_MAPBOX_TOKEN</code> in <code>.env</code> and restart. See MANUAL_SETUP.md.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={className} style={style}>
      <Map
        ref={mapRef}
        mapLib={mapboxgl}
        mapboxAccessToken={mapboxAccessToken}
        initialViewState={defaultView}
        mapStyle={mapStyle}
        projection="globe"
        style={{ width: '100%', height: '100%', minHeight: 400 }}
        onClick={(e) => {
          if (e.lngLat) onClick?.({ lat: e.lngLat.lat, lng: e.lngLat.lng })
        }}
        onMoveEnd={(e) => {
          const map = e.target
          if (map && map.getBounds) {
            const b = map.getBounds()
            if (b)
              onBoundsChange?.({
                lamin: b.getSouth(),
                lomin: b.getWest(),
                lamax: b.getNorth(),
                lomax: b.getEast(),
              })
          }
        }}
        onLoad={() => {
          const map = mapRef?.current?.getMap?.()
          if (map && map.getBounds) {
            const b = map.getBounds()
            if (b)
              onBoundsChange?.({
                lamin: b.getSouth(),
                lomin: b.getWest(),
                lamax: b.getNorth(),
                lomax: b.getEast(),
              })
          }
        }}
      >
        <GlobeStyleSync mapStyleKey={mapStyleKey} />
        <GlobeTrafficSync showTraffic={showTraffic} />
        <GlobeCameraSync pitch={pitch} bearing={bearing} />
        {flyToTarget && <GlobeFlyTo target={flyToTarget} onComplete={onFlyToComplete} />}
        <Source id="movements" type="geojson" data={movementData}>
          <Layer
            id="movements-circles"
            type="circle"
            paint={{
              'circle-radius': ['case', ['==', ['get', 'type'], 'flight'], 5, 4],
              'circle-color': [
                'case',
                ['==', ['get', 'type'], 'flight'],
                '#3b82f6',
                '#059669',
              ],
              'circle-stroke-width': ['case', ['get', 'isAnomaly'], 2, 0],
              'circle-stroke-color': '#ef4444',
            }}
          />
        </Source>
      </Map>
    </div>
  )
}
