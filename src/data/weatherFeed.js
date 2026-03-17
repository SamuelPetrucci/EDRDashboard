// Live weather and current events feed data
// Uses Windy Point Forecast API v2 for Jamaica center.
// Key: VITE_WINDY_FORECAST_API_KEY (or fallback VITE_WINDY_API_KEY).

import { jamaicaCenter } from './parishCoordinates'

const WINDY_ENDPOINT = 'https://api.windy.com/api/point-forecast/v2'

export const getWeatherData = async () => {
  const forecastKey = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_WINDY_FORECAST_API_KEY : null
  const legacyKey = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_WINDY_API_KEY : null
  const rawKey = (forecastKey && String(forecastKey).trim()) || (legacyKey && String(legacyKey).trim()) || null
  const apiKey = rawKey ? String(rawKey).trim() : null
  if (!apiKey) return { error: 'No API key. Set VITE_WINDY_FORECAST_API_KEY (or VITE_WINDY_API_KEY) in .env.' }

  try {
    const body = {
      lat: Number(jamaicaCenter.lat.toFixed(2)),
      lon: Number(jamaicaCenter.lng.toFixed(2)),
      model: 'gfs',
      parameters: ['temp', 'rh', 'wind', 'pressure', 'lclouds', 'mclouds', 'hclouds', 'precip'],
      levels: ['surface'],
      key: apiKey,
    }

    const res = await fetch(WINDY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      let message = `Windy API error ${res.status}`
      try {
        const errBody = await res.json()
        if (errBody?.message) message = errBody.message
        else if (errBody?.error) message = errBody.error
      } catch (_) { /* ignore */ }
      if (res.status === 401 || res.status === 403) {
        message = 'Invalid or expired API key. Get a new key at api.windy.com/keys'
      }
      console.error('Windy API', res.status, message)
      return { error: message }
    }

    const data = await res.json()
    const ts = data.ts || []
    if (!Array.isArray(ts) || ts.length === 0) return { error: 'Windy returned no forecast data.' }

    const temps = data['temp-surface'] || []
    const rhs = data['rh-surface'] || []
    const windU = data['wind_u-surface'] || []
    const windV = data['wind_v-surface'] || []
    const pressure = data['pressure-surface'] || []
    const precip = data['past3hprecip-surface'] || []

    const toDate = (t) => new Date(t)
    // Windy returns temperature in Kelvin; convert to Celsius when value looks like K
    const toCelsius = (v) => {
      if (v == null) return null
      const n = Number(v)
      return n > 150 ? Math.round(n - 273.15) : Math.round(n)
    }

    const idxNow = 0
    const nowTemp = toCelsius(temps[idxNow])
    const nowRh = rhs[idxNow] ?? null
    const nowP = pressure[idxNow] ?? null
    const u = windU[idxNow] ?? 0
    const v = windV[idxNow] ?? 0

    const windSpeedMs = Math.hypot(u, v)
    const windSpeedKmh = windSpeedMs * 3.6
    const windDirDeg = (Math.atan2(-u, -v) * 180) / Math.PI
    const windDir = degToCompass(windDirDeg)

    const current = {
      temperature: nowTemp,
      condition: deriveCondition(nowTemp, rhs[idxNow], precip[idxNow]),
      humidity: nowRh != null ? Math.round(nowRh) : null,
      windSpeed: Math.round(windSpeedKmh),
      windDirection: windDir,
      visibility: 10,
      pressure: nowP != null ? Math.round(nowP / 100) : null, // hPa from Pa
    }

    const hourly = ts.slice(0, 16).map((t, i) => {
      const tempC = toCelsius(temps[i])
      const rh = rhs[i]
      const pp = precip[i]
      return {
        time: toDate(t),
        temperature: tempC,
        precipitation: pp != null ? Number(pp.toFixed(1)) : 0,
        humidity: rh != null ? Math.round(rh) : null,
        condition: deriveCondition(tempC, rh, pp),
      }
    })

    const dailyMap = new Map()
    ts.forEach((t, i) => {
      const d = toDate(t)
      const key = d.toISOString().slice(0, 10)
      const temp = temps[i]
      const pp = precip[i] || 0
      if (!dailyMap.has(key)) {
        dailyMap.set(key, {
          date: d,
          high: temp,
          low: temp,
          precipTotal: pp,
        })
      } else {
        const entry = dailyMap.get(key)
        if (temp != null) {
          if (entry.high == null || temp > entry.high) entry.high = temp
          if (entry.low == null || temp < entry.low) entry.low = temp
        }
        entry.precipTotal += pp
      }
    })

    const forecast = Array.from(dailyMap.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 7)
      .map((d) => ({
        date: d.date,
        condition: d.precipTotal > 3 ? 'Wet' : d.precipTotal > 0.5 ? 'Showers' : 'Dry',
        high: toCelsius(d.high),
        low: toCelsius(d.low),
        precipitation: Math.min(100, Math.round((d.precipTotal / 10) * 100)),
      }))

    return {
      data: {
        current,
        alerts: [],
        forecast,
        hourly,
      },
    }
  } catch (err) {
    console.error('Windy API fetch failed', err)
    const message = err?.message || 'Network or server error.'
    return { error: message }
  }
}

export const getCurrentEvents = () => {
  return []
}

function degToCompass(num) {
  const val = Math.round(num / 22.5)
  const arr = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  return arr[(val + 16) % 16]
}

function deriveCondition(temp, rh, precip) {
  if (precip != null && precip > 0.1) return 'Rain / showers'
  if (rh != null && rh > 90) return 'Humid / cloudy'
  if (temp != null && temp > 30) return 'Hot'
  if (temp != null && temp < 20) return 'Cool'
  return 'Fair'
}

