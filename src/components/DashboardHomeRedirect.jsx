import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isSupabaseConfigured } from '../lib/supabaseClient'
import GlobalOverview from '../pages/GlobalOverview'
import { getDefaultHomeForRole } from '../constants/roles'

/**
 * `/app` — without Supabase, shows the legacy global overview. With auth configured,
 * signed-in users are sent to their role dashboard; use `/app/operations` for National Overview.
 */
export default function DashboardHomeRedirect() {
  const { session, role, loading } = useAuth()

  if (!isSupabaseConfigured) {
    return <GlobalOverview />
  }

  if (loading) {
    return (
      <div className="auth-route-loading" role="status" aria-live="polite">
        <div className="auth-route-loading__inner">
          <span className="auth-route-loading__dot" aria-hidden />
          <span className="auth-route-loading__label">Loading…</span>
        </div>
      </div>
    )
  }

  if (session) {
    return <Navigate to={getDefaultHomeForRole(role)} replace />
  }

  return <GlobalOverview />
}
