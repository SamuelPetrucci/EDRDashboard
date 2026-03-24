import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, MapPin, FileText, BookOpen, Phone, Moon, Sun, Satellite } from 'lucide-react'
import EmergencyBanner from './EmergencyBanner'
import brandLogo from '../../headerlogo.png'
import './Layout.css'

const Layout = ({ children }) => {
  const location = useLocation()
  const [theme, setTheme] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('theme') : null
    return saved || 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'))
  }

  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <img src={brandLogo} alt="Emergency Resilience Scorecard (TM)" className="logo-image" />
          </div>
          <nav className="nav">
            <Link 
              to="/" 
              className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            >
              <Home size={18} />
              <span>Overview</span>
            </Link>
            <Link 
              to="/parish/kingston" 
              className={`nav-link ${location.pathname.startsWith('/parish') && !location.pathname.includes('scorecard') ? 'active' : ''}`}
            >
              <MapPin size={18} />
              <span>Parishes</span>
            </Link>
            <Link 
              to="/scorecard" 
              className={`nav-link ${location.pathname.includes('scorecard') ? 'active' : ''}`}
            >
              <FileText size={18} />
              <span>Scorecard</span>
            </Link>
            <Link 
              to="/intel" 
              className={`nav-link ${location.pathname === '/intel' ? 'active' : ''}`}
            >
              <Satellite size={18} />
              <span>Intel</span>
            </Link>
            <Link 
              to="/protocols" 
              className={`nav-link ${location.pathname === '/protocols' ? 'active' : ''}`}
            >
              <BookOpen size={18} />
              <span>Protocols & Training</span>
            </Link>
            <Link 
              to="/contacts" 
              className={`nav-link ${location.pathname === '/contacts' ? 'active' : ''}`}
            >
              <Phone size={18} />
              <span>Contacts</span>
            </Link>
            <button 
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </nav>
        </div>
      </header>
      <EmergencyBanner />
      <main className={`main-content ${location.pathname === '/intel' ? 'main-content--intel' : ''}`}>
        {children}
      </main>
      <footer className="footer footer--minimal" />
    </div>
  )
}

export default Layout

