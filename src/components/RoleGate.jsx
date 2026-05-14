import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getDefaultHomeForRole } from '../constants/roles'

/**
 * @param {object} props
 * @param {string[]} props.allowedRoles
 * @param {import('react').ReactNode} props.children
 */
export default function RoleGate({ allowedRoles, children }) {
  const { role, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="auth-route-loading" role="status" aria-live="polite">
        <div className="auth-route-loading__inner">
          <span className="auth-route-loading__dot" aria-hidden />
          <span className="auth-route-loading__label">Loading your access…</span>
        </div>
      </div>
    )
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to={getDefaultHomeForRole(role)} replace state={{ from: location.pathname }} />
  }

  return children
}
