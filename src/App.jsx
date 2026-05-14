import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import RouteFade from './components/RouteFade'
import ScrollToTop from './components/ScrollToTop'
import ProtectedRoute, { RedirectIfAuthedShell } from './components/ProtectedRoute'
import RoleGate from './components/RoleGate'
import DashboardHomeRedirect from './components/DashboardHomeRedirect'
import GlobalOverview from './pages/GlobalOverview'
import ParishDashboard from './pages/ParishDashboard'
import ScorecardView from './pages/ScorecardView'
import EmergencyProtocols from './pages/EmergencyProtocols'
import Contacts from './pages/Contacts'
import Intel from './pages/Intel'
import LandingPage from './pages/LandingPage'
import SignIn from './pages/SignIn'
import AdminControlTower from './pages/AdminControlTower'
import ExecutiveDashboard from './pages/ExecutiveDashboard'
import DataOfficerWorkspace from './pages/DataOfficerWorkspace'
import FieldOperatorWorkspace from './pages/FieldOperatorWorkspace'
import AuditorDashboard from './pages/AuditorDashboard'
import ManagerDashboard from './pages/ManagerDashboard'
import ProfilePage from './pages/ProfilePage'
import PlatformAdmin from './pages/PlatformAdmin'
import { DRIS_ROLES } from './constants/roles'
import {
  RedirectToAppContacts,
  RedirectToAppIntel,
  RedirectToAppProtocols,
  RedirectToAppScorecard,
  RedirectToParishContacts,
  RedirectToParishOverview,
  RedirectToParishScorecard,
} from './components/LegacyAppRedirects'
import { APP_BASE } from './constants/paths'
import './App.css'

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route
          path="/"
          element={
            <RouteFade>
              <LandingPage />
            </RouteFade>
          }
        />
        <Route
          path="/sign-in"
          element={
            <RedirectIfAuthedShell>
              <RouteFade>
                <SignIn />
              </RouteFade>
            </RedirectIfAuthedShell>
          }
        />

        {/* Legacy paths (pre /app) */}
        <Route path="/scorecard" element={<RedirectToAppScorecard />} />
        <Route path="/intel" element={<RedirectToAppIntel />} />
        <Route path="/protocols" element={<RedirectToAppProtocols />} />
        <Route path="/contacts" element={<RedirectToAppContacts />} />
        <Route path="/parish/:parishId" element={<RedirectToParishOverview />} />
        <Route path="/parish/:parishId/scorecard" element={<RedirectToParishScorecard />} />
        <Route path="/parish/:parishId/contacts" element={<RedirectToParishContacts />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path={`${APP_BASE}/operations`} element={<GlobalOverview />} />
            <Route path={APP_BASE} element={<DashboardHomeRedirect />} />
            <Route
              path={`${APP_BASE}/manager`}
              element={
                <RoleGate allowedRoles={[DRIS_ROLES.PARISH_MANAGER]}>
                  <ManagerDashboard />
                </RoleGate>
              }
            />
            <Route
              path={`${APP_BASE}/executive`}
              element={
                <RoleGate allowedRoles={[DRIS_ROLES.COUNTRY_EXECUTIVE]}>
                  <ExecutiveDashboard />
                </RoleGate>
              }
            />
            <Route
              path={`${APP_BASE}/admin`}
              element={
                <RoleGate allowedRoles={[DRIS_ROLES.COUNTRY_ADMIN]}>
                  <AdminControlTower />
                </RoleGate>
              }
            />
            <Route
              path={`${APP_BASE}/workspace/data`}
              element={
                <RoleGate allowedRoles={[DRIS_ROLES.DATA_OFFICER]}>
                  <DataOfficerWorkspace />
                </RoleGate>
              }
            />
            <Route
              path={`${APP_BASE}/workspace/field`}
              element={
                <RoleGate allowedRoles={[DRIS_ROLES.FIELD_USER]}>
                  <FieldOperatorWorkspace />
                </RoleGate>
              }
            />
            <Route
              path={`${APP_BASE}/audit`}
              element={
                <RoleGate allowedRoles={[DRIS_ROLES.AUDITOR]}>
                  <AuditorDashboard />
                </RoleGate>
              }
            />
            <Route path={`${APP_BASE}/profile`} element={<ProfilePage />} />
            <Route
              path={`${APP_BASE}/platform-admin`}
              element={
                <RoleGate allowedRoles={[DRIS_ROLES.PLATFORM_ADMIN]}>
                  <PlatformAdmin />
                </RoleGate>
              }
            />
            <Route path={`${APP_BASE}/parish/:parishId`} element={<ParishDashboard />} />
            <Route path={`${APP_BASE}/parish/:parishId/scorecard`} element={<ScorecardView />} />
            <Route path={`${APP_BASE}/scorecard`} element={<ScorecardView />} />
            <Route path={`${APP_BASE}/protocols`} element={<EmergencyProtocols />} />
            <Route path={`${APP_BASE}/intel`} element={<Intel />} />
            <Route path={`${APP_BASE}/contacts`} element={<Contacts />} />
            <Route path={`${APP_BASE}/parish/:parishId/contacts`} element={<Contacts />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App
