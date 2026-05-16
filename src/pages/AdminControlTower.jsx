import { useState } from 'react'
import UsersInvitesSection from '../components/admin/UsersInvitesSection'
import '../styles/dris-dashboard.css'
import './AdminControlTower.css'

const KPIS = [
  { label: 'Total users', value: '1,248', delta: '+12%', up: true },
  { label: 'Pending validations', value: '87', delta: '+5%', up: true },
  { label: 'Pending approvals', value: '42', delta: '−8%', up: false },
  { label: 'Data quality score', value: '87%', delta: '+7%', up: true },
  { label: 'Audit exceptions', value: '5', delta: '−3%', up: false },
]

const FEED = [
  { who: 'John Smith', role: 'Data Officer', action: 'Submitted KPI data for Infrastructure', when: '2 mins ago' },
  { who: 'Sarah Johnson', role: 'Parish Manager', action: 'Approved Housing Recovery evidence pack', when: '15 mins ago' },
  { who: 'Michael Brown', role: 'Data Officer', action: 'Uploaded documents for Health domain', when: '1 hour ago' },
  { who: 'Emily Davis', role: 'Data Officer', action: 'Returned Governance KPI for correction', when: '2 hours ago' },
]

const CAL_ROWS = [
  { domain: 'Governance', raw: '78%', cal: '82%', status: 'Passing', ok: true },
  { domain: 'Infrastructure', raw: '65%', cal: '71%', status: 'Passing', ok: true },
  { domain: 'Housing', raw: '52%', cal: '58%', status: 'Needs support', ok: false },
  { domain: 'Health', raw: '71%', cal: '74%', status: 'Passing', ok: true },
  { domain: 'Economy', raw: '69%', cal: '72%', status: 'Passing', ok: true },
]

const ALERTS = [
  'No Recovery Plan — score capped at 70%.',
  'Incomplete evidence for Finance KPI set.',
  'Calibration drift detected in Housing (review suggested).',
]

export default function AdminControlTower() {
  const [tab, setTab] = useState('overview')

  return (
    <div className="dris-dashboard dris-dashboard--admin admin-control-tower">
      <div className="admin-control-tower__header">
        <h1 className="dris-dashboard__page-title">Administrator control tower</h1>
        <div className="admin-control-tower__tabs" role="tablist" aria-label="Admin sections">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'overview'}
            className={`admin-control-tower__tab${tab === 'overview' ? ' admin-control-tower__tab--active' : ''}`}
            onClick={() => setTab('overview')}
          >
            Overview
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'users'}
            className={`admin-control-tower__tab${tab === 'users' ? ' admin-control-tower__tab--active' : ''}`}
            onClick={() => setTab('users')}
          >
            Users & invitations
          </button>
        </div>
      </div>

      {tab === 'users' ? (
        <UsersInvitesSection />
      ) : (
        <>
          <div className="dris-dashboard__grid dris-dashboard__grid--kpi5">
            {KPIS.map((k) => (
              <div key={k.label} className="dris-card">
                <h2 className="dris-card__title">{k.label}</h2>
                <div className="dris-card__body">
                  <p className="dris-stat-num">{k.value}</p>
                  <p className={`dris-stat-delta ${k.up ? 'dris-stat-delta--up' : 'dris-stat-delta--down'}`}>{k.delta}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="dris-dashboard__grid dris-dashboard__grid--triple" style={{ marginTop: '1rem' }}>
            <div className="dris-card">
              <h2 className="dris-card__title">User activity feed</h2>
              <div className="dris-card__body">
                <ul className="dris-feed">
                  {FEED.map((f) => (
                    <li key={`${f.who}-${f.when}`}>
                      <strong>
                        {f.who} ({f.role})
                      </strong>{' '}
                      — {f.action}{' '}
                      <span className="dris-muted">· {f.when}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="dris-card">
              <h2 className="dris-card__title">Calibration review panel</h2>
              <div className="dris-card__body dris-table-wrap">
                <table className="dris-table">
                  <thead>
                    <tr>
                      <th>Domain</th>
                      <th>Raw score</th>
                      <th>Calibrated</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CAL_ROWS.map((r) => (
                      <tr key={r.domain}>
                        <td>{r.domain}</td>
                        <td>{r.raw}</td>
                        <td>{r.cal}</td>
                        <td>
                          <span className={r.ok ? 'dris-pill dris-pill--ok' : 'dris-pill dris-pill--warn'} style={{ fontSize: '0.68rem' }}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <a className="dris-link" href="#review">
                  Review calibration changes →
                </a>
              </div>
            </div>

            <div className="dris-card">
              <h2 className="dris-card__title">Critical KPI cap alerts</h2>
              <div className="dris-card__body">
                <ul className="dris-alert-list">
                  {ALERTS.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
                <a className="dris-link" href="#alerts">
                  View all alerts →
                </a>
              </div>
            </div>
          </div>

          <div className="dris-card" style={{ marginTop: '1rem' }}>
            <h2 className="dris-card__title">System health</h2>
            <div className="dris-card__body dris-health">
              <div>
                Data sync: <b>Healthy</b>
              </div>
              <div>
                API services: <b>Healthy</b>
              </div>
              <div>
                Database: <b>Healthy</b>
              </div>
              <div>
                Backup status: <b>Healthy</b>
              </div>
              <div>
                Storage: <strong className="dris-text-strong">74%</strong>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
