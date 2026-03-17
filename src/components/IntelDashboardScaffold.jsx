import { AlertTriangle, Globe2, Radio, Cloud, DollarSign, Car, Activity } from 'lucide-react'
import './IntelDashboardScaffold.css'

const IntelDashboardScaffold = () => {
  const placeholderItems = [
    { id: 'sample-1', title: 'No critical anomalies detected', body: 'AI vision and anomaly detection will surface notable deviations across all feeds here.', severity: 'info' },
    { id: 'sample-2', title: 'Scaffolding in progress', body: 'Connect geopolitical, weather, finance, traffic, and disaster sources to power this dashboard.', severity: 'low' },
  ]

  return (
    <div className="intel-dashboard-scaffold">
      <header className="intel-dashboard-scaffold-header">
        <div className="intel-dashboard-scaffold-title">
          <Globe2 size={20} />
          <div>
            <h1>Intel Dashboard</h1>
            <p>High-level intelligence view for state, local, and partner operations. Data feeds and AI analysis coming soon.</p>
          </div>
        </div>
        <span className="intel-dashboard-scaffold-pill">Scaffolding phase</span>
      </header>

      <section className="intel-dashboard-scaffold-grid">
        <div className="intel-dashboard-scaffold-column">
          <div className="intel-dashboard-card intel-dashboard-card--primary">
            <div className="intel-dashboard-card-header">
              <AlertTriangle size={18} />
              <span>AI vision & anomalies</span>
            </div>
            <div className="intel-dashboard-card-body">
              <p className="intel-dashboard-card-intro">
                This section will aggregate alerts and analysis from all intelligence feeds – highlighting anomalies in movement,
                geopolitics, weather, finance, traffic, and disasters.
              </p>
              <ul className="intel-dashboard-alert-list">
                {placeholderItems.map((item) => (
                  <li key={item.id} className="intel-dashboard-alert-item">
                    <div className="intel-dashboard-alert-main">
                      <strong>{item.title}</strong>
                      <p>{item.body}</p>
                    </div>
                    <span className="intel-dashboard-alert-tag">Coming soon</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="intel-dashboard-scaffold-column intel-dashboard-scaffold-column--right">
          <div className="intel-dashboard-card">
            <div className="intel-dashboard-card-header">
              <Radio size={16} />
              <span>Geopolitical</span>
            </div>
            <div className="intel-dashboard-card-body">
              <p className="intel-dashboard-placeholder-text">
                Briefings on regional and global political developments, security incidents, and policy shifts will appear here.
              </p>
            </div>
          </div>

          <div className="intel-dashboard-card">
            <div className="intel-dashboard-card-header">
              <Cloud size={16} />
              <span>Weather & climate</span>
            </div>
            <div className="intel-dashboard-card-body">
              <p className="intel-dashboard-placeholder-text">
                Aggregated severe weather, seasonal outlooks, and climate signals affecting operations and infrastructure.
              </p>
            </div>
          </div>

          <div className="intel-dashboard-card">
            <div className="intel-dashboard-card-header">
              <DollarSign size={16} />
              <span>Finance & infrastructure</span>
            </div>
            <div className="intel-dashboard-card-body">
              <p className="intel-dashboard-placeholder-text">
                Market stress, supply chain disruptions, and critical infrastructure status for resilience planning.
              </p>
            </div>
          </div>

          <div className="intel-dashboard-card intel-dashboard-card--compact-row">
            <div className="intel-dashboard-card-split">
              <div className="intel-dashboard-card-split-item">
                <div className="intel-dashboard-card-header">
                  <Car size={14} />
                  <span>Traffic & mobility</span>
                </div>
                <p className="intel-dashboard-placeholder-text">
                  Live congestion, route disruptions, and mobility patterns from map feeds and sensors.
                </p>
              </div>
              <div className="intel-dashboard-card-split-item">
                <div className="intel-dashboard-card-header">
                  <Activity size={14} />
                  <span>Disasters & hazards</span>
                </div>
                <p className="intel-dashboard-placeholder-text">
                  Earthquakes, storms, floods, and other hazard summaries built on GDACS, USGS, and future sources.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default IntelDashboardScaffold

