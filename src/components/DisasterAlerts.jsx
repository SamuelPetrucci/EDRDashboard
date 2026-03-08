import { useState, useEffect } from 'react'
import { AlertTriangle, Clock, MapPin, CheckCircle, X } from 'lucide-react'
import { getActiveAlerts, alertTypes } from '../data/disasterAlerts'
import './DisasterAlerts.css'

const DisasterAlerts = () => {
  const [alerts, setAlerts] = useState([])
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set())
  const [lastUpdate, setLastUpdate] = useState(null)

  useEffect(() => {
    const loadAlerts = () => {
      const activeAlerts = getActiveAlerts()
      setAlerts(activeAlerts)
      setLastUpdate(new Date())
    }

    loadAlerts()

    // Simulate live updates every 10 minutes
    const interval = setInterval(loadAlerts, 600000)

    return () => clearInterval(interval)
  }, [])

  const handleDismiss = (alertId) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]))
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'warning':
        return 'var(--danger-color)'
      case 'watch':
        return 'var(--warning-color)'
      case 'advisory':
        return 'var(--primary-color)'
      default:
        return 'var(--text-secondary)'
    }
  }

  const activeAlerts = alerts.filter(alert => !dismissedAlerts.has(alert.id))

  if (activeAlerts.length === 0) {
    return (
      <div className="disaster-alerts">
        <div className="alerts-header">
          <h2>Disaster Alerts</h2>
        </div>
        <div className="no-alerts">
          <CheckCircle size={48} />
          <p>No active alerts at this time</p>
          <span className="last-update">
            Last checked: {lastUpdate ? formatTime(lastUpdate) : 'Never'}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="disaster-alerts">
      <div className="alerts-header">
        <div>
          <h2>Active Disaster Alerts</h2>
          {lastUpdate && (
            <span className="update-time">
              Last updated: {formatTime(lastUpdate)}
            </span>
          )}
        </div>
        <div className="alert-count">
          <AlertTriangle size={20} />
          <span>{activeAlerts.length} Active</span>
        </div>
      </div>

      <div className="alerts-list">
        {activeAlerts.map((alert) => {
          const alertType = alertTypes[alert.type] || alertTypes.hurricane
          const severityColor = getSeverityColor(alert.severity)

          return (
            <div
              key={alert.id}
              className="alert-card"
              style={{ borderLeftColor: severityColor }}
            >
              <div className="alert-card-header">
                <div className="alert-type-badge" style={{ backgroundColor: alertType.color }}>
                  <span>{alertType.icon}</span>
                  <span>{alertType.name}</span>
                </div>
                <div className="alert-severity" style={{ color: severityColor }}>
                  {alert.severity.toUpperCase()}
                </div>
                <button
                  className="dismiss-btn"
                  onClick={() => handleDismiss(alert.id)}
                  aria-label="Dismiss alert"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="alert-content">
                <h3>{alert.title}</h3>
                <p className="alert-description">{alert.description}</p>

                <div className="alert-meta">
                  <div className="meta-item">
                    <MapPin size={16} />
                    <span>
                      Affected: {alert.affectedParishes.length} parish(es)
                    </span>
                  </div>
                  <div className="meta-item">
                    <Clock size={16} />
                    <span>Issued: {formatTime(alert.issued)}</span>
                  </div>
                  {alert.expires && (
                    <div className="meta-item">
                      <Clock size={16} />
                      <span>Expires: {formatTime(alert.expires)}</span>
                    </div>
                  )}
                </div>

                <div className="alert-actions">
                  <h4>Recommended Actions:</h4>
                  <ul>
                    {alert.actions.map((action, index) => (
                      <li key={index}>{action}</li>
                    ))}
                  </ul>
                </div>

                <div className="alert-source">
                  Source: {alert.source}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="alerts-footer">
        <p className="demo-notice">
          ⚠️ Demo Data - In production, this would connect to real alert systems (FEMA, ODPEM, NHC, etc.)
        </p>
      </div>
    </div>
  )
}

export default DisasterAlerts



