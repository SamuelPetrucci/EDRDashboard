import { useState, useEffect, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { scorecardDomains, calculateDomainScore, calculateOverallScore, getRecoveryStatus, getRecoveryGaugeAccent, TOTAL_POSSIBLE_SCORE } from '../data/scorecardDomains'
import { getParishById, getAllParishes } from '../data/jamaicaParishes'
import {
  initializeParishScorecard,
  saveParishScorecard,
  getNationalAveragedDomains,
  countParishesWithScorecardData,
} from '../utils/scorecardStorage'
import { getParishEquipment, getParishPersonnel } from '../utils/equipmentStorage'
import EditableInventory from '../components/EditableInventory'
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  X,
  MapPin,
  Package,
  Truck,
  Zap,
  UserCheck,
  Heart,
  Users,
} from 'lucide-react'
import './ScorecardView.css'

const buildNationalInventoryAgg = (parishList) => {
  return parishList.reduce(
    (acc, parish) => {
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
      acc.emergencyVehicles += equipment.emergencyVehicles || 0
      acc.generators += equipment.generators || 0
      acc.medicalSupplies += equipment.medicalSupplies || 0
      acc.waterTrucks += equipment.waterTrucks || 0
      acc.emergencyResponders += personnel.emergencyResponders || 0
      acc.medicalStaff += personnel.medicalStaff || 0
      acc.volunteers += personnel.volunteers || 0
      acc.totalEquipment += Object.values(equipment)
        .filter((v) => typeof v === 'number')
        .reduce((a, b) => a + b, 0)
      acc.totalPersonnel += Object.values(personnel)
        .filter((v) => typeof v === 'number')
        .reduce((a, b) => a + b, 0)
      return acc
    },
    {
      emergencyVehicles: 0,
      generators: 0,
      medicalSupplies: 0,
      waterTrucks: 0,
      emergencyResponders: 0,
      medicalStaff: 0,
      volunteers: 0,
      totalEquipment: 0,
      totalPersonnel: 0,
    }
  )
}

