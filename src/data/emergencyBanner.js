// Emergency notification banner – admin-updatable
// Stored in localStorage; in production would use backend API

const STORAGE_KEY = 'emergency_banner'

const DEFAULT_BANNER = {
  message: 'All parishes: Ensure emergency contact lists and shelter locations are current. ODPEM drill next Tuesday 10:00.',
  severity: 'warning', // 'info' | 'warning' | 'critical'
  active: true,
  updatedAt: new Date().toISOString(),
  updatedBy: 'System'
}

export const getEmergencyBanner = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
    return null
  } catch (e) {
    return null
  }
}

export const setEmergencyBanner = (payload) => {
  try {
    const data = {
      message: payload.message ?? '',
      severity: payload.severity ?? 'info',
      active: payload.active ?? false,
      updatedAt: new Date().toISOString(),
      updatedBy: payload.updatedBy ?? 'Admin'
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return data
  } catch (e) {
    console.error('Failed to save emergency banner:', e)
    return null
  }
}

export const seedDefaultBanner = () => {
  if (!getEmergencyBanner()) {
    setEmergencyBanner(DEFAULT_BANNER)
  }
}
