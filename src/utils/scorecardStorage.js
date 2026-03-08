// Utility for storing and retrieving parish-specific scorecard data
// Uses localStorage for persistence

const STORAGE_KEY = 'ltdrr_parish_scorecards'

// Get all stored scorecards
export const getAllScorecards = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.error('Error reading scorecards from storage:', error)
    return {}
  }
}

// Get scorecard for a specific parish
export const getParishScorecard = (parishId) => {
  const allScorecards = getAllScorecards()
  return allScorecards[parishId] || null
}

// Save scorecard for a specific parish
export const saveParishScorecard = (parishId, scorecardData) => {
  try {
    const allScorecards = getAllScorecards()
    allScorecards[parishId] = {
      ...scorecardData,
      lastUpdated: new Date().toISOString()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allScorecards))
    return true
  } catch (error) {
    console.error('Error saving scorecard to storage:', error)
    return false
  }
}

// Initialize scorecard for a parish (if it doesn't exist)
export const initializeParishScorecard = (parishId, defaultDomains) => {
  const existing = getParishScorecard(parishId)
  if (existing) {
    return existing.domains
  }
  
  // Create fresh scorecard structure
  const newScorecard = {
    domains: defaultDomains.map(domain => ({
      ...domain,
      criteria: domain.criteria.map(criterion => ({
        ...criterion,
        score: 0,
        notes: ''
      }))
    })),
    lastUpdated: new Date().toISOString()
  }
  
  saveParishScorecard(parishId, newScorecard)
  return newScorecard.domains
}



