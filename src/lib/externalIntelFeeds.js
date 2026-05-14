/**
 * Third-party intel / overview feeds (OpenSky, AISHub, GDACS, USGS, Nominatim,
 * Open-Meteo, Windy, configurable news, Windy/OpenWebcamDB webcams).
 *
 * Default OFF so the app does not call external services unless you explicitly
 * opt in (keys, quotas, and compliance can be handled when you are ready).
 *
 * Set in `.env`: VITE_ENABLE_EXTERNAL_INTEL_FEEDS=true
 * Windy-only (Overview weather): VITE_ENABLE_WINDY_FORECAST=true (see `isWindyForecastEnabled`).
 */
export function isExternalIntelFeedsEnabled() {
  if (typeof import.meta === 'undefined') return false
  return import.meta.env?.VITE_ENABLE_EXTERNAL_INTEL_FEEDS === 'true'
}

/**
 * Windy Point Forecast (Overview hero weather). Does not enable OpenSky, AIS, etc.
 *
 * Set `VITE_ENABLE_WINDY_FORECAST=true` in `.env`, or turn on all intel with
 * `VITE_ENABLE_EXTERNAL_INTEL_FEEDS=true`.
 */
export function isWindyForecastEnabled() {
  if (typeof import.meta === 'undefined') return false
  if (import.meta.env?.VITE_ENABLE_WINDY_FORECAST === 'true') return true
  return import.meta.env?.VITE_ENABLE_EXTERNAL_INTEL_FEEDS === 'true'
}
