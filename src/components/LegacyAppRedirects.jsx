import { Navigate, useParams } from 'react-router-dom'
import { appPath, parishPath } from '../constants/paths'

export function RedirectToAppScorecard() {
  return <Navigate to={appPath('/scorecard')} replace />
}

export function RedirectToAppIntel() {
  return <Navigate to={appPath('/intel')} replace />
}

export function RedirectToAppProtocols() {
  return <Navigate to={appPath('/protocols')} replace />
}

export function RedirectToAppContacts() {
  return <Navigate to={appPath('/contacts')} replace />
}

export function RedirectToParishOverview() {
  const { parishId } = useParams()
  return <Navigate to={parishPath(parishId)} replace />
}

export function RedirectToParishScorecard() {
  const { parishId } = useParams()
  return <Navigate to={parishPath(parishId, 'scorecard')} replace />
}

export function RedirectToParishContacts() {
  const { parishId } = useParams()
  return <Navigate to={parishPath(parishId, 'contacts')} replace />
}
