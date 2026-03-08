// Emergency Contacts Database
// Organized by category and jurisdiction level

export const emergencyContacts = {
  national: {
    title: 'National Emergency Contacts',
    description: 'Country-wide emergency management and coordination',
    contacts: [
      {
        id: 'odpem',
        name: 'ODPEM (Office of Disaster Preparedness and Emergency Management)',
        role: 'National Disaster Management Agency',
        phone: '876-906-9674',
        phoneEmergency: '119',
        email: 'info@odpem.org.jm',
        website: 'https://www.odpem.org.jm',
        address: '2-4 Haining Road, Kingston 5',
        hours: '24/7 Emergency Hotline',
        category: 'coordination'
      },
      {
        id: 'jamaica-fire',
        name: 'Jamaica Fire Brigade',
        role: 'Fire & Rescue Services',
        phone: '110',
        phoneEmergency: '110',
        email: 'info@jfb.gov.jm',
        website: 'https://www.jfb.gov.jm',
        hours: '24/7',
        category: 'fire-rescue'
      },
      {
        id: 'jamaica-police',
        name: 'Jamaica Constabulary Force',
        role: 'Police Emergency',
        phone: '119',
        phoneEmergency: '119',
        email: 'info@jcf.gov.jm',
        website: 'https://www.jcf.gov.jm',
        hours: '24/7',
        category: 'police'
      },
      {
        id: 'jamaica-health',
        name: 'Ministry of Health & Wellness',
        role: 'Public Health Emergency',
        phone: '876-633-8172',
        phoneEmergency: '888-ONE-LOVE',
        email: 'info@moh.gov.jm',
        website: 'https://www.moh.gov.jm',
        hours: 'Mon-Fri 8:30am-5pm, Emergency 24/7',
        category: 'health'
      },
      {
        id: 'met-service',
        name: 'Jamaica Meteorological Service',
        role: 'Weather & Climate Information',
        phone: '876-924-8055',
        email: 'info@metservice.gov.jm',
        website: 'https://metservice.gov.jm',
        hours: '24/7',
        category: 'weather'
      },
      {
        id: 'red-cross',
        name: 'Jamaica Red Cross',
        role: 'Humanitarian Assistance',
        phone: '876-984-7860',
        email: 'info@redcross.org.jm',
        website: 'https://www.redcross.org.jm',
        hours: 'Mon-Fri 9am-5pm',
        category: 'humanitarian'
      }
    ]
  },
  parishes: [
    {
      parishId: 'kingston',
      parishName: 'Kingston',
      contacts: [
        {
          id: 'kingston-emergency',
          name: 'Kingston Emergency Operations Centre',
          role: 'Parish Emergency Coordinator',
          phone: '876-922-0210',
          email: 'eoc.kingston@odpem.org.jm',
          address: 'Kingston Parish Council',
          category: 'coordination'
        },
        {
          id: 'kingston-fire',
          name: 'Kingston Fire Station',
          phone: '876-922-0211',
          address: 'Kingston',
          category: 'fire-rescue'
        },
        {
          id: 'kingston-hospital',
          name: 'Kingston Public Hospital',
          role: 'Emergency Medical Services',
          phone: '876-922-0210',
          address: 'North Street, Kingston',
          category: 'health'
        }
      ]
    },
    {
      parishId: 'st-andrew',
      parishName: 'St. Andrew',
      contacts: [
        {
          id: 'st-andrew-emergency',
          name: 'St. Andrew Emergency Operations Centre',
          role: 'Parish Emergency Coordinator',
          phone: '876-927-1234',
          email: 'eoc.st-andrew@odpem.org.jm',
          category: 'coordination'
        }
      ]
    },
    {
      parishId: 'st-catherine',
      parishName: 'St. Catherine',
      contacts: [
        {
          id: 'st-catherine-emergency',
          name: 'St. Catherine Emergency Operations Centre',
          role: 'Parish Emergency Coordinator',
          phone: '876-984-5000',
          email: 'eoc.st-catherine@odpem.org.jm',
          category: 'coordination'
        }
      ]
    }
  ],
  categories: {
    coordination: {
      name: 'Coordination',
      icon: '📋',
      description: 'Emergency management coordination centers'
    },
    'fire-rescue': {
      name: 'Fire & Rescue',
      icon: '🚒',
      description: 'Fire departments and rescue services'
    },
    police: {
      name: 'Police',
      icon: '🚔',
      description: 'Law enforcement and security'
    },
    health: {
      name: 'Health Services',
      icon: '🏥',
      description: 'Hospitals and medical emergency services'
    },
    weather: {
      name: 'Weather Services',
      icon: '🌤️',
      description: 'Meteorological and climate information'
    },
    humanitarian: {
      name: 'Humanitarian',
      icon: '❤️',
      description: 'Relief organizations and support services'
    },
    utilities: {
      name: 'Utilities',
      icon: '⚡',
      description: 'Power, water, and infrastructure services'
    }
  }
}

// Get contacts for a specific parish
export const getParishContacts = (parishId) => {
  const parish = emergencyContacts.parishes.find(p => p.parishId === parishId)
  return parish ? parish.contacts : []
}

// Get all national contacts
export const getNationalContacts = () => {
  return emergencyContacts.national.contacts
}

// Get contacts by category
export const getContactsByCategory = (category) => {
  const national = emergencyContacts.national.contacts.filter(c => c.category === category)
  const parish = emergencyContacts.parishes.flatMap(p => 
    p.contacts.filter(c => c.category === category)
  )
  return [...national, ...parish]
}

// Search contacts
export const searchContacts = (query) => {
  const allContacts = [
    ...emergencyContacts.national.contacts,
    ...emergencyContacts.parishes.flatMap(p => p.contacts)
  ]
  
  const lowerQuery = query.toLowerCase()
  return allContacts.filter(contact => 
    contact.name.toLowerCase().includes(lowerQuery) ||
    contact.role?.toLowerCase().includes(lowerQuery) ||
    contact.phone?.includes(query)
  )
}