const ScorecardView = () => {
  const { parishId } = useParams()
  const navigate = useNavigate()
  const parishes = getAllParishes()
  const parish = parishId ? getParishById(parishId) : null
  const isNationalView = !parishId

  const parishesWithScorecards = countParishesWithScorecardData(parishes)
  const totalPopulation = useMemo(
    () => parishes.reduce((sum, p) => sum + p.population, 0),
    [parishes]
  )

  const inventoryAgg = useMemo(() => buildNationalInventoryAgg(parishes), [parishes])

  const [domains, setDomains] = useState(() =>
    parishId
      ? initializeParishScorecard(parishId, scorecardDomains)
      : getNationalAveragedDomains(scorecardDomains, parishes)
  )

  useEffect(() => {
    if (parishId) {
      setDomains(initializeParishScorecard(parishId, scorecardDomains))
    } else {
      setDomains(getNationalAveragedDomains(scorecardDomains, parishes))
    }
  }, [parishId, parishes])

  const handleScoreChange = (domainId, criterionId, newScore) => {
    if (isNationalView) return
    const updatedDomains = domains.map((domain) =>
      domain.id === domainId
        ? {
            ...domain,
            criteria: domain.criteria.map((criterion) =>
              criterion.id === criterionId
                ? { ...criterion, score: parseInt(newScore, 10) }
                : criterion
            ),
          }
        : domain
    )

    setDomains(updatedDomains)

    if (parishId) {
      saveParishScorecard(parishId, { domains: updatedDomains })
    }
  }

  const [modalDomainId, setModalDomainId] = useState(null)

  const overallScore = calculateOverallScore(domains)
  const recoveryStatus = getRecoveryStatus(overallScore)
  const overallGaugeAccent = getRecoveryGaugeAccent(overallScore)
  const totalPoints = domains.reduce(
    (sum, d) => sum + d.criteria.reduce((s, c) => s + c.score, 0),
    0
  )

  const openDomainModal = (domainId) => {
    setModalDomainId(domainId)
  }

  const closeDomainModal = () => {
    setModalDomainId(null)
  }

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

  if (parishId && !parish) {
    return (
      <div className="scorecard-view scorecard-view--error">
        <p className="scorecard-view-error-msg">Parish not found.</p>
        <Link to="/scorecard" className="back-link">
          <ArrowLeft size={20} />
          <span>Back to national scorecard</span>
        </Link>
      </div>
    )
  }

  const criterionScoreColor = (score) => {
    const s = typeof score === 'number' ? score : 0
    if (s <= 0.01) return 'var(--section-training)'
    if (s < 1.25) return 'var(--restoring-color)'
    return 'var(--resilient-color)'
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
                {isNationalView
                  ? 'National Disaster Recovery Scorecard'
                  : `${parish.name} Parish — Disaster Recovery Scorecard`}
              </h1>
              <p className="subtitle">
                {isNationalView
                  ? `Nationwide view: averaged scores from parishes with saved scorecards (${parishesWithScorecards} of ${parishes.length}). Select a parish to view or edit parish-level data.`
                  : `Long-Term Disaster Recovery Resilience Assessment for ${parish.name} Parish`}
              </p>
            </div>
          </div>
          <div className="scorecard-parish-filter">
            <MapPin size={18} />
            <label htmlFor="scorecard-parish-select" className="scorecard-filter-label">
              View
            </label>
            <select
              id="scorecard-parish-select"
              className="scorecard-parish-select"
              value={parishId || ''}
              onChange={handleParishFilterChange}
              aria-label="National or parish scorecard"
            >
              <option value="">National (all-parish averages)</option>
              {parishes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <section className="scorecard-panel scorecard-panel--glance">
        <div className="scorecard-panel-header">
          <h2 className="scorecard-panel-title">Overall Recovery Health</h2>
        </div>
        <div className="scorecard-panel-body">
          <div className="scorecard-at-a-glance" style={{ '--glance-accent': overallGaugeAccent }}>
            <div className="at-a-glance-score">
              <div className="at-a-glance-circle" style={{ borderColor: overallGaugeAccent }}>
                <span>{overallScore.toFixed(0)}%</span>
              </div>
              <div className="at-a-glance-info">
                <div className="at-a-glance-status" style={{ backgroundColor: overallGaugeAccent }}>
                  {getStatusIcon(recoveryStatus.status)}
                  {recoveryStatus.status}
                </div>
                <p className="at-a-glance-points">
                  {isNationalView ? (
                    <>
                      {totalPoints.toFixed(1)} / {TOTAL_POSSIBLE_SCORE} mean points (national){' '}
                    </>
                  ) : (
                    <>
                      {Math.round(totalPoints)} / {TOTAL_POSSIBLE_SCORE} points
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="at-a-glance-bar">
              <div
                className="at-a-glance-fill"
                style={{ width: `${overallScore}%`, backgroundColor: overallGaugeAccent }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="scorecard-panel scorecard-panel--domains">
        <div className="scorecard-panel-header">
          <h2 className="scorecard-panel-title">Domain Overview</h2>
        </div>
        <div className="scorecard-panel-body">
          <p className="domains-overview-hint">
            {isNationalView
              ? 'Nationwide averages per domain. Open a domain for detail (read-only). Choose a parish above to edit scores.'
              : 'Click a domain to assess or edit scores.'}
          </p>
          <div className="domains-grid-overview">
            {domains.map((domain) => {
              const domainScore = calculateDomainScore(domain)
              const domainStatus = getRecoveryStatus(domainScore)
              const gaugeAccent = getRecoveryGaugeAccent(domainScore)
              const completedCriteria = domain.criteria.filter((c) => c.score === 2).length
              const totalCriteria = domain.criteria.length
              const meanCriterion =
                domain.criteria.reduce((s, c) => s + c.score, 0) / domain.criteria.length

              return (
                <button
                  key={domain.id}
                  type="button"
                  className="domain-overview-card"
                  onClick={() => openDomainModal(domain.id)}
                  style={{ '--domain-accent': gaugeAccent }}
                >
                  <div className="domain-overview-header">
                    <div className="domain-overview-title">
                      <h3>{domain.name}</h3>
                      <p className="domain-overview-desc">{domain.description}</p>
                    </div>
                    <div className="domain-overview-score">
                      <div className="domain-score-modern" style={{ color: gaugeAccent }}>
                        {domainScore.toFixed(0)}%
                      </div>
                    </div>
                  </div>
                  <div className="domain-overview-stats">
                    <div className="domain-stat-item">
                      <TrendingUp size={14} />
                      <span>
                        {isNationalView
                          ? `Avg ${meanCriterion.toFixed(1)} / 2 per criterion`
                          : `${completedCriteria}/${totalCriteria} Complete`}
                      </span>
                    </div>
                    <div className="domain-status-badge" style={{ backgroundColor: gaugeAccent }}>
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
                          backgroundColor: gaugeAccent,
                        }}
                      />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {isNationalView && (
        <section className="scorecard-panel scorecard-panel--inventory-national">
          <div className="scorecard-panel-header">
            <h2 className="scorecard-panel-title">National inventory snapshot</h2>
          </div>
          <div className="scorecard-panel-body scorecard-inventory-national-body">
            <p className="scorecard-inventory-national-intro">
              Combined equipment and personnel totals across all {parishes.length} parishes (saved
              overrides included). Select a parish above to manage parish inventory.
            </p>
            <div className="scorecard-inventory-stats">
              <div className="scorecard-inventory-stat-card">
                <Truck size={22} aria-hidden />
                <div>
                  <div className="scorecard-inventory-number">
                    {inventoryAgg.emergencyVehicles.toLocaleString()}
                  </div>
                  <div className="scorecard-inventory-label">Emergency vehicles</div>
                </div>
              </div>
              <div className="scorecard-inventory-stat-card">
                <Zap size={22} aria-hidden />
                <div>
                  <div className="scorecard-inventory-number">
                    {inventoryAgg.generators.toLocaleString()}
                  </div>
                  <div className="scorecard-inventory-label">Generators</div>
                </div>
              </div>
              <div className="scorecard-inventory-stat-card">
                <Package size={22} aria-hidden />
                <div>
                  <div className="scorecard-inventory-number">
                    {inventoryAgg.medicalSupplies.toLocaleString()}
                  </div>
                  <div className="scorecard-inventory-label">Medical supply kits</div>
                </div>
              </div>
              <div className="scorecard-inventory-stat-card">
                <UserCheck size={22} aria-hidden />
                <div>
                  <div className="scorecard-inventory-number">
                    {inventoryAgg.emergencyResponders.toLocaleString()}
                  </div>
                  <div className="scorecard-inventory-label">Emergency responders</div>
                </div>
              </div>
              <div className="scorecard-inventory-stat-card">
                <Heart size={22} aria-hidden />
                <div>
                  <div className="scorecard-inventory-number">
                    {inventoryAgg.medicalStaff.toLocaleString()}
                  </div>
                  <div className="scorecard-inventory-label">Medical staff</div>
                </div>
              </div>
              <div className="scorecard-inventory-stat-card">
                <Users size={22} aria-hidden />
                <div>
                  <div className="scorecard-inventory-number">
                    {inventoryAgg.volunteers.toLocaleString()}
                  </div>
                  <div className="scorecard-inventory-label">Trained volunteers</div>
                </div>
              </div>
            </div>
            <div className="scorecard-inventory-context">
              <MapPin size={14} aria-hidden />
              <span>{parishes.length} parishes</span>
              <span className="scorecard-inventory-context-sep">·</span>
              <span>{totalPopulation.toLocaleString()} population</span>
              <span className="scorecard-inventory-context-sep">·</span>
              <span>
                {inventoryAgg.totalEquipment.toLocaleString()} equipment units ·{' '}
                {inventoryAgg.totalPersonnel.toLocaleString()} personnel
              </span>
            </div>
          </div>
        </section>
      )}

      {parish && parishId && (
        <section className="scorecard-panel scorecard-panel--inventory-parish">
          <div className="scorecard-panel-header">
            <h2 className="scorecard-panel-title">Parish inventory</h2>
          </div>
          <div className="scorecard-panel-body scorecard-inventory-parish-body">
            <p className="scorecard-inventory-parish-intro">
              Equipment and personnel for {parish.name} (same controls as the parish dashboard).
            </p>
            <div className="scorecard-inventory-parish-grid">
              <div className="scorecard-inventory-parish-card">
                <EditableInventory
                  type="equipment"
                  data={parish.equipment}
                  parishId={parishId}
                  onUpdate={() => {}}
                />
              </div>
              <div className="scorecard-inventory-parish-card">
                <EditableInventory
                  type="personnel"
                  data={parish.personnel}
                  parishId={parishId}
                  onUpdate={() => {}}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {modalDomainId &&
        (() => {
          const domain = domains.find((d) => d.id === modalDomainId)
          if (!domain) return null
          const domainScore = calculateDomainScore(domain)
          const domainStatus = getRecoveryStatus(domainScore)
          const modalGaugeAccent = getRecoveryGaugeAccent(domainScore)
          return (
            <div
              className="scorecard-modal-backdrop"
              onClick={closeDomainModal}
              role="presentation"
            >
              <div
                className={`scorecard-modal${isNationalView ? ' scorecard-modal--read-only' : ''}`}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="scorecard-modal-title"
              >
                <div className="scorecard-modal-header" style={{ borderLeftColor: modalGaugeAccent }}>
                  <div>
                    <h2 id="scorecard-modal-title">{domain.name}</h2>
                    <p className="scorecard-modal-desc">{domain.description}</p>
                    {isNationalView && (
                      <p className="scorecard-modal-national-note">
                        Nationwide averages (0–2 scale per criterion). Select a parish from the
                        header menu to enter or edit scores.
                      </p>
                    )}
                    <div className="scorecard-modal-meta">
                      <div className="domain-status-badge" style={{ backgroundColor: modalGaugeAccent }}>
                        {getStatusIcon(domainStatus.status)}
                        {domainStatus.status}
                      </div>
                      <span className="scorecard-modal-score" style={{ color: modalGaugeAccent }}>
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
                          <div
                            className={`score-indicator-compact${isNationalView ? ' score-indicator-compact--avg' : ` score-${criterion.score}`}`}
                            style={{
                              backgroundColor: criterionScoreColor(criterion.score),
                            }}
                          >
                            {isNationalView ? criterion.score.toFixed(1) : criterion.score}
                          </div>
                        </div>
                        <p className="criterion-desc-compact">{criterion.description}</p>
                        <div className="score-checkboxes-compact">
                          <label
                            className={`score-checkbox-label score-0 ${criterion.score === 0 ? 'active' : ''} ${isNationalView ? 'score-checkbox-label--disabled' : ''}`}
                          >
                            <input
                              type="radio"
                              name={`${domain.id}-${criterion.id}`}
                              checked={!isNationalView && criterion.score === 0}
                              onChange={(e) => {
                                if (e.target.checked) handleScoreChange(domain.id, criterion.id, 0)
                              }}
                              className="score-checkbox-input"
                              disabled={isNationalView}
                            />
                            <span className="score-checkbox-custom score-0">0</span>
                            <span className="score-checkbox-text">No</span>
                          </label>
                          <label
                            className={`score-checkbox-label score-1 ${criterion.score === 1 ? 'active' : ''} ${isNationalView ? 'score-checkbox-label--disabled' : ''}`}
                          >
                            <input
                              type="radio"
                              name={`${domain.id}-${criterion.id}`}
                              checked={!isNationalView && criterion.score === 1}
                              onChange={(e) => {
                                if (e.target.checked) handleScoreChange(domain.id, criterion.id, 1)
                              }}
                              className="score-checkbox-input"
                              disabled={isNationalView}
                            />
                            <span className="score-checkbox-custom score-1">1</span>
                            <span className="score-checkbox-text">Progress</span>
                          </label>
                          <label
                            className={`score-checkbox-label score-2 ${criterion.score === 2 ? 'active' : ''} ${isNationalView ? 'score-checkbox-label--disabled' : ''}`}
                          >
                            <input
                              type="radio"
                              name={`${domain.id}-${criterion.id}`}
                              checked={!isNationalView && criterion.score === 2}
                              onChange={(e) => {
                                if (e.target.checked) handleScoreChange(domain.id, criterion.id, 2)
                              }}
                              className="score-checkbox-input"
                              disabled={isNationalView}
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
                            backgroundColor: modalGaugeAccent,
                          }}
                        />
                      </div>
                      <span className="progress-text-modern">
                        {domain.criteria.reduce((sum, c) => sum + c.score, 0).toFixed(1)} /{' '}
                        {domain.maxScore}{' '}
                        {isNationalView ? 'mean pts' : 'points'}
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
