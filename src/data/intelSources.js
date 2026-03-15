/**
 * Intelligence platform – data sources and map layers.
 * Central config for satellite, basemaps, and (later) live feeds.
 * Extend this as we add GDACS, weather, AI insights, etc.
 */

/** Jamaica / Caribbean bounding box (WGS84) for feed requests */
export const JAMAICA_BBOX = {
  lamin: 17.6,
  lomin: -78.6,
  lamax: 18.6,
  lomax: -76.0,
}

/** Refresh intervals in ms */
export const FEED_REFRESH_MS = {
  flights: 50000,
  ships: 65000,
}

/** Max markers to render (avoids lag). User can raise via display limit. */
export const MAX_DISPLAY_FLIGHTS_DEFAULT = 200
export const MAX_DISPLAY_SHIPS_DEFAULT = 120
export const DISPLAY_LIMIT_OPTIONS = [
  { flights: 100, ships: 60 },
  { flights: 200, ships: 120 },
  { flights: 400, ships: 200 },
  { flights: 800, ships: 300 },
]

/** Basemap / tile layer definitions for the Intel map */
export const BASEMAP_LAYERS = [
  {
    id: 'osm',
    name: 'Streets',
    type: 'basemap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    default: true,
  },
  {
    id: 'satellite',
    name: 'Satellite',
    type: 'basemap',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    default: false,
  },
  {
    id: 'topo',
    name: 'Terrain',
    type: 'basemap',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    default: false,
  },
]

/** Weather radar overlay – set VITE_RAINVIEWER_TILE_URL or OpenWeatherMap radar URL in .env */
export const WEATHER_RADAR_OVERLAY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_RAINVIEWER_TILE_URL) || ''

/** Placeholder for future live / overlay sources */
export const OVERLAY_SOURCES = []

export const getDefaultBasemap = () => BASEMAP_LAYERS.find((l) => l.default) || BASEMAP_LAYERS[0]

/** Convert Leaflet LatLngBounds to bbox { lamin, lomin, lamax, lomax } */
export function boundsToBbox(bounds) {
  if (!bounds || !bounds.getSouthWest || !bounds.getNorthEast) return null
  const sw = bounds.getSouthWest()
  const ne = bounds.getNorthEast()
  return {
    lamin: sw.lat,
    lomin: sw.lng,
    lamax: ne.lat,
    lomax: ne.lng,
  }
}
