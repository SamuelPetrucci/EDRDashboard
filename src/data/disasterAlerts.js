// Disaster alert system data
// Connect to FEMA, ODPEM, NHC, etc. for real alerts.

export const getActiveAlerts = () => {
  return []
}

export const alertTypes = {
  hurricane: {
    name: 'Hurricane',
    icon: '🌪️',
    color: '#dc3545',
    description: 'Tropical cyclones with sustained winds of 74 mph or higher'
  },
  flood: {
    name: 'Flood',
    icon: '🌊',
    color: '#0066cc',
    description: 'Overflow of water onto normally dry land'
  },
  earthquake: {
    name: 'Earthquake',
    icon: '🌍',
    color: '#8b4513',
    description: 'Sudden shaking of the ground caused by seismic activity'
  },
  wildfire: {
    name: 'Wildfire',
    icon: '🔥',
    color: '#ff6600',
    description: 'Uncontrolled fires in vegetation'
  },
  tornado: {
    name: 'Tornado',
    icon: '🌪️',
    color: '#8b0000',
    description: 'Violently rotating column of air'
  },
  tsunami: {
    name: 'Tsunami',
    icon: '🌊',
    color: '#000080',
    description: 'Large ocean waves caused by underwater disturbances'
  },
  drought: {
    name: 'Drought',
    icon: '☀️',
    color: '#ffa500',
    description: 'Extended period of abnormally low rainfall'
  }
}



