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
import { fetchNewsForBounds } from '../data/newsFeed'
import { fetchGdacsEvents } from '../data/gdacsFeed'
import { fetchEarthquakes } from '../data/earthquakeFeed'
import { detectAnomalies } from '../utils/anomalyDetection'
import MapBoundsReporter from '../components/MapBoundsReporter'
import MapClickHandler from '../components/MapClickHandler'
import FlyToTarget from '../components/FlyToTarget'
import FollowTrackedVessel from '../components/FollowTrackedVessel'
import IntelDashboardScaffold from '../components/IntelDashboardScaffold'
import GlobeView from '../components/GlobeView'
import 'leaflet/dist/leaflet.css'
import './Intel.css'

/** Windy viewer URLs load the full map (often satellite) in an iframe; use a new tab for those. */
function cameraUrlEmbedsInline(url) {
  if (!url || url === '#') return false
  try {
    const u = new URL(url)
    return !u.hostname.includes('windy.com')
  } catch {
    return false
  }
}

function formatCameraFeedError(msg) {
  if (!msg) return msg
  if (msg.startsWith('Windy:')) return 'Windy: check key or CORS (see MANUAL_SETUP.md).'
  if (msg.startsWith('OpenWebcamDB:')) return 'OpenWebcamDB: check API key (see MANUAL_SETUP.md).'
  return msg
}

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
  oblique: { pitch: 48, bearing: 0, label: 'Oblique' },
  horizon: { pitch: 60, bearing: 0, label: 'Horizon' },
}

