// Utility for storing and retrieving parish-specific equipment and personnel data
// Uses localStorage for persistence (will be replaced with API in production)

const EQUIPMENT_STORAGE_KEY = 'parish_equipment_data'
const PERSONNEL_STORAGE_KEY = 'parish_personnel_data'
const CHANGE_HISTORY_KEY = 'equipment_change_history'

// Get all stored equipment data
export const getAllEquipmentData = () => {
  try {
    const stored = localStorage.getItem(EQUIPMENT_STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.error('Error reading equipment data from storage:', error)
    return {}
  }
}

// Get equipment data for a specific parish
export const getParishEquipment = (parishId) => {
  const allData = getAllEquipmentData()
  return allData[parishId] || null
}

// Save equipment data for a specific parish
export const saveParishEquipment = (parishId, equipmentData, userId, reason = '') => {
  try {
    const allData = getAllEquipmentData()
    const previousData = allData[parishId] || {}
    
    // Create change history entry
    const changeHistory = {
      timestamp: new Date().toISOString(),
      userId: userId || 'unknown',
      parishId: parishId,
      action: 'equipment_update',
      changes: [],
      reason: reason
    }
    
    // Track what changed
    Object.keys(equipmentData).forEach(key => {
      if (previousData[key] !== equipmentData[key]) {
        changeHistory.changes.push({
          field: key,
          oldValue: previousData[key] || 0,
          newValue: equipmentData[key]
        })
      }
    })
    
    // Save equipment data
    allData[parishId] = {
      ...equipmentData,
      lastUpdated: new Date().toISOString(),
      updatedBy: userId || 'unknown'
    }
    localStorage.setItem(EQUIPMENT_STORAGE_KEY, JSON.stringify(allData))
    
    // Save change history
    if (changeHistory.changes.length > 0) {
      saveChangeHistory(changeHistory)
    }
    
    return true
  } catch (error) {
    console.error('Error saving equipment data to storage:', error)
    return false
  }
}

// Get all stored personnel data
export const getAllPersonnelData = () => {
  try {
    const stored = localStorage.getItem(PERSONNEL_STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.error('Error reading personnel data from storage:', error)
    return {}
  }
}

// Get personnel data for a specific parish
export const getParishPersonnel = (parishId) => {
  const allData = getAllPersonnelData()
  return allData[parishId] || null
}

// Save personnel data for a specific parish
export const saveParishPersonnel = (parishId, personnelData, userId, reason = '') => {
  try {
    const allData = getAllPersonnelData()
    const previousData = allData[parishId] || {}
    
    // Create change history entry
    const changeHistory = {
      timestamp: new Date().toISOString(),
      userId: userId || 'unknown',
      parishId: parishId,
      action: 'personnel_update',
      changes: [],
      reason: reason
    }
    
    // Track what changed
    Object.keys(personnelData).forEach(key => {
      if (previousData[key] !== personnelData[key]) {
        changeHistory.changes.push({
          field: key,
          oldValue: previousData[key] || 0,
          newValue: personnelData[key]
        })
      }
    })
    
    // Save personnel data
    allData[parishId] = {
      ...personnelData,
      lastUpdated: new Date().toISOString(),
      updatedBy: userId || 'unknown'
    }
    localStorage.setItem(PERSONNEL_STORAGE_KEY, JSON.stringify(allData))
    
    // Save change history
    if (changeHistory.changes.length > 0) {
      saveChangeHistory(changeHistory)
    }
    
    return true
  } catch (error) {
    console.error('Error saving personnel data to storage:', error)
    return false
  }
}

// Save change history
const saveChangeHistory = (changeEntry) => {
  try {
    const existing = localStorage.getItem(CHANGE_HISTORY_KEY)
    const history = existing ? JSON.parse(existing) : []
    
    // Add new entry at the beginning
    history.unshift(changeEntry)
    
    // Keep only last 1000 entries
    if (history.length > 1000) {
      history.splice(1000)
    }
    
    localStorage.setItem(CHANGE_HISTORY_KEY, JSON.stringify(history))
  } catch (error) {
    console.error('Error saving change history:', error)
  }
}

// Get change history for a parish
export const getParishChangeHistory = (parishId, limit = 50) => {
  try {
    const existing = localStorage.getItem(CHANGE_HISTORY_KEY)
    const history = existing ? JSON.parse(existing) : []
    
    // Filter by parish and limit
    return history
      .filter(entry => entry.parishId === parishId)
      .slice(0, limit)
  } catch (error) {
    console.error('Error reading change history:', error)
    return []
  }
}

// Initialize equipment data from default parish data
export const initializeParishEquipment = (parishId, defaultEquipment) => {
  const existing = getParishEquipment(parishId)
  if (existing) {
    return existing
  }
  
  // Create initial data structure
  const initialData = { ...defaultEquipment }
  saveParishEquipment(parishId, initialData, 'system', 'Initial data setup')
  return initialData
}

// Initialize personnel data from default parish data
export const initializeParishPersonnel = (parishId, defaultPersonnel) => {
  const existing = getParishPersonnel(parishId)
  if (existing) {
    return existing
  }
  
  // Create initial data structure
  const initialData = { ...defaultPersonnel }
  saveParishPersonnel(parishId, initialData, 'system', 'Initial data setup')
  return initialData
}



