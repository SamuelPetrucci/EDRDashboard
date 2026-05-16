/**
 * Parish scorecard composites in localStorage (demo / offline convenience).
 * Published readiness should align with DB KPI workflow (`kpi_submissions`) — see docs/PROJECT_CLEANUP_AND_DATA_PLAN.md.
 */

import { REGION_JAMAICA, REGION_USA } from '../data/regionCatalog'

const STORAGE_KEY_JM = 'ltdrr_parish_scorecards'
const STORAGE_KEY_USA = 'ltdrr_parish_scorecards_usa'

function resolveKey(region = REGION_JAMAICA) {
  return region === REGION_USA ? STORAGE_KEY_USA : STORAGE_KEY_JM
}

// Get all stored scorecards
export const getAllScorecards = (region = REGION_JAMAICA) => {
  try {
    const stored = localStorage.getItem(resolveKey(region))
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.error('Error reading scorecards from storage:', error)
    return {}
  }
}

// Get scorecard for a specific parish
export const getParishScorecard = (parishId, region = REGION_JAMAICA) => {
  const allScorecards = getAllScorecards(region)
  return allScorecards[parishId] || null
}

// Save scorecard for a specific parish
export const saveParishScorecard = (parishId, scorecardData, region = REGION_JAMAICA) => {
  try {
    const allScorecards = getAllScorecards(region)
    allScorecards[parishId] = {
      ...scorecardData,
      lastUpdated: new Date().toISOString()
    }
    localStorage.setItem(resolveKey(region), JSON.stringify(allScorecards))
    return true
  } catch (error) {
    console.error('Error saving scorecard to storage:', error)
    return false
  }
}

// Initialize scorecard for a parish (if it doesn't exist)
export const initializeParishScorecard = (parishId, defaultDomains, region = REGION_JAMAICA) => {
  const existing = getParishScorecard(parishId, region)
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
  
  saveParishScorecard(parishId, newScorecard, region)
  return newScorecard.domains
}

/**
 * Build domain/criterion structure with scores = mean of each criterion across parishes
 * that have saved scorecard data. Parishes without a scorecard are excluded from that criterion's mean.
 */
export const getNationalAveragedDomains = (templateDomains, allParishes, region = REGION_JAMAICA) => {
  return templateDomains.map((domain) => ({
    ...domain,
    criteria: domain.criteria.map((criterion) => {
      const scores = []
      for (const p of allParishes) {
        const sc = getParishScorecard(p.id, region)
        if (!sc?.domains) continue
        const d = sc.domains.find((x) => x.id === domain.id)
        const c = d?.criteria.find((x) => x.id === criterion.id)
        if (c && typeof c.score === 'number') scores.push(c.score)
      }
      const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
      return { ...criterion, score: avg }
    }),
  }))
}

/** Parishes with any saved scorecard (used for national averages copy). */
export const countParishesWithScorecardData = (allParishes, region = REGION_JAMAICA) =>
  allParishes.filter((p) => {
    const sc = getParishScorecard(p.id, region)
    return sc?.domains && Array.isArray(sc.domains)
  }).length

