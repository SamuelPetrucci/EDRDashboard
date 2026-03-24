/**
 * 3D globe view using Mapbox GL (globe projection + terrain).
 * Requires VITE_MAPBOX_TOKEN. Renders flights and ships as point layers.
 */
import { useRef, useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import mapboxgl from 'mapbox-gl'
import { Map, Source, Layer, useMap } from 'react-map-gl/mapbox-legacy'
import 'mapbox-gl/dist/mapbox-gl.css'

const MAPBOX_STYLES = {
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  standard: 'mapbox://styles/mapbox/standard',
}

const INTERACTIVE_LAYER_IDS = ['movements-circles', 'movements-symbols', 'webcams-circles', 'webcams-symbols']

function queryInteractiveFeatures(map, point) {
  if (!map || typeof map.queryRenderedFeatures !== 'function' || typeof map.getLayer !== 'function') return []
  const layers = INTERACTIVE_LAYER_IDS.filter((id) => {
    try {
      return !!map.getLayer(id)
    } catch {
      return false
    }
  })
  if (layers.length === 0) return []
  try {
    return map.queryRenderedFeatures(point, { layers })
  } catch {
    return []
  }
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
          symbol: '✈',
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
          symbol: '🚢',
          isAnomaly: !!s.isAnomaly,
        },
      })
    }
  }
  return { type: 'FeatureCollection', features }
}

/** Convert webcam/camera list to GeoJSON for map markers */
function toCamerasGeoJSON(cameras) {
  if (!Array.isArray(cameras)) return { type: 'FeatureCollection', features: [] }
  const features = cameras
    .filter((c) => typeof c.lat === 'number' && typeof c.lng === 'number' && !Number.isNaN(c.lat) && !Number.isNaN(c.lng))
    .map((c) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [c.lng, c.lat] },
      properties: { id: c.id, name: c.name || 'Webcam', url: c.url || '' },
    }))
  return { type: 'FeatureCollection', features }
}

/** Convert trail lines (array of { id, positions: [[lat,lng],...] }) to GeoJSON LineStrings */
function toTrailsGeoJSON(flightTrails = [], shipTrails = [], showFlights = true, showShips = true) {
  const features = []
  if (showFlights && Array.isArray(flightTrails)) {
    for (const { id, positions } of flightTrails) {
      if (!positions || positions.length < 2) continue
      const coordinates = positions.map(([lat, lng]) => [lng, lat])
      features.push({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates },
        properties: { id: `trail-f-${id}`, type: 'flight' },
      })
    }
  }
  if (showShips && Array.isArray(shipTrails)) {
    for (const { id, positions } of shipTrails) {
      if (!positions || positions.length < 2) continue
      const coordinates = positions.map(([lat, lng]) => [lng, lat])
      features.push({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates },
        properties: { id: `trail-s-${id}`, type: 'ship' },
      })
    }
  }
  return { type: 'FeatureCollection', features }
}

/** Sync terrain, fog, and optional 3D buildings after style load. Standard style has its own 3D buildings. */
function GlobeStyleSync({ mapStyleKey }) {
  const mapContext = useMap()
  const map = mapContext?.current?.getMap?.() ?? mapContext?.current
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
  const map = mapContext?.current?.getMap?.() ?? mapContext?.current
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
                'moderate', '#0284c7',
                'heavy', '#0369a1',
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
  const map = mapContext?.current?.getMap?.() ?? mapContext?.current
  useEffect(() => {
    if (!map || !map.isStyleLoaded()) return
    if (typeof pitch === 'number') map.setPitch(pitch)
    if (typeof bearing === 'number') map.setBearing(bearing)
  }, [map, pitch, bearing])
  return null
}

