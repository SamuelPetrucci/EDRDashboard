import { useState, useEffect } from 'react'
import { Map, Radio, RefreshCw, Layers } from 'lucide-react'
import './WeatherRadar.css'

const WeatherRadar = () => {
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [radarType, setRadarType] = useState('precipitation') // 'precipitation', 'satellite', 'wind'
  const [isLoading, setIsLoading] = useState(false)

  // Jamaica coordinates: approximately 18.1096° N, 77.2975° W
  const jamaicaCenter = { lat: 18.1096, lng: -77.2975 }
  const zoom = 7

  // Simulate radar update
  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => {
      setLastUpdate(new Date())
      setIsLoading(false)
    }, 1000)
  }

  // Format time
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // Get radar map URL based on type
  const getRadarUrl = () => {
    // Using OpenWeatherMap radar layer (requires API key in production)
    // For demo, using a static map with radar overlay concept
    // In production, this would connect to: https://tile.openweathermap.org/map/{layer}/{z}/{x}/{y}.png?appid={API_KEY}
    
    // Alternative: Using Windy.com embed or similar service
    // For now, using a map with radar visualization concept
    
    const baseUrl = 'https://www.openstreetmap.org/export/embed.html'
    const bbox = `${jamaicaCenter.lng - 1.5},${jamaicaCenter.lat - 0.8},${jamaicaCenter.lng + 1.5},${jamaicaCenter.lat + 0.8}`
    
    // In production, replace with actual radar tile service
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${jamaicaCenter.lat},${jamaicaCenter.lng}`
  }

  return (
    <div className="weather-radar">
      <div className="radar-header">
        <div className="radar-title-section">
          <Map size={24} />
          <div>
            <h2>Live Weather Radar</h2>
            <p className="radar-subtitle">Jamaica & Caribbean Region</p>
          </div>
        </div>
        <div className="radar-controls">
          <div className="radar-type-selector">
            <Layers size={18} />
            <select
              value={radarType}
              onChange={(e) => setRadarType(e.target.value)}
              className="type-select"
            >
              <option value="precipitation">Precipitation</option>
              <option value="satellite">Satellite</option>
              <option value="wind">Wind</option>
            </select>
          </div>
          <button
            className="refresh-button"
            onClick={handleRefresh}
            disabled={isLoading}
            title="Refresh radar data"
          >
            <RefreshCw size={18} className={isLoading ? 'spinning' : ''} />
          </button>
        </div>
      </div>

      <div className="radar-status">
        <Radio size={16} />
        <span>Live</span>
        <span className="update-time">
          Last updated: {formatTime(lastUpdate)}
        </span>
      </div>

      <div className="radar-container">
        {/* Radar Map */}
        <div className="radar-map-wrapper">
          <iframe
            src={`https://embed.windy.com/embed2.html?lat=${jamaicaCenter.lat}&lon=${jamaicaCenter.lng}&zoom=${zoom}&level=surface&overlay=${radarType}&menu=&message=&marker=&calendar=&pressure=&type=map&location=coordinates&detail=&detailLat=${jamaicaCenter.lat}&detailLon=${jamaicaCenter.lng}&metricWind=default&metricTemp=default&radarRange=-1`}
            width="100%"
            height="100%"
            frameBorder="0"
            title="Jamaica Weather Radar"
            className="radar-iframe"
          />
        </div>
      </div>

      <div className="radar-footer">
        <p className="radar-note">
          <strong>Data Source:</strong> Windy.com / OpenWeatherMap (Demo)
        </p>
        <p className="radar-note">
          In production, this would connect to Jamaica Meteorological Service radar feeds
        </p>
      </div>
    </div>
  )
}

export default WeatherRadar

