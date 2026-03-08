import { useState, useEffect } from 'react'
import { getAllEmergencyTypes, getEmergencyProtocol } from '../data/emergencyProtocols'
import { trainingCategories, getAllTrainings, getRequiredTrainings, searchTrainings } from '../data/trainings'
import { ChevronDown, ChevronRight, BookOpen, Clock, Shield, GraduationCap, Search, Filter, CheckCircle, AlertCircle } from 'lucide-react'
import './EmergencyProtocols.css'

const EmergencyProtocols = () => {
  const [selectedType, setSelectedType] = useState(null)
  const [expandedPhase, setExpandedPhase] = useState(null)
  const [activeTab, setActiveTab] = useState('protocols') // 'protocols' or 'training'
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const emergencyTypes = getAllEmergencyTypes()
  
  // Reset selected type when category changes
  useEffect(() => {
    if (selectedType && selectedCategory !== 'all') {
      const isNatural = ['hurricane', 'flood', 'earthquake', 'wildfire', 'tornado'].includes(selectedType)
      const isNonNatural = ['cyber-attack', 'infrastructure-failure', 'civil-unrest', 'terrorism-security', 'chemical-industrial'].includes(selectedType)
      
      if (selectedCategory === 'natural' && !isNatural) {
        setSelectedType(null)
        setExpandedPhase(null)
      } else if (selectedCategory === 'non-natural' && !isNonNatural) {
        setSelectedType(null)
        setExpandedPhase(null)
      }
    }
  }, [selectedCategory, selectedType])

  const handleTypeSelect = (typeId) => {
    if (selectedType === typeId) {
      setSelectedType(null)
      setExpandedPhase(null)
    } else {
      setSelectedType(typeId)
      setExpandedPhase('preparedness') // Default to preparedness phase
    }
  }

  const togglePhase = (phase) => {
    if (expandedPhase === phase) {
      setExpandedPhase(null)
    } else {
      setExpandedPhase(phase)
    }
  }

  const selectedProtocol = selectedType ? getEmergencyProtocol(selectedType) : null

  // Filter trainings
  const getFilteredTrainings = () => {
    let trainings = getAllTrainings()
    
    if (selectedCategory !== 'all') {
      trainings = trainings.filter(t => t.categoryId === selectedCategory)
    }
    
    if (searchQuery) {
      trainings = searchTrainings(searchQuery)
    }
    
    return trainings
  }

  const filteredTrainings = getFilteredTrainings()
  const requiredTrainings = getRequiredTrainings()

  return (
    <div className="emergency-protocols">
      <div className="protocols-header">
        <h1>Protocols & Training</h1>
        <p className="subtitle">
          Comprehensive emergency protocols and required trainings for disaster preparedness, response, and recovery
        </p>
      </div>

      {/* Tabs */}
      <div className="protocols-tabs">
        <button
          className={`tab-button ${activeTab === 'protocols' ? 'active' : ''}`}
          onClick={() => setActiveTab('protocols')}
        >
          <Shield size={18} />
          <span>Emergency Protocols</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'training' ? 'active' : ''}`}
          onClick={() => setActiveTab('training')}
        >
          <GraduationCap size={18} />
          <span>Training & Learning</span>
          {requiredTrainings.length > 0 && (
            <span className="tab-badge">{requiredTrainings.length}</span>
          )}
        </button>
      </div>

      {/* Training Section */}
      {activeTab === 'training' && (
        <div className="training-section">
          {/* Required Trainings Summary */}
          <div className="required-trainings-summary">
            <div className="summary-header">
              <AlertCircle size={24} style={{ color: 'var(--warning-color)' }} />
              <div>
                <h2>Required Trainings</h2>
                <p>Essential trainings for all emergency management personnel</p>
              </div>
            </div>
            <div className="required-stats">
              <div className="required-stat">
                <span className="stat-number">{requiredTrainings.length}</span>
                <span className="stat-label">Required Trainings</span>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="training-controls">
            <div className="search-box">
              <Search size={20} />
              <input
                type="text"
                placeholder="Search trainings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="filter-box">
              <Filter size={18} />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Categories</option>
                {trainingCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Training Categories */}
          {trainingCategories
            .filter(cat => selectedCategory === 'all' || cat.id === selectedCategory)
            .map(category => {
              const categoryTrainings = category.trainings.filter(training => {
                if (searchQuery) {
                  const query = searchQuery.toLowerCase()
                  return training.name.toLowerCase().includes(query) ||
                         training.description.toLowerCase().includes(query) ||
                         training.topics.some(topic => topic.toLowerCase().includes(query))
                }
                return true
              })

              if (categoryTrainings.length === 0) return null

              return (
                <div key={category.id} className="training-category">
                  <div className="category-header">
                    <span className="category-icon">{category.icon}</span>
                    <div>
                      <h2>{category.name}</h2>
                      <p>{category.description}</p>
                      {category.required && (
                        <span className="required-badge">Required</span>
                      )}
                    </div>
                  </div>
                  <div className="trainings-grid">
                    {categoryTrainings.map(training => (
                      <div key={training.id} className="training-card">
                        <div className="training-card-header">
                          <h3>{training.name}</h3>
                          {category.required && (
                            <CheckCircle size={18} style={{ color: 'var(--resilient-color)' }} />
                          )}
                        </div>
                        <p className="training-description">{training.description}</p>
                        
                        <div className="training-details">
                          <div className="detail-item">
                            <Clock size={16} />
                            <span>{training.duration}</span>
                          </div>
                          <div className="detail-item">
                            <GraduationCap size={16} />
                            <span>{training.provider}</span>
                          </div>
                          {training.certification && (
                            <div className="detail-item">
                              <CheckCircle size={16} />
                              <span>{training.certification}</span>
                            </div>
                          )}
                          <div className="detail-item">
                            <AlertCircle size={16} />
                            <span>Renew: {training.frequency}</span>
                          </div>
                        </div>

                        {training.targetAudience && training.targetAudience.length > 0 && (
                          <div className="training-audience">
                            <strong>Target Audience:</strong>
                            <ul>
                              {training.targetAudience.map((audience, idx) => (
                                <li key={idx}>{audience}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {training.topics && training.topics.length > 0 && (
                          <div className="training-topics">
                            <strong>Topics Covered:</strong>
                            <ul>
                              {training.topics.map((topic, idx) => (
                                <li key={idx}>{topic}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {training.prerequisites && training.prerequisites.length > 0 && (
                          <div className="training-prerequisites">
                            <strong>Prerequisites:</strong>
                            <ul>
                              {training.prerequisites.map((prereq, idx) => (
                                <li key={idx}>{prereq}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {training.resources && training.resources.length > 0 && (
                          <div className="training-resources">
                            <strong>Resources:</strong>
                            {training.resources.map((resource, idx) => (
                              <a
                                key={idx}
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="resource-link"
                              >
                                {resource.name} →
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
        </div>
      )}

      {/* Protocols Section */}
      {activeTab === 'protocols' && (
      <div className="protocols-layout">
        {/* Emergency Types List */}
        <div className="types-sidebar">
          <h2>Emergency Types</h2>
          
          {/* Category Filter */}
          <div className="type-categories">
            <button
              className={`category-filter ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              All Types
            </button>
            <button
              className={`category-filter ${selectedCategory === 'natural' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('natural')}
            >
              Natural Disasters
            </button>
            <button
              className={`category-filter ${selectedCategory === 'non-natural' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('non-natural')}
            >
              Non-Natural Threats
            </button>
          </div>

          <div className="types-list">
            {emergencyTypes
              .filter(type => {
                if (selectedCategory === 'all') return true
                if (selectedCategory === 'natural') {
                  return ['hurricane', 'flood', 'earthquake', 'wildfire', 'tornado'].includes(type.id)
                }
                if (selectedCategory === 'non-natural') {
                  return ['cyber-attack', 'infrastructure-failure', 'civil-unrest', 'terrorism-security', 'chemical-industrial'].includes(type.id)
                }
                return true
              })
              .map((type) => (
                <button
                  key={type.id}
                  className={`type-item ${selectedType === type.id ? 'active' : ''}`}
                  onClick={() => handleTypeSelect(type.id)}
                >
                  <span className="type-icon">{type.icon}</span>
                  <div className="type-info">
                    <div className="type-name">{type.name}</div>
                    {type.commonInJamaica && (
                      <span className="common-badge">Common in Jamaica</span>
                    )}
                  </div>
                  {selectedType === type.id ? (
                    <ChevronDown size={20} />
                  ) : (
                    <ChevronRight size={20} />
                  )}
                </button>
              ))}
          </div>
        </div>

        {/* Protocol Details */}
        <div className="protocol-details">
          {!selectedProtocol ? (
            <div className="no-selection">
              <BookOpen size={64} />
              <h2>Select an Emergency Type</h2>
              <p>Choose an emergency type from the list to view detailed protocols for preparedness, response, and recovery.</p>
            </div>
          ) : (
            <>
              <div className="protocol-header">
                <div className="protocol-title-section">
                  <span className="protocol-icon">{selectedProtocol.icon}</span>
                  <div>
                    <h2>{selectedProtocol.name}</h2>
                    <p className="protocol-description">{selectedProtocol.description}</p>
                    {selectedProtocol.season && (
                      <div className="protocol-season">
                        <Clock size={16} />
                        <span>Season: {selectedProtocol.season}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Phases */}
              <div className="phases-container">
                {Object.entries(selectedProtocol.phases).map(([phaseKey, phase]) => (
                  <div key={phaseKey} className="phase-section">
                    <button
                      className="phase-header"
                      onClick={() => togglePhase(phaseKey)}
                    >
                      <div className="phase-title-group">
                        <Shield size={20} />
                        <div>
                          <h3>{phase.title}</h3>
                          <span className="phase-timeline">{phase.timeline}</span>
                        </div>
                      </div>
                      {expandedPhase === phaseKey ? (
                        <ChevronDown size={20} />
                      ) : (
                        <ChevronRight size={20} />
                      )}
                    </button>

                    {expandedPhase === phaseKey && (
                      <div className="phase-content">
                        {phase.actions.map((actionGroup, index) => (
                          <div key={index} className="action-group">
                            <h4 className="action-category">{actionGroup.category}</h4>
                            <ul className="action-items">
                              {actionGroup.items.map((item, itemIndex) => (
                                <li key={itemIndex}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Resources */}
              {selectedProtocol.resources && selectedProtocol.resources.length > 0 && (
                <div className="resources-section">
                  <h3>Additional Resources</h3>
                  <div className="resources-list">
                    {selectedProtocol.resources.map((resource, index) => (
                      <div key={index} className="resource-item">
                        <div className="resource-name">{resource.name}</div>
                        <div className="resource-description">{resource.description}</div>
                        {resource.url && (
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="resource-link"
                          >
                            Visit Resource →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      )}
    </div>
  )
}

export default EmergencyProtocols