/** When tracking a flight/ship, keep camera following it (offset behind by heading). */
function GlobeFollowTracked({ trackedEntity, flights, ships }) {
  const mapContext = useMap()
  const map = mapContext?.current?.getMap?.() ?? mapContext?.current
  const lastPosRef = useRef(null)
  const OFFSET_DEG = 0.04
  useEffect(() => {
    if (!map || !trackedEntity) return
    const list = trackedEntity.type === 'flight' ? flights : ships
    if (!Array.isArray(list)) return
    const entity = list.find((x) => x.id === trackedEntity.id)
    if (!entity || entity.lat == null || entity.lng == null) return
    const lat = entity.lat
    const lng = entity.lng
    const heading = entity.heading != null ? entity.heading : 0
    const rad = (heading * Math.PI) / 180
    const centerLng = lng + OFFSET_DEG * Math.sin(rad)
    const centerLat = lat + OFFSET_DEG * Math.cos(rad)
    const key = `${lat.toFixed(5)}-${lng.toFixed(5)}`
    if (lastPosRef.current === key) return
    lastPosRef.current = key
    map.easeTo({ center: [centerLng, centerLat], duration: 1.2, essential: true })
  }, [map, trackedEntity, flights, ships])
  return null
}

/** Show a Mapbox Popup when selectedFeature is set; render popupContent (React node) into it. */
function GlobePopup({ selectedFeature, popupContent, onClosePopup }) {
  const mapContext = useMap()
  const map = mapContext?.current?.getMap?.() ?? mapContext?.current
  const popupRef = useRef(null)
  const containerRef = useRef(null)
  const rootRef = useRef(null)
  useEffect(() => {
    if (!map) return
    if (!selectedFeature || (selectedFeature.lat == null && selectedFeature.lng == null)) {
      if (popupRef.current) {
        popupRef.current.remove()
        popupRef.current = null
      }
      if (rootRef.current && containerRef.current) {
        rootRef.current.unmount()
        rootRef.current = null
      }
      return
    }
    const lng = selectedFeature.lng ?? 0
    const lat = selectedFeature.lat ?? 0
    const container = document.createElement('div')
    container.className = 'globe-popup-content'
    containerRef.current = container
    const popup = new mapboxgl.Popup({ closeButton: true, closeOnClick: false })
      .setLngLat([lng, lat])
      .setDOMContent(container)
      .addTo(map)
    popupRef.current = popup
    if (popupContent && container) {
      const root = createRoot(container)
      rootRef.current = root
      root.render(popupContent)
    }
    const onClose = () => {
      onClosePopup?.()
    }
    popup.on('close', onClose)
    return () => {
      popup.off('close', onClose)
      popup.remove()
      popupRef.current = null
      if (rootRef.current && containerRef.current) {
        rootRef.current.unmount()
        rootRef.current = null
      }
    }
  }, [map, selectedFeature?.id, selectedFeature?.lat, selectedFeature?.lng, popupContent, onClosePopup])
  return null
}

/** Fly map to target when parent triggers search (same as Leaflet FlyToTarget) */
function GlobeFlyTo({ target, onComplete }) {
  const mapContext = useMap()
  const map = mapContext?.current?.getMap?.() ?? mapContext?.current
  useEffect(() => {
    if (!map || !target || typeof target.lat !== 'number' || typeof target.lng !== 'number') return
    const zoom = typeof target.zoom === 'number' ? target.zoom : 10
    map.flyTo({ center: [target.lng, target.lat], zoom, duration: 1.5, essential: true })
    onComplete?.()
  }, [map, target?.lat, target?.lng, target?.zoom, onComplete])
  return null
}

