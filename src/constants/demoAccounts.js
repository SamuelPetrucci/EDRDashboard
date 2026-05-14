import { readViteEnv } from '../lib/env'
import { DRIS_ROLES, ROLE_LABELS } from './roles'

/** Shared password shown in demo UI and used by `npm run seed:demo` when env matches. */
export const DEMO_PASSWORD_DEFAULT = 'DRIS-Demo-2026!'

/** Emails are stable so the seed script and UI stay in sync. */
export const DEMO_ACCOUNTS = [
  { role: DRIS_ROLES.PLATFORM_ADMIN, email: 'demo-platform@dris.local', label: ROLE_LABELS[DRIS_ROLES.PLATFORM_ADMIN] },
  { role: DRIS_ROLES.COUNTRY_EXECUTIVE, email: 'demo-executive@dris.local', label: ROLE_LABELS[DRIS_ROLES.COUNTRY_EXECUTIVE] },
  { role: DRIS_ROLES.COUNTRY_ADMIN, email: 'demo-admin@dris.local', label: ROLE_LABELS[DRIS_ROLES.COUNTRY_ADMIN] },
  { role: DRIS_ROLES.PARISH_MANAGER, email: 'demo-manager@dris.local', label: ROLE_LABELS[DRIS_ROLES.PARISH_MANAGER] },
  { role: DRIS_ROLES.DATA_OFFICER, email: 'demo-data@dris.local', label: ROLE_LABELS[DRIS_ROLES.DATA_OFFICER] },
  { role: DRIS_ROLES.FIELD_USER, email: 'demo-field@dris.local', label: ROLE_LABELS[DRIS_ROLES.FIELD_USER] },
  { role: DRIS_ROLES.AUDITOR, email: 'demo-auditor@dris.local', label: ROLE_LABELS[DRIS_ROLES.AUDITOR] },
]

export function getDemoPassword() {
  return readViteEnv('VITE_DEMO_PASSWORD') || DEMO_PASSWORD_DEFAULT
}

/**
 * Demo strip on /sign-in whenever Supabase is configured (dev and production builds).
 * Set VITE_HIDE_DEMO_LOGIN=1 (or true/yes) to hide for deployments that must not expose demo credentials.
 */
export function isDemoLoginUiEnabled() {
  const hide = String(import.meta.env.VITE_HIDE_DEMO_LOGIN ?? '').toLowerCase()
  if (hide === '1' || hide === 'true' || hide === 'yes') return false
  return true
}
