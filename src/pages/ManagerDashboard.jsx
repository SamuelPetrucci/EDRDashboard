import '../styles/dris-dashboard.css'

const APPROVALS = [
  { id: 'R-1042', domain: 'Housing', by: 'M. Chen', status: 'Pending' },
  { id: 'R-1043', domain: 'Infrastructure', by: 'A. Blake', status: 'Pending' },
  { id: 'R-1044', domain: 'Health', by: 'J. Wright', status: 'Evidence requested' },
]

const GAPS = [
  { title: 'Housing recovery', level: 'High gap', detail: 'Backlog on resilient rebuild inspections.' },
  { title: 'Infrastructure', level: 'High gap', detail: 'Coastal hardening KPIs below threshold.' },
  { title: 'Finance', level: 'Watch', detail: 'Recovery finance plan completeness at 62%.' },
]

export default function ManagerDashboard() {
  return (
    <div className="dris-dashboard">
      <h1 className="dris-dashboard__page-title">State / Parish manager dashboard</h1>

      <div className="dris-dashboard__grid dris-dashboard__grid--kpi4" style={{ marginBottom: '1rem' }}>
        <div className="dris-card">
          <h2 className="dris-card__title">Parish DRIS score</h2>
          <div className="dris-card__body">
            <p className="dris-stat-num">68</p>
            <p className="dris-muted">/100 · demo aggregate</p>
          </div>
        </div>
        <div className="dris-card">
          <h2 className="dris-card__title">Classification</h2>
          <div className="dris-card__body">
            <span className="dris-pill dris-pill--warn">Needs support</span>
            <p className="dris-muted" style={{ marginTop: '0.65rem' }}>
              Band 50–69 (demo)
            </p>
          </div>
        </div>
        <div className="dris-card">
          <h2 className="dris-card__title">Pending approvals</h2>
          <div className="dris-card__body">
            <p className="dris-stat-num">12</p>
            <p className="dris-muted">Across domains (demo)</p>
          </div>
        </div>
        <div className="dris-card">
          <h2 className="dris-card__title">Critical gaps</h2>
          <div className="dris-card__body">
            <p className="dris-stat-num dris-stat-num--alert">4</p>
            <p className="dris-muted">Open mitigation items (demo)</p>
          </div>
        </div>
      </div>

      <div className="dris-dashboard__grid dris-dashboard__grid--triple">
        <div className="dris-card">
          <h2 className="dris-card__title">Approval queue</h2>
          <div className="dris-card__body dris-table-wrap">
            <table className="dris-table">
              <thead>
                <tr>
                  <th>Record</th>
                  <th>Domain</th>
                  <th>Submitted by</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {APPROVALS.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.domain}</td>
                    <td>{r.by}</td>
                    <td>{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="dris-card">
          <h2 className="dris-card__title">Domain gap cards</h2>
          <div className="dris-card__body" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {GAPS.map((g) => (
              <div
                key={g.title}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '0.65rem 0.75rem',
                  background: '#f8fafc',
                }}
              >
                <p className="dris-text-strong" style={{ margin: 0, fontWeight: 700 }}>
                  {g.title}
                </p>
                <p className="dris-pill dris-pill--warn" style={{ marginTop: 6, fontSize: '0.72rem', width: 'fit-content' }}>
                  {g.level}
                </p>
                <p className="dris-muted" style={{ marginTop: 6 }}>
                  {g.detail}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="dris-card">
          <h2 className="dris-card__title">Score trend</h2>
          <div className="dris-card__body">
            <p className="dris-muted">
              Line chart for DRIS score over time will connect to your warehouse. Demo placeholder: upward drift of +4
              points over the last six months after calibration.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
