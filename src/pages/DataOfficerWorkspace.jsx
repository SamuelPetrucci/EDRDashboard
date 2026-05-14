import './DrisRoleShell.css'

export default function DataOfficerWorkspace() {
  return (
    <div className="dris-role-shell">
      <p className="dris-role-shell__eyebrow">DRIS™ · Data Officer</p>
      <h1 className="dris-role-shell__title">State / parish data officer workspace</h1>
      <p className="dris-role-shell__lede">
        Validate field submissions, complete structured KPI inputs, and track evidence gaps. Same global nav as other roles: use Intel for
        feeds, Scorecard for published composites, and National Overview for geography.
      </p>
      <div className="dris-role-shell__panel">
        <h2>Product surface (from UI framework)</h2>
        <ul>
          <li>
            <strong>Validation dashboard</strong> — table of <code>kpi_submissions</code> in <code>pending_validation</code> / <code>submitted</code> with
            evidence flags; approve / reject / return actions (implement via a SECURITY DEFINER RPC so RLS stays strict for field users).
          </li>
          <li>
            <strong>KPI input forms</strong> — same 0–3 + N/A model; data officers can enter official values where they have jurisdiction or country scope.
          </li>
          <li>
            <strong>Evidence uploads</strong> — review files in <code>kpi_submission_evidence</code>; tie to storage bucket policies.
          </li>
          <li>
            <strong>Employee / resource records</strong> — future module; keep out of KPI tables to avoid mixing concerns.
          </li>
          <li>
            <strong>Reports</strong> — aggregate from <code>kpi_submissions</code> + <code>scorecard_snapshots</code> + <code>news_stories</code> by country and jurisdiction.
          </li>
        </ul>
      </div>
      <div className="dris-role-shell__panel">
        <h2>Validation workflow (recommended next step)</h2>
        <p>
          Field users update only <code>draft</code> / <code>returned</code> rows they own. Add an RPC such as <code>data_officer_review_submission</code> that
          transitions status to <code>approved</code> / <code>rejected</code> / <code>returned</code>, sets <code>reviewed_by</code>, and optionally materializes domain scores into{' '}
          <code>scorecard_snapshots</code> for the executive heatmap.
        </p>
      </div>
    </div>
  )
}
