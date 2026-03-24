import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getAllParishes } from '../data/jamaicaParishes'
import { jamaicaCenter } from '../data/parishCoordinates'
import GlobeView from '../components/GlobeView'
import { MapPin, Users, Package, AlertCircle, CheckCircle, Clock, BookOpen, MessageSquare, BarChart3, ArrowRight, GraduationCap, Bell, Cloud, Thermometer, ExternalLink, Radio, Truck, Zap, Heart, UserCheck, Satellite, Shield, Phone, LayoutGrid, Globe, Search, Video } from 'lucide-react'
import DisasterAlerts from '../components/DisasterAlerts'
import { getParishScorecard } from '../utils/scorecardStorage'
import { getParishEquipment, getParishPersonnel } from '../utils/equipmentStorage'
import { calculateOverallScore, getRecoveryStatus } from '../data/scorecardDomains'
import { getRequiredTrainings, getAllTrainings } from '../data/trainings'
import { getWeatherData } from '../data/weatherFeed'
import { getCommunications } from '../data/communications'
import { fetchNewsForBounds } from '../data/newsFeed'
import { JAMAICA_BBOX } from '../data/intelSources'
import { searchPlaces } from '../data/geocode'
import { getWeatherAtPoint } from '../data/weatherAtPoint'
import { fetchCamerasNearPoint } from '../data/cameraFeed'
import './GlobalOverview.css'

