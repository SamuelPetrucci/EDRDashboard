import './DrisRoleShell.css'

export default function AuditorDashboard() {
  return (
    <div className="dris-role-shell">
      <p className="dris-role-shell__eyebrow">DRIS™ · Auditor</p>
      <h1 className="dris-role-shell__title">Compliance & audit</h1>
      <p className="dris-role-shell__lede">
        Read-only validation: audit trails, evidence review, score calculation detail, and exports. The live scorecard views elsewhere
        stay available where policy allows; this area will consolidate compliance reporting.
      </p>
      <div className="dris-role-shell__panel">
        <h2>Planned focus</h2>
        <ul>
          <li>Immutable-style audit trail (who / what / before / after / when)</li>
          <li>Explainability: points earned vs possible, weights, calibration deltas</li>
          <li>Export center for compliance packs</li>
        </ul>
      </div>
    </div>
  )
}
