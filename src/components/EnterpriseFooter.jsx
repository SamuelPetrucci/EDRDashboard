import skillvantageLogo from '../../skillvantagelogo.png'
import drisLogo from '../../DRISlogo.png'

/**
 * Site footer — Skillvantage (left), legal copy (center), DRIS (right).
 */
export default function EnterpriseFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="enterprise-footer enterprise-footer--simple" aria-label="Site footer">
      <div className="enterprise-footer__simple-inner">
        <div className="enterprise-footer__logos">
          <img
            src={skillvantageLogo}
            alt="Skillvantage Enterprise"
            className="enterprise-footer__logo enterprise-footer__logo--skillvantage"
            decoding="async"
          />
          <p className="enterprise-footer__legal">
            © {year} Marceen A. Burgher. All rights reserved. Patents pending. The SkillVantage
            AI-Powered Disaster Resilience Intelligence Scorecard™ (DRIS™) is proprietary
            intellectual property owned by Marceen A. Burgher and licensed to SkillVantage
            Enterprise. DRIS™ AI development support by Sam Petrucci.
          </p>
          <img
            src={drisLogo}
            alt="DRIS — Disaster Resilience Intelligence Scorecard"
            className="enterprise-footer__logo enterprise-footer__logo--dris"
            decoding="async"
          />
        </div>
      </div>
    </footer>
  )
}