const GlobalOverview = () => {
  const parishes = getAllParishes()
  const requiredTrainings = getRequiredTrainings()
  const allTrainings = getAllTrainings()
  const communications = getCommunications()
  const [weather, setWeather] = useState(null)
  const [weatherError, setWeatherError] = useState(null)
  const [weatherView, setWeatherView] = useState('3day') // 'hourly' | '3day' | 'week'
  const satelliteUrl = 'https://www.windy.com/?18.1096,-77.2975,7,satellite'
  const mapboxToken = typeof import.meta !== 'undefined' && import.meta.env?.VITE_MAPBOX_TOKEN

  const [feedSearchQuery, setFeedSearchQuery] = useState('')
  const [feedSearchResults, setFeedSearchResults] = useState([])
  const [feedSearchOpen, setFeedSearchOpen] = useState(false)
  const [feedSearching, setFeedSearching] = useState(false)
  const [feedSelectedPlace, setFeedSelectedPlace] = useState(null)
  const [feedWeather, setFeedWeather] = useState(null)
  const [feedCameras, setFeedCameras] = useState([])
  const [feedLoading, setFeedLoading] = useState(false)
  const [feedError, setFeedError] = useState(null)
  const [newsArticles, setNewsArticles] = useState([])
  const [newsLoading, setNewsLoading] = useState(false)
  const [newsError, setNewsError] = useState(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const result = await getWeatherData()
      if (cancelled) return
      if (result.data) {
        setWeather(result.data)
        setWeatherError(null)
      } else {
        setWeather(null)
        setWeatherError(result.error || 'Weather unavailable')
      }
    }
    load()
    const interval = setInterval(load, 30 * 60 * 1000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const handleFeedSearch = async (e) => {
    e?.preventDefault()
    const q = feedSearchQuery.trim()
    if (!q) return
    setFeedSearching(true)
    setFeedSearchResults([])
    setFeedSearchOpen(true)
    try {
      const results = await searchPlaces(q, 5)
      setFeedSearchResults(results || [])
    } catch {
      setFeedSearchResults([])
    }
    setFeedSearching(false)
  }

  const pickFeedPlace = (place) => {
    setFeedSelectedPlace(place)
    setFeedSearchQuery(place.displayName)
    setFeedSearchResults([])
    setFeedSearchOpen(false)
  }

  useEffect(() => {
    if (!feedSelectedPlace || typeof feedSelectedPlace.lat !== 'number' || typeof feedSelectedPlace.lng !== 'number') return
    setFeedLoading(true)
    setFeedError(null)
    const point = { lat: feedSelectedPlace.lat, lng: feedSelectedPlace.lng }
    Promise.all([getWeatherAtPoint(point), fetchCamerasNearPoint(point, 50)])
      .then(([w, cams]) => {
        setFeedWeather(w ?? null)
        setFeedCameras(Array.isArray(cams) ? cams : [])
        setFeedError(null)
      })
      .catch((err) => {
        setFeedWeather(null)
        setFeedCameras([])
        setFeedError(err?.message || 'Failed to load feeds')
      })
      .finally(() => setFeedLoading(false))
  }, [feedSelectedPlace?.lat, feedSelectedPlace?.lng])

  useEffect(() => {
    let cancelled = false
    const loadNews = async () => {
      setNewsLoading(true)
      setNewsError(null)
      try {
        const list = await fetchNewsForBounds(JAMAICA_BBOX, 12)
        if (cancelled) return
        setNewsArticles(Array.isArray(list) ? list : [])
        setNewsError(null)
      } catch {
        if (cancelled) return
        setNewsArticles([])
        setNewsError('Unable to load news aggregate right now.')
      } finally {
        if (!cancelled) setNewsLoading(false)
      }
    }

    loadNews()
    const interval = setInterval(loadNews, 5 * 60 * 1000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  // Get readiness status for each parish
  const getParishReadiness = (parish) => {
    const scorecardData = getParishScorecard(parish.id)
    
    if (!scorecardData || !scorecardData.domains) {
      return {
        score: 0,
        status: 'Not Assessed',
        color: 'var(--text-secondary)',
        assessed: false
      }
    }

    const overallScore = calculateOverallScore(scorecardData.domains)
    const recoveryStatus = getRecoveryStatus(overallScore)
    
    return {
      score: overallScore,
      status: recoveryStatus.status,
      color: recoveryStatus.color,
      assessed: true
    }
  }

  // Effective equipment/personnel per parish (storage or default)
  const getEffective = (parish) => {
    const eq = getParishEquipment(parish.id)
    const pers = getParishPersonnel(parish.id)
    let equipment = parish.equipment
    let personnel = parish.personnel
    if (eq) {
      const { lastUpdated, updatedBy, ...rest } = eq
      equipment = rest
    }
    if (pers) {
      const { lastUpdated, updatedBy, ...rest } = pers
      personnel = rest
    }
    return { equipment, personnel }
  }

  // Aggregate inventory stats (meaningful categories)
  const inventoryAgg = parishes.reduce(
    (acc, parish) => {
      const { equipment, personnel } = getEffective(parish)
      acc.emergencyVehicles += equipment.emergencyVehicles || 0
      acc.generators += equipment.generators || 0
      acc.medicalSupplies += equipment.medicalSupplies || 0
      acc.waterTrucks += equipment.waterTrucks || 0
      acc.emergencyResponders += personnel.emergencyResponders || 0
      acc.medicalStaff += personnel.medicalStaff || 0
      acc.volunteers += personnel.volunteers || 0
      acc.totalEquipment += Object.values(equipment).filter((v) => typeof v === 'number').reduce((a, b) => a + b, 0)
      acc.totalPersonnel += Object.values(personnel).filter((v) => typeof v === 'number').reduce((a, b) => a + b, 0)
      return acc
    },
    { emergencyVehicles: 0, generators: 0, medicalSupplies: 0, waterTrucks: 0, emergencyResponders: 0, medicalStaff: 0, volunteers: 0, totalEquipment: 0, totalPersonnel: 0 }
  )

  const totalPopulation = parishes.reduce((sum, parish) => sum + parish.population, 0)

  // Calculate readiness statistics
  const readinessStats = parishes.reduce((stats, parish) => {
    const readiness = getParishReadiness(parish)
    if (!readiness.assessed) {
      stats.notAssessed++
    } else if (readiness.status === 'Resilient') {
      stats.resilient++
    } else if (readiness.status === 'Restoring') {
      stats.restoring++
    } else {
      stats.needSupport++
    }
    return stats
  }, { resilient: 0, restoring: 0, needSupport: 0, notAssessed: 0 })

  // Calculate average readiness score
  const assessedParishes = parishes.filter(p => getParishReadiness(p).assessed)
  const averageScore = assessedParishes.length > 0
    ? assessedParishes.reduce((sum, p) => sum + getParishReadiness(p).score, 0) / assessedParishes.length
    : 0

  return (
    <div className="global-overview">
      <div className="page-header">
        <h1>Emergency Resilience Scorecard (TM)</h1>
        <p className="subtitle">Strategic Emergency Management - 14 Parishes Overview</p>
      </div>

      {/* At-a-Glance Overview */}
      <div className="scorecard-overview-section">
        <div className="section-header">
          <div className="header-content">
            <BarChart3 size={24} />
            <h2>Overview</h2>
          </div>
          <Link to="/scorecard" className="view-all-link">
            View Full Scorecard <ArrowRight size={16} />
          </Link>
        </div>
        <div className="overview-body">
          <div className="overview-primary">
            <div className="scorecard-grid">
              {weather?.current ? (
                <div className="scorecard-weather-card">
                  <div className="weather-card-header">
                    <Cloud size={20} />
                    <span>Weather</span>
                  </div>
                  <div className="weather-card-main">
                    <div className="weather-card-temp">
                      <Thermometer size={24} />
                      <span>{weather.current.temperature}°C</span>
                    </div>
                    <div className="weather-card-condition">{weather.current.condition}</div>
                    <div className="weather-card-details">
                      <span>H {weather.current.humidity}%</span>
                      <span>W {weather.current.windSpeed} km/h {weather.current.windDirection}</span>
                      {weather.current.pressure != null && <span>{weather.current.pressure} hPa</span>}
                    </div>
                  </div>
                  {((weather.hourly?.length > 0) || (weather.forecast?.length > 0)) && (
                    <>
                      <div className="weather-forecast-tabs">
                        {['hourly', '3day', 'week'].map((view) => (
                          <button
                            key={view}
                            type="button"
                            className={`weather-forecast-tab ${weatherView === view ? 'active' : ''}`}
                            onClick={() => setWeatherView(view)}
                          >
                            {view === 'hourly' ? 'Hourly' : view === '3day' ? '3-day' : 'Week'}
                          </button>
                        ))}
                      </div>
                      <div className="weather-forecast-list">
                        {weatherView === 'hourly' && weather.hourly?.slice(0, 8).map((h, i) => (
                          <div key={i} className="weather-forecast-item weather-forecast-item--hourly">
                            <span className="weather-forecast-time">{h.time.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })}</span>
                            <span className="weather-forecast-temp">{h.temperature != null ? `${h.temperature}°` : '—'}</span>
                            <span className="weather-forecast-precip">{h.precipitation > 0 ? `${h.precipitation} mm` : '—'}</span>
                          </div>
                        ))}
                        {weatherView === '3day' && weather.forecast?.slice(0, 3).map((d, i) => (
                          <div key={i} className="weather-forecast-item weather-forecast-item--day">
                            <span className="weather-forecast-day">{d.date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                            <span className="weather-forecast-high-low">
                              {d.high != null ? d.high : '—'}° / {d.low != null ? d.low : '—'}°
                            </span>
                            <span className="weather-forecast-condition">{d.condition}</span>
                          </div>
                        ))}
                        {weatherView === 'week' && weather.forecast?.slice(0, 7).map((d, i) => (
                          <div key={i} className="weather-forecast-item weather-forecast-item--day">
                            <span className="weather-forecast-day">{d.date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                            <span className="weather-forecast-high-low">
                              {d.high != null ? d.high : '—'}° / {d.low != null ? d.low : '—'}°
                            </span>
                            <span className="weather-forecast-condition">{d.condition}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  <a
                    href={satelliteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="weather-satellite-link"
                  >
                    <ExternalLink size={14} />
                    View satellite
                  </a>
                </div>
              ) : (
                <div className="scorecard-weather-card scorecard-weather-card-placeholder">
                  <div className="weather-card-header">
                    <Cloud size={20} />
                    <span>Weather</span>
                  </div>
                  <div className="weather-card-main">
                    <span className="weather-placeholder-text">—</span>
                    {weatherError ? (
                      <>
                        <p className="weather-placeholder-hint weather-error-hint">{weatherError}</p>
                        <a
                          href="https://api.windy.com/keys"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="weather-satellite-link"
                        >
                          <ExternalLink size={14} />
                          Get or renew key at api.windy.com/keys
                        </a>
                      </>
                    ) : (
                      <p className="weather-placeholder-hint">Set VITE_WINDY_FORECAST_API_KEY in .env for live weather.</p>
                    )}
                    <a href={satelliteUrl} target="_blank" rel="noopener noreferrer" className="weather-satellite-link">
                      <ExternalLink size={14} /> View satellite
                    </a>
                  </div>
                </div>
              )}
              <div className="scorecard-summary-card">
            <div className="score-display">
              <div className="score-circle-large" style={{ borderColor: getRecoveryStatus(averageScore).color }}>
                <span className="score-value-large">{averageScore.toFixed(0)}%</span>
              </div>
              <div className="score-info">
                <h3>Average Readiness</h3>
                <div className="status-badge-large" style={{ backgroundColor: getRecoveryStatus(averageScore).color }}>
                  {getRecoveryStatus(averageScore).status}
                </div>
              </div>
            </div>
          </div>
          <div className="readiness-stats-grid-compact">
            <div className="readiness-stat-card-compact">
              <CheckCircle size={26} style={{ color: 'var(--resilient-color)' }} />
              <div>
                <h4>{readinessStats.resilient}</h4>
                <p>Resilient</p>
              </div>
            </div>
            <div className="readiness-stat-card-compact">
              <Clock size={26} style={{ color: 'var(--restoring-color)' }} />
              <div>
                <h4>{readinessStats.restoring}</h4>
                <p>Restoring</p>
              </div>
            </div>
            <div className="readiness-stat-card-compact">
              <AlertCircle size={26} style={{ color: 'var(--need-support-color)' }} />
              <div>
                <h4>{readinessStats.needSupport}</h4>
                <p>Need Support</p>
              </div>
            </div>
            <div className="readiness-stat-card-compact">
              <AlertCircle size={26} style={{ color: 'var(--text-secondary)' }} />
              <div>
                <h4>{readinessStats.notAssessed}</h4>
                <p>Not Assessed</p>
              </div>
            </div>
          </div>
        </div>
          </div>
          <div className="overview-sidebar">
            <div className="overview-sidebar-card">
              <h4 className="overview-sidebar-title"><LayoutGrid size={18} /> Quick access</h4>
              <nav className="overview-sidebar-links">
                <Link to="/" className="overview-sidebar-link"><BarChart3 size={16} /> Overview</Link>
                <Link to="/scorecard" className="overview-sidebar-link"><BarChart3 size={16} /> Full scorecard</Link>
                <Link to="/intel" className="overview-sidebar-link"><Satellite size={16} /> Intel map</Link>
                <Link to="/protocols" className="overview-sidebar-link"><BookOpen size={16} /> Protocols & training</Link>
                <Link to="/contacts" className="overview-sidebar-link"><Phone size={16} /> Contacts</Link>
                <Link to="/parish/kingston" className="overview-sidebar-link"><MapPin size={16} /> Parishes</Link>
              </nav>
            </div>
            <div className="overview-sidebar-card overview-live-feeds-card">
              <h4 className="overview-sidebar-title"><Video size={18} /> Live feeds</h4>
              <p className="overview-live-feeds-desc">Search a place to see weather and webcams.</p>
              <form className="overview-live-feeds-search" onSubmit={handleFeedSearch}>
                <Search size={16} aria-hidden />
                <input
                  type="text"
                  placeholder="City or place…"
                  value={feedSearchQuery}
                  onChange={(e) => { setFeedSearchQuery(e.target.value); setFeedSearchOpen(false) }}
                  onFocus={() => feedSearchResults.length > 0 && setFeedSearchOpen(true)}
                  aria-label="Search for live feeds by place"
                  autoComplete="off"
                />
                <button type="submit" disabled={feedSearching} title="Search">{feedSearching ? '…' : 'Go'}</button>
              </form>
              {feedSearchOpen && feedSearchResults.length > 0 && (
                <ul className="overview-live-feeds-results" role="listbox">
                  {feedSearchResults.map((place, i) => (
                    <li
                      key={`${place.lat}-${place.lng}-${i}`}
                      role="option"
                      className="overview-live-feeds-result"
                      onClick={() => pickFeedPlace(place)}
                    >
                      {place.displayName}
                    </li>
                  ))}
                </ul>
              )}
              {feedSelectedPlace && (
                <div className="overview-live-feeds-result-panel">
                  <p className="overview-live-feeds-place">{feedSelectedPlace.displayName}</p>
                  {feedLoading ? (
                    <p className="overview-live-feeds-loading">Loading…</p>
                  ) : (
                    <>
                      {feedError && <p className="overview-live-feeds-error">{feedError}</p>}
                      {feedWeather && (
                        <div className="overview-live-feeds-weather">
                          <Cloud size={14} />
                          <span>{feedWeather.temp}°C · {feedWeather.condition} · Wind {feedWeather.windSpeed} km/h</span>
                        </div>
                      )}
                      {feedCameras.length > 0 && (
                        <div className="overview-live-feeds-cameras">
                          <strong><Video size={14} /> Webcams</strong>
                          <ul className="overview-live-feeds-camera-list">
                            {feedCameras.slice(0, 5).map((c) => (
                              <li key={c.id}>
                                <a href={c.url} target="_blank" rel="noopener noreferrer" className="overview-live-feeds-camera-link">{c.name}</a>
                              </li>
                            ))}
                          </ul>
                          {feedCameras.length > 5 && <p className="overview-live-feeds-more">+{feedCameras.length - 5} more on Intel map</p>}
                        </div>
                      )}
                      {!feedLoading && !feedError && !feedWeather && feedCameras.length === 0 && (
                        <p className="overview-live-feeds-empty">No weather or webcams found. Try another place.</p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Intelligence Overview */}
      <div className="intel-overview-section">
        <div className="section-header">
          <div className="header-content">
            <Satellite size={22} />
            <h2>Intelligence overview</h2>
          </div>
          <Link to="/intel" className="view-all-link">
            Open Intel dashboard <ArrowRight size={16} />
          </Link>
        </div>
        <div className="intel-overview-body">
          <div className="intel-overview-left">
            <div className="intel-overview-card intel-overview-card--primary">
              <div className="intel-overview-card-header">
                <AlertCircle size={16} />
                <span>AI vision & anomalies</span>
              </div>
              <div className="intel-overview-card-body">
                <p className="intel-overview-copy">
                  This panel will surface key anomalies and AI summaries from flights, ships, weather, and geopolitical feeds.
                  For now, use it as a high-level placeholder for future reporting.
                </p>
                <ul className="intel-overview-list">
                  <li>• No critical anomalies detected in the last cycle.</li>
                  <li>• Connect additional feeds to enable automated alerts and daily briefs.</li>
                </ul>
              </div>
            </div>
            <div className="intel-overview-card">
              <div className="intel-overview-card-header">
                <Radio size={16} />
                <span>Global brief (scaffold)</span>
              </div>
              <div className="intel-overview-card-body intel-overview-brief-body">
                <div className="intel-overview-brief-column">
                  <h3>Today</h3>
                  <p>Top stories and alerts for the current day will be summarized here.</p>
                </div>
                <div className="intel-overview-brief-column">
                  <h3>Week / Month / Quarter</h3>
                  <p>Rolling intel trends will appear here – geopolitical, weather, finance, and disasters.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="intel-overview-right">
            <div className="intel-overview-card intel-overview-card--globe">
              <div className="intel-overview-card-header">
                <Globe size={16} />
                <span>Dynamic satellite globe</span>
              </div>
              <div className="intel-overview-card-body intel-overview-globe-body">
                {mapboxToken ? (
                  <GlobeView
                    mapboxAccessToken={mapboxToken}
                    initialViewState={{
                      longitude: jamaicaCenter.lng,
                      latitude: jamaicaCenter.lat,
                      zoom: 5.5,
                    }}
                    mapStyleKey="satellite"
                    flights={[]}
                    ships={[]}
                    showFlights={false}
                    showShips={false}
                    showTraffic={false}
                    className="overview-intel-globe"
                    style={{ height: 240 }}
                  />
                ) : (
                  <div className="overview-intel-placeholder">
                    <p>Live satellite globe preview.</p>
                    <p className="overview-intel-placeholder-sub">
                      Set <code>VITE_MAPBOX_TOKEN</code> to enable the 3D globe.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid - Training + Inventory (stacked left), Alerts (right, embedded scroll) */}
      <div className="main-content-grid">
        {/* Training Section */}
        <div className="training-section-card">
          <div className="section-header">
            <div className="header-content">
              <GraduationCap size={24} />
              <h2>Training & Protocols</h2>
            </div>
            <Link to="/protocols" className="view-all-link">
              View All <ArrowRight size={16} />
            </Link>
          </div>
          <div className="training-summary">
            <div className="training-stat">
              <div className="stat-number">{requiredTrainings.length}</div>
              <div className="stat-label">Required Trainings</div>
            </div>
            <div className="training-stat">
              <div className="stat-number">{allTrainings.length}</div>
              <div className="stat-label">Total Available</div>
            </div>
          </div>
          <div className="upcoming-trainings">
            <h3>Featured Trainings</h3>
            {requiredTrainings.slice(0, 3).map(training => (
              <div key={training.id} className="training-item">
                <BookOpen size={16} />
                <div>
                  <div className="training-name">{training.name}</div>
                  <div className="training-meta">{training.duration} • {training.provider}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory Summary Section - under Training */}
        <div className="inventory-section-card">
          <div className="section-header">
            <div className="header-content">
              <Package size={24} />
              <h2>Inventory Summary</h2>
            </div>
            <Link to="/parish/kingston" className="view-all-link">
              Manage Inventory <ArrowRight size={16} />
            </Link>
          </div>
          <div className="inventory-stats">
            <div className="inventory-stat-card">
              <Truck size={24} />
              <div>
                <div className="inventory-number">{inventoryAgg.emergencyVehicles.toLocaleString()}</div>
                <div className="inventory-label">Emergency vehicles</div>
              </div>
            </div>
            <div className="inventory-stat-card">
              <Zap size={24} />
              <div>
                <div className="inventory-number">{inventoryAgg.generators.toLocaleString()}</div>
                <div className="inventory-label">Generators</div>
              </div>
            </div>
            <div className="inventory-stat-card">
              <Package size={24} />
              <div>
                <div className="inventory-number">{inventoryAgg.medicalSupplies.toLocaleString()}</div>
                <div className="inventory-label">Medical supply kits</div>
              </div>
            </div>
            <div className="inventory-stat-card">
              <UserCheck size={24} />
              <div>
                <div className="inventory-number">{inventoryAgg.emergencyResponders.toLocaleString()}</div>
                <div className="inventory-label">Emergency responders</div>
              </div>
            </div>
            <div className="inventory-stat-card">
              <Heart size={24} />
              <div>
                <div className="inventory-number">{inventoryAgg.medicalStaff.toLocaleString()}</div>
                <div className="inventory-label">Medical staff</div>
              </div>
            </div>
            <div className="inventory-stat-card">
              <Users size={24} />
              <div>
                <div className="inventory-number">{inventoryAgg.volunteers.toLocaleString()}</div>
                <div className="inventory-label">Trained volunteers</div>
              </div>
            </div>
          </div>
          <div className="inventory-context">
            <MapPin size={14} />
            <span>14 parishes</span>
            <span className="inventory-context-sep">·</span>
            <span>{totalPopulation.toLocaleString()} population</span>
          </div>
        </div>

        {/* Communication & Alerts Section - embedded scroll */}
        <div className="communication-section-card">
          <div className="section-header">
            <div className="header-content">
              <MessageSquare size={24} />
              <h2>Communication & Alerts</h2>
            </div>
          </div>
          <div className="alerts-scroll-container">
            <DisasterAlerts />
            <div className="communications-section">
              <h3 className="communications-title">
                <Radio size={18} />
                Communications
              </h3>
              <p className="communications-intro">
                Bulletins and updates from ODPEM, NHC, and partners.
              </p>
              {communications.length > 0 ? (
                <div className="communications-list">
                  {communications.slice(0, 5).map(item => (
                    <div key={item.id} className="communications-item">
                      <Bell size={14} />
                      <div>
                        <div className="communications-item-title">{item.title}</div>
                        <div className="communications-item-meta">
                          {new Date(item.timestamp).toLocaleString()} · {item.source}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="communications-empty">No recent bulletins.</p>
              )}
            </div>
            <div className="communications-section news-aggregate-section">
              <h3 className="communications-title">
                <Shield size={18} />
                News Aggregate
              </h3>
              <p className="communications-intro">
                Consolidated headlines and updates relevant to regional operations.
              </p>
              {newsLoading ? (
                <p className="communications-empty">Loading news...</p>
              ) : newsError ? (
                <p className="communications-empty">{newsError}</p>
              ) : newsArticles.length > 0 ? (
                <div className="communications-list news-aggregate-list">
                  {newsArticles.slice(0, 6).map((article) => (
                    <div key={article.id} className="communications-item news-aggregate-item">
                      <Bell size={14} />
                      <div>
                        <a
                          href={article.url || '#'}
                          target={article.url ? '_blank' : undefined}
                          rel={article.url ? 'noopener noreferrer' : undefined}
                          className="news-aggregate-title"
                        >
                          {article.title}
                        </a>
                        <div className="communications-item-meta">
                          {(article.source || 'News')}{article.publishedAt ? ` · ${new Date(article.publishedAt).toLocaleString()}` : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="communications-empty">No news items available yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Parishes Grid */}
      <div className="parishes-section">
        <div className="section-header">
          <div className="header-content">
            <MapPin size={24} />
            <h2>Parish Overview</h2>
          </div>
        </div>
        <div className="parishes-grid">
          {parishes.map((parish) => {
            const readiness = getParishReadiness(parish)
            return (
              <div key={parish.id} className="parish-card-modern" style={{ borderTopColor: readiness.color }}>
                <Link to={`/parish/${parish.id}`} className="parish-card-main-link">
                  <div className="parish-card-header-modern">
                    <div>
                      <h3>{parish.name}</h3>
                      <span className="parish-region">{parish.region}</span>
                    </div>
                    {readiness.assessed && (
                      <div className="score-badge-inline" style={{ backgroundColor: readiness.color }}>
                        {readiness.score.toFixed(0)}%
                      </div>
                    )}
                  </div>
                  {/* Readiness Status Preview */}
                  <div className="readiness-preview-modern" style={{ borderLeftColor: readiness.color }}>
                    <div className="readiness-header-modern">
                      {readiness.assessed ? (
                        <>
                          {readiness.status === 'Resilient' && <CheckCircle size={16} style={{ color: readiness.color }} />}
                          {readiness.status === 'Restoring' && <Clock size={16} style={{ color: readiness.color }} />}
                          {readiness.status === 'Need Support' && <AlertCircle size={16} style={{ color: readiness.color }} />}
                          <span className="readiness-status-modern" style={{ color: readiness.color }}>
                            {readiness.status}
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={16} style={{ color: readiness.color }} />
                          <span className="readiness-status-modern" style={{ color: readiness.color }}>
                            {readiness.status}
                          </span>
                        </>
                      )}
                    </div>
                    {readiness.assessed && (
                      <div className="readiness-score-modern">
                        <div className="score-bar-modern">
                          <div 
                            className="score-fill-modern" 
                            style={{ 
                              width: `${readiness.score}%`,
                              backgroundColor: readiness.color
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="parish-stats-modern">
                    <div className="stat-item-modern">
                      <Users size={16} />
                      <span>{parish.population.toLocaleString()}</span>
                    </div>
                    <div className="stat-item-modern">
                      <Package size={16} />
                      <span>{Object.values(getEffective(parish).equipment).filter((v) => typeof v === 'number').reduce((a, b) => a + b, 0)} units</span>
                    </div>
                  </div>
                </Link>
                <Link 
                  to={`/parish/${parish.id}/scorecard`} 
                  className="parish-scorecard-link"
                >
                  <BarChart3 size={16} />
                  View scorecard
                  <ArrowRight size={14} />
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default GlobalOverview

