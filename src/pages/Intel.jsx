import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, LayersControl, LayerGroup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import { Satellite, MapPin, Layers, ExternalLink, Plane, Ship, AlertTriangle, Filter, Search, Cloud, Video, X, Navigation, Globe, Info, PanelRightClose, PanelRightOpen, LayoutGrid, Car, Map, Newspaper, Target } from 'lucide-react'
import { jamaicaCenter, defaultZoom, parishCoordinates } from '../data/parishCoordinates'
import { getAllParishes } from '../data/jamaicaParishes'
import { BASEMAP_LAYERS, JAMAICA_BBOX, FEED_REFRESH_MS, boundsToBbox, WEATHER_RADAR_OVERLAY, DISPLAY_LIMIT_OPTIONS } from '../data/intelSources'
import { fetchFlightsInBounds } from '../data/flightFeed'
import { fetchShipsInBounds, isRealAISEnabled } from '../data/maritimeFeed'
import { searchPlaces } from '../data/geocode'
import { getWeatherAtPoint } from '../data/weatherAtPoint'
import { fetchCamerasNearPoint } from '../data/cameraFeed'
import { fetchGdacsEvents } from '../data/gdacsFeed'
import { fetchEarthquakes } from '../data/earthquakeFeed'
import { detectAnomalies } from '../utils/anomalyDetection'
import MapBoundsReporter from '../components/MapBoundsReporter'
import MapClickHandler from '../components/MapClickHandler'
import FlyToTarget from '../components/FlyToTarget'
import FollowTrackedVessel from '../components/FollowTrackedVessel'
import GlobeView from '../components/GlobeView'
import 'leaflet/dist/leaflet.css'
import './Intel.css'

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})
L.Marker.prototype.options.icon = DefaultIcon

const { BaseLayer, Overlay } = LayersControl

/** 3D globe camera presets: pitch (tilt) and bearing (rotation) in degrees */
const VIEW_PRESETS = {
  top: { pitch: 0, bearing: 0, label: 'Top-down' },
  oblique: { pitch: 45, bearing: 0, label: 'Oblique' },
  horizon: { pitch: 60, bearing: 0, label: 'Horizon' },
}

/** Plane icon, rotated by heading (degrees). Anomaly = red ring. */
function createPlaneIcon(isAnomaly, heading = 0) {
  const size = 28
  const rot = heading != null ? heading : 0
  const ring = isAnomaly ? 'border:2px solid #EF4444;border-radius:50%;box-sizing:border-box;' : ''
  return L.divIcon({
    className: 'movement-marker movement-marker-plane',
    html: `<div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;transform:rotate(${rot}deg);font-size:22px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.4));${ring}" title="Flight">✈</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

/** Ship icon, rotated by heading. Anomaly = red ring. */
function createShipIcon(isAnomaly, heading = 0) {
  const size = 28
  const rot = heading != null ? heading : 0
  const ring = isAnomaly ? 'border:2px solid #EF4444;border-radius:50%;box-sizing:border-box;' : ''
  return L.divIcon({
    className: 'movement-marker movement-marker-ship',
    html: `<div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;transform:rotate(${rot}deg);font-size:20px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.4));${ring}" title="Ship">🚢</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function createMovementIcon(type, isAnomaly, heading) {
  return type === 'flight' ? createPlaneIcon(isAnomaly, heading) : createShipIcon(isAnomaly, heading)
}

