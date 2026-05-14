/**
 * Snapshot of which browser-side integrations are configured / active.
 * Use for debugging: set VITE_LOG_ACTIVE_DATA_SOURCES=true and reload.
 */
import { isSupabaseConfigured } from './supabaseClient'
import { getMapboxAccessToken, readViteEnv } from './env'
import { isExternalIntelFeedsEnabled, isWindyForecastEnabled } from './externalIntelFeeds'
import { isWebcamFeedsEnabled } from './webcamFeeds'

function hasEnv(...keys) {
  return keys.some((k) => {
    const v = readViteEnv(k)
    return !!(v && String(v).trim())
  })
}

/**
 * @returns {Record<string, unknown>}
 */
export function getActiveClientDataSources() {
  const externalIntelFeeds = isExternalIntelFeedsEnabled()
  const windyForecastEnabled = isWindyForecastEnabled()
  const webcamConfigured = isWebcamFeedsEnabled()
  const webcamActive = externalIntelFeeds && webcamConfigured

  return {
    supabaseConfigured: isSupabaseConfigured,
    mapboxTokenPresent: !!getMapboxAccessToken(),
    /** When true, National Overview may call Windy point forecast (if keys set). Also true when externalIntelFeeds is on. */
    windyForecastEnabled,
    /** When true, Intel/Overview may call OpenSky, GDACS, USGS, Nominatim, Open-Meteo, Windy forecast, news URL, AISHub (if keys set). */
    externalIntelFeedsEnabled: externalIntelFeeds,
    /** When true, Windy/OpenWebcamDB webcam HTTP calls may run (only if externalIntelFeeds is also true). */
    webcamFeedsEnabled: webcamConfigured,
    webcamApiCallsActive: webcamActive,
    keysPresentButMayBeUnused: {
      windyForecast: hasEnv('VITE_WINDY_FORECAST_API_KEY', 'VITE_WINDY_API_KEY'),
      windyWebcam: hasEnv('VITE_WINDY_WEBCAM_API_KEY', 'VITE_WINDY_API_KEY'),
      openwebcamdb: hasEnv('VITE_OPENWEBCAMDB_API_KEY'),
      aishub: hasEnv('VITE_AISHUB_USERNAME') && hasEnv('VITE_AISHUB_KEY'),
      newsApiUrl: hasEnv('VITE_NEWS_API_URL'),
    },
    mapTilesNote: 'Leaflet/OSM or Esri basemap tiles still load for 2D maps when you open Intel.',
  }
}

export function logActiveClientDataSourcesIfEnabled() {
  if (typeof import.meta === 'undefined') return
  if (import.meta.env?.VITE_LOG_ACTIVE_DATA_SOURCES !== 'true') return
  // eslint-disable-next-line no-console -- intentional dev aid
  console.info('[DRIS] Active client data sources:', getActiveClientDataSources())
}
