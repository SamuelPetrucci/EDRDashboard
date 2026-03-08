import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Phone, Mail, Globe, MapPin, Clock, Search, Filter } from 'lucide-react'
import { getNationalContacts, getParishContacts, emergencyContacts, searchContacts } from '../data/contacts'
import { getParishById } from '../data/jamaicaParishes'
import './Contacts.css'

const Contacts = () => {
  const { parishId } = useParams()
  const parish = parishId ? getParishById(parishId) : null
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  
  const nationalContacts = getNationalContacts()
  const parishContacts = parishId ? getParishContacts(parishId) : []
  const allContacts = [...nationalContacts, ...parishContacts]

  const categories = Object.entries(emergencyContacts.categories).map(([key, value]) => ({
    key,
    ...value
  }))

  const handleCall = (phone) => {
    if (phone) {
      window.location.href = `tel:${phone.replace(/\D/g, '')}`
    }
  }

  const handleEmail = (email) => {
    if (email) {
      window.location.href = `mailto:${email}`
    }
  }
  
  // Get category key from selected category display name
  const getCategoryKey = (displayName) => {
    const category = categories.find(c => 
      c.name.toLowerCase().replace(/\s+/g, '-') === displayName
    )
    return category?.key || displayName
  }
  
  // Filter contacts
  const getFilteredContacts = () => {
    let filtered = allContacts
    
    if (searchQuery) {
      filtered = searchContacts(searchQuery)
    }
    
    if (selectedCategory !== 'all') {
      const categoryKey = getCategoryKey(selectedCategory)
      filtered = filtered.filter(c => c.category === categoryKey)
    }
    
    return filtered
  }
  
  const displayContacts = getFilteredContacts()

  return (
    <div className="contacts-page">
      <div className="contacts-header">
        <h1>Emergency Contacts</h1>
        <p className="subtitle">
          {parish 
            ? `Emergency contacts for ${parish.name} Parish`
            : 'National and parish emergency contact directory'
          }
        </p>
      </div>

      {/* Search and Filter */}
      <div className="contacts-controls">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search contacts..."
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
            {categories.map(cat => (
              <option key={cat.name.toLowerCase().replace(/\s+/g, '-')} value={cat.name.toLowerCase().replace(/\s+/g, '-')}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Display Contacts */}
      {displayContacts.length > 0 ? (
        <div className="contacts-section">
          {searchQuery ? (
            <h2>Search Results ({displayContacts.length})</h2>
          ) : parishId ? (
            <>
              <h2>{parish.name} Parish Contacts</h2>
              {parishContacts.length === 0 && (
                <p className="section-description">No parish-specific contacts available. Showing national contacts.</p>
              )}
            </>
          ) : (
            <>
              <h2>{emergencyContacts.national.title}</h2>
              <p className="section-description">{emergencyContacts.national.description}</p>
            </>
          )}
          <div className="contacts-grid">
            {displayContacts.map((contact) => (
              <ContactCard key={contact.id} contact={contact} onCall={handleCall} onEmail={handleEmail} />
            ))}
          </div>
        </div>
      ) : (
        <div className="contacts-section">
          <div className="no-results">
            <p>
              {searchQuery 
                ? `No contacts found matching "${searchQuery}"`
                : 'No contacts available'
              }
            </p>
          </div>
        </div>
      )}

      {/* Quick Emergency Numbers */}
      <div className="quick-emergency">
        <h2>Quick Emergency Numbers</h2>
        <div className="emergency-numbers">
          <div className="emergency-number">
            <Phone size={24} />
            <div>
              <strong>Police Emergency</strong>
              <a href="tel:119">119</a>
            </div>
          </div>
          <div className="emergency-number">
            <Phone size={24} />
            <div>
              <strong>Fire & Rescue</strong>
              <a href="tel:110">110</a>
            </div>
          </div>
          <div className="emergency-number">
            <Phone size={24} />
            <div>
              <strong>Medical Emergency</strong>
              <a href="tel:119">119</a>
            </div>
          </div>
          <div className="emergency-number">
            <Phone size={24} />
            <div>
              <strong>ODPEM Hotline</strong>
              <a href="tel:119">119</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const ContactCard = ({ contact, onCall, onEmail }) => {
  const categoryKey = contact.category || 'coordination'
  const category = emergencyContacts.categories[categoryKey] || emergencyContacts.categories.coordination

  return (
    <div className="contact-card">
      <div className="contact-header">
        <div className="contact-icon">{category.icon}</div>
        <div className="contact-title-section">
          <h3>{contact.name}</h3>
          {contact.role && <span className="contact-role">{contact.role}</span>}
        </div>
      </div>

      <div className="contact-details">
        {contact.phone && (
          <div className="contact-item">
            <Phone size={16} />
            <div>
              <span className="contact-label">Phone:</span>
              <a href={`tel:${contact.phone.replace(/\D/g, '')}`} onClick={() => onCall(contact.phone)}>
                {contact.phone}
              </a>
              {contact.phoneEmergency && (
                <span className="emergency-badge">Emergency: {contact.phoneEmergency}</span>
              )}
            </div>
          </div>
        )}

        {contact.email && (
          <div className="contact-item">
            <Mail size={16} />
            <div>
              <span className="contact-label">Email:</span>
              <a href={`mailto:${contact.email}`} onClick={() => onEmail(contact.email)}>
                {contact.email}
              </a>
            </div>
          </div>
        )}

        {contact.website && (
          <div className="contact-item">
            <Globe size={16} />
            <div>
              <span className="contact-label">Website:</span>
              <a href={contact.website} target="_blank" rel="noopener noreferrer">
                Visit Website
              </a>
            </div>
          </div>
        )}

        {contact.address && (
          <div className="contact-item">
            <MapPin size={16} />
            <div>
              <span className="contact-label">Address:</span>
              <span>{contact.address}</span>
            </div>
          </div>
        )}

        {contact.hours && (
          <div className="contact-item">
            <Clock size={16} />
            <div>
              <span className="contact-label">Hours:</span>
              <span>{contact.hours}</span>
            </div>
          </div>
        )}
      </div>

      <div className="contact-category">
        <span className="category-badge">{category.name}</span>
      </div>
    </div>
  )
}

export default Contacts

