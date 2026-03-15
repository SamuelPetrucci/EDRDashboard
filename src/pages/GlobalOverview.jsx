import { Link } from 'react-router-dom'
import { getAllParishes } from '../data/jamaicaParishes'
import { MapPin, Users, Package, AlertCircle, CheckCircle, Clock, BookOpen, MessageSquare, BarChart3, ArrowRight, GraduationCap, Bell, Cloud, Thermometer, ExternalLink, Radio, Truck, Zap, Heart, UserCheck, Satellite, Shield, Phone, LayoutGrid } from 'lucide-react'
import DisasterAlerts from '../components/DisasterAlerts'
import { getParishScorecard } from '../utils/scorecardStorage'
import { getParishEquipment, getParishPersonnel } from '../utils/equipmentStorage'
import { calculateOverallScore, getRecoveryStatus } from '../data/scorecardDomains'
import { getRequiredTrainings, getAllTrainings } from '../data/trainings'
import { getWeatherData } from '../data/weatherFeed'
import { getCommunications } from '../data/communications'
import './GlobalOverview.css'

const GlobalOverview = () => {
  const parishes = getAllParishes()
  const requiredTrainings = getRequiredTrainings()
  const allTrainings = getAllTrainings()
  const communications = getCommunications()
  const weather = getWeatherData()
  const satelliteUrl = 'https://www.windy.com/?18.1096,-77.2975,7,satellite'

  // Get readiness status for each parish
  const getParishReadiness = (parish) => {
    const scorecardData = getParishScorecard(parish.id)
    
    if (!scorecardData || !scorecardData.domains) {
      return {
        score: 0,
        status: 'Not Assessed',
        color: 'var(--text-secondary)',
        assessed: false
      }
    }

    const overallScore = calculateOverallScore(scorecardData.domains)
    const recoveryStatus = getRecoveryStatus(overallScore)
    
    return {
      score: overallScore,
      status: recoveryStatus.status,
      color: recoveryStatus.color,
      assessed: true
    }
  }

  // Effective equipment/personnel per parish (storage or default)
  const getEffective = (parish) => {
    const eq = getParishEquipment(parish.id)
    const pers = getParishPersonnel(parish.id)
    let equipment = parish.equipment
    let personnel = parish.personnel
    if (eq) {
      const { lastUpdated, updatedBy, ...rest } = eq
      equipment = rest
    }
    if (pers) {
      const { lastUpdated, updatedBy, ...rest } = pers
      personnel = rest
    }
    return { equipment, personnel }
  }

  // Aggregate inventory stats (meaningful categories)
  const inventoryAgg = parishes.reduce(
    (acc, parish) => {
      const { equipment, personnel } = getEffective(parish)
      acc.emergencyVehicles += equipment.emergencyVehicles || 0
      acc.generators += equipment.generators || 0
      acc.medicalSupplies += equipment.medicalSupplies || 0
      acc.waterTrucks += equipment.waterTrucks || 0
      acc.emergencyResponders += personnel.emergencyResponders || 0
      acc.medicalStaff += personnel.medicalStaff || 0
      acc.volunteers += personnel.volunteers || 0
      acc.totalEquipment += Object.values(equipment).filter((v) => typeof v === 'number').reduce((a, b) => a + b, 0)
      acc.totalPersonnel += Object.values(personnel).filter((v) => typeof v === 'number').reduce((a, b) => a + b, 0)
      return acc
    },
    { emergencyVehicles: 0, generators: 0, medicalSupplies: 0, waterTrucks: 0, emergencyResponders: 0, medicalStaff: 0, volunteers: 0, totalEquipment: 0, totalPersonnel: 0 }
  )

  const totalPopulation = parishes.reduce((sum, parish) => sum + parish.population, 0)

  // Calculate readiness statistics
  const readinessStats = parishes.reduce((stats, parish) => {
    const readiness = getParishReadiness(parish)
    if (!readiness.assessed) {
      stats.notAssessed++
    } else if (readiness.status === 'Resilient') {
      stats.resilient++
    } else if (readiness.status === 'Restoring') {
      stats.restoring++
    } else {
      stats.needSupport++
    }
    return stats
  }, { resilient: 0, restoring: 0, needSupport: 0, notAssessed: 0 })

  // Calculate average readiness score
  const assessedParishes = parishes.filter(p => getParishReadiness(p).assessed)
  const averageScore = assessedParishes.length > 0
    ? assessedParishes.reduce((sum, p) => sum + getParishReadiness(p).score, 0) / assessedParishes.length
    : 0

  return (
    <div className="global-overview">
      <div className="page-header">
        <h1>Jamaica Disaster Recovery Dashboard</h1>
        <p className="subtitle">Coordinated Emergency Management - 14 Parishes Overview</p>
      </div>

      {/* At-a-Glance Overview */}
      <div className="scorecard-overview-section">
        <div className="section-header">
          <div className="header-content">
            <BarChart3 size={24} />
            <h2>Overview</h2>
          </div>
          <Link to="/scorecard" className="view-all-link">
            View Full Scorecard <ArrowRight size={16} />
          </Link>
        </div>
        <div className="overview-body">
          <div className="overview-primary">
            <div className="scorecard-grid">
              {weather?.current ? (
                <div className="scorecard-weather-card">
              <div className="weather-card-header">
                <Cloud size={20} />
                <span>Weather</span>
              </div>
              <div className="weather-card-main">
                <div className="weather-card-temp">
                  <Thermometer size={24} />
                  <span>{weather.current.temperature}°C</span>
                </div>
                <div className="weather-card-condition">{weather.current.condition}</div>
                <div className="weather-card-details">
                  <span>H {weather.current.humidity}%</span>
                  <span>W {weather.current.windSpeed} km/h {weather.current.windDirection}</span>
                </div>
              </div>
              <a
                href={satelliteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="weather-satellite-link"
              >
                <ExternalLink size={14} />
                View satellite
              </a>
            </div>
          ) : (
            <div className="scorecard-weather-card scorecard-weather-card-placeholder">
              <div className="weather-card-header">
                <Cloud size={20} />
                <span>Weather</span>
              </div>
              <div className="weather-card-main">
                <span className="weather-placeholder-text">—</span>
                <a href={satelliteUrl} target="_blank" rel="noopener noreferrer" className="weather-satellite-link">
                  <ExternalLink size={14} /> View satellite
                </a>
              </div>
            </div>
          )}
          <div className="scorecard-summary-card">
            <div className="score-display">
              <div className="score-circle-large" style={{ borderColor: getRecoveryStatus(averageScore).color }}>
                <span className="score-value-large">{averageScore.toFixed(0)}%</span>
              </div>
              <div className="score-info">
                <h3>Average Readiness</h3>
                <div className="status-badge-large" style={{ backgroundColor: getRecoveryStatus(averageScore).color }}>
                  {getRecoveryStatus(averageScore).status}
                </div>
              </div>
            </div>
          </div>
          <div className="readiness-stats-grid-compact">
            <div className="readiness-stat-card-compact" style={{ borderColor: 'var(--resilient-color)' }}>
              <CheckCircle size={20} style={{ color: 'var(--resilient-color)' }} />
              <div>
                <h4>{readinessStats.resilient}</h4>
                <p>Resilient</p>
              </div>
            </div>
            <div className="readiness-stat-card-compact" style={{ borderColor: 'var(--restoring-color)' }}>
              <Clock size={20} style={{ color: 'var(--restoring-color)' }} />
              <div>
                <h4>{readinessStats.restoring}</h4>
                <p>Restoring</p>
              </div>
            </div>
            <div className="readiness-stat-card-compact" style={{ borderColor: 'var(--need-support-color)' }}>
              <AlertCircle size={20} style={{ color: 'var(--need-support-color)' }} />
              <div>
                <h4>{readinessStats.needSupport}</h4>
                <p>Need Support</p>
              </div>
            </div>
            <div className="readiness-stat-card-compact" style={{ borderColor: 'var(--text-secondary)' }}>
              <AlertCircle size={20} style={{ color: 'var(--text-secondary)' }} />
              <div>
                <h4>{readinessStats.notAssessed}</h4>
                <p>Not Assessed</p>
              </div>
            </div>
          </div>
        </div>
          </div>
          <div className="overview-sidebar">
            <div className="overview-sidebar-card">
              <h4 className="overview-sidebar-title"><LayoutGrid size={18} /> Quick access</h4>
              <nav className="overview-sidebar-links">
                <Link to="/scorecard" className="overview-sidebar-link"><BarChart3 size={16} /> Full scorecard</Link>
                <Link to="/intel" className="overview-sidebar-link"><Satellite size={16} /> Intel map</Link>
                <Link to="/protocols" className="overview-sidebar-link"><Shield size={16} /> Protocols & training</Link>
                <Link to="/contacts" className="overview-sidebar-link"><Phone size={16} /> Contacts</Link>
                <Link to="/parish/kingston" className="overview-sidebar-link"><MapPin size={16} /> Parishes</Link>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid - Training + Inventory (stacked left), Alerts (right, embedded scroll) */}
      <div className="main-content-grid">
        {/* Training Section */}
        <div className="training-section-card">
          <div className="section-header">
            <div className="header-content">
              <GraduationCap size={24} />
              <h2>Training & Protocols</h2>
            </div>
            <Link to="/protocols" className="view-all-link">
              View All <ArrowRight size={16} />
            </Link>
          </div>
          <div className="training-summary">
            <div className="training-stat">
              <div className="stat-number">{requiredTrainings.length}</div>
              <div className="stat-label">Required Trainings</div>
            </div>
            <div className="training-stat">
              <div className="stat-number">{allTrainings.length}</div>
              <div className="stat-label">Total Available</div>
            </div>
          </div>
          <div className="upcoming-trainings">
            <h3>Featured Trainings</h3>
            {requiredTrainings.slice(0, 3).map(training => (
              <div key={training.id} className="training-item">
                <BookOpen size={16} />
                <div>
                  <div className="training-name">{training.name}</div>
                  <div className="training-meta">{training.duration} • {training.provider}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory Summary Section - under Training */}
        <div className="inventory-section-card">
          <div className="section-header">
            <div className="header-content">
              <Package size={24} />
              <h2>Inventory Summary</h2>
            </div>
            <Link to="/parish/kingston" className="view-all-link">
              Manage Inventory <ArrowRight size={16} />
            </Link>
          </div>
          <div className="inventory-stats">
            <div className="inventory-stat-card">
              <Truck size={24} />
              <div>
                <div className="inventory-number">{inventoryAgg.emergencyVehicles.toLocaleString()}</div>
                <div className="inventory-label">Emergency vehicles</div>
              </div>
            </div>
            <div className="inventory-stat-card">
              <Zap size={24} />
              <div>
                <div className="inventory-number">{inventoryAgg.generators.toLocaleString()}</div>
                <div className="inventory-label">Generators</div>
              </div>
            </div>
            <div className="inventory-stat-card">
              <Package size={24} />
              <div>
                <div className="inventory-number">{inventoryAgg.medicalSupplies.toLocaleString()}</div>
                <div className="inventory-label">Medical supply kits</div>
              </div>
            </div>
            <div className="inventory-stat-card">
              <UserCheck size={24} />
              <div>
                <div className="inventory-number">{inventoryAgg.emergencyResponders.toLocaleString()}</div>
                <div className="inventory-label">Emergency responders</div>
              </div>
            </div>
            <div className="inventory-stat-card">
              <Heart size={24} />
              <div>
                <div className="inventory-number">{inventoryAgg.medicalStaff.toLocaleString()}</div>
                <div className="inventory-label">Medical staff</div>
              </div>
            </div>
            <div className="inventory-stat-card">
              <Users size={24} />
              <div>
                <div className="inventory-number">{inventoryAgg.volunteers.toLocaleString()}</div>
                <div className="inventory-label">Trained volunteers</div>
              </div>
            </div>
          </div>
          <div className="inventory-context">
            <MapPin size={14} />
            <span>14 parishes</span>
            <span className="inventory-context-sep">·</span>
            <span>{totalPopulation.toLocaleString()} population</span>
          </div>
        </div>

        {/* Communication & Alerts Section - embedded scroll */}
        <div className="communication-section-card">
          <div className="section-header">
            <div className="header-content">
              <MessageSquare size={24} />
              <h2>Communication & Alerts</h2>
            </div>
          </div>
          <div className="alerts-scroll-container">
            <DisasterAlerts />
            <div className="communications-section">
              <h3 className="communications-title">
                <Radio size={18} />
                Communications
              </h3>
              <p className="communications-intro">
                Bulletins and updates from ODPEM, NHC, and partners.
              </p>
              {communications.length > 0 ? (
                <div className="communications-list">
                  {communications.slice(0, 5).map(item => (
                    <div key={item.id} className="communications-item">
                      <Bell size={14} />
                      <div>
                        <div className="communications-item-title">{item.title}</div>
                        <div className="communications-item-meta">
                          {new Date(item.timestamp).toLocaleString()} · {item.source}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="communications-empty">No recent bulletins.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Parishes Grid */}
      <div className="parishes-section">
        <div className="section-header">
          <div className="header-content">
            <MapPin size={24} />
            <h2>Parish Overview</h2>
          </div>
        </div>
        <div className="parishes-grid">
          {parishes.map((parish) => {
            const readiness = getParishReadiness(parish)
            return (
              <div key={parish.id} className="parish-card-modern">
                <Link to={`/parish/${parish.id}`} className="parish-card-main-link">
                  <div className="parish-card-header-modern">
                    <div>
                      <h3>{parish.name}</h3>
                      <span className="parish-region">{parish.region}</span>
                    </div>
                    {readiness.assessed && (
                      <div className="score-badge-inline" style={{ backgroundColor: readiness.color }}>
                        {readiness.score.toFixed(0)}%
                      </div>
                    )}
                  </div>
                  {/* Readiness Status Preview */}
                  <div className="readiness-preview-modern" style={{ borderLeftColor: readiness.color }}>
                    <div className="readiness-header-modern">
                      {readiness.assessed ? (
                        <>
                          {readiness.status === 'Resilient' && <CheckCircle size={16} style={{ color: readiness.color }} />}
                          {readiness.status === 'Restoring' && <Clock size={16} style={{ color: readiness.color }} />}
                          {readiness.status === 'Need Support' && <AlertCircle size={16} style={{ color: readiness.color }} />}
                          <span className="readiness-status-modern" style={{ color: readiness.color }}>
                            {readiness.status}
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={16} style={{ color: readiness.color }} />
                          <span className="readiness-status-modern" style={{ color: readiness.color }}>
                            {readiness.status}
                          </span>
                        </>
                      )}
                    </div>
                    {readiness.assessed && (
                      <div className="readiness-score-modern">
                        <div className="score-bar-modern">
                          <div 
                            className="score-fill-modern" 
                            style={{ 
                              width: `${readiness.score}%`,
                              backgroundColor: readiness.color
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="parish-stats-modern">
                    <div className="stat-item-modern">
                      <Users size={16} />
                      <span>{parish.population.toLocaleString()}</span>
                    </div>
                    <div className="stat-item-modern">
                      <Package size={16} />
                      <span>{Object.values(getEffective(parish).equipment).filter((v) => typeof v === 'number').reduce((a, b) => a + b, 0)} units</span>
                    </div>
                  </div>
                </Link>
                <Link 
                  to={`/parish/${parish.id}/scorecard`} 
                  className="parish-scorecard-link"
                >
                  <BarChart3 size={16} />
                  View scorecard
                  <ArrowRight size={14} />
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default GlobalOverview

