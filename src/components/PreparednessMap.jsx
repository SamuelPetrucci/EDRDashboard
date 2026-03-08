import { Link } from 'react-router-dom'
import { getAllParishes } from '../data/jamaicaParishes'
import { getParishScorecard } from '../utils/scorecardStorage'
import { calculateOverallScore, getRecoveryStatus } from '../data/scorecardDomains'
import { CheckCircle, Clock, AlertCircle, MapPin } from 'lucide-react'
import './PreparednessMap.css'

const PreparednessMap = () => {
  const parishes = getAllParishes()

  // Get readiness status for each parish
  const getParishReadiness = (parish) => {
    const scorecardData = getParishScorecard(parish.id)
    
    if (!scorecardData || !scorecardData.domains) {
      return {
        score: 0,
        status: 'Not Assessed',
        color: '#64748B',
        icon: MapPin,
        assessed: false
      }
    }

    const overallScore = calculateOverallScore(scorecardData.domains)
    const recoveryStatus = getRecoveryStatus(overallScore)
    
    let Icon
    if (overallScore >= 80) {
      Icon = CheckCircle
    } else if (overallScore >= 60) {
      Icon = Clock
    } else {
      Icon = AlertCircle
    }
    
    return {
      score: overallScore,
      status: recoveryStatus.status,
      color: recoveryStatus.color,
      icon: Icon,
      assessed: true
    }
  }

  // Geographic coordinates for Jamaica parishes (relative positions for visualization)
  const parishPositions = {
    // Western Parishes (left side)
    'westmoreland': { x: 20, y: 58 },
    'hanover': { x: 22, y: 52 },
    'st-james': { x: 25, y: 50 },
    'trelawny': { x: 30, y: 52 },
    'st-elizabeth': { x: 28, y: 62 },
    
    // Central Parishes
    'manchester': { x: 42, y: 58 },
    'clarendon': { x: 48, y: 60 },
    'st-catherine': { x: 55, y: 65 },
    'kingston': { x: 65, y: 72 },
    'st-andrew': { x: 63, y: 68 },
    
    // Eastern Parishes (right side)
    'st-ann': { x: 50, y: 48 },
    'st-mary': { x: 60, y: 42 },
    'portland': { x: 70, y: 38 },
    'st-thomas': { x: 68, y: 58 }
  }

  if (!parishes || parishes.length === 0) {
    return (
      <div className="preparedness-map">
        <div className="map-header">
          <h2>Jamaica Preparedness Map</h2>
          <p className="map-subtitle">Loading parish data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="preparedness-map">
      <div className="map-header">
        <h2>Jamaica Preparedness Map</h2>
        <p className="map-subtitle">Click on any parish to view details</p>
      </div>

      <div className="map-container">
        <svg 
          viewBox="0 0 100 100" 
          className="jamaica-map"
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background */}
          <rect x="0" y="0" width="100" height="100" fill="rgba(240, 248, 255, 0.5)" />
          
          {/* Jamaica outline */}
          <path
            d="M 15 35 L 20 32 L 28 30 L 35 28 L 42 27 L 50 26 L 58 27 L 65 28 L 72 30 L 76 33 L 80 38 L 82 42 L 83 48 L 82 54 L 80 60 L 76 66 L 72 70 L 65 74 L 58 76 L 50 77 L 42 76 L 35 74 L 28 70 L 20 66 L 16 60 L 15 54 L 15 48 L 15 42 Z"
            fill="rgba(74, 144, 226, 0.2)"
            stroke="#2C5F8D"
            strokeWidth="2.5"
            className="jamaica-outline"
          />

          {/* Parish Markers */}
          {parishes.map((parish) => {
            const readiness = getParishReadiness(parish)
            const position = parishPositions[parish.id] || { x: 50, y: 50 }
            const Icon = readiness.icon

            return (
              <g key={parish.id} className="parish-marker-group">
                {/* Marker Circle */}
                <circle
                  cx={position.x}
                  cy={position.y}
                  r="3.5"
                  fill={readiness.color}
                  stroke="white"
                  strokeWidth="1.5"
                  className="parish-marker"
                  opacity="1"
                />
                
                {/* Outer glow ring */}
                <circle
                  cx={position.x}
                  cy={position.y}
                  r="5"
                  fill="none"
                  stroke={readiness.color}
                  strokeWidth="0.8"
                  opacity="0.3"
                />

                {/* Parish Label */}
                <text
                  x={position.x}
                  y={position.y - 7}
                  textAnchor="middle"
                  className="parish-label"
                  fontSize="2.5"
                  fill="var(--text-primary)"
                  fontWeight="600"
                  style={{ textShadow: '0 1px 3px rgba(255, 255, 255, 0.9)' }}
                >
                  {parish.name}
                </text>

                {/* Status indicator */}
                <text
                  x={position.x}
                  y={position.y + 8}
                  textAnchor="middle"
                  className="status-label"
                  fontSize="1.8"
                  fill={readiness.color}
                  fontWeight="700"
                  style={{ textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)' }}
                >
                  {readiness.status === 'Resilient' ? '✓' : readiness.status === 'Restoring' ? '~' : readiness.status === 'Need Support' ? '!' : '?'}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Interactive Parish Links Overlay */}
        <div className="parish-overlay">
          {parishes.map((parish) => {
            const readiness = getParishReadiness(parish)
            const position = parishPositions[parish.id] || { x: 50, y: 50 }
            const Icon = readiness.icon

            return (
              <Link
                key={parish.id}
                to={`/parish/${parish.id}`}
                className="parish-link"
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                }}
                title={`${parish.name}: ${readiness.status} (${readiness.assessed ? readiness.score.toFixed(1) + '%' : 'Not Assessed'})`}
              >
                <div className="parish-icon-wrapper" style={{ color: readiness.color }}>
                  <Icon size={16} strokeWidth={2.5} />
                </div>
                <div className="parish-tooltip">
                  <div className="tooltip-header">
                    <strong>{parish.name}</strong>
                    <span className="tooltip-status" style={{ color: readiness.color }}>
                      {readiness.status}
                    </span>
                  </div>
                  {readiness.assessed && (
                    <div className="tooltip-score">
                      Score: {readiness.score.toFixed(1)}%
                    </div>
                  )}
                  <div className="tooltip-region">{parish.region} Region</div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="map-legend">
        <h3>Preparedness Status</h3>
        <div className="legend-items">
          <div className="legend-item">
            <CheckCircle size={20} style={{ color: 'var(--resilient-color)' }} />
            <div>
              <strong>Resilient</strong>
              <span>80-100% - High readiness</span>
            </div>
          </div>
          <div className="legend-item">
            <Clock size={20} style={{ color: 'var(--restoring-color)' }} />
            <div>
              <strong>Restoring</strong>
              <span>60-79% - Moderate capability</span>
            </div>
          </div>
          <div className="legend-item">
            <AlertCircle size={20} style={{ color: 'var(--need-support-color)' }} />
            <div>
              <strong>Need Support</strong>
              <span>0-59% - Requires attention</span>
            </div>
          </div>
          <div className="legend-item">
            <MapPin size={20} style={{ color: 'var(--text-secondary)' }} />
            <div>
              <strong>Not Assessed</strong>
              <span>No scorecard data</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PreparednessMap
