import { useState, useEffect } from 'react'
import { Cloud, Droplets, Wind, Thermometer, Eye } from 'lucide-react'
import { getWeatherData, getCurrentEvents } from '../data/weatherFeed'
import './WeatherFeed.css'

const WeatherFeed = () => {
  const [weather, setWeather] = useState(null)
  const [events, setEvents] = useState([])
  const [lastUpdate, setLastUpdate] = useState(null)
  const [forecastView, setForecastView] = useState('hourly') // 'hourly' | 'weekly'

  useEffect(() => {
    const loadData = async () => {
      const weatherData = await getWeatherData()
      const currentEvents = await getCurrentEvents()
      setWeather(weatherData)
      setEvents(currentEvents)
      setLastUpdate(new Date())
    }

    loadData()

    // Simulate live updates every 5 minutes
    const interval = setInterval(loadData, 300000)

    return () => clearInterval(interval)
  }, [])

  if (!weather || !weather.current) {
    return (
      <div className="weather-feed">
        <div className="weather-header">
          <h2>Live Weather & Events</h2>
        </div>
        <div className="no-weather-data">
          <Cloud size={48} />
          <p>No weather data</p>
          <span className="hint">Connect a weather API (NOAA, NWS, Open-Meteo) to show live data.</span>
        </div>
      </div>
    )
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="weather-feed">
      <div className="weather-header">
        <h2>Live Weather & Events</h2>
        {lastUpdate && (
          <span className="update-time">
            Last updated: {formatTime(lastUpdate)}
          </span>
        )}
      </div>

      {/* Current Weather */}
      <div className="current-weather">
        <div className="weather-main">
          <div className="temperature">
            <Thermometer size={32} />
            <span className="temp-value">{weather.current.temperature}°C</span>
          </div>
          <div className="condition">{weather.current.condition}</div>
        </div>
        <div className="weather-details">
          <div className="detail-item">
            <Droplets size={18} />
            <span>Humidity: {weather.current.humidity}%</span>
          </div>
          <div className="detail-item">
            <Wind size={18} />
            <span>Wind: {weather.current.windSpeed} km/h {weather.current.windDirection}</span>
          </div>
          <div className="detail-item">
            <Eye size={18} />
            <span>Visibility: {weather.current.visibility} km</span>
          </div>
          <div className="detail-item">
            <span>Pressure: {weather.current.pressure} hPa</span>
          </div>
        </div>
      </div>

      {/* Weather Alerts */}
      {weather.alerts && weather.alerts.length > 0 && (
        <div className="weather-alerts">
          <h3>Weather Alerts</h3>
          {weather.alerts.map((alert) => (
            <div key={alert.id} className={`alert-item alert-${alert.severity}`}>
              <strong>{alert.title}</strong>
              <p>{alert.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Forecast */}
      {weather.forecast && weather.forecast.length > 0 && (
        <div className="forecast">
          <div className="forecast-header">
            <h3>Forecast</h3>
            <div className="forecast-toggle">
              <button
                type="button"
                className={forecastView === 'hourly' ? 'active' : ''}
                onClick={() => setForecastView('hourly')}
              >
                Next 24h
              </button>
              <button
                type="button"
                className={forecastView === 'weekly' ? 'active' : ''}
                onClick={() => setForecastView('weekly')}
              >
                7-day
              </button>
            </div>
          </div>

          {forecastView === 'hourly' && weather.hourly && weather.hourly.length > 0 && (
            <div className="forecast-grid forecast-grid--hourly">
              {weather.hourly.slice(0, 12).map((h, index) => (
                <div key={index} className="forecast-hour">
                  <div className="forecast-date">
                    {h.time.toLocaleTimeString('en-US', { hour: 'numeric' })}
                  </div>
                  <div className="forecast-condition">{h.condition}</div>
                  <div className="forecast-temps">
                    <span className="high">{h.temperature}°</span>
                  </div>
                  <div className="forecast-precip">
                    <Droplets size={14} />
                    <span>{h.precipitation} mm</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {forecastView === 'weekly' && (
            <div className="forecast-grid">
              {weather.forecast.map((day, index) => (
                <div key={index} className="forecast-day">
                  <div className="forecast-date">
                    {new Date(day.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="forecast-condition">{day.condition}</div>
                  <div className="forecast-temps">
                    <span className="high">{day.high}°</span>
                    <span className="low">{day.low}°</span>
                  </div>
                  <div className="forecast-precip">
                    <Droplets size={14} />
                    <span>{day.precipitation}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Current Events */}
      {events.length > 0 && (
        <div className="current-events">
          <h3>Current Events</h3>
          {events.map((event) => (
            <div key={event.id} className={`event-item event-${event.severity}`}>
              <div className="event-header">
                <strong>{event.title}</strong>
                <span className="event-time">{formatTime(event.timestamp)}</span>
              </div>
              <p>{event.description}</p>
              <span className="event-source">Source: {event.source}</span>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}

export default WeatherFeed



