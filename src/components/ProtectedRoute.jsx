import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isSupabaseConfigured } from '../lib/supabaseClient'
import { postSignInPath } from '../constants/roles'

function isLikelyMissingProfilesTable(message) {
  if (!message || typeof message !== 'string') return false
  const m = message.toLowerCase()
  return m.includes('profiles') && (m.includes('schema') || m.includes('does not exist') || m.includes('not find'))
}

function DatabaseSetupHint() {
  return (
    <div className="auth-route-loading auth-route-loading--wide" role="alert">
      <div className="auth-route-loading__inner auth-route-loading__inner--column">
        <span className="auth-route-loading__label">Supabase is connected, but the profiles table is not ready.</span>
        <p className="auth-setup-hint">
          In the Supabase SQL editor, run the migration file{' '}
          <code className="auth-setup-hint__code">supabase/migrations/20260513120000_dris_profiles_roles.sql</code> from this repository.
          That creates <code className="auth-setup-hint__code">public.profiles</code>, row-level security for self-read, and a trigger so
          new users receive a default <code className="auth-setup-hint__code">field_user</code> role. Then assign roles in the Table
          Editor as needed.
        </p>
      </div>
    </div>
  )
}

/**
 * Requires a Supabase session when project env is configured.
 * Without URL + publishable (or legacy anon) key, dashboard routes stay open so local UX works until you wire Supabase.
 */
export default function ProtectedRoute() {
  const { session, loading, profileError } = useAuth()
  const location = useLocation()

  if (!isSupabaseConfigured) {
    return <Outlet />
  }

  if (loading) {
    return (
      <div className="auth-route-loading" role="status" aria-live="polite">
        <div className="auth-route-loading__inner">
          <span className="auth-route-loading__dot" aria-hidden />
          <span className="auth-route-loading__label">Signing you in…</span>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <Navigate to="/sign-in" replace state={{ from: `${location.pathname}${location.search}${location.hash}` }} />
    )
  }

  if (profileError && isLikelyMissingProfilesTable(profileError)) {
    return <DatabaseSetupHint />
  }

  return <Outlet />
}

export function RedirectIfAuthedShell({ children }) {
  const { session, loading, role } = useAuth()
  if (!isSupabaseConfigured) return children
  if (loading) {
    return (
      <div className="auth-route-loading" role="status" aria-live="polite">
        <div className="auth-route-loading__inner">
          <span className="auth-route-loading__dot" aria-hidden />
        </div>
      </div>
    )
  }
  if (session) {
    const target = postSignInPath(role, '')
    return <Navigate to={target} replace />
  }
  return children
}