function createAlertIcon(color) {
  return L.divIcon({
    className: 'alert-marker',
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid white;"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}

const Intel = () => {
  const parishes = getAllParishes()
  const [mapBbox, setMapBbox] = useState(JAMAICA_BBOX)
  const [flights, setFlights] = useState([])
  const [ships, setShips] = useState([])
  const [lastUpdated, setLastUpdated] = useState(null)
  const [flightError, setFlightError] = useState(false)
  const [shipError, setShipError] = useState(false)
  const [showFlights, setShowFlights] = useState(true)
  const [showShips, setShowShips] = useState(true)
  const [showTraffic, setShowTraffic] = useState(false)
  const [minSpeedFilter, setMinSpeedFilter] = useState('')
  const [selectedPoint, setSelectedPoint] = useState(null)
  const [flyToTarget, setFlyToTarget] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false)
  const [areaFeeds, setAreaFeeds] = useState({ weather: null, cameras: [], loading: false, error: null })
  const [gdacsEvents, setGdacsEvents] = useState([])
  const [earthquakes, setEarthquakes] = useState([])
  const [showGdacs, setShowGdacs] = useState(true)
  const [showEarthquakes, setShowEarthquakes] = useState(true)
  const [trailLengthMinutes, setTrailLengthMinutes] = useState(0)
  const [trailHistory, setTrailHistory] = useState({ flights: {}, ships: {} })
  const [displayLimitIndex, setDisplayLimitIndex] = useState(1)
  const [trackedEntity, setTrackedEntity] = useState(null) // { id, type: 'flight'|'ship', label }
  const [viewMode, setViewMode] = useState('3d') // '2d' | '3d' – 3D globe by default
  const [selectedCamera, setSelectedCamera] = useState(null) // { id, name, url } for live feed modal
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const [controlsCollapsed, setControlsCollapsed] = useState(false)
  const [viewPreset, setViewPreset] = useState('top') // 'top' | 'oblique' | 'horizon' – 3D camera angle
  const [mapStyleKey, setMapStyleKey] = useState('standard') // 'standard' = 3D buildings with elevation, 'satellite' = satellite imagery
  const [controlTab, setControlTab] = useState('search') // 'search' | 'map' | 'layers' | 'intel' | 'maps' | 'news'
  const [mapMode, setMapMode] = useState('tactical') // 'tactical' | 'disaster' | 'strategy' – for different map contexts / future response plans
  const fetchCountRef = useRef(0)
  const mapSearchWrapRef = useRef(null)
  const mapboxToken = typeof import.meta !== 'undefined' && import.meta.env?.VITE_MAPBOX_TOKEN

  useEffect(() => {
    if (!searchDropdownOpen) return
    const close = (e) => {
      if (mapSearchWrapRef.current && !mapSearchWrapRef.current.contains(e.target)) setSearchDropdownOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [searchDropdownOpen])

  const parishById = useMemo(() => {
    const map = {}
    parishes.forEach((p) => { map[p.id] = p })
    return map
  }, [parishes])

  const onBoundsChange = useCallback((bbox) => setMapBbox(bbox), [])

  const TRAIL_CAP = 120
  const mergeTrail = (prev, key, items, nowMs, windowMs) => {
    if (!items || !items.length) return prev
    const next = { ...prev }
    const window = next[key] || {}
    for (const item of items) {
      const id = item.id
      const tail = (window[id] || []).filter((p) => p.t > nowMs - windowMs)
      tail.push({ lat: item.lat, lng: item.lng, t: nowMs })
      if (tail.length > TRAIL_CAP) tail.shift()
      window[id] = tail
    }
    next[key] = window
    return next
  }

  const fetchFeeds = useCallback(() => {
    const bbox = mapBbox
    const nowMs = Date.now()
    const windowMs = trailLengthMinutes > 0 ? trailLengthMinutes * 60 * 1000 : 10 * 60 * 1000
    Promise.all([
      fetchFlightsInBounds(bbox).then((data) => {
        setFlights(data)
        setFlightError(false)
        if (trailLengthMinutes > 0) {
          fetchCountRef.current += 1
          if (fetchCountRef.current % 2 === 0) setTrailHistory((prev) => mergeTrail(prev, 'flights', data, nowMs, windowMs))
        }
      }).catch(() => setFlightError(true)),
      fetchShipsInBounds(bbox).then((data) => {
        setShips(data)
        setShipError(false)
        if (trailLengthMinutes > 0) {
          if (fetchCountRef.current % 2 === 0) setTrailHistory((prev) => mergeTrail(prev, 'ships', data, nowMs, windowMs))
        }
      }).catch(() => setShipError(true)),
    ]).then(() => setLastUpdated(Date.now()))
  }, [mapBbox, trailLengthMinutes])

  useEffect(() => {
    fetchFeeds()
    const t1 = setInterval(fetchFeeds, FEED_REFRESH_MS.flights)
    const t2 = setInterval(fetchFeeds, FEED_REFRESH_MS.ships)
    return () => { clearInterval(t1); clearInterval(t2) }
  }, [fetchFeeds])

  useEffect(() => {
    const load = () => {
      fetchGdacsEvents(mapBbox).then(setGdacsEvents).catch(() => setGdacsEvents([]))
      fetchEarthquakes(mapBbox).then(setEarthquakes).catch(() => setEarthquakes([]))
    }
    load()
    const t = setInterval(load, 5 * 60 * 1000)
    return () => clearInterval(t)
  }, [mapBbox])

  useEffect(() => {
    if (!selectedPoint) { setAreaFeeds({ weather: null, cameras: [], loading: false, error: null }); return }
    setAreaFeeds((prev) => ({ ...prev, loading: true, error: null }))
    Promise.all([
      getWeatherAtPoint(selectedPoint),
      fetchCamerasNearPoint(selectedPoint, 50),
    ]).then(([weather, cameras]) => {
      setAreaFeeds({ weather: weather ?? null, cameras: cameras ?? [], loading: false, error: null })
    }).catch((err) => {
      setAreaFeeds({
        weather: null,
        cameras: [],
        loading: false,
        error: err?.message || 'Failed to load feeds',
      })
    })
  }, [selectedPoint?.lat, selectedPoint?.lng])

  const handleSearch = async (e) => {
    e?.preventDefault()
    const q = searchQuery.trim()
    if (!q) return
    setSearchLoading(true)
    setSearchResults([])
    setSearchDropdownOpen(false)
    const results = await searchPlaces(q, 5)
    setSearchLoading(false)
    if (results.length === 0) return
    if (results.length === 1) {
      const r = results[0]
      setFlyToTarget({ lat: r.lat, lng: r.lng, zoom: 10 })
      setSelectedPoint({ lat: r.lat, lng: r.lng })
      setSearchQuery(r.displayName)
      return
    }
    setSearchResults(results)
    setSearchDropdownOpen(true)
  }

  const pickSearchResult = (place) => {
    setFlyToTarget({ lat: place.lat, lng: place.lng, zoom: 10 })
    setSelectedPoint({ lat: place.lat, lng: place.lng })
    setSearchQuery(place.displayName)
    setSearchResults([])
    setSearchDropdownOpen(false)
  }

  const handleMapClick = useCallback((point) => setSelectedPoint(point), [])
  const startTracking = useCallback((id, type, label) => setTrackedEntity({ id, type, label }), [])
  const stopTracking = useCallback(() => setTrackedEntity(null), [])

  const minSpeed = minSpeedFilter === '' ? null : parseFloat(minSpeedFilter)
  const filteredFlights = useMemo(() => {
    let list = flights
    if (minSpeed != null && !Number.isNaN(minSpeed)) {
      const minMs = minSpeed * 0.514444
      list = list.filter((f) => f.speed != null && f.speed >= minMs)
    }
    return list
  }, [flights, minSpeed])
  const filteredShips = useMemo(() => {
    let list = ships
    if (minSpeed != null && !Number.isNaN(minSpeed)) {
      list = list.filter((s) => s.speed != null && s.speed >= minSpeed)
    }
    return list
  }, [ships, minSpeed])

  const flightsWithAnomalies = useMemo(() => detectAnomalies(filteredFlights), [filteredFlights])
  const shipsWithAnomalies = useMemo(() => detectAnomalies(filteredShips), [filteredShips])
  const limits = DISPLAY_LIMIT_OPTIONS[displayLimitIndex] ?? DISPLAY_LIMIT_OPTIONS[1]
  const displayedFlights = useMemo(() => flightsWithAnomalies.slice(0, limits.flights), [flightsWithAnomalies, limits.flights])
  const displayedShips = useMemo(() => shipsWithAnomalies.slice(0, limits.ships), [shipsWithAnomalies, limits.ships])
  const anomalyList = useMemo(() => [
    ...flightsWithAnomalies.filter((f) => f.isAnomaly).map((f) => ({ ...f, type: 'flight' })),
    ...shipsWithAnomalies.filter((s) => s.isAnomaly).map((s) => ({ ...s, type: 'ship' })),
  ], [flightsWithAnomalies, shipsWithAnomalies])

  const trailWindowMs = trailLengthMinutes * 60 * 1000
  const flightTrailLines = useMemo(() => {
    if (trailLengthMinutes <= 0) return []
    const nowMs = Date.now()
    const out = []
    const flights = trailHistory.flights || {}
    for (const [id, points] of Object.entries(flights)) {
      const recent = points.filter((p) => p.t > nowMs - trailWindowMs)
      if (recent.length >= 2) out.push({ id, positions: recent.map((p) => [p.lat, p.lng]) })
    }
    return out
  }, [trailHistory.flights, trailLengthMinutes])
  const shipTrailLines = useMemo(() => {
    if (trailLengthMinutes <= 0) return []
    const nowMs = Date.now()
    const out = []
    const ships = trailHistory.ships || {}
    for (const [id, points] of Object.entries(ships)) {
      const recent = points.filter((p) => p.t > nowMs - trailWindowMs)
      if (recent.length >= 2) out.push({ id, positions: recent.map((p) => [p.lat, p.lng]) })
    }
    return out
  }, [trailHistory.ships, trailLengthMinutes])

  return (
    <div className="intel-dashboard">
      <div className="intel-dashboard-main">
        <div className="intel-map-wrapper">
          {viewMode === '3d' && mapboxToken ? (
            <GlobeView
              mapboxAccessToken={mapboxToken}
              initialViewState={{
                longitude: jamaicaCenter.lng,
                latitude: jamaicaCenter.lat,
                zoom: defaultZoom,
                pitch: VIEW_PRESETS[viewPreset]?.pitch ?? 0,
                bearing: VIEW_PRESETS[viewPreset]?.bearing ?? 0,
              }}
              pitch={VIEW_PRESETS[viewPreset]?.pitch ?? 0}
              bearing={VIEW_PRESETS[viewPreset]?.bearing ?? 0}
              flyToTarget={flyToTarget}
              onFlyToComplete={() => setFlyToTarget(null)}
              mapStyleKey={mapStyleKey}
              flights={displayedFlights}
              ships={displayedShips}
              showFlights={showFlights}
              showShips={showShips}
              showTraffic={showTraffic}
              onClick={handleMapClick}
              onBoundsChange={setMapBbox}
              className="intel-globe"
              style={{ height: '100%', minHeight: 400 }}
            />
          ) : viewMode === '3d' && !mapboxToken ? (
            <GlobeView mapboxAccessToken={null} className="intel-globe" style={{ height: '100%', minHeight: 400 }} />
          ) : (
            <>
          {trackedEntity && (
            <div className="intel-tracking-pill">
              <Navigation size={16} />
              <span>Tracking: {trackedEntity.label}</span>
              <button type="button" className="intel-tracking-stop" onClick={stopTracking} aria-label="Stop tracking">Stop</button>
            </div>
          )}
          <MapContainer
            className="intel-map intel-map-smooth"
            center={[jamaicaCenter.lat, jamaicaCenter.lng]}
            zoom={defaultZoom}
            zoomControl={true}
            scrollWheelZoom={true}
            zoomSnap={0.25}
            zoomDelta={0.5}
            inertia={true}
            inertiaDeceleration={3000}
          >
            <MapBoundsReporter onBoundsChange={onBoundsChange} />
            <MapClickHandler onMapClick={handleMapClick} />
            <FlyToTarget target={flyToTarget} onComplete={() => setFlyToTarget(null)} />
            <FollowTrackedVessel trackedEntity={trackedEntity} flights={displayedFlights} ships={displayedShips} />
            <LayersControl position="topright">
              {BASEMAP_LAYERS.map((layer) => (
                <BaseLayer key={layer.id} name={layer.name} checked={!!layer.default}>
                  <TileLayer url={layer.url} attribution={layer.attribution} />
                </BaseLayer>
              ))}
              {WEATHER_RADAR_OVERLAY && (
                <Overlay name="Weather radar" checked={false}>
                  <TileLayer url={WEATHER_RADAR_OVERLAY} attribution="Radar" />
                </Overlay>
              )}
              <Overlay name="Movement trails" checked={trailLengthMinutes > 0}>
                <LayerGroup>
                  {flightTrailLines.map(({ id, positions }) => (
                    <Polyline key={`trail-f-${id}`} positions={positions} pathOptions={{ color: '#2C5F8D', weight: 2, opacity: 0.7 }} />
                  ))}
                  {shipTrailLines.map(({ id, positions }) => (
                    <Polyline key={`trail-s-${id}`} positions={positions} pathOptions={{ color: '#059669', weight: 2, opacity: 0.7 }} />
                  ))}
                </LayerGroup>
              </Overlay>
              <Overlay name="Flights" checked={showFlights}>
                <LayerGroup>
                  {showFlights && displayedFlights.map((f) => (
                    <Marker key={`f-${f.id}`} position={[f.lat, f.lng]} icon={createMovementIcon('flight', f.isAnomaly, f.heading)}>
                      <Popup>
                        <div className="intel-popup intel-movement-popup">
                          <strong>{f.meta?.callsign || f.id}</strong>
                          <span className="intel-popup-meta">{f.meta?.originCountry ?? '—'} · {f.altitude != null ? `${Math.round(f.altitude)} m` : '—'} · {f.speed != null ? `${Math.round(f.speed)} m/s` : '—'}</span>
                          {f.isAnomaly && <span className="intel-popup-anomaly"><AlertTriangle size={14} /> {f.anomalyReasons.join(', ')}</span>}
                          <button type="button" className="intel-popup-track-btn" onClick={() => startTracking(f.id, 'flight', f.meta?.callsign || f.id)}>
                            <Navigation size={14} /> Track live
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </LayerGroup>
              </Overlay>
              <Overlay name="Ships" checked={showShips}>
                <LayerGroup>
                  {showShips && displayedShips.map((s) => (
                    <Marker key={`s-${s.id}`} position={[s.lat, s.lng]} icon={createMovementIcon('ship', s.isAnomaly, s.heading)}>
                      <Popup>
                        <div className="intel-popup intel-movement-popup">
                          <strong>{s.meta?.name || s.id}</strong>
                          <span className="intel-popup-meta">{s.meta?.shipType ?? '—'} · {s.speed != null ? `${s.speed.toFixed(1)} kn` : '—'}</span>
                          {s.isAnomaly && <span className="intel-popup-anomaly"><AlertTriangle size={14} /> {s.anomalyReasons.join(', ')}</span>}
                          <button type="button" className="intel-popup-track-btn" onClick={() => startTracking(s.id, 'ship', s.meta?.name || s.id)}>
                            <Navigation size={14} /> Track live
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </LayerGroup>
              </Overlay>
              <Overlay name="Disasters (GDACS)" checked={showGdacs}>
                <LayerGroup>
                  {showGdacs && gdacsEvents.map((e) => (
                    <Marker key={e.id} position={[e.lat, e.lng]} icon={createAlertIcon(e.severity === 'Red' ? '#EF4444' : e.severity === 'Orange' ? '#F59E0B' : '#10B981')}>
                      <Popup>
                        <div className="intel-popup"><strong>{e.type}</strong> {e.label} {e.url && <a href={e.url} target="_blank" rel="noopener noreferrer">Details</a>}</div>
                      </Popup>
                    </Marker>
                  ))}
                </LayerGroup>
              </Overlay>
              <Overlay name="Earthquakes (USGS)" checked={showEarthquakes}>
                <LayerGroup>
                  {showEarthquakes && earthquakes.map((e) => (
                    <Marker key={e.id} position={[e.lat, e.lng]} icon={createAlertIcon('#7C3AED')}>
                      <Popup>
                        <div className="intel-popup"><strong>M{e.magnitude}</strong> {e.place}</div>
                      </Popup>
                    </Marker>
                  ))}
                </LayerGroup>
              </Overlay>
            </LayersControl>
            {Object.entries(parishCoordinates).map(([parishId, coords]) => {
              const parish = parishById[parishId]
              const name = parish ? parish.name : parishId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
              return (
                <Marker key={parishId} position={[coords.lat, coords.lng]}>
                  <Popup>
                    <div className="intel-popup">
                      <strong>{name}</strong>
                      {parish && (
                        <>
                          <span className="intel-popup-meta">{parish.region} · Pop. {parish.population?.toLocaleString()}</span>
                          <Link to={`/parish/${parishId}`} className="intel-popup-link">View parish dashboard <ExternalLink size={12} /></Link>
                        </>
                      )}
                    </div>
                  </Popup>
                </Marker>
              )
            })}
          </MapContainer>
          </>
          )}
          <div className="intel-map-footer">
            {lastUpdated && <span>Updated {new Date(lastUpdated).toLocaleTimeString()}</span>}
            {flightError && <span className="intel-feed-error">Flights error</span>}
            {shipError && <span className="intel-feed-error">Ships error</span>}
          </div>

          <div className={`intel-overlay-panel ${controlsCollapsed ? 'collapsed' : ''}`}>
            <button type="button" className="intel-overlay-panel-toggle" onClick={() => setControlsCollapsed((c) => !c)} aria-label={controlsCollapsed ? 'Open controls' : 'Collapse controls'}>
              {controlsCollapsed ? <PanelRightOpen size={20} /> : <PanelRightClose size={20} />}
            </button>
            <div className="intel-overlay-panel-inner">
              <div className="intel-panel-title">Intelligence</div>
              <div className="intel-control-tabs" role="tablist" aria-label="Tools">
                <button type="button" role="tab" aria-selected={controlTab === 'search'} className={`intel-control-tab ${controlTab === 'search' ? 'active' : ''}`} onClick={() => setControlTab('search')} title="Search for a place"><Search size={14} /> Search</button>
                <button type="button" role="tab" aria-selected={controlTab === 'map'} className={`intel-control-tab ${controlTab === 'map' ? 'active' : ''}`} onClick={() => setControlTab('map')} title="Map view and 2D/3D"><Map size={14} /> Map</button>
                <button type="button" role="tab" aria-selected={controlTab === 'layers'} className={`intel-control-tab ${controlTab === 'layers' ? 'active' : ''}`} onClick={() => setControlTab('layers')} title="Layers and filters"><Layers size={14} /> Layers</button>
                <button type="button" role="tab" aria-selected={controlTab === 'intel'} className={`intel-control-tab ${controlTab === 'intel' ? 'active' : ''}`} onClick={() => setControlTab('intel')} title="Area intel and feeds"><Target size={14} /> Intel</button>
                <button type="button" role="tab" aria-selected={controlTab === 'maps'} className={`intel-control-tab ${controlTab === 'maps' ? 'active' : ''}`} onClick={() => setControlTab('maps')} title="Map modes"><Globe size={14} /> Maps</button>
                <button type="button" role="tab" aria-selected={controlTab === 'news'} className={`intel-control-tab ${controlTab === 'news' ? 'active' : ''}`} onClick={() => setControlTab('news')} title="News"><Newspaper size={14} /> News</button>
              </div>
              <div className="intel-control-tab-content">
                {controlTab === 'search' && (
                  <div className="intel-tab-pane intel-tab-search">
                    <div className="intel-sources-header"><h2>Search map</h2></div>
                    <p className="intel-tab-desc">Find a city, address, or place to fly the map there.</p>
                    <div className="intel-map-search-wrap intel-panel-search-wrap" ref={mapSearchWrapRef}>
                      <form className="intel-dashboard-search" onSubmit={handleSearch}>
                        <Search size={18} aria-hidden />
                        <input
                          type="text"
                          placeholder="City, address, or place…"
                          value={searchQuery}
                          onChange={(e) => { setSearchQuery(e.target.value); setSearchDropdownOpen(false) }}
                          onFocus={() => searchResults.length > 0 && setSearchDropdownOpen(true)}
                          disabled={searchLoading}
                          aria-label="Search map for an area"
                          autoComplete="off"
                        />
                        <button type="submit" disabled={searchLoading} title="Look up area">{searchLoading ? '…' : 'Go'}</button>
                      </form>
                      {searchDropdownOpen && searchResults.length > 0 && (
                        <ul className="intel-map-search-results" role="listbox">
                          {searchResults.map((place, i) => (
                            <li
                              key={`${place.lat}-${place.lng}-${i}`}
                              role="option"
                              className="intel-map-search-result"
                              onClick={() => pickSearchResult(place)}
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickSearchResult(place) } }}
                              tabIndex={0}
                            >
                              <MapPin size={14} />
                              <span>{place.displayName}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
                {controlTab === 'map' && (
                  <div className="intel-tab-pane intel-tab-map">
                    <div className="intel-sources-header"><h2>View</h2></div>
                    <div className="intel-view-toggle">
                      <button type="button" className={viewMode === '2d' ? 'active' : ''} onClick={() => setViewMode('2d')} title="2D map"><MapPin size={16} /> 2D</button>
                      <button type="button" className={viewMode === '3d' ? 'active' : ''} onClick={() => setViewMode('3d')} title="3D globe"><Globe size={16} /> 3D</button>
                    </div>
                    {viewMode === '3d' && mapboxToken && (
                      <>
                        <div className="intel-view-angle">
                          <LayoutGrid size={16} aria-hidden />
                          <select value={viewPreset} onChange={(e) => setViewPreset(e.target.value)} title="Camera angle" aria-label="View angle">
                            {Object.entries(VIEW_PRESETS).map(([key, { label }]) => (
                              <option key={key} value={key}>{label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="intel-map-style" title="3D buildings = full elevation. Satellite = 3D when zoomed in (zoom 12+).">
                          <select value={mapStyleKey} onChange={(e) => setMapStyleKey(e.target.value)} aria-label="Map style">
                            <option value="standard">3D buildings</option>
                            <option value="satellite">Satellite + 3D</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                )}
                {controlTab === 'layers' && (
                  <div className="intel-tab-pane intel-tab-layers">
                    <div className="intel-filters-card">
                      <div className="intel-sources-header"><Filter size={18} /><h2>Filters</h2></div>
                      <label className="intel-filter-row"><input type="checkbox" checked={showFlights} onChange={(e) => setShowFlights(e.target.checked)} /><span><Plane size={14} /> Flights</span></label>
                      <label className="intel-filter-row"><input type="checkbox" checked={showShips} onChange={(e) => setShowShips(e.target.checked)} /><span><Ship size={14} /> Ships</span></label>
                      {viewMode === '3d' && (
                        <label className="intel-filter-row" title="Road congestion (3D only, Mapbox Traffic)">
                          <input type="checkbox" checked={showTraffic} onChange={(e) => setShowTraffic(e.target.checked)} />
                          <span><Car size={14} /> Traffic</span>
                        </label>
                      )}
                      <label className="intel-filter-row"><input type="checkbox" checked={showGdacs} onChange={(e) => setShowGdacs(e.target.checked)} /><span>Disasters</span></label>
                      <label className="intel-filter-row"><input type="checkbox" checked={showEarthquakes} onChange={(e) => setShowEarthquakes(e.target.checked)} /><span>Earthquakes</span></label>
                      <label className="intel-filter-row intel-filter-speed"><span>Min speed (kn)</span><input type="number" min="0" step="1" placeholder="Any" value={minSpeedFilter} onChange={(e) => setMinSpeedFilter(e.target.value)} /></label>
                      <div className="intel-filter-row intel-filter-speed"><span>Display limit</span><select value={displayLimitIndex} onChange={(e) => setDisplayLimitIndex(Number(e.target.value))}>{DISPLAY_LIMIT_OPTIONS.map((opt, i) => <option key={i} value={i}>{opt.flights} / {opt.ships}</option>)}</select></div>
                      <div className="intel-filter-row intel-filter-trail"><span>Trail</span><select value={trailLengthMinutes} onChange={(e) => setTrailLengthMinutes(Number(e.target.value))}><option value={0}>Off</option><option value={2}>2 min</option><option value={5}>5 min</option><option value={10}>10 min</option></select></div>
                    </div>
                    {anomalyList.length > 0 && (
                      <div className="intel-anomalies-card">
                        <div className="intel-sources-header"><AlertTriangle size={18} /><h2>Anomalies ({anomalyList.length})</h2></div>
                        <ul className="intel-anomalies-list">
                          {anomalyList.slice(0, 12).map((a) => (
                            <li key={`${a.type}-${a.id}`} className="intel-anomaly-item">
                              <span className="intel-anomaly-type">{a.type === 'flight' ? 'F' : 'S'}</span>
                              <span className="intel-anomaly-id">{a.meta?.callsign || a.meta?.name || a.id}</span>
                              <span className="intel-anomaly-reasons">{a.anomalyReasons.join(', ')}</span>
                            </li>
                          ))}
                        </ul>
                        {anomalyList.length > 12 && <p className="intel-anomalies-more">+{anomalyList.length - 12}</p>}
                      </div>
                    )}
                  </div>
                )}
                {controlTab === 'intel' && (
                  <div className="intel-tab-pane intel-tab-intel">
                    {selectedPoint ? (
                      <div className="intel-area-feeds-card">
                        <div className="intel-sources-header">
                          <h2>Feeds at this area</h2>
                          <button type="button" className="intel-close-area" onClick={() => setSelectedPoint(null)} aria-label="Close"><X size={18} /></button>
                        </div>
                        <p className="intel-area-coords">{selectedPoint.lat.toFixed(4)}, {selectedPoint.lng.toFixed(4)}</p>
                        <p className="intel-area-hint">Click map to change location. Cameras need an API key (see Sources).</p>
                        {areaFeeds.loading ? <p className="intel-area-loading">Loading…</p> : (
                          <>
                            <div className="intel-area-section">
                              <strong><Plane size={14} /> Flights</strong>
                              <span>{flightsWithAnomalies.length}{flightsWithAnomalies.length > limits.flights ? ` (${limits.flights})` : ''}</span>
                            </div>
                            <div className="intel-area-section">
                              <strong><Ship size={14} /> Ships</strong>
                              <span>{shipsWithAnomalies.length}{shipsWithAnomalies.length > limits.ships ? ` (${limits.ships})` : ''}</span>
                            </div>
                            {areaFeeds.weather && (
                              <div className="intel-area-section intel-weather">
                                <strong><Cloud size={14} /> Weather</strong>
                                <span>{areaFeeds.weather.temp}°C · {areaFeeds.weather.condition} · Wind {areaFeeds.weather.windSpeed} km/h</span>
                              </div>
                            )}
                            <div className="intel-area-section intel-cameras">
                              <strong><Video size={14} /> Live webcams</strong>
                              {areaFeeds.cameras.length > 0 ? (
                                <ul className="intel-camera-list">
                                  {areaFeeds.cameras.map((c) => (
                                    <li key={c.id} className="intel-camera-item">
                                      <a href={c.url} target="_blank" rel="noopener noreferrer" className="intel-camera-link">
                                        {c.thumbnail ? <img src={c.thumbnail} alt="" className="intel-camera-thumb" /> : <span className="intel-camera-placeholder" />}
                                        <span className="intel-camera-name">{c.name}</span>
                                      </a>
                                      <button type="button" className="intel-camera-watch-btn" onClick={() => setSelectedCamera(c)} title="Watch live"><Video size={14} /> Watch</button>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <>
                                  {areaFeeds.error && (
                                    <p className="intel-area-feed-error" title={areaFeeds.error}>
                                      {areaFeeds.error.startsWith('Windy:') ? 'Windy: check key or CORS (see MANUAL_SETUP.md).' : areaFeeds.error}
                                    </p>
                                  )}
                                  <p className="intel-area-no-cameras">No webcams here. Search a city (e.g. London, Tokyo) or set VITE_WINDY_API_KEY for more.</p>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="intel-area-feeds-card">
                        <div className="intel-sources-header"><h2>Area intel</h2></div>
                        <p className="intel-area-hint">Click a point on the map to see feeds, weather, and webcams for that area. Use search to jump to a place.</p>
                        <p className="intel-intel-note">Future: gather intel from map data (terrain, infrastructure, population) to understand regions and support response planning.</p>
                      </div>
                    )}
                  </div>
                )}
                {controlTab === 'maps' && (
                  <div className="intel-tab-pane intel-tab-maps">
                    <div className="intel-sources-header"><h2>Map mode</h2></div>
                    <p className="intel-tab-desc">Load different map contexts for operations. Strategy maps and response plans (by area + intel) coming later.</p>
                    <div className="intel-map-mode-list">
                      <label className="intel-map-mode-option">
                        <input type="radio" name="mapMode" value="tactical" checked={mapMode === 'tactical'} onChange={(e) => setMapMode(e.target.value)} />
                        <span><MapPin size={14} /> Tactical</span>
                        <small>Default: flights, ships, disasters, weather.</small>
                      </label>
                      <label className="intel-map-mode-option">
                        <input type="radio" name="mapMode" value="disaster" checked={mapMode === 'disaster'} onChange={(e) => setMapMode(e.target.value)} />
                        <span><AlertTriangle size={14} /> Disaster focus</span>
                        <small>Emphasize GDACS, earthquakes, and hazards.</small>
                      </label>
                      <label className="intel-map-mode-option">
                        <input type="radio" name="mapMode" value="strategy" checked={mapMode === 'strategy'} onChange={(e) => setMapMode(e.target.value)} />
                        <span><Target size={14} /> Strategy</span>
                        <small>Coming soon: deploy strategy maps and create response plans from map + intel.</small>
                      </label>
                    </div>
                  </div>
                )}
                {controlTab === 'news' && (
                  <div className="intel-tab-pane intel-tab-news">
                    <div className="intel-sources-header"><h2>News</h2></div>
                    <p className="intel-tab-desc">News aggregate for the visible region and selected topics. Coming soon.</p>
                    <div className="intel-news-placeholder">
                      <Newspaper size={32} className="intel-news-placeholder-icon" />
                      <p>Regional news and alerts will appear here. You can filter by area (map bounds) and category (disasters, security, weather).</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="intel-sources-overlay">
            <button type="button" className="intel-sources-btn" onClick={() => setSourcesOpen((o) => !o)} aria-expanded={sourcesOpen} title="Data sources"><Info size={18} /></button>
            {sourcesOpen && (
              <div className="intel-sources-popover">
                <div className="intel-sources-header"><Layers size={16} /><h3>Sources</h3><button type="button" onClick={() => setSourcesOpen(false)} aria-label="Close"><X size={14} /></button></div>
                <ul className="intel-sources-list">
                  <li><Satellite size={14} /><span>Satellite – Esri / Mapbox</span></li>
                  <li><Plane size={14} /><span>Flights – OpenSky</span></li>
                  <li><Ship size={14} /><span>Ships – {isRealAISEnabled() ? 'AISHub' : 'Set AISHub keys'}</span></li>
                  <li><Car size={14} /><span>Traffic – Mapbox (3D only)</span></li>
                  <li><MapPin size={14} /><span>Parishes</span></li>
                  <li><AlertTriangle size={14} /><span>GDACS, USGS</span></li>
                  <li><Cloud size={14} /><span>Weather – Open-Meteo</span></li>
                  <li><Video size={14} /><span>Cameras</span></li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedCamera && (
        <div className="intel-camera-modal-overlay" onClick={() => setSelectedCamera(null)} role="presentation">
          <div className="intel-camera-modal" onClick={(e) => e.stopPropagation()}>
            <div className="intel-camera-modal-header">
              <h3><Video size={20} /> {selectedCamera.name}</h3>
              <button type="button" className="intel-camera-modal-close" onClick={() => setSelectedCamera(null)} aria-label="Close"><X size={24} /></button>
            </div>
            <div className="intel-camera-modal-body">
              {selectedCamera.url && selectedCamera.url !== '#' && !selectedCamera.url.startsWith('#') ? (
                <iframe title={selectedCamera.name} src={selectedCamera.url} className="intel-camera-iframe" />
              ) : (
                <p className="intel-camera-modal-fallback">No embed URL. <a href={selectedCamera.url && selectedCamera.url !== '#' ? selectedCamera.url : 'https://www.windy.com'} target="_blank" rel="noopener noreferrer">Open in new tab</a></p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Intel
