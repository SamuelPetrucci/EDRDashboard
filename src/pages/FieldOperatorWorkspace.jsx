import './DrisRoleShell.css'

export default function FieldOperatorWorkspace() {
  return (
    <div className="dris-role-shell">
      <p className="dris-role-shell__eyebrow">DRIS™ · Field user</p>
      <h1 className="dris-role-shell__title">Field operator workspace</h1>
      <p className="dris-role-shell__lede">
        Submit KPI updates and evidence for parishes or states you are assigned to. Intel, scorecards, and National Overview remain available
        from the main navigation for situational awareness.
      </p>
      <div className="dris-role-shell__panel">
        <h2>Product surface (from UI framework)</h2>
        <ul>
          <li>
            <strong>My tasks</strong> — queue from <code>operator_tasks</code> (assigned to you); open a task to jump into the right form.
          </li>
          <li>
            <strong>Submit KPI update</strong> — parish/state, domain, KPI pickers; 0–3 (or N/A) score; evidence upload; notes; save draft
            vs submit → writes <code>kpi_submissions</code> + <code>kpi_submission_evidence</code>.
          </li>
          <li>
            <strong>Submit resource / employee data</strong> — separate intake (future table) for roster-style updates.
          </li>
          <li>
            <strong>My submissions</strong> — read-only history filtered by <code>workflow_status</code> (draft, submitted, returned, approved).
          </li>
        </ul>
      </div>
      <div className="dris-role-shell__panel">
        <h2>Database (migration applied)</h2>
        <p>
          Use Supabase REST against <code>kpi_definitions</code> (catalog), <code>kpi_submissions</code>, <code>kpi_submission_evidence</code>, and{' '}
          <code>operator_tasks</code>. RLS allows inserts when your profile has matching <code>user_jurisdiction_access</code> or country-wide access.
        </p>
      </div>
    </div>
  )
}
