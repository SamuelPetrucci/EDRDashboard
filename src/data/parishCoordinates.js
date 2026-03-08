// Actual geographic coordinates (latitude, longitude) for Jamaica's 14 parishes
// Coordinates represent approximate center points of each parish

export const parishCoordinates = {
  'kingston': { lat: 17.9712, lng: -76.7929 },        // Kingston (capital)
  'st-andrew': { lat: 18.0333, lng: -76.7833 },      // St. Andrew (surrounds Kingston)
  'st-catherine': { lat: 18.0500, lng: -77.0167 },   // St. Catherine
  'clarendon': { lat: 18.1167, lng: -77.2667 },      // Clarendon
  'manchester': { lat: 18.0500, lng: -77.5000 },     // Manchester
  'st-ann': { lat: 18.4167, lng: -77.1833 },         // St. Ann
  'st-mary': { lat: 18.3167, lng: -76.9000 },        // St. Mary
  'portland': { lat: 18.1500, lng: -76.4167 },       // Portland
  'st-thomas': { lat: 17.9500, lng: -76.4167 },       // St. Thomas
  'st-elizabeth': { lat: 18.0500, lng: -77.7667 },    // St. Elizabeth
  'westmoreland': { lat: 18.2833, lng: -78.1333 },   // Westmoreland
  'hanover': { lat: 18.4167, lng: -78.1333 },        // Hanover
  'trelawny': { lat: 18.3500, lng: -77.6000 },       // Trelawny
  'st-james': { lat: 18.4667, lng: -77.9167 }        // St. James (Montego Bay)
}

// Get coordinates for a parish
export const getParishCoordinates = (parishId) => {
  return parishCoordinates[parishId] || { lat: 18.1096, lng: -77.2975 } // Default to Jamaica center
}

// Jamaica center point for map initialization
export const jamaicaCenter = { lat: 18.1096, lng: -77.2975 }

// Default zoom level to show all of Jamaica
export const defaultZoom = 8



