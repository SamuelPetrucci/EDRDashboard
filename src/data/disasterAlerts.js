// Disaster alert system data
// In production, this would connect to FEMA, ODPEM, NHC, etc.

export const getActiveAlerts = () => {
  // Demo alerts - in production, fetch from real alert systems
  return [
    {
      id: 'alert-1',
      type: 'hurricane',
      severity: 'watch', // watch, warning, advisory
      title: 'Hurricane Watch - Potential System',
      description: 'Tropical system developing in Atlantic. Monitor closely.',
      affectedParishes: ['kingston', 'st-andrew', 'st-catherine', 'portland', 'st-mary'],
      issued: new Date(Date.now() - 10800000).toISOString(),
      expires: new Date(Date.now() + 172800000).toISOString(),
      actions: [
        'Review evacuation routes',
        'Check emergency supplies',
        'Monitor official updates',
        'Secure outdoor items'
      ],
      source: 'NHC/ODPEM'
    },
    {
      id: 'alert-2',
      type: 'flood',
      severity: 'advisory',
      title: 'Flood Advisory - Heavy Rainfall Expected',
      description: 'Heavy rainfall may cause flooding in low-lying areas',
      affectedParishes: ['st-thomas', 'portland', 'st-mary'],
      issued: new Date(Date.now() - 3600000).toISOString(),
      expires: new Date(Date.now() + 86400000).toISOString(),
      actions: [
        'Avoid flood-prone areas',
        'Do not drive through flooded roads',
        'Monitor water levels',
        'Prepare sandbags if in flood zone'
      ],
      source: 'Meteorological Service'
    }
  ]
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



