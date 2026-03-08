import { useState, useEffect } from 'react'
import { Edit2, Save, X, History, AlertCircle } from 'lucide-react'
import { 
  getParishEquipment, 
  saveParishEquipment, 
  initializeParishEquipment,
  getParishPersonnel,
  saveParishPersonnel,
  initializeParishPersonnel,
  getParishChangeHistory
} from '../utils/equipmentStorage'
import { getCurrentUser } from '../data/userRoles'
import './EditableInventory.css'

const EditableInventory = ({ type, data, parishId, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState({})
  const [changeReason, setChangeReason] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const user = getCurrentUser()
  const canEdit = user && (user.role !== 'operator')

  useEffect(() => {
    // Load saved data or initialize from default
    if (type === 'equipment') {
      const saved = getParishEquipment(parishId)
      if (saved) {
        // Remove metadata fields
        const { lastUpdated, updatedBy, ...equipmentData } = saved
        setEditedData(equipmentData)
      } else {
        const initialized = initializeParishEquipment(parishId, data)
        const { lastUpdated, updatedBy, ...equipmentData } = initialized
        setEditedData(equipmentData)
      }
    } else {
      const saved = getParishPersonnel(parishId)
      if (saved) {
        const { lastUpdated, updatedBy, ...personnelData } = saved
        setEditedData(personnelData)
      } else {
        const initialized = initializeParishPersonnel(parishId, data)
        const { lastUpdated, updatedBy, ...personnelData } = initialized
        setEditedData(personnelData)
      }
    }
  }, [parishId, type, data])

  const handleEdit = () => {
    if (!canEdit) {
      setError('You do not have permission to edit this data.')
      return
    }
    setIsEditing(true)
    setError('')
    setSuccess('')
  }

  const handleCancel = () => {
    setIsEditing(false)
    setChangeReason('')
    setError('')
    setSuccess('')
    // Reload original data
    if (type === 'equipment') {
      const saved = getParishEquipment(parishId)
      if (saved) {
        const { lastUpdated, updatedBy, ...equipmentData } = saved
        setEditedData(equipmentData)
      } else {
        setEditedData(data)
      }
    } else {
      const saved = getParishPersonnel(parishId)
      if (saved) {
        const { lastUpdated, updatedBy, ...personnelData } = saved
        setEditedData(personnelData)
      } else {
        setEditedData(data)
      }
    }
  }

  const handleSave = () => {
    // Validation
    const hasNegative = Object.values(editedData).some(val => val < 0)
    if (hasNegative) {
      setError('Values cannot be negative.')
      return
    }

    if (!changeReason.trim()) {
      setError('Please provide a reason for the changes.')
      return
    }

    // Save data
    const userId = user?.userId || 'unknown'
    let success = false

    if (type === 'equipment') {
      success = saveParishEquipment(parishId, editedData, userId, changeReason)
    } else {
      success = saveParishPersonnel(parishId, editedData, userId, changeReason)
    }

    if (success) {
      setSuccess('Data saved successfully!')
      setIsEditing(false)
      setChangeReason('')
      setError('')
      
      // Notify parent component
      if (onUpdate) {
        onUpdate()
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } else {
      setError('Failed to save data. Please try again.')
    }
  }

  const handleValueChange = (key, value) => {
    const numValue = parseInt(value) || 0
    setEditedData(prev => ({
      ...prev,
      [key]: numValue
    }))
  }

  const loadHistory = () => {
    const changeHistory = getParishChangeHistory(parishId, 20)
    const filtered = changeHistory.filter(entry => 
      entry.action === `${type}_update`
    )
    setHistory(filtered)
    setShowHistory(true)
  }

  const formatFieldName = (key) => {
    return key.split(/(?=[A-Z])/).join(' ').replace(/^\w/, c => c.toUpperCase())
  }

  const displayData = isEditing ? editedData : (editedData || data)

  return (
    <div className="editable-inventory">
      <div className="inventory-header">
        <h2>{type === 'equipment' ? 'Equipment Inventory' : 'Personnel Resources'}</h2>
        <div className="inventory-actions">
          {!isEditing && canEdit && (
            <>
              <button onClick={handleEdit} className="edit-button">
                <Edit2 size={18} />
                <span>Edit</span>
              </button>
              <button onClick={loadHistory} className="history-button">
                <History size={18} />
                <span>History</span>
              </button>
            </>
          )}
          {isEditing && (
            <>
              <button onClick={handleCancel} className="cancel-button">
                <X size={18} />
                <span>Cancel</span>
              </button>
              <button onClick={handleSave} className="save-button">
                <Save size={18} />
                <span>Save</span>
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="message error-message">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="message success-message">
          <span>{success}</span>
        </div>
      )}

      {isEditing && (
        <div className="change-reason-input">
          <label htmlFor="change-reason">
            Reason for Changes <span className="required">*</span>
          </label>
          <textarea
            id="change-reason"
            value={changeReason}
            onChange={(e) => setChangeReason(e.target.value)}
            placeholder="Explain why you're making these changes (e.g., 'Equipment deployed to incident', 'New personnel hired', 'Routine inventory update')"
            rows="3"
          />
        </div>
      )}

      <div className={`inventory-grid ${isEditing ? 'editing' : ''}`}>
        {Object.entries(displayData).map(([key, value]) => (
          <div key={key} className={`inventory-item ${isEditing ? 'editable' : ''}`}>
            <div className="inventory-label">
              {formatFieldName(key)}
            </div>
            {isEditing ? (
              <div className="inventory-input-wrapper">
                <input
                  type="number"
                  min="0"
                  value={editedData[key] || 0}
                  onChange={(e) => handleValueChange(key, e.target.value)}
                  className="inventory-input"
                />
                <button
                  className="increment-button"
                  onClick={() => handleValueChange(key, (editedData[key] || 0) + 1)}
                >
                  +
                </button>
                <button
                  className="decrement-button"
                  onClick={() => handleValueChange(key, Math.max(0, (editedData[key] || 0) - 1))}
                >
                  −
                </button>
              </div>
            ) : (
              <div className="inventory-value">{value}</div>
            )}
          </div>
        ))}
      </div>

      {showHistory && (
        <div className="change-history-modal" onClick={() => setShowHistory(false)}>
          <div className="history-content" onClick={(e) => e.stopPropagation()}>
            <div className="history-header">
              <h3>Change History</h3>
              <button onClick={() => setShowHistory(false)} className="close-button">
                <X size={20} />
              </button>
            </div>
            <div className="history-list">
              {history.length === 0 ? (
                <p className="no-history">No change history available.</p>
              ) : (
                history.map((entry, index) => (
                  <div key={index} className="history-entry">
                    <div className="history-timestamp">
                      {new Date(entry.timestamp).toLocaleString()}
                    </div>
                    {entry.reason && (
                      <div className="history-reason">
                        <strong>Reason:</strong> {entry.reason}
                      </div>
                    )}
                    {entry.changes && entry.changes.length > 0 && (
                      <div className="history-changes">
                        {entry.changes.map((change, idx) => (
                          <div key={idx} className="change-item">
                            <span className="change-field">{formatFieldName(change.field)}:</span>
                            <span className="change-old">{change.oldValue}</span>
                            <span className="change-arrow">→</span>
                            <span className="change-new">{change.newValue}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EditableInventory



