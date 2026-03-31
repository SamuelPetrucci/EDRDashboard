import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, FileText, BookOpen, Phone, Moon, Sun, Satellite, Menu, X } from 'lucide-react'
import EmergencyBanner from './EmergencyBanner'
import EnterpriseFooter from './EnterpriseFooter'
import skillvantageLogo from '../../skillvantagelogo.png'
import './Layout.css'

const Layout = ({ children }) => {
  const location = useLocation()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [theme, setTheme] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('theme') : null
    return saved || 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!mobileNavOpen) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileNavOpen])

  useEffect(() => {
    if (!mobileNavOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') setMobileNavOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mobileNavOpen])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 769px)')
    const onChange = (e) => {
      if (e.matches) setMobileNavOpen(false)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  const closeMobileNav = () => setMobileNavOpen(false)

  const isIntelPage = location.pathname === '/intel'

  const getNavLinkClass = (opts) => {
    const { path, scorecard, protocols, contacts } = opts
    let active = false
    if (scorecard) active = location.pathname.includes('scorecard')
    else if (protocols) active = location.pathname === '/protocols'
    else if (contacts) active = location.pathname === '/contacts'
    else if (path === '/') active = location.pathname === '/'
    else if (path) active = location.pathname === path
    return `nav-link${active ? ' active' : ''}`
  }

  return (
    <div className={`layout${isIntelPage ? ' layout--intel-page' : ''}`}>
      <header className="header">
        <div className="header-content">
          <div
            className="header-logos"
            aria-label="Skillvantage Enterprise and DRIS, Disaster Resilience Intelligence Scorecard"
          >
            <img
              src={skillvantageLogo}
              alt="Skillvantage Enterprise"
              className="header-logo header-logo--skillvantage"
            />
            <div className="header-scorecard-brand">
              <span className="header-dris-acronym" aria-hidden="true">
                <span className="header-dris-letters">DRIS</span>
                <sup className="header-tm">™</sup>
              </span>
              <span className="header-scorecard-name">
                Disaster Resilience Intelligence Scorecard™
              </span>
            </div>
          </div>
          <div className="header-nav-cluster">
            <button
              type="button"
              className="nav-mobile-menu-btn"
              aria-expanded={mobileNavOpen}
              aria-controls="site-mobile-nav"
              aria-label={mobileNavOpen ? 'Menu open' : 'Open menu'}
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu size={22} strokeWidth={2} aria-hidden />
            </button>
            <nav className="nav" aria-label="Primary">
              <div className="nav-scroll">
                <Link to="/" className={getNavLinkClass({ path: '/' })}>
                  <Home size={18} aria-hidden />
                  <span>Overview</span>
                </Link>
                <Link to="/scorecard" className={getNavLinkClass({ scorecard: true })}>
                  <FileText size={18} aria-hidden />
                  <span>Scorecard</span>
                </Link>
                <Link to="/intel" className={getNavLinkClass({ path: '/intel' })}>
                  <Satellite size={18} aria-hidden />
                  <span>Intel</span>
                </Link>
                <Link
                  to="/protocols"
                  className={`${getNavLinkClass({ protocols: true })} nav-link--protocols`}
                  title="Protocols & Training"
                >
                  <BookOpen size={18} aria-hidden />
                  <span>Protocols & Training</span>
                </Link>
                <Link to="/contacts" className={getNavLinkClass({ contacts: true })}>
                  <Phone size={18} aria-hidden />
                  <span>Contacts</span>
                </Link>
              </div>
              <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
                {theme === 'light' ? <Moon size={18} aria-hidden /> : <Sun size={18} aria-hidden />}
              </button>
            </nav>
          </div>
        </div>
      </header>

      {mobileNavOpen && (
        <div className="mobile-nav-root" role="presentation">
          <button
            type="button"
            className="mobile-nav-backdrop"
            aria-label="Close menu"
            onClick={closeMobileNav}
          />
          <div
            id="site-mobile-nav"
            className="mobile-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-nav-title"
          >
            <div className="mobile-nav-drawer-header">
              <span id="mobile-nav-title" className="mobile-nav-drawer-title">
                Menu
              </span>
              <button
                type="button"
                className="mobile-nav-close"
                onClick={closeMobileNav}
                aria-label="Close menu"
              >
                <X size={22} aria-hidden />
              </button>
            </div>
            <nav className="mobile-nav-links" aria-label="Primary">
              <Link
                to="/"
                className={`${getNavLinkClass({ path: '/' })} mobile-nav-link`}
                onClick={closeMobileNav}
              >
                <Home size={20} aria-hidden />
                <span>Overview</span>
              </Link>
              <Link
                to="/scorecard"
                className={`${getNavLinkClass({ scorecard: true })} mobile-nav-link`}
                onClick={closeMobileNav}
              >
                <FileText size={20} aria-hidden />
                <span>Scorecard</span>
              </Link>
              <Link
                to="/intel"
                className={`${getNavLinkClass({ path: '/intel' })} mobile-nav-link`}
                onClick={closeMobileNav}
              >
                <Satellite size={20} aria-hidden />
                <span>Intel</span>
              </Link>
              <Link
                to="/protocols"
                className={`${getNavLinkClass({ protocols: true })} mobile-nav-link mobile-nav-link--wrap`}
                onClick={closeMobileNav}
              >
                <BookOpen size={20} aria-hidden />
                <span>Protocols & Training</span>
              </Link>
              <Link
                to="/contacts"
                className={`${getNavLinkClass({ contacts: true })} mobile-nav-link`}
                onClick={closeMobileNav}
              >
                <Phone size={20} aria-hidden />
                <span>Contacts</span>
              </Link>
            </nav>
            <div className="mobile-nav-drawer-footer">
              <span className="mobile-nav-theme-label">Appearance</span>
              <button type="button" className="mobile-nav-theme-btn" onClick={toggleTheme}>
                {theme === 'light' ? <Moon size={18} aria-hidden /> : <Sun size={18} aria-hidden />}
                {theme === 'light' ? 'Dark mode' : 'Light mode'}
              </button>
            </div>
          </div>
        </div>
      )}

      <EmergencyBanner />
      <main className={`main-content ${isIntelPage ? 'main-content--intel' : ''}`}>
        {children}
      </main>
      {!isIntelPage && <EnterpriseFooter />}
    </div>
  )
}

export default Layout
