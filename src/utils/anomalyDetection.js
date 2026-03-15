/**
 * Rule-based anomaly detection for flight and ship movements.
 * Input: normalized movements (flights + ships). Output: same items with anomaly flags.
 */

/** Speed thresholds: flights in m/s (OpenSky), ships in kn */
const FLIGHT_SPEED_MS_ANOMALY = 309 // ~600 kn
const SHIP_SPEED_KN_ANOMALY = 25
const STALE_SECONDS = 600 // 10 min

/**
 * @param {Array<{ id: string, type: string, speed?: number, lastSeen?: number }>} movements
 * @returns {Array<{ ...movement, isAnomaly: boolean, anomalyReasons: string[] }>}
 */
export function detectAnomalies(movements) {
  if (!Array.isArray(movements)) return []
  const now = Math.floor(Date.now() / 1000)
  return movements.map((m) => {
    const reasons = []
    if (m.type === 'flight') {
      if (m.speed != null && m.speed > FLIGHT_SPEED_MS_ANOMALY) {
        reasons.push('High speed')
      }
    }
    if (m.type === 'ship') {
      if (m.speed != null && m.speed > SHIP_SPEED_KN_ANOMALY) {
        reasons.push('High speed')
      }
    }
    if (m.lastSeen != null && now - m.lastSeen > STALE_SECONDS) {
      reasons.push('Stale position')
    }
    return {
      ...m,
      isAnomaly: reasons.length > 0,
      anomalyReasons: reasons,
    }
  })
}
