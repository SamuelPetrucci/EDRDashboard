import { APP_BASE, appPath } from './paths'

/** @typedef {'platform_admin'|'country_executive'|'country_admin'|'parish_manager'|'data_officer'|'field_user'|'auditor'} DrisRole */

export const DRIS_ROLES = {
  PLATFORM_ADMIN: 'platform_admin',
  COUNTRY_EXECUTIVE: 'country_executive',
  COUNTRY_ADMIN: 'country_admin',
  PARISH_MANAGER: 'parish_manager',
  DATA_OFFICER: 'data_officer',
  FIELD_USER: 'field_user',
  AUDITOR: 'auditor',
}

/** @type {Record<string, string>} */
export const ROLE_LABELS = {
  [DRIS_ROLES.PLATFORM_ADMIN]: 'Platform Administrator',
  [DRIS_ROLES.COUNTRY_EXECUTIVE]: 'Country Executive',
  [DRIS_ROLES.COUNTRY_ADMIN]: 'Country Administrator',
  [DRIS_ROLES.PARISH_MANAGER]: 'State / Parish Manager',
  [DRIS_ROLES.DATA_OFFICER]: 'Data Officer',
  [DRIS_ROLES.FIELD_USER]: 'Field User',
  [DRIS_ROLES.AUDITOR]: 'Auditor',
}

/** Nav label for the shared `/app/operations` view (national globe + situational feeds). */
export const NATIONAL_OVERVIEW_NAV_LABEL = 'National Overview'

/** Shared globe / feeds overview (not role-specific). Route: `/app/operations`. */
export function getOperationsMapPath() {
  return appPath('/operations')
}

/** @param {string|null|undefined} role */
export function getDefaultHomeForRole(role) {
  switch (role) {
    case DRIS_ROLES.PLATFORM_ADMIN:
      return appPath('/platform-admin')
    case DRIS_ROLES.COUNTRY_ADMIN:
      return appPath('/admin')
    case DRIS_ROLES.DATA_OFFICER:
      return appPath('/workspace/data')
    case DRIS_ROLES.FIELD_USER:
      return appPath('/workspace/field')
    case DRIS_ROLES.AUDITOR:
      return appPath('/audit')
    case DRIS_ROLES.COUNTRY_EXECUTIVE:
      return appPath('/executive')
    case DRIS_ROLES.PARISH_MANAGER:
      return appPath('/manager')
    default:
      return getOperationsMapPath()
  }
}

/**
 * Primary nav label for each role’s dashboard entry.
 * @param {string|null|undefined} role
 * @param {{ configured?: boolean, authenticated?: boolean }} [opts]
 */
export function dashboardHomeLabel(role, opts = {}) {
  const { configured = false, authenticated = false } = opts
  if (!configured || !authenticated) return 'Overview'
  switch (role) {
    case DRIS_ROLES.PLATFORM_ADMIN:
      return 'Platform admin'
    case DRIS_ROLES.COUNTRY_EXECUTIVE:
      return 'National dashboard'
    case DRIS_ROLES.COUNTRY_ADMIN:
      return 'Control tower'
    case DRIS_ROLES.PARISH_MANAGER:
      return 'Parish dashboard'
    case DRIS_ROLES.DATA_OFFICER:
      return 'Data workspace'
    case DRIS_ROLES.FIELD_USER:
      return 'Field workspace'
    case DRIS_ROLES.AUDITOR:
      return 'Audit'
    default:
      return 'Dashboard'
  }
}

/**
 * @param {string|null|undefined} role
 * @param {string} fromState
 */
export function safeDashboardPath(candidate) {
  if (candidate === APP_BASE || candidate === `${APP_BASE}/`) return getOperationsMapPath()
  if (typeof candidate === 'string' && candidate.startsWith(`${APP_BASE}/`)) return candidate
  return getOperationsMapPath()
}

/**
 * After sign-in: honor deep links under /app; otherwise send user to role home (DRIS doc).
 * @param {string|null|undefined} role
 * @param {string} fromState
 */
export function postSignInPath(role, fromState) {
  const from = typeof fromState === 'string' ? fromState : ''
  if (from && (from === APP_BASE || from.startsWith(`${APP_BASE}/`))) {
    return safeDashboardPath(from)
  }
  return getDefaultHomeForRole(role)
}

/** @param {string|null|undefined} role */
export function roleLabel(role) {
  if (!role) return 'User'
  return ROLE_LABELS[role] || role
}
