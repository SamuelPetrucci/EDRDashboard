import skillvantageLogo from '../../skillvantagelogo.png'

/**
 * Site footer — SkillVantage mark and legal copy.
 */
export default function EnterpriseFooter() {
  return (
    <footer className="enterprise-footer enterprise-footer--simple" aria-label="Site footer">
      <div className="enterprise-footer__simple-inner">
        <div className="enterprise-footer__logos">
          <img
            src={skillvantageLogo}
            alt="SkillVantage Enterprise"
            className="enterprise-footer__logo enterprise-footer__logo--skillvantage"
            decoding="async"
          />
          <p className="enterprise-footer__legal">
            © 2026 SkillVantage Enterprise. All rights reserved. DRIS™ (Disaster Resilience
            Intelligence Scorecard™) is a proprietary, patent-pending system of SkillVantage
            Enterprise. Unauthorized use or disclosure is prohibited.
          </p>
        </div>
      </div>
    </footer>
  )
}
