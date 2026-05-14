import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import {
  Home,
  FileText,
  BookOpen,
  Phone,
  Satellite,
  Menu,
  X,
  LogOut,
  Globe,
  User,
  Shield,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import EmergencyBanner from './EmergencyBanner'
import EnterpriseFooter from './EnterpriseFooter'
import CennaAssistant from './CennaAssistant'
import headerLogo from '../../headerlogo.webp'
import { appPath } from '../constants/paths'
import { useAuth } from '../context/AuthContext'
import {
  roleLabel,
  getDefaultHomeForRole,
  dashboardHomeLabel,
  getOperationsMapPath,
  NATIONAL_OVERVIEW_NAV_LABEL,
  DRIS_ROLES,
} from '../constants/roles'
import './Layout.css'

const NARROW_QUERY = '(max-width: 899px)'
const RAIL_COLLAPSED_KEY = 'dris_nav_rail_collapsed'

function Layout() {
  const location = useLocation()
  const [sidenavOpen, setSidenavOpen] = useState(true)
  const [isNarrow, setIsNarrow] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(NARROW_QUERY).matches
  )
  const [railCollapsed, setRailCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      return window.localStorage.getItem(RAIL_COLLAPSED_KEY) === '1'
    } catch {
      return false
    }
  })
  const { session, isSupabaseConfigured, signOut, role } = useAuth()
  const mainRef = useRef(null)
  const routeEnterTimerRef = useRef(null)
  const skipNextRouteEnterRef = useRef(true)
  const prevPathForNavRef = useRef(null)

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('theme') : null
    const theme = saved || 'dark'
    document.documentElement.setAttribute('data-theme', theme)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia(NARROW_QUERY)
    const onChange = () => setIsNarrow(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  /** Mobile overlay: close after in-app navigation (not first paint). */
  useEffect(() => {
    if (!isNarrow) return
    const prev = prevPathForNavRef.current
    prevPathForNavRef.current = location.pathname
    if (prev === null) return
    if (prev === location.pathname) return
    setSidenavOpen(false)
  }, [location.pathname, isNarrow])

  /** Soft transition when switching in-app pages (no Outlet remount — state preserved). */
  useEffect(() => {
    if (skipNextRouteEnterRef.current) {
      skipNextRouteEnterRef.current = false
      return
    }
    const el = mainRef.current
    if (!el) return
    el.classList.add('main-content--route-enter')
    if (routeEnterTimerRef.current) clearTimeout(routeEnterTimerRef.current)
    routeEnterTimerRef.current = setTimeout(() => {
      el.classList.remove('main-content--route-enter')
      routeEnterTimerRef.current = null
    }, 480)
    return () => {
      if (routeEnterTimerRef.current) clearTimeout(routeEnterTimerRef.current)
    }
  }, [location.pathname])

  /** Lock scroll only while the mobile overlay drawer is open. */
  useEffect(() => {
    if (!isNarrow || !sidenavOpen) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [isNarrow, sidenavOpen])

  useEffect(() => {
    if (!isNarrow || !sidenavOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') setSidenavOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isNarrow, sidenavOpen])

  const closeSidenav = useCallback(() => setSidenavOpen(false), [])

  const collapseRail = useCallback(() => {
    setRailCollapsed(true)
    try {
      window.localStorage.setItem(RAIL_COLLAPSED_KEY, '1')
    } catch {
      /* ignore */
    }
  }, [])

  const expandRail = useCallback(() => {
    setRailCollapsed(false)
    try {
      window.localStorage.removeItem(RAIL_COLLAPSED_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  const overviewPath = appPath('/')
  const operationsPath = getOperationsMapPath()
  const protocolsPath = appPath('/protocols')
  const contactsPath = appPath('/contacts')
  const intelPath = appPath('/intel')
  const scorecardPath = appPath('/scorecard')
  const profilePath = appPath('/profile')
  const platformAdminPath = appPath('/platform-admin')

  const showSignOut = isSupabaseConfigured && session
  const primaryHomePath = !isSupabaseConfigured || !session ? overviewPath : getDefaultHomeForRole(role)
  const dashboardNavLabel = dashboardHomeLabel(role, {
    configured: isSupabaseConfigured,
    authenticated: Boolean(session),
  })

  const pathMatches = (pathname, target) => {
    const a = pathname.replace(/\/$/, '') || '/'
    const b = target.replace(/\/$/, '') || '/'
    return a === b || a.startsWith(`${b}/`)
  }

  const overviewNavActive = pathMatches(location.pathname, primaryHomePath)
  const operationsNavActive = pathMatches(location.pathname, operationsPath)
  const showOperationsMapLink = isSupabaseConfigured && session

  const isDrisLightMain = /^\/app\/(executive|admin|manager|profile|platform-admin)\/?$/.test(location.pathname)

  const isIntelPage = location.pathname === intelPath

  const getNavLinkClass = (opts) => {
    const { overview, operations, scorecard, protocols, contacts, intelPath: intel, profile, platformAdmin } = opts
    let active = false
    const p = location.pathname
    if (scorecard) active = p.includes('scorecard')
    else if (protocols) active = p === protocolsPath
    else if (contacts)
      active =
        p === contactsPath ||
        /^\/app\/parish\/[^/]+\/contacts$/.test(p)
    else if (operations) active = operationsNavActive
    else if (overview) active = overviewNavActive
    else if (intel) active = p === intelPath
    else if (profile) active = p === profilePath
    else if (platformAdmin) active = p === platformAdminPath
    return `nav-link sidenav-link${active ? ' active' : ''}`
  }

  async function handleSignOut() {
    await signOut()
    closeSidenav()
    window.location.assign('/sign-in')
  }

  const sidenavClass = [
    'layout-sidenav',
    isNarrow && sidenavOpen && 'layout-sidenav--open',
    !isNarrow && railCollapsed && 'layout-sidenav--rail-collapsed',
  ]
    .filter(Boolean)
    .join(' ')

  const linkAfterNav = isNarrow ? closeSidenav : undefined

  return (
    <div
      className={`layout${isIntelPage ? ' layout--intel-page' : ''}${isDrisLightMain ? ' layout--dris-light-main' : ''}${
        !isNarrow && railCollapsed ? ' layout--rail-collapsed' : ''
      }`}
    >
      <aside
        id="site-sidenav"
        className={sidenavClass}
        aria-label="Primary navigation"
        aria-hidden={isNarrow ? !sidenavOpen : false}
        inert={!isNarrow && railCollapsed}
      >
        <div className="layout-sidenav__top">
          <button
            type="button"
            className="layout-sidenav__close"
            onClick={isNarrow ? closeSidenav : collapseRail}
            aria-label={isNarrow ? 'Close navigation' : 'Collapse sidebar'}
          >
            {isNarrow ? <X size={22} aria-hidden /> : <ChevronLeft size={22} aria-hidden />}
          </button>
          <Link
            to={primaryHomePath}
            className="layout-sidenav__brand"
            aria-label={`${dashboardNavLabel} — Disaster Resilience Intelligence Scorecard home`}
            onClick={linkAfterNav}
          >
            <div className="layout-sidenav__logos">
              <img src={headerLogo} alt="" className="layout-sidenav__logo" />
              <div className="layout-sidenav__titles">
                <span className="layout-sidenav__dris" aria-hidden="true">
                  DRIS<sup className="layout-sidenav__tm">™</sup>
                </span>
                <span className="layout-sidenav__subtitle">Disaster Resilience Intelligence Scorecard™</span>
              </div>
            </div>
          </Link>
        </div>

        {showSignOut ? (
          <div className="layout-sidenav__role" title="Your DRIS role">
            {roleLabel(role)}
          </div>
        ) : null}

        <nav className="sidenav-nav" aria-label="Sections">
          <Link to={primaryHomePath} className={getNavLinkClass({ overview: true })} onClick={linkAfterNav}>
            <Home size={20} aria-hidden />
            <span>{dashboardNavLabel}</span>
          </Link>
          {showOperationsMapLink ? (
            <Link
              to={operationsPath}
              className={getNavLinkClass({ operations: true })}
              title="National overview — situational feeds and scorecard snapshot"
              onClick={linkAfterNav}
            >
              <Globe size={20} aria-hidden />
              <span>{NATIONAL_OVERVIEW_NAV_LABEL}</span>
            </Link>
          ) : null}
          <Link to={scorecardPath} className={getNavLinkClass({ scorecard: true })} onClick={linkAfterNav}>
            <FileText size={20} aria-hidden />
            <span>Scorecard</span>
          </Link>
          <Link to={intelPath} className={getNavLinkClass({ intelPath: true })} onClick={linkAfterNav}>
            <Satellite size={20} aria-hidden />
            <span>Intel</span>
          </Link>
          <Link
            to={protocolsPath}
            className={`${getNavLinkClass({ protocols: true })} nav-link--protocols`}
            title="Protocols & Training"
            onClick={linkAfterNav}
          >
            <BookOpen size={20} aria-hidden />
            <span>Protocols & Training</span>
          </Link>
          <Link to={contactsPath} className={getNavLinkClass({ contacts: true })} onClick={linkAfterNav}>
            <Phone size={20} aria-hidden />
            <span>Contacts</span>
          </Link>
          {showSignOut && role === DRIS_ROLES.PLATFORM_ADMIN ? (
            <Link to={platformAdminPath} className={getNavLinkClass({ platformAdmin: true })} onClick={linkAfterNav}>
              <Shield size={20} aria-hidden />
              <span>Platform admin</span>
            </Link>
          ) : null}
        </nav>

        {showSignOut ? (
          <div className="layout-sidenav__footer">
            <Link to={profilePath} className={getNavLinkClass({ profile: true })} onClick={linkAfterNav}>
              <User size={20} aria-hidden />
              <span>Profile</span>
            </Link>
            <button type="button" className="nav-link sidenav-link nav-sign-out sidenav-sign-out" onClick={handleSignOut}>
              <LogOut size={20} aria-hidden />
              <span>Sign out</span>
            </button>
          </div>
        ) : null}
      </aside>

      {isNarrow && sidenavOpen ? (
        <button
          type="button"
          className="layout-sidenav-backdrop"
          aria-label="Close navigation"
          onClick={closeSidenav}
        />
      ) : null}

      {!isNarrow && railCollapsed ? (
        <button
          type="button"
          className="layout-nav-rail-expand"
          onClick={expandRail}
          aria-controls="site-sidenav"
          aria-label="Expand sidebar"
        >
          <ChevronRight size={22} strokeWidth={2} aria-hidden />
        </button>
      ) : null}

      {isNarrow ? (
        <header className="layout-appbar">
          <button
            type="button"
            className="layout-appbar__menu"
            aria-expanded={sidenavOpen}
            aria-controls="site-sidenav"
            aria-label={sidenavOpen ? 'Navigation open' : 'Open navigation'}
            onClick={() => setSidenavOpen((o) => !o)}
          >
            <Menu size={22} strokeWidth={2} aria-hidden />
          </button>
          <span className="layout-appbar__title">DRIS™</span>
          {showSignOut ? (
            <span className="layout-appbar__role" title="Your DRIS role">
              {roleLabel(role)}
            </span>
          ) : (
            <span className="layout-appbar__spacer" aria-hidden />
          )}
        </header>
      ) : null}

      <div className="layout-body">
        <EmergencyBanner />
        <main
          ref={mainRef}
          className={`main-content ${isIntelPage ? 'main-content--intel' : ''} ${isDrisLightMain ? 'main-content--dris' : ''}`}
        >
          <Outlet />
        </main>
        {!isIntelPage && <EnterpriseFooter />}
      </div>
      <CennaAssistant withFooterBand={!isIntelPage} />
    </div>
  )
}

export default Layout
