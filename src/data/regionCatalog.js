/**
 * Active geographic dataset for DRIS (Jamaica parishes vs USA states test mode).
 */
import { getAllParishes, getParishById } from './jamaicaParishes'
import { parishCoordinates, jamaicaCenter, defaultZoom } from './parishCoordinates'
import { getAllUsStates, getUsStateById, usStateCoordinates } from './usStates'
import { JAMAICA_BBOX, USA_CONUS_BBOX } from './intelSources'

export const REGION_JAMAICA = 'jamaica'
export const REGION_USA = 'usa'

/**
 * When `true` (default for current release), the app only exposes Jamaica: no dataset
 * switcher, and region is always Jamaica. USA catalog code remains for a future toggle.
 * Set to `false` to show the Layout “Dataset” control and allow `REGION_USA`.
 */
export const JAMAICA_DATASET_ONLY = true

/** @typedef {'jamaica'|'usa'} DatasetRegion */

const usaCenter = { lat: 39.5, lng: -98.35 }
const usaLeafletZoom = 4

const jamaicaCatalog = {
  id: REGION_JAMAICA,
  storageScope: REGION_JAMAICA,
  getAllJurisdictions: getAllParishes,
  getJurisdictionById: getParishById,
  coordinatesMap: parishCoordinates,
  mapCenter: jamaicaCenter,
  leafletDefaultZoom: defaultZoom,
  feedBbox: JAMAICA_BBOX,
  /** Initial 3D globe camera for Intel */
  globeInitialViewState: {
    longitude: jamaicaCenter.lng,
    latitude: jamaicaCenter.lat,
    zoom: 5.5,
    pitch: 48,
    bearing: 0,
  },
  overviewSubtitle: `Strategic emergency management · ${getAllParishes().length} parishes`,
  jurisdictionLabelPlural: 'Parishes',
  jurisdictionLabelSingular: 'Parish',
  notFoundHeading: 'Parish not found',
  navShortLabel: 'JM',
}

const usaCatalogBase = () => ({
  id: REGION_USA,
  storageScope: REGION_USA,
  getAllJurisdictions: getAllUsStates,
  getJurisdictionById: getUsStateById,
  coordinatesMap: usStateCoordinates,
  mapCenter: usaCenter,
  leafletDefaultZoom: usaLeafletZoom,
  feedBbox: USA_CONUS_BBOX,
  globeInitialViewState: {
    longitude: usaCenter.lng,
    latitude: usaCenter.lat,
    zoom: 3.45,
    pitch: 40,
    bearing: 0,
  },
  overviewSubtitle: `Test mode · ${getAllUsStates().length} US states`,
  jurisdictionLabelPlural: 'States',
  jurisdictionLabelSingular: 'State',
  notFoundHeading: 'State not found',
  navShortLabel: 'USA',
})

let usaMemo
function getUsaCatalog() {
  if (!usaMemo) usaMemo = usaCatalogBase()
  return usaMemo
}

/**
 * @param {DatasetRegion} region
 */
export function getRegionCatalog(region) {
  return region === REGION_USA ? getUsaCatalog() : jamaicaCatalog
}

export function normalizeRegion(region) {
  return region === REGION_USA ? REGION_USA : REGION_JAMAICA
}
