import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getParishById } from '../data/jamaicaParishes'
import { ArrowLeft, Users, Package, TrendingUp, GraduationCap, MessageSquare, Phone, ArrowRight, BookOpen, Bell, Radio } from 'lucide-react'
import EditableInventory from '../components/EditableInventory'
import { getParishEquipment, getParishPersonnel } from '../utils/equipmentStorage'
import { getParishScorecard } from '../utils/scorecardStorage'
import { calculateOverallScore } from '../data/scorecardDomains'
import { getRequiredTrainings, getAllTrainings } from '../data/trainings'
import { getParishContacts } from '../data/contacts'
import { getCommunications } from '../data/communications'
import DisasterAlerts from '../components/DisasterAlerts'
import './ParishDashboard.css'

const ParishDashboard = () => {
  const { parishId } = useParams()
  const parish = getParishById(parishId)
  const [equipmentData, setEquipmentData] = useState(parish?.equipment || {})
  const [personnelData, setPersonnelData] = useState(parish?.personnel || {})

  useEffect(() => {
    if (parish) {
      // Load saved data or use default
      const savedEquipment = getParishEquipment(parishId)
      const savedPersonnel = getParishPersonnel(parishId)
      
      if (savedEquipment) {
        const { lastUpdated, updatedBy, ...equipment } = savedEquipment
        setEquipmentData(equipment)
      } else {
        setEquipmentData(parish.equipment)
      }
      
      if (savedPersonnel) {
        const { lastUpdated, updatedBy, ...personnel } = savedPersonnel
        setPersonnelData(personnel)
      } else {
        setPersonnelData(parish.personnel)
      }
    }
  }, [parishId, parish])

  const handleDataUpdate = () => {
    // Reload data after update
    const savedEquipment = getParishEquipment(parishId)
    const savedPersonnel = getParishPersonnel(parishId)
    
    if (savedEquipment) {
      const { lastUpdated, updatedBy, ...equipment } = savedEquipment
      setEquipmentData(equipment)
    }
    
    if (savedPersonnel) {
      const { lastUpdated, updatedBy, ...personnel } = savedPersonnel
      setPersonnelData(personnel)
    }
  }

  if (!parish) {
    return (
      <div className="parish-dashboard">
        <div className="error-message">
          <h2>Parish not found</h2>
          <Link to="/">Return to Overview</Link>
        </div>
      </div>
    )
  }

  const totalEquipment = Object.values(equipmentData).reduce((a, b) => a + b, 0)
  const totalPersonnel = Object.values(personnelData).reduce((a, b) => a + b, 0)
  
  // Get scorecard data
  const scorecardData = getParishScorecard(parishId)
  const overallScore = scorecardData?.domains ? calculateOverallScore(scorecardData.domains) : 0

  // Get training data
  const requiredTrainings = getRequiredTrainings()
  const allTrainings = getAllTrainings()
  
  // Get contacts
  const parishContacts = getParishContacts(parishId)
  const totalContacts = parishContacts.length
  
  const communications = getCommunications()

  return (
    <div className="parish-dashboard">
      <div className="dashboard-header">
        <Link to="/" className="back-link">
          <ArrowLeft size={20} />
          <span>Back to Overview</span>
        </Link>
        <div className="parish-title">
          <h1>{parish.name} Parish</h1>
          <span className="parish-badge">{parish.region} Region</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, var(--navy-color) 0%, var(--navy-dark) 100%)' }}>
            <Users size={24} />
          </div>
          <div className="stat-info">
            <h3>{parish.population.toLocaleString()}</h3>
            <p>Population</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%)' }}>
            <Users size={24} />
          </div>
          <div className="stat-info">
            <h3>{totalPersonnel}</h3>
            <p>Total Personnel</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, var(--navy-light) 0%, var(--navy-color) 100%)' }}>
            <Package size={24} />
          </div>
          <div className="stat-info">
            <h3>{totalEquipment}</h3>
            <p>Total Equipment</p>
          </div>
        </div>
        <Link to={`/parish/${parish.id}/scorecard`} className="stat-card stat-card-link">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary-color) 100%)' }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <h3>{overallScore.toFixed(0)}%</h3>
            <p>Readiness Score</p>
            <span className="stat-card-view">View scorecard →</span>
          </div>
        </Link>
      </div>

      {/* Main Content Grid - Training (left sidebar) | Comms & Alerts (right, horizontal card) */}
      <div className="main-dashboard-grid">
        {/* Training & Protocols - sidebar style like Overview */}
        <div className="dashboard-section training-section parish-training-sidebar">
          <div className="section-header-modern">
            <div className="header-content-modern">
              <GraduationCap size={24} />
              <h2>Training & Protocols</h2>
            </div>
            <Link to="/protocols" className="view-all-link">
              View All <ArrowRight size={16} />
            </Link>
          </div>
          <div className="training-preview">
            <div className="training-stats">
              <div className="training-stat-item">
                <div className="training-stat-number">{requiredTrainings.length}</div>
                <div className="training-stat-label">Required</div>
              </div>
              <div className="training-stat-item">
                <div className="training-stat-number">{allTrainings.length}</div>
                <div className="training-stat-label">Total Available</div>
              </div>
            </div>
            <div className="featured-trainings">
              <h3>Featured Trainings</h3>
              {requiredTrainings.slice(0, 3).map(training => (
                <div key={training.id} className="training-item-preview">
                  <BookOpen size={16} />
                  <div>
                    <div className="training-name-preview">{training.name}</div>
                    <div className="training-meta-preview">{training.duration} · {training.provider}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Communication & Alerts - horizontal compact card, embedded scroll */}
        <div className="dashboard-section communication-section parish-comms-horizontal">
          <div className="section-header-modern">
            <div className="header-content-modern">
              <MessageSquare size={24} />
              <h2>Communication & Alerts</h2>
            </div>
            <Link to={`/parish/${parish.id}/contacts`} className="view-all-link">
              View Contacts <ArrowRight size={16} />
            </Link>
          </div>
          <div className="parish-comms-scroll-embed">
            <div className="parish-comms-inner">
              <div className="parish-comms-alerts">
                <DisasterAlerts />
              </div>
              <div className="parish-comms-right">
                <div className="parish-comms-contacts">
                  <Phone size={20} />
                  <div>
                    <div className="parish-comms-num">{totalContacts}</div>
                    <div className="parish-comms-lbl">Emergency contacts</div>
                  </div>
                </div>
                <div className="parish-comms-section">
                  <h3 className="parish-comms-subtitle">
                    <Radio size={16} />
                    Communications
                  </h3>
                  {communications.length > 0 ? (
                    <div className="parish-comms-list">
                      {communications.slice(0, 3).map(item => (
                        <div key={item.id} className="parish-comms-item">
                          <Bell size={14} />
                          <div>
                            <div className="parish-comms-item-title">{item.title}</div>
                            <div className="parish-comms-item-meta">{new Date(item.timestamp).toLocaleString()} · {item.source}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="parish-comms-empty">No recent bulletins.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Management Section */}
      <div className="inventory-section-modern">
        <div className="section-header-modern">
          <div className="header-content-modern">
            <Package size={24} />
            <h2>Inventory Management</h2>
          </div>
        </div>
        <div className="inventory-grid-modern">
          <div className="inventory-card-modern">
            <EditableInventory
              type="equipment"
              data={parish.equipment}
              parishId={parishId}
              onUpdate={handleDataUpdate}
            />
          </div>
          <div className="inventory-card-modern">
            <EditableInventory
              type="personnel"
              data={parish.personnel}
              parishId={parishId}
              onUpdate={handleDataUpdate}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ParishDashboard