/** Initial 3D globe view: angled at Jamaica like a cylindrical globe spawning in */
const GLOBE_JAMAICA_VIEW = {
  longitude: jamaicaCenter.lng,
  latitude: jamaicaCenter.lat,
  zoom: 5.5,
  pitch: 48,
  bearing: 0,
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

/** Webcam/camera marker – video icon style. */
function createCameraIcon() {
  const size = 32
  return L.divIcon({
    className: 'intel-camera-marker',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:#2563EB;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;color:white;font-size:16px;" title="Webcam">📹</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
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
  const [trailLengthMinutes, setTrailLengthMinutes] = useState(2)
  const [trailHistory, setTrailHistory] = useState({ flights: {}, ships: {} })
  const [displayLimitIndex, setDisplayLimitIndex] = useState(1)
  const [trackedEntity, setTrackedEntity] = useState(null) // { id, type: 'flight'|'ship', label }
  const [viewMode, setViewMode] = useState('3d') // '2d' | '3d' – 3D globe by default
  const [selectedCamera, setSelectedCamera] = useState(null) // { id, name, url } for live feed modal
  const [selectedMapFeature, setSelectedMapFeature] = useState(null) // { type: 'flight'|'ship'|'webcam', id, lat, lng } for 3D globe popup
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const [controlsCollapsed, setControlsCollapsed] = useState(false)
  const [viewPreset, setViewPreset] = useState('oblique') // 'top' | 'oblique' | 'horizon' – 3D camera angle (oblique = angled Jamaica spawn)
  const [mapStyleKey, setMapStyleKey] = useState('standard') // 'standard' = 3D buildings with elevation, 'satellite' = satellite imagery
  const [intelView, setIntelView] = useState('map') // 'map' | 'dashboard'
  const [controlTab, setControlTab] = useState('search') // 'search' | 'map' | 'layers' | 'intel' | 'webcams' | 'maps' | 'news'
  const [mapMode, setMapMode] = useState('tactical') // 'tactical' | 'disaster' | 'strategy' – for different map contexts / future response plans
  const [webcamSearchQuery, setWebcamSearchQuery] = useState('')
  const [webcamSearchResults, setWebcamSearchResults] = useState([])
  const [webcamSearchOpen, setWebcamSearchOpen] = useState(false)
  const [webcamSearching, setWebcamSearching] = useState(false)
  const [webcamPlace, setWebcamPlace] = useState(null)
  const [webcamList, setWebcamList] = useState([])
  const [webcamLoading, setWebcamLoading] = useState(false)
  const [webcamError, setWebcamError] = useState(null)
  const [newsArticles, setNewsArticles] = useState([])
  const [newsLoading, setNewsLoading] = useState(false)
  const [newsError, setNewsError] = useState(null)
  const mapSearchWrapRef = useRef(null)
  const mapboxToken = typeof import.meta !== 'undefined' && import.meta.env?.VITE_MAPBOX_TOKEN
  const hasWebcamKey =
    typeof import.meta !== 'undefined' &&
    (import.meta.env?.VITE_WINDY_WEBCAM_API_KEY ||
      import.meta.env?.VITE_WINDY_API_KEY ||
      import.meta.env?.VITE_OPENWEBCAMDB_API_KEY)

  useEffect(() => {
    if (!searchDropdownOpen) return
    const close = (e) => {
      if (mapSearchWrapRef.current && !mapSearchWrapRef.current.contains(e.target)) setSearchDropdownOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [searchDropdownOpen])

  // Default selected point so area feeds (weather, webcams) load for initial map view
  useEffect(() => {
    setSelectedPoint((prev) => prev ?? jamaicaCenter)
  }, [])

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
        if (trailLengthMinutes > 0) setTrailHistory((prev) => mergeTrail(prev, 'flights', data, nowMs, windowMs))
      }).catch(() => setFlightError(true)),
      fetchShipsInBounds(bbox).then((data) => {
        setShips(data)
        setShipError(false)
        if (trailLengthMinutes > 0) setTrailHistory((prev) => mergeTrail(prev, 'ships', data, nowMs, windowMs))
      }).catch(() => setShipError(true)),
    ]).then(() => setLastUpdated(Date.now()))
  }, [mapBbox, trailLengthMinutes])

  useEffect(() => {
    fetchFeeds()
    const ms = Math.max(FEED_REFRESH_MS.flights, FEED_REFRESH_MS.ships)
    const t = setInterval(fetchFeeds, ms)
    return () => clearInterval(t)
  }, [fetchFeeds])

  useEffect(() => {
    const load = () => {
      fetchGdacsEvents(mapBbox).then(setGdacsEvents).catch(() => setGdacsEvents([]))
      fetchEarthquakes(mapBbox).then(setEarthquakes).catch(() => setEarthquakes([]))
      setNewsLoading(true)
      setNewsError(null)
      fetchNewsForBounds(mapBbox, 24)
        .then((list) => {
          setNewsArticles(Array.isArray(list) ? list : [])
          setNewsError(null)
        })
        .catch(() => {
          setNewsArticles([])
          setNewsError('Failed to load news for this region.')
        })
        .finally(() => setNewsLoading(false))
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

  const handleWebcamSearch = async (e) => {
    e?.preventDefault()
    const q = webcamSearchQuery.trim()
    if (!q) return
    setWebcamSearching(true)
    setWebcamSearchResults([])
    setWebcamSearchOpen(true)
    try {
      const results = await searchPlaces(q, 5)
      setWebcamSearchResults(results || [])
    } catch {
      setWebcamSearchResults([])
    }
    setWebcamSearching(false)
  }

  const pickWebcamPlace = (place) => {
    setWebcamPlace(place)
    setWebcamSearchQuery(place.displayName)
    setWebcamSearchResults([])
    setWebcamSearchOpen(false)
  }

  useEffect(() => {
    if (!webcamPlace || typeof webcamPlace.lat !== 'number' || typeof webcamPlace.lng !== 'number') return
    setWebcamLoading(true)
    setWebcamError(null)
    const point = { lat: webcamPlace.lat, lng: webcamPlace.lng }
    fetchCamerasNearPoint(point, 50)
      .then((list) => {
        setWebcamList(Array.isArray(list) ? list : [])
        setWebcamError(null)
      })
      .catch((err) => {
        setWebcamList([])
        setWebcamError(err?.message || 'Failed to load webcams')
      })
      .finally(() => setWebcamLoading(false))
  }, [webcamPlace?.lat, webcamPlace?.lng])

  const handleMapClick = useCallback((point) => {
    setSelectedPoint(point)
    setSelectedMapFeature(null)
  }, [])
  const startTracking = useCallback((id, type, label) => setTrackedEntity({ id, type, label }), [])
  const stopTracking = useCallback(() => setTrackedEntity(null), [])
  const handleGlobeFeatureClick = useCallback((feature) => {
    setSelectedMapFeature({
      type: feature.type,
      id: feature.id,
      lat: feature.lat,
      lng: feature.lng,
    })
    if (feature.type === 'flight') {
      const flight = flights.find((f) => f.id === feature.id)
      startTracking(feature.id, 'flight', flight?.meta?.callsign || feature.id)
    } else if (feature.type === 'ship') {
      const ship = ships.find((s) => s.id === feature.id)
      startTracking(feature.id, 'ship', ship?.meta?.name || feature.id)
    }
  }, [flights, ships, startTracking])

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
  const displayedCameras = useMemo(() => {
    const byId = {}
    ;(areaFeeds.cameras || []).forEach((c) => { byId[c.id] = c })
    ;(webcamList || []).forEach((c) => { byId[c.id] = c })
    return Object.values(byId)
  }, [areaFeeds.cameras, webcamList])
  const anomalyList = useMemo(() => [
    ...flightsWithAnomalies.filter((f) => f.isAnomaly).map((f) => ({ ...f, type: 'flight' })),
    ...shipsWithAnomalies.filter((s) => s.isAnomaly).map((s) => ({ ...s, type: 'ship' })),
  ], [flightsWithAnomalies, shipsWithAnomalies])
  const trackedEntityData = useMemo(() => {
    if (!trackedEntity) return null
    if (trackedEntity.type === 'flight') return displayedFlights.find((f) => f.id === trackedEntity.id) || null
    return displayedShips.find((s) => s.id === trackedEntity.id) || null
  }, [trackedEntity, displayedFlights, displayedShips])

  const globePopupContent = useMemo(() => {
    if (!selectedMapFeature) return null
    const { type, id } = selectedMapFeature
    if (type === 'flight') {
      const f = displayedFlights.find((x) => x.id === id)
      if (!f) return null
      return (
        <div className="intel-popup intel-movement-popup intel-flight-detail">
          <strong className="intel-flight-callsign">{f.meta?.callsign || f.id}</strong>
          <div className="intel-flight-meta">
            <span>ICAO24: {f.meta?.icao24 || f.id}</span>
            <span>Country: {f.meta?.originCountry ?? '—'}</span>
            <span>Altitude: {f.altitude != null ? `${Math.round(f.altitude)} m (${Math.round(f.altitude * 3.28084)} ft)` : '—'}</span>
            <span>Speed: {f.speed != null ? `${Math.round(f.speed)} m/s (${Math.round(f.speed * 1.94384)} kt)` : '—'}</span>
            <span>Heading: {f.heading != null ? `${Math.round(f.heading)}°` : '—'}</span>
            {f.verticalRate != null && <span>Vertical: {f.verticalRate > 0 ? '+' : ''}{f.verticalRate.toFixed(0)} m/s</span>}
            {f.onGround && <span className="intel-flight-onground">On ground</span>}
          </div>
          {f.isAnomaly && <span className="intel-popup-anomaly"><AlertTriangle size={14} /> {f.anomalyReasons.join(', ')}</span>}
          <div className="intel-popup-actions">
            <button type="button" className="intel-popup-track-btn" onClick={() => startTracking(f.id, 'flight', f.meta?.callsign || f.id)}>
              <Navigation size={14} /> Track live
            </button>
            <a href={`https://opensky-network.org/network/explorer?icao24=${encodeURIComponent(f.id)}`} target="_blank" rel="noopener noreferrer" className="intel-popup-link">
              More info (OpenSky) <ExternalLink size={12} />
            </a>
          </div>
        </div>
      )
    }
    if (type === 'ship') {
      const s = displayedShips.find((x) => x.id === id)
      if (!s) return null
      return (
        <div className="intel-popup intel-movement-popup">
          <strong>{s.meta?.name || s.id}</strong>
          <span className="intel-popup-meta">{s.meta?.shipType ?? '—'} · {s.speed != null ? `${s.speed.toFixed(1)} kn` : '—'}</span>
          {s.isAnomaly && <span className="intel-popup-anomaly"><AlertTriangle size={14} /> {s.anomalyReasons.join(', ')}</span>}
          <button type="button" className="intel-popup-track-btn" onClick={() => startTracking(s.id, 'ship', s.meta?.name || s.id)}>
            <Navigation size={14} /> Track live
          </button>
        </div>
      )
    }
    if (type === 'webcam') {
      const c = displayedCameras.find((x) => x.id === id)
      if (!c) return null
      return (
        <div className="intel-popup intel-camera-popup">
          <strong>{c.name}</strong>
          <span className="intel-popup-meta">Live webcam</span>
          <button type="button" className="intel-popup-track-btn" onClick={() => setSelectedCamera(c)}>
            <Video size={14} /> Watch live
          </button>
          {c.url && c.url !== '#' && (
            <a href={c.url} target="_blank" rel="noopener noreferrer" className="intel-popup-link">Open in new tab <ExternalLink size={12} /></a>
          )}
        </div>
      )
    }
    return null
  }, [selectedMapFeature, displayedFlights, displayedShips, displayedCameras, startTracking])

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
  const trackedFlightTrailPoints = useMemo(() => {
    if (!trackedEntity || trackedEntity.type !== 'flight' || trailLengthMinutes <= 0) return []
    const nowMs = Date.now()
    const points = (trailHistory.flights?.[trackedEntity.id] || []).filter((p) => p.t > nowMs - trailWindowMs)
    return points.length >= 2 ? points : []
  }, [trackedEntity, trailHistory.flights, trailLengthMinutes, trailWindowMs])
  const trackedFlightTrail2D = useMemo(
    () => trackedFlightTrailPoints.map((p) => [p.lat, p.lng]),
    [trackedFlightTrailPoints]
  )
  const trackedFlightTrail3D = useMemo(
    () => trackedFlightTrailPoints.map((p) => [p.lng, p.lat]),
    [trackedFlightTrailPoints]
  )

  return (
    <div className="intel-dashboard">
      <header className="intel-page-header">
        <div className="intel-page-header-tabs">
          <button
            type="button"
            className={intelView === 'map' ? 'active' : ''}
            onClick={() => setIntelView('map')}
          >
            Map
          </button>
          <button
            type="button"
            className={intelView === 'dashboard' ? 'active' : ''}
            onClick={() => setIntelView('dashboard')}
          >
            Dashboard
          </button>
        </div>
      </header>
      <div className="intel-dashboard-main">
        <div className="intel-map-wrapper">
          {intelView === 'dashboard' ? (
            <IntelDashboardScaffold />
          ) : viewMode === '3d' && mapboxToken ? (
            <>
              {trackedEntity && (
                <div className="intel-tracking-pill">
                  <Navigation size={16} />
                  <span>
                    Tracking: {trackedEntity.label}
                    {trackedEntity.type === 'flight' && trackedEntityData?.altitude != null && ` · ${Math.round(trackedEntityData.altitude * 3.28084)} ft`}
                    {trackedEntityData?.speed != null && ` · ${trackedEntity.type === 'flight' ? `${Math.round(trackedEntityData.speed * 1.94384)} kt` : `${trackedEntityData.speed.toFixed(1)} kn`}`}
                  </span>
                  <button type="button" className="intel-tracking-stop" onClick={stopTracking} aria-label="Stop tracking">Stop</button>
                </div>
              )}
              <GlobeView
                mapboxAccessToken={mapboxToken}
                initialViewState={GLOBE_JAMAICA_VIEW}
                spawnFlyToDuration={1800}
                pitch={VIEW_PRESETS[viewPreset]?.pitch ?? GLOBE_JAMAICA_VIEW.pitch}
                bearing={VIEW_PRESETS[viewPreset]?.bearing ?? GLOBE_JAMAICA_VIEW.bearing}
                flyToTarget={flyToTarget}
                onFlyToComplete={() => setFlyToTarget(null)}
                mapStyleKey={mapStyleKey}
                flights={displayedFlights}
                ships={displayedShips}
                cameras={displayedCameras}
                flightTrails={flightTrailLines}
                shipTrails={shipTrailLines}
                showFlights={showFlights}
                showShips={showShips}
                showTraffic={showTraffic}
                onClick={handleMapClick}
                onBoundsChange={setMapBbox}
                onFeatureClick={handleGlobeFeatureClick}
                selectedFeature={selectedMapFeature}
                popupContent={globePopupContent}
                onClosePopup={() => setSelectedMapFeature(null)}
                trackedEntity={trackedEntity}
                trackedFlightTrail={trackedFlightTrail3D}
                className="intel-globe"
                style={{ height: '100%', minHeight: 400 }}
              />
            </>
          ) : viewMode === '3d' && !mapboxToken ? (
            <GlobeView mapboxAccessToken={null} className="intel-globe" style={{ height: '100%', minHeight: 400 }} />
          ) : (
            <>
          {trackedEntity && (
            <div className="intel-tracking-pill">
              <Navigation size={16} />
              <span>
                Tracking: {trackedEntity.label}
                {trackedEntity.type === 'flight' && trackedEntityData?.altitude != null && ` · ${Math.round(trackedEntityData.altitude * 3.28084)} ft`}
                {trackedEntityData?.speed != null && ` · ${trackedEntity.type === 'flight' ? `${Math.round(trackedEntityData.speed * 1.94384)} kt` : `${trackedEntityData.speed.toFixed(1)} kn`}`}
              </span>
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
            {trackedEntity?.type === 'flight' && trackedFlightTrail2D.length >= 2 && (
              <Polyline
                positions={trackedFlightTrail2D}
                pathOptions={{ color: '#f97316', weight: 4, opacity: 0.95, dashArray: '10 8' }}
              />
            )}
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
                  {showFlights && displayedFlights
                    .filter((f) => typeof f.lat === 'number' && typeof f.lng === 'number' && !Number.isNaN(f.lat) && !Number.isNaN(f.lng))
                    .map((f) => (
                    <Marker
                      key={`f-${f.id}`}
                      position={[f.lat, f.lng]}
                      icon={createMovementIcon('flight', f.isAnomaly, f.heading)}
                      eventHandlers={{ click: () => startTracking(f.id, 'flight', f.meta?.callsign || f.id) }}
                    >
                      <Popup>
                        <div className="intel-popup intel-movement-popup intel-flight-detail">
                          <strong className="intel-flight-callsign">{f.meta?.callsign || f.id}</strong>
                          <div className="intel-flight-meta">
                            <span>ICAO24: {f.meta?.icao24 || f.id}</span>
                            <span>Country: {f.meta?.originCountry ?? '—'}</span>
                            <span>Altitude: {f.altitude != null ? `${Math.round(f.altitude)} m (${Math.round(f.altitude * 3.28084)} ft)` : '—'}</span>
                            <span>Speed: {f.speed != null ? `${Math.round(f.speed)} m/s (${Math.round(f.speed * 1.94384)} kt)` : '—'}</span>
                            <span>Heading: {f.heading != null ? `${Math.round(f.heading)}°` : '—'}</span>
                            {f.verticalRate != null && <span>Vertical: {f.verticalRate > 0 ? '+' : ''}{f.verticalRate.toFixed(0)} m/s</span>}
                            {f.onGround && <span className="intel-flight-onground">On ground</span>}
                          </div>
                          {f.isAnomaly && <span className="intel-popup-anomaly"><AlertTriangle size={14} /> {f.anomalyReasons.join(', ')}</span>}
                          <div className="intel-popup-actions">
                            <button type="button" className="intel-popup-track-btn" onClick={() => startTracking(f.id, 'flight', f.meta?.callsign || f.id)}>
                              <Navigation size={14} /> Track live
                            </button>
                            <a href={`https://opensky-network.org/network/explorer?icao24=${encodeURIComponent(f.id)}`} target="_blank" rel="noopener noreferrer" className="intel-popup-link">
                              More info (OpenSky) <ExternalLink size={12} />
                            </a>
                          </div>
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
                    <Marker key={e.id} position={[e.lat, e.lng]} icon={createAlertIcon(e.severity === 'Red' ? '#EF4444' : e.severity === 'Orange' ? '#0EA5E9' : '#10B981')}>
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
              <Overlay name="Webcams" checked={true}>
                <LayerGroup>
                  {areaFeeds.cameras.filter((c) => typeof c.lat === 'number' && typeof c.lng === 'number' && !Number.isNaN(c.lat) && !Number.isNaN(c.lng)).map((c) => (
                    <Marker key={c.id} position={[c.lat, c.lng]} icon={createCameraIcon()}>
                      <Popup>
                        <div className="intel-popup intel-camera-popup">
                          <strong>{c.name}</strong>
                          <span className="intel-popup-meta">Live webcam</span>
                          <button type="button" className="intel-popup-track-btn" onClick={() => setSelectedCamera(c)}>
                            <Video size={14} /> Watch live
                          </button>
                          {c.url && c.url !== '#' && (
                            <a href={c.url} target="_blank" rel="noopener noreferrer" className="intel-popup-link">Open in new tab <ExternalLink size={12} /></a>
                          )}
                        </div>
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
          {intelView !== 'dashboard' && (
            <div className="intel-map-legend" role="list" aria-label="Map legend">
              <div className="intel-map-legend-title">Map legend</div>
              <div className="intel-map-legend-item">
                <span className="intel-map-legend-icon intel-map-legend-flight" aria-hidden>✈</span>
                <span>Flights</span>
              </div>
              <div className="intel-map-legend-item">
                <span className="intel-map-legend-icon intel-map-legend-ship" aria-hidden>🚢</span>
                <span>Ships</span>
              </div>
              <div className="intel-map-legend-item">
                <span className="intel-map-legend-icon intel-map-legend-webcam" aria-hidden>📹</span>
                <span>Webcams</span>
              </div>
              <div className="intel-map-legend-item">
                <span className="intel-map-legend-dot intel-map-legend-disaster" />
                <span>Disasters (GDACS)</span>
              </div>
              <div className="intel-map-legend-item">
                <span className="intel-map-legend-dot intel-map-legend-earthquake" />
                <span>Earthquakes</span>
              </div>
            </div>
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
                <button type="button" role="tab" aria-selected={controlTab === 'webcams'} className={`intel-control-tab ${controlTab === 'webcams' ? 'active' : ''}`} onClick={() => setControlTab('webcams')} title="Live webcams (OpenWebcamDB or Windy)"><Video size={14} /> Webcams</button>
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
                                <>
                                  <p className="intel-camera-list-hint">Click a camera name or <strong>Watch</strong> to preview. Windy feeds must use <strong>Open in new tab</strong>; OpenWebcamDB may play inline when the stream allows it.</p>
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
                                </>
                              ) : (
                                <>
                                  {areaFeeds.error && (
                                    <p className="intel-area-feed-error" title={areaFeeds.error}>
                                      {formatCameraFeedError(areaFeeds.error)}
                                    </p>
                                  )}
                                  <p className="intel-area-no-cameras">No webcams in range. Try another city or set VITE_OPENWEBCAMDB_API_KEY / Windy keys in .env (see MANUAL_SETUP.md).</p>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="intel-area-feeds-card">
                        <div className="intel-sources-header"><h2>Area intel</h2></div>
                        <p className="intel-area-hint">Click a point on the map (or search for a city, e.g. London, Tokyo) to load feeds and webcams for that area.</p>
                        <p className="intel-area-hint intel-webcam-where">Set <code>VITE_OPENWEBCAMDB_API_KEY</code> and/or Windy webcam keys in <code>.env</code>. After you click or search, cameras list under <strong>Live webcams</strong>.</p>
                        <p className="intel-intel-note">Future: gather intel from map data (terrain, infrastructure, population) to understand regions and support response planning.</p>
                      </div>
                    )}
                  </div>
                )}
                {controlTab === 'webcams' && (
                  <div className="intel-tab-pane intel-tab-webcams">
                    <div className="intel-sources-header"><h2><Video size={18} /> Live webcams</h2></div>
                    <p className="intel-tab-desc">Search a place to list nearby cameras (OpenWebcamDB when configured, otherwise Windy).</p>
                    {!hasWebcamKey && (
                      <p className="intel-webcam-key-hint">Set <code>VITE_OPENWEBCAMDB_API_KEY</code> and/or <code>VITE_WINDY_WEBCAM_API_KEY</code> in <code>.env</code> and restart the app.</p>
                    )}
                    <form className="intel-dashboard-search" onSubmit={handleWebcamSearch}>
                      <Search size={18} aria-hidden />
                      <input
                        type="text"
                        placeholder="City or place (e.g. London, Tokyo, Montego Bay)"
                        value={webcamSearchQuery}
                        onChange={(e) => { setWebcamSearchQuery(e.target.value); setWebcamSearchOpen(false) }}
                        onFocus={() => webcamSearchResults.length > 0 && setWebcamSearchOpen(true)}
                        disabled={webcamSearching}
                        aria-label="Search for webcams by place"
                        autoComplete="off"
                      />
                      <button type="submit" disabled={webcamSearching} title="Search">{webcamSearching ? '…' : 'Go'}</button>
                    </form>
                    {webcamSearchOpen && webcamSearchResults.length > 0 && (
                      <ul className="intel-map-search-results" role="listbox">
                        {webcamSearchResults.map((place, i) => (
                          <li
                            key={`${place.lat}-${place.lng}-${i}`}
                            role="option"
                            className="intel-map-search-result"
                            onClick={() => pickWebcamPlace(place)}
                          >
                            <MapPin size={14} />
                            <span>{place.displayName}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {webcamPlace && (
                      <div className="intel-webcam-result-panel">
                        <p className="intel-webcam-place">{webcamPlace.displayName}</p>
                        {webcamLoading ? (
                          <p className="intel-area-loading">Loading webcams…</p>
                        ) : (
                          <>
                            {webcamError && (
                              <p className="intel-area-feed-error" title={webcamError}>
                                {formatCameraFeedError(webcamError)}
                              </p>
                            )}
                            {webcamList.length > 0 ? (
                              <ul className="intel-camera-list">
                                {webcamList.map((c) => (
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
                              !webcamError && <p className="intel-area-no-cameras">No webcams found here. Try another city (e.g. London, Tokyo).</p>
                            )}
                          </>
                        )}
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
                    <p className="intel-tab-desc">Regional news and alerts for the visible map area. Set VITE_NEWS_API_URL / VITE_NEWS_API_KEY to enable a backend.</p>
                    {newsLoading ? (
                      <p className="intel-news-loading">Loading news…</p>
                    ) : (
                      <>
                        {newsError && <p className="intel-news-error">{newsError}</p>}
                        {newsArticles.length === 0 && !newsError && (
                          <div className="intel-news-placeholder">
                            <Newspaper size={32} className="intel-news-placeholder-icon" />
                            <p>No news articles for this area yet.</p>
                            <p className="intel-news-hint">Configure <code>VITE_NEWS_API_URL</code> and <code>VITE_NEWS_API_KEY</code> in your environment to connect a news service.</p>
                          </div>
                        )}
                        {newsArticles.length > 0 && (
                          <ul className="intel-news-list">
                            {newsArticles.map((a) => (
                              <li key={a.id} className="intel-news-item">
                                <div className="intel-news-item-main">
                                  <a
                                    href={a.url || '#'}
                                    target={a.url ? '_blank' : undefined}
                                    rel={a.url ? 'noopener noreferrer' : undefined}
                                    className="intel-news-title"
                                  >
                                    {a.title}
                                  </a>
                                  {a.summary && <p className="intel-news-summary">{a.summary}</p>}
                                </div>
                                <div className="intel-news-meta">
                                  {a.source && <span className="intel-news-source">{a.source}</span>}
                                  {a.publishedAt && (
                                    <span className="intel-news-time">
                                      {new Date(a.publishedAt).toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    )}
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
              <a
                href={selectedCamera.url && selectedCamera.url !== '#' ? selectedCamera.url : 'https://www.windy.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="intel-camera-modal-open-tab"
              >
                Open in new tab
              </a>
              <button type="button" className="intel-camera-modal-close" onClick={() => setSelectedCamera(null)} aria-label="Close"><X size={24} /></button>
            </div>
            <div className="intel-camera-modal-body">
              {selectedCamera.url && selectedCamera.url !== '#' && !selectedCamera.url.startsWith('#') && cameraUrlEmbedsInline(selectedCamera.url) ? (
                <>
                  <iframe title={selectedCamera.name} src={selectedCamera.url} className="intel-camera-iframe" />
                  <p className="intel-camera-modal-fallback">If the player does not load, use <strong>Open in new tab</strong> above.</p>
                </>
              ) : (
                <p className="intel-camera-modal-fallback">
                  {selectedCamera.url && selectedCamera.url.includes('windy.com')
                    ? 'Windy camera pages cannot play inside this window (you would see the map/satellite view). Use Open in new tab above for the webcam viewer.'
                    : 'Use Open in new tab above to watch this camera.'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Intel
