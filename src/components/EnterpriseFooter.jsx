import footerLogo from '../../headerlogo.png'

/**
 * Site footer — logo + copyright only.
 */
export default function EnterpriseFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="enterprise-footer enterprise-footer--simple" aria-label="Site footer">
      <div className="enterprise-footer__simple-inner">
        <div className="enterprise-footer__brand">
          <img
            src={footerLogo}
            alt="Skillvantage DRIS — Disaster Resilience Intelligence Scorecard"
            className="enterprise-footer__logo"
            decoding="async"
          />
        </div>
        <p className="enterprise-footer__copy">© {year} Skillvantage</p>
      </div>
    </footer>
  )
}
