import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { scorecardDomains, calculateDomainScore, calculateOverallScore, getRecoveryStatus, TOTAL_POSSIBLE_SCORE } from '../data/scorecardDomains'
import { getParishById, getAllParishes } from '../data/jamaicaParishes'
import { initializeParishScorecard, saveParishScorecard } from '../utils/scorecardStorage'
import { ArrowLeft, CheckCircle2, Clock, AlertCircle, TrendingUp, X, MapPin } from 'lucide-react'
import './ScorecardView.css'

const ScorecardView = () => {
  const { parishId } = useParams()
  const navigate = useNavigate()
  const parishes = getAllParishes()
  const parish = parishId ? getParishById(parishId) : null
  
  // Initialize with parish-specific data or global default
  const [domains, setDomains] = useState(() => {
    if (parishId) {
      return initializeParishScorecard(parishId, scorecardDomains)
    }
    return scorecardDomains
  })

  const handleScoreChange = (domainId, criterionId, newScore) => {
    const updatedDomains = domains.map(domain =>
      domain.id === domainId
        ? {
            ...domain,
            criteria: domain.criteria.map(criterion =>
              criterion.id === criterionId
                ? { ...criterion, score: parseInt(newScore) }
                : criterion
            )
          }
        : domain
    )
    
    setDomains(updatedDomains)
    
    // Save to localStorage if parish-specific
    if (parishId) {
      saveParishScorecard(parishId, { domains: updatedDomains })
    }
  }

  // Load saved data on mount
  useEffect(() => {
    if (parishId) {
      const saved = initializeParishScorecard(parishId, scorecardDomains)
      setDomains(saved)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parishId])

  const [modalDomainId, setModalDomainId] = useState(null)

  const overallScore = calculateOverallScore(domains)
  const recoveryStatus = getRecoveryStatus(overallScore)
  const totalPoints = domains.reduce((sum, d) => sum + d.criteria.reduce((s, c) => s + c.score, 0), 0)

  const openDomainModal = (domainId) => {
    setModalDomainId(domainId)
  }

  const closeDomainModal = () => {
    setModalDomainId(null)
  }

  // Close modal on Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') closeDomainModal()
    }
    if (modalDomainId) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [modalDomainId])

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Resilient':
        return <CheckCircle2 size={18} />
      case 'Restoring':
        return <Clock size={18} />
      default:
        return <AlertCircle size={18} />
    }
  }

  const handleParishFilterChange = (e) => {
    const id = e.target.value
    if (id) navigate(`/parish/${id}/scorecard`)
    else navigate('/scorecard')
  }

  return (
    <div className="scorecard-view">
      <div className="scorecard-header">
        <div className="scorecard-header-top">
          <div className="scorecard-header-left">
            {parish && (
              <Link to={`/parish/${parish.id}`} className="back-link">
                <ArrowLeft size={20} />
                <span>Back to {parish.name} Parish</span>
              </Link>
            )}
            <div>
              <h1>
                {parish ? `${parish.name} Parish - ` : ''}Disaster Recovery Scorecard
              </h1>
              <p className="subtitle">
                {parish 
                  ? `Long-Term Disaster Recovery Resilience Assessment for ${parish.name} Parish`
                  : 'Long-Term Disaster Recovery Resilience Assessment'
                }
              </p>
            </div>
          </div>
          <div className="scorecard-parish-filter">
            <MapPin size={18} />
            <label htmlFor="scorecard-parish-select" className="scorecard-filter-label">Parish</label>
            <select
              id="scorecard-parish-select"
              className="scorecard-parish-select"
              value={parishId || ''}
              onChange={handleParishFilterChange}
              aria-label="Filter scorecard by parish"
            >
              <option value="">Select parish</option>
              {parishes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* At a Glance – Compact Score Summary */}
      <div className="scorecard-at-a-glance" style={{ borderLeftColor: recoveryStatus.color }}>
        <div className="at-a-glance-score">
          <div className="at-a-glance-circle" style={{ borderColor: recoveryStatus.color }}>
            <span>{overallScore.toFixed(0)}%</span>
          </div>
          <div className="at-a-glance-info">
            <h2>Overall Recovery Health</h2>
            <div className="at-a-glance-status" style={{ backgroundColor: recoveryStatus.color }}>
              {getStatusIcon(recoveryStatus.status)}
              {recoveryStatus.status}
            </div>
            <p className="at-a-glance-points">{totalPoints} / {TOTAL_POSSIBLE_SCORE} points</p>
          </div>
        </div>
        <div className="at-a-glance-bar">
          <div 
            className="at-a-glance-fill" 
            style={{ width: `${overallScore}%`, backgroundColor: recoveryStatus.color }}
          />
        </div>
      </div>

      {/* Domain Overview – click a card to open scorecard modal */}
      <div className="domains-overview">
        <h2 className="section-title">Domain Overview</h2>
        <p className="domains-overview-hint">Click a domain to assess or edit scores.</p>
        <div className="domains-grid-overview">
          {domains.map((domain) => {
            const domainScore = calculateDomainScore(domain)
            const domainStatus = getRecoveryStatus(domainScore)
            const completedCriteria = domain.criteria.filter(c => c.score === 2).length
            const totalCriteria = domain.criteria.length

            return (
              <button 
                key={domain.id} 
                type="button"
                className="domain-overview-card"
                onClick={() => openDomainModal(domain.id)}
                style={{ borderColor: domainStatus.color }}
              >
                <div className="domain-overview-header">
                  <div className="domain-overview-title">
                    <h3>{domain.name}</h3>
                    <p className="domain-overview-desc">{domain.description}</p>
                  </div>
                  <div className="domain-overview-score">
                    <div className="domain-score-modern" style={{ color: domainStatus.color }}>
                      {domainScore.toFixed(0)}%
                    </div>
                  </div>
                </div>
                <div className="domain-overview-stats">
                  <div className="domain-stat-item">
                    <TrendingUp size={14} />
                    <span>{completedCriteria}/{totalCriteria} Complete</span>
                  </div>
                  <div className="domain-status-badge" style={{ backgroundColor: domainStatus.color }}>
                    {getStatusIcon(domainStatus.status)}
                    {domainStatus.status}
                  </div>
                </div>
                <div className="domain-overview-progress">
                  <div className="domain-progress-bar">
                    <div 
                      className="domain-progress-fill" 
                      style={{ 
                        width: `${domainScore}%`,
                        backgroundColor: domainStatus.color
                      }}
                    />
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Domain Scorecard Modal – popup form */}
      {modalDomainId && (() => {
        const domain = domains.find(d => d.id === modalDomainId)
        if (!domain) return null
        const domainScore = calculateDomainScore(domain)
        const domainStatus = getRecoveryStatus(domainScore)
        return (
          <div 
            className="scorecard-modal-backdrop" 
            onClick={closeDomainModal}
            role="presentation"
          >
            <div 
              className="scorecard-modal"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="scorecard-modal-title"
            >
              <div className="scorecard-modal-header" style={{ borderLeftColor: domainStatus.color }}>
                <div>
                  <h2 id="scorecard-modal-title">{domain.name}</h2>
                  <p className="scorecard-modal-desc">{domain.description}</p>
                  <div className="scorecard-modal-meta">
                    <div className="domain-status-badge" style={{ backgroundColor: domainStatus.color }}>
                      {getStatusIcon(domainStatus.status)}
                      {domainStatus.status}
                    </div>
                    <span className="scorecard-modal-score" style={{ color: domainStatus.color }}>
                      {domainScore.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="scorecard-modal-close"
                  onClick={closeDomainModal}
                  aria-label="Close"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="scorecard-modal-body">
                <div className="criteria-grid-compact">
                  {domain.criteria.map((criterion) => (
                    <div key={criterion.id} className="criterion-card-compact">
                      <div className="criterion-header-compact">
                        <h4 className="criterion-title-compact">{criterion.name}</h4>
                        <div className={`score-indicator-compact score-${criterion.score}`} style={{ 
                          backgroundColor: criterion.score === 0 ? 'var(--need-support-color)' : 
                                          criterion.score === 1 ? 'var(--restoring-color)' : 'var(--resilient-color)'
                        }}>
                          {criterion.score}
                        </div>
                      </div>
                      <p className="criterion-desc-compact">{criterion.description}</p>
                      <div className="score-checkboxes-compact">
                        <label className={`score-checkbox-label score-0 ${criterion.score === 0 ? 'active' : ''}`}>
                          <input
                            type="radio"
                            name={`${domain.id}-${criterion.id}`}
                            checked={criterion.score === 0}
                            onChange={(e) => {
                              if (e.target.checked) handleScoreChange(domain.id, criterion.id, 0)
                            }}
                            className="score-checkbox-input"
                          />
                          <span className="score-checkbox-custom score-0">0</span>
                          <span className="score-checkbox-text">No</span>
                        </label>
                        <label className={`score-checkbox-label score-1 ${criterion.score === 1 ? 'active' : ''}`}>
                          <input
                            type="radio"
                            name={`${domain.id}-${criterion.id}`}
                            checked={criterion.score === 1}
                            onChange={(e) => {
                              if (e.target.checked) handleScoreChange(domain.id, criterion.id, 1)
                            }}
                            className="score-checkbox-input"
                          />
                          <span className="score-checkbox-custom score-1">1</span>
                          <span className="score-checkbox-text">Progress</span>
                        </label>
                        <label className={`score-checkbox-label score-2 ${criterion.score === 2 ? 'active' : ''}`}>
                          <input
                            type="radio"
                            name={`${domain.id}-${criterion.id}`}
                            checked={criterion.score === 2}
                            onChange={(e) => {
                              if (e.target.checked) handleScoreChange(domain.id, criterion.id, 2)
                            }}
                            className="score-checkbox-input"
                          />
                          <span className="score-checkbox-custom score-2">2</span>
                          <span className="score-checkbox-text">Yes</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="domain-footer-modern">
                  <div className="domain-progress-modern">
                    <div className="progress-bar-modern">
                      <div
                        className="progress-fill-modern"
                        style={{
                          width: `${domainScore}%`,
                          backgroundColor: domainStatus.color
                        }}
                      />
                    </div>
                    <span className="progress-text-modern">
                      {domain.criteria.reduce((sum, c) => sum + c.score, 0)} / {domain.maxScore} points
                    </span>
                  </div>
                </div>
              </div>
              <div className="scorecard-modal-footer">
                <button type="button" className="scorecard-modal-done" onClick={closeDomainModal}>
                  Done
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

export default ScorecardView

