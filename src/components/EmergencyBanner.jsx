import { useState, useEffect } from 'react'
import { AlertTriangle, X, Settings2 } from 'lucide-react'
import { getEmergencyBanner, setEmergencyBanner, seedDefaultBanner } from '../data/emergencyBanner'
import { hasPermission, getCurrentUser } from '../data/userRoles'
import './EmergencyBanner.css'

const DISMISSED_KEY = 'emergency_banner_dismissed'

const EmergencyBanner = () => {
  const [banner, setBanner] = useState(null)
  const [dismissed, setDismissed] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editMessage, setEditMessage] = useState('')
  const [editSeverity, setEditSeverity] = useState('info')
  const [editActive, setEditActive] = useState(true)

  const canEdit = hasPermission('canConfigureSystem')

  useEffect(() => {
    seedDefaultBanner()
    const b = getEmergencyBanner()
    setBanner(b)
    if (b) {
      const dismissedAt = sessionStorage.getItem(DISMISSED_KEY)
      setDismissed(dismissedAt === b.updatedAt)
    } else {
      setDismissed(true)
    }
  }, [editOpen])

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setEditOpen(false)
    }
    if (editOpen) {
      document.addEventListener('keydown', onKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [editOpen])

  const handleDismiss = () => {
    if (banner) {
      sessionStorage.setItem(DISMISSED_KEY, banner.updatedAt)
      setDismissed(true)
    }
  }

  const openEdit = () => {
    if (banner) {
      setEditMessage(banner.message)
      setEditSeverity(banner.severity)
      setEditActive(banner.active)
    } else {
      setEditMessage('')
      setEditSeverity('warning')
      setEditActive(true)
    }
    setEditOpen(true)
  }

  const saveBanner = () => {
    const user = getCurrentUser()
    const active = editActive && editMessage.trim().length > 0
    const updated = setEmergencyBanner({
      message: editMessage.trim(),
      severity: editSeverity,
      active,
      updatedBy: user?.name || 'Admin'
    })
    setBanner(updated)
    setEditOpen(false)
    setDismissed(false)
    sessionStorage.removeItem(DISMISSED_KEY)
  }

  const clearBanner = () => {
    const cleared = setEmergencyBanner({ message: '', severity: 'info', active: false, updatedBy: getCurrentUser()?.name || 'Admin' })
    setBanner(cleared)
    setEditOpen(false)
    setDismissed(true)
    sessionStorage.removeItem(DISMISSED_KEY)
  }

  const showBanner = banner?.active && banner?.message?.trim() && !dismissed
  const severityClass = banner ? `emergency-banner--${banner.severity}` : ''

  return (
    <>
      {showBanner && (
      <div className={`emergency-banner ${severityClass}`} role="alert">
        <div className="emergency-banner-inner">
          <AlertTriangle size={22} className="emergency-banner-icon" />
          <p className="emergency-banner-message">{banner.message}</p>
          <div className="emergency-banner-actions">
            {canEdit && (
              <button
                type="button"
                className="emergency-banner-btn emergency-banner-edit"
                onClick={openEdit}
                aria-label="Edit notification"
              >
                <Settings2 size={18} />
                Edit
              </button>
            )}
            <button
              type="button"
              className="emergency-banner-btn emergency-banner-dismiss"
              onClick={handleDismiss}
              aria-label="Dismiss"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>
      )}

      {!showBanner && canEdit && (
        <div className="emergency-banner-admin-bar">
          <span>No active emergency notification.</span>
          <button type="button" className="emergency-banner-set-btn" onClick={openEdit}>
            <Settings2 size={16} />
            Set notification
          </button>
        </div>
      )}

      {editOpen && (
        <div className="emergency-banner-modal-backdrop" onClick={() => setEditOpen(false)}>
          <div className="emergency-banner-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Emergency notification (admin)</h3>
            <label>
              Message
              <textarea
                value={editMessage}
                onChange={(e) => setEditMessage(e.target.value)}
                rows={4}
                placeholder="e.g. All parishes: Ensure contact lists are current. Drill Tuesday 10:00."
              />
            </label>
            <label>
              Severity
              <select value={editSeverity} onChange={(e) => setEditSeverity(e.target.value)}>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </label>
            <label className="emergency-banner-modal-check">
              <input
                type="checkbox"
                checked={editActive}
                onChange={(e) => setEditActive(e.target.checked)}
              />
              Show banner to all users
            </label>
            <div className="emergency-banner-modal-actions">
              <button type="button" className="emergency-banner-modal-save" onClick={saveBanner}>
                Save
              </button>
              <button type="button" className="emergency-banner-modal-clear" onClick={clearBanner}>
                Clear & deactivate
              </button>
              <button type="button" className="emergency-banner-modal-cancel" onClick={() => setEditOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default EmergencyBanner
