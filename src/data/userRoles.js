// User Roles and Permissions System
// This is a conceptual structure for role-based access control

export const USER_ROLES = {
  SYSTEM_ADMIN: 'system_admin',
  NATIONAL_COORDINATOR: 'national_coordinator',
  REGIONAL_COORDINATOR: 'regional_coordinator',
  PARISH_COORDINATOR: 'parish_coordinator',
  OPERATOR: 'operator'
}

export const ROLE_PERMISSIONS = {
  [USER_ROLES.SYSTEM_ADMIN]: {
    canEditEquipment: true,
    canEditPersonnel: true,
    canEditScorecard: true,
    canViewAllParishes: true,
    canEditAllParishes: true,
    canApproveRequests: true,
    canManageUsers: true,
    canViewAuditLogs: true,
    canConfigureSystem: true
  },
  [USER_ROLES.NATIONAL_COORDINATOR]: {
    canEditEquipment: true,
    canEditPersonnel: true,
    canEditScorecard: true,
    canViewAllParishes: true,
    canEditAllParishes: true,
    canApproveRequests: true,
    canManageUsers: false,
    canViewAuditLogs: true,
    canConfigureSystem: false
  },
  [USER_ROLES.REGIONAL_COORDINATOR]: {
    canEditEquipment: true,
    canEditPersonnel: true,
    canEditScorecard: true,
    canViewAllParishes: false, // Only assigned parishes
    canEditAllParishes: false, // Only assigned parishes
    canApproveRequests: false,
    canManageUsers: false,
    canViewAuditLogs: false, // Only own parish logs
    canConfigureSystem: false
  },
  [USER_ROLES.PARISH_COORDINATOR]: {
    canEditEquipment: true,
    canEditPersonnel: true,
    canEditScorecard: true,
    canViewAllParishes: false, // Only own parish
    canEditAllParishes: false, // Only own parish
    canApproveRequests: false,
    canManageUsers: false,
    canViewAuditLogs: false, // Only own parish logs
    canConfigureSystem: false
  },
  [USER_ROLES.OPERATOR]: {
    canEditEquipment: false,
    canEditPersonnel: false,
    canEditScorecard: false,
    canViewAllParishes: false, // Only assigned parishes
    canEditAllParishes: false,
    canApproveRequests: false,
    canManageUsers: false,
    canViewAuditLogs: false,
    canConfigureSystem: false
  }
}

// Mock current user (in production, this would come from authentication)
// For demo purposes, we'll use localStorage to simulate user session
const CURRENT_USER_KEY = 'current_user'

export const getCurrentUser = () => {
  try {
    const stored = localStorage.getItem(CURRENT_USER_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
    // Default to parish coordinator for demo
    return {
      userId: 'demo_user',
      name: 'Demo User',
      email: 'demo@parish.gov.jm',
      role: USER_ROLES.PARISH_COORDINATOR,
      assignedParishes: ['kingston'],
      assignedRegions: []
    }
  } catch (error) {
    console.error('Error reading current user:', error)
    return null
  }
}

export const setCurrentUser = (user) => {
  try {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
    return true
  } catch (error) {
    console.error('Error saving current user:', error)
    return false
  }
}

export const hasPermission = (permission) => {
  const user = getCurrentUser()
  if (!user) return false
  
  const permissions = ROLE_PERMISSIONS[user.role] || {}
  return permissions[permission] === true
}

export const canEditParish = (parishId) => {
  const user = getCurrentUser()
  if (!user) return false
  
  // System admin and national coordinator can edit all
  if (user.role === USER_ROLES.SYSTEM_ADMIN || user.role === USER_ROLES.NATIONAL_COORDINATOR) {
    return true
  }
  
  // Regional coordinator can edit assigned parishes
  if (user.role === USER_ROLES.REGIONAL_COORDINATOR) {
    // In production, check if parish is in assigned region
    return user.assignedParishes?.includes(parishId) || false
  }
  
  // Parish coordinator can only edit own parish
  if (user.role === USER_ROLES.PARISH_COORDINATOR) {
    return user.assignedParishes?.includes(parishId) || false
  }
  
  return false
}

// Demo users for testing different roles
export const DEMO_USERS = {
  systemAdmin: {
    userId: 'admin_001',
    name: 'System Administrator',
    email: 'admin@odpem.gov.jm',
    role: USER_ROLES.SYSTEM_ADMIN,
    assignedParishes: [],
    assignedRegions: []
  },
  nationalCoordinator: {
    userId: 'nat_001',
    name: 'National Coordinator',
    email: 'national@odpem.gov.jm',
    role: USER_ROLES.NATIONAL_COORDINATOR,
    assignedParishes: [],
    assignedRegions: []
  },
  regionalCoordinator: {
    userId: 'reg_001',
    name: 'Southeast Regional Coordinator',
    email: 'regional@odpem.gov.jm',
    role: USER_ROLES.REGIONAL_COORDINATOR,
    assignedParishes: ['kingston', 'st-andrew', 'st-catherine'],
    assignedRegions: ['Southeast']
  },
  parishCoordinator: {
    userId: 'par_001',
    name: 'Kingston Parish Coordinator',
    email: 'coordinator@kingston.gov.jm',
    role: USER_ROLES.PARISH_COORDINATOR,
    assignedParishes: ['kingston'],
    assignedRegions: []
  },
  operator: {
    userId: 'op_001',
    name: 'View-Only Operator',
    email: 'operator@odpem.gov.jm',
    role: USER_ROLES.OPERATOR,
    assignedParishes: ['kingston', 'st-andrew'],
    assignedRegions: []
  }
}