/** One-time spawn animation: fly from zoomed-out globe into the target view (e.g. angled Jamaica). */
function GlobeSpawnFly({ initialViewState, spawnFlyToDuration }) {
  const mapContext = useMap()
  const map = mapContext?.current?.getMap?.() ?? mapContext?.current
  const didSpawn = useRef(false)
  useEffect(() => {
    if (!map || !spawnFlyToDuration || spawnFlyToDuration <= 0 || didSpawn.current) return
    const iv = initialViewState ?? {}
    const center = [iv.longitude ?? -77.3, iv.latitude ?? 18.1]
    const targetZoom = typeof iv.zoom === 'number' ? iv.zoom : 5.5
    const targetPitch = typeof iv.pitch === 'number' ? iv.pitch : 48
    const targetBearing = typeof iv.bearing === 'number' ? iv.bearing : 0
    const runFly = () => {
      map.flyTo({ center, zoom: targetZoom, pitch: targetPitch, bearing: targetBearing, duration: spawnFlyToDuration, essential: true })
    }
    didSpawn.current = true
    const t = setTimeout(() => {
      if (map.isStyleLoaded()) runFly()
      else map.once('style.load', runFly)
    }, 120)
    return () => clearTimeout(t)
  }, [map, initialViewState, spawnFlyToDuration])
  return null
}

export default function GlobeView({
  mapboxAccessToken,
  initialViewState,
  pitch = 0,
  bearing = 0,
  flyToTarget,
  onFlyToComplete,
  spawnFlyToDuration,
  mapStyleKey = 'standard',
  flights = [],
  ships = [],
  cameras = [],
  flightTrails = [],
  shipTrails = [],
  showFlights = true,
  showShips = true,
  showTraffic = false,
  onClick,
  onBoundsChange,
  onFeatureClick,
  selectedFeature,
  popupContent,
  onClosePopup,
  trackedEntity,
  trackedFlightTrail = [],
  style,
  className,
}) {
  const mapRef = useRef(null)
  const mapStyle = MAPBOX_STYLES[mapStyleKey] || MAPBOX_STYLES.standard
  const [styleLoaded, setStyleLoaded] = useState(false)

  const movementData = useMemo(
    () => toMovementGeoJSON(flights, ships, showFlights, showShips),
    [flights, ships, showFlights, showShips]
  )

  const camerasData = useMemo(() => toCamerasGeoJSON(cameras), [cameras])

  const trailsData = useMemo(
    () => toTrailsGeoJSON(flightTrails, shipTrails, showFlights, showShips),
    [flightTrails, shipTrails, showFlights, showShips]
  )

  const defaultView = useMemo(() => {
    const base = {
      longitude: initialViewState?.longitude ?? -77.3,
      latitude: initialViewState?.latitude ?? 18.1,
      zoom: initialViewState?.zoom ?? 3,
      pitch: typeof initialViewState?.pitch === 'number' ? initialViewState.pitch : 0,
      bearing: typeof initialViewState?.bearing === 'number' ? initialViewState.bearing : 0,
    }
    if (spawnFlyToDuration && spawnFlyToDuration > 0) {
      return { ...base, zoom: 2.6, pitch: 22 }
    }
    return base
  }, [
    initialViewState?.longitude,
    initialViewState?.latitude,
    initialViewState?.zoom,
    initialViewState?.pitch,
    initialViewState?.bearing,
    spawnFlyToDuration,
  ])

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
          const map = e.target
          if (map && typeof map.queryRenderedFeatures === 'function') {
            const features = map.queryRenderedFeatures(e.point, {
              layers: ['movements-circles', 'movements-symbols', 'webcams-circles', 'webcams-symbols'],
            })
            const hit = features.find((f) => f.properties?.id)
            if (hit && onFeatureClick) {
              const props = hit.properties
              const coords = hit.geometry?.type === 'Point' && hit.geometry?.coordinates
              const lng = coords?.[0]
              const lat = coords?.[1]
              const type = props.type === 'flight' || props.type === 'ship' ? props.type : 'webcam'
              onFeatureClick({
                type: type === 'webcam' ? 'webcam' : type,
                id: props.id,
                lat: typeof lat === 'number' ? lat : e.lngLat?.lat,
                lng: typeof lng === 'number' ? lng : e.lngLat?.lng,
              })
              return
            }
          }
          if (e.lngLat) onClick?.({ lat: e.lngLat.lat, lng: e.lngLat.lng })
        }}
        onMouseMove={(e) => {
          const map = e.target
          if (!map || typeof map.queryRenderedFeatures !== 'function') return
          const features = queryInteractiveFeatures(map, e.point)
          const canvas = map.getCanvas()
          if (canvas) canvas.style.cursor = features.length > 0 ? 'pointer' : ''
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
        onLoad={(e) => {
          setStyleLoaded(true)
          const map = e.target || (mapRef?.current?.getMap?.() ?? mapRef?.current)
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
        {spawnFlyToDuration > 0 && <GlobeSpawnFly initialViewState={initialViewState} spawnFlyToDuration={spawnFlyToDuration} />}
        {flyToTarget && <GlobeFlyTo target={flyToTarget} onComplete={onFlyToComplete} />}
        {trackedEntity && <GlobeFollowTracked trackedEntity={trackedEntity} flights={flights} ships={ships} />}
        {selectedFeature && <GlobePopup selectedFeature={selectedFeature} popupContent={popupContent} onClosePopup={onClosePopup} />}
        {styleLoaded && (
          <>
            {trailsData.features.length > 0 && (
              <Source id="trails" type="geojson" data={trailsData}>
                <Layer
                  id="trails-lines"
                  type="line"
                  paint={{
                    'line-color': ['match', ['get', 'type'], 'flight', '#2563eb', '#059669'],
                    'line-width': 2,
                    'line-opacity': 0.75,
                  }}
                />
              </Source>
            )}
            {Array.isArray(trackedFlightTrail) && trackedFlightTrail.length >= 2 && (
              <Source
                id="tracked-flight-trail"
                type="geojson"
                data={{
                  type: 'FeatureCollection',
                  features: [
                    {
                      type: 'Feature',
                      geometry: { type: 'LineString', coordinates: trackedFlightTrail },
                      properties: {},
                    },
                  ],
                }}
              >
                <Layer
                  id="tracked-flight-trail-line"
                  type="line"
                  paint={{
                    'line-color': '#f97316',
                    'line-width': 4,
                    'line-opacity': 0.95,
                    'line-dasharray': [2, 2],
                  }}
                />
              </Source>
            )}
            <Source id="movements" type="geojson" data={movementData}>
              <Layer
                id="movements-circles"
                type="circle"
                paint={{
                  'circle-radius': 12,
                  'circle-color': [
                    'case',
                    ['==', ['get', 'type'], 'flight'],
                    '#2563eb',
                    '#059669',
                  ],
                  'circle-stroke-width': ['case', ['get', 'isAnomaly'], 2, 0],
                  'circle-stroke-color': '#ef4444',
                  'circle-opacity': 0.92,
                }}
              />
              <Layer
                id="movements-symbols"
                type="symbol"
                layout={{
                  'text-field': ['get', 'symbol'],
                  'text-size': 16,
                  'text-allow-overlap': true,
                  'text-ignore-placement': true,
                  'text-anchor': 'center',
                }}
                paint={{
                  'text-halo-color': 'rgba(0,0,0,0.75)',
                  'text-halo-width': 1.5,
                }}
              />
            </Source>
            {camerasData.features.length > 0 && (
              <Source id="webcams" type="geojson" data={camerasData}>
                <Layer
                  id="webcams-circles"
                  type="circle"
                  paint={{
                    'circle-radius': 10,
                    'circle-color': '#2563EB',
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#fff',
                    'circle-opacity': 0.95,
                  }}
                />
                <Layer
                  id="webcams-symbols"
                  type="symbol"
                  layout={{
                    'text-field': '📹',
                    'text-size': 16,
                    'text-allow-overlap': true,
                    'text-ignore-placement': true,
                    'text-anchor': 'center',
                  }}
                  paint={{
                    'text-halo-color': 'rgba(0,0,0,0.6)',
                    'text-halo-width': 1,
                  }}
                />
              </Source>
            )}
          </>
        )}
      </Map>
    </div>
  )
}
