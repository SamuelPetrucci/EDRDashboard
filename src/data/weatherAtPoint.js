/**
 * Current weather at a point – Open-Meteo (free, no key).
 */

const OPEN_METEO = 'https://api.open-meteo.com/v1/forecast'

/**
 * @param {{ lat: number, lng: number }} point
 * @returns {Promise<{ temp: number, condition: string, windSpeed: number, humidity: number } | null>}
 */
export async function getWeatherAtPoint(point) {
  if (!point || typeof point.lat !== 'number' || typeof point.lng !== 'number') return null
  try {
    const params = new URLSearchParams({
      latitude: String(point.lat),
      longitude: String(point.lng),
      current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
    })
    const res = await fetch(`${OPEN_METEO}?${params}`, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const data = await res.json()
    const c = data?.current
    if (!c) return null
    const condition = weatherCodeToLabel(c.weather_code)
    return {
      temp: c.temperature_2m ?? 0,
      condition,
      windSpeed: c.wind_speed_10m ?? 0,
      humidity: c.relative_humidity_2m ?? 0,
    }
  } catch {
    return null
  }
}

function weatherCodeToLabel(code) {
  const map = {
    0: 'Clear', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Foggy', 48: 'Foggy', 51: 'Drizzle', 53: 'Drizzle', 55: 'Drizzle',
    61: 'Rain', 63: 'Rain', 65: 'Heavy rain', 80: 'Showers', 81: 'Showers', 82: 'Showers',
    95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm',
  }
  return map[code] ?? 'Unknown'
}
