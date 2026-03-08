// Live weather and current events feed data
// In production, this would connect to real APIs (NOAA, NWS, etc.)

export const getWeatherData = () => {
  // Demo data - in production, fetch from API
  return {
    current: {
      temperature: 28,
      condition: 'Partly Cloudy',
      humidity: 75,
      windSpeed: 15,
      windDirection: 'NE',
      pressure: 1013,
      visibility: 10,
      lastUpdated: new Date().toISOString()
    },
    forecast: [
      {
        date: new Date(Date.now() + 86400000).toISOString(),
        high: 30,
        low: 24,
        condition: 'Sunny',
        precipitation: 20,
        windSpeed: 12
      },
      {
        date: new Date(Date.now() + 172800000).toISOString(),
        high: 29,
        low: 23,
        condition: 'Partly Cloudy',
        precipitation: 30,
        windSpeed: 18
      },
      {
        date: new Date(Date.now() + 259200000).toISOString(),
        high: 28,
        low: 22,
        condition: 'Cloudy',
        precipitation: 60,
        windSpeed: 25
      }
    ],
    alerts: [
      {
        id: 'heat-1',
        type: 'heat',
        severity: 'moderate',
        title: 'Heat Advisory',
        message: 'High temperatures expected. Stay hydrated and avoid prolonged sun exposure.',
        issued: new Date(Date.now() - 3600000).toISOString(),
        expires: new Date(Date.now() + 86400000).toISOString()
      }
    ]
  }
}

export const getCurrentEvents = () => {
  // Demo current events - in production, fetch from news APIs
  return [
    {
      id: 'event-1',
      type: 'weather',
      title: 'Tropical Depression Monitoring',
      description: 'Meteorologists monitoring potential tropical system in Atlantic',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      source: 'NOAA/NHC',
      severity: 'low'
    },
    {
      id: 'event-2',
      type: 'preparedness',
      title: 'ODPEM Training Exercise Scheduled',
      description: 'Community disaster preparedness drill planned for next week',
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      source: 'ODPEM',
      severity: 'info'
    }
  ]
}



