// Utility for storing and retrieving parish-specific equipment and personnel data
// Uses localStorage for persistence (will be replaced with API in production).

import { REGION_JAMAICA, REGION_USA } from '../data/regionCatalog'

const EQUIPMENT_STORAGE_KEY_JM = 'parish_equipment_data'
const PERSONNEL_STORAGE_KEY_JM = 'parish_personnel_data'
const CHANGE_HISTORY_KEY_JM = 'equipment_change_history'

const EQUIPMENT_STORAGE_KEY_USA = 'parish_equipment_data_usa'
const PERSONNEL_STORAGE_KEY_USA = 'parish_personnel_data_usa'
const CHANGE_HISTORY_KEY_USA = 'equipment_change_history_usa'

function equipmentKey(region = REGION_JAMAICA) {
  return region === REGION_USA ? EQUIPMENT_STORAGE_KEY_USA : EQUIPMENT_STORAGE_KEY_JM
}

function personnelKey(region = REGION_JAMAICA) {
  return region === REGION_USA ? PERSONNEL_STORAGE_KEY_USA : PERSONNEL_STORAGE_KEY_JM
}

function historyKey(region = REGION_JAMAICA) {
  return region === REGION_USA ? CHANGE_HISTORY_KEY_USA : CHANGE_HISTORY_KEY_JM
}

function saveChangeHistory(changeEntry, region = REGION_JAMAICA) {
  try {
    const existing = localStorage.getItem(historyKey(region))
    const history = existing ? JSON.parse(existing) : []

    history.unshift(changeEntry)

    if (history.length > 1000) {
      history.splice(1000)
    }

    localStorage.setItem(historyKey(region), JSON.stringify(history))
  } catch (error) {
    console.error('Error saving change history:', error)
  }
}

export const getAllEquipmentData = (region = REGION_JAMAICA) => {
  try {
    const stored = localStorage.getItem(equipmentKey(region))
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.error('Error reading equipment data from storage:', error)
    return {}
  }
}

export const getParishEquipment = (parishId, region = REGION_JAMAICA) => {
  const allData = getAllEquipmentData(region)
  return allData[parishId] || null
}

export const saveParishEquipment = (parishId, equipmentData, userId, reason = '', region = REGION_JAMAICA) => {
  try {
    const allData = getAllEquipmentData(region)
    const previousData = allData[parishId] || {}

    const changeHistory = {
      timestamp: new Date().toISOString(),
      userId: userId || 'unknown',
      parishId: parishId,
      action: 'equipment_update',
      changes: [],
      reason,
    }

    Object.keys(equipmentData).forEach((key) => {
      if (previousData[key] !== equipmentData[key]) {
        changeHistory.changes.push({
          field: key,
          oldValue: previousData[key] || 0,
          newValue: equipmentData[key],
        })
      }
    })

    allData[parishId] = {
      ...equipmentData,
      lastUpdated: new Date().toISOString(),
      updatedBy: userId || 'unknown',
    }
    localStorage.setItem(equipmentKey(region), JSON.stringify(allData))

    if (changeHistory.changes.length > 0) {
      saveChangeHistory(changeHistory, region)
    }

    return true
  } catch (error) {
    console.error('Error saving equipment data to storage:', error)
    return false
  }
}

export const getAllPersonnelData = (region = REGION_JAMAICA) => {
  try {
    const stored = localStorage.getItem(personnelKey(region))
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.error('Error reading personnel data from storage:', error)
    return {}
  }
}

export const getParishPersonnel = (parishId, region = REGION_JAMAICA) => {
  const allData = getAllPersonnelData(region)
  return allData[parishId] || null
}

export const saveParishPersonnel = (parishId, personnelData, userId, reason = '', region = REGION_JAMAICA) => {
  try {
    const allData = getAllPersonnelData(region)
    const previousData = allData[parishId] || {}

    const changeHistory = {
      timestamp: new Date().toISOString(),
      userId: userId || 'unknown',
      parishId: parishId,
      action: 'personnel_update',
      changes: [],
      reason,
    }

    Object.keys(personnelData).forEach((key) => {
      if (previousData[key] !== personnelData[key]) {
        changeHistory.changes.push({
          field: key,
          oldValue: previousData[key] || 0,
          newValue: personnelData[key],
        })
      }
    })

    allData[parishId] = {
      ...personnelData,
      lastUpdated: new Date().toISOString(),
      updatedBy: userId || 'unknown',
    }
    localStorage.setItem(personnelKey(region), JSON.stringify(allData))

    if (changeHistory.changes.length > 0) {
      saveChangeHistory(changeHistory, region)
    }

    return true
  } catch (error) {
    console.error('Error saving personnel data to storage:', error)
    return false
  }
}

export const getParishChangeHistory = (parishId, limit = 50, region = REGION_JAMAICA) => {
  try {
    const existing = localStorage.getItem(historyKey(region))
    const history = existing ? JSON.parse(existing) : []

    return history
      .filter((entry) => entry.parishId === parishId)
      .slice(0, limit)
  } catch (error) {
    console.error('Error reading change history:', error)
    return []
  }
}

export const initializeParishEquipment = (parishId, defaultEquipment, region = REGION_JAMAICA) => {
  const existing = getParishEquipment(parishId, region)
  if (existing) {
    return existing
  }

  const initialData = { ...defaultEquipment }
  saveParishEquipment(parishId, initialData, 'system', 'Initial data setup', region)
  return initialData
}

export const initializeParishPersonnel = (parishId, defaultPersonnel, region = REGION_JAMAICA) => {
  const existing = getParishPersonnel(parishId, region)
  if (existing) {
    return existing
  }

  const initialData = { ...defaultPersonnel }
  saveParishPersonnel(parishId, initialData, 'system', 'Initial data setup', region)
  return initialData
}