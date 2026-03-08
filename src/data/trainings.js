// Required Trainings and Learning Resources for Emergency Management

export const trainingCategories = [
  {
    id: 'basic-preparedness',
    name: 'Basic Emergency Preparedness',
    icon: '📚',
    description: 'Fundamental knowledge for all emergency personnel',
    required: true,
    trainings: [
      {
        id: 'basic-first-aid',
        name: 'Basic First Aid & CPR',
        description: 'Essential life-saving skills for emergency situations',
        duration: '8 hours',
        certification: 'Valid for 2 years',
        provider: 'Jamaica Red Cross / St. John Ambulance',
        frequency: 'Biennial renewal required',
        targetAudience: ['All emergency personnel', 'Community volunteers', 'First responders'],
        topics: [
          'Cardiopulmonary Resuscitation (CPR)',
          'Choking response',
          'Bleeding control',
          'Shock management',
          'Basic wound care',
          'Fracture immobilization'
        ],
        resources: [
          {
            name: 'Jamaica Red Cross Training',
            url: 'https://www.redcross.org.jm',
            type: 'provider'
          }
        ]
      },
      {
        id: 'emergency-communication',
        name: 'Emergency Communication Protocols',
        description: 'Effective communication during emergencies',
        duration: '4 hours',
        certification: 'Certificate of Completion',
        provider: 'ODPEM',
        frequency: 'Annual',
        targetAudience: ['Coordinators', 'Communication specialists', 'Emergency managers'],
        topics: [
          'Radio communication protocols',
          'Emergency alert systems',
          'Public information management',
          'Media relations',
          'Crisis communication'
        ]
      },
      {
        id: 'incident-command',
        name: 'Incident Command System (ICS)',
        description: 'Standardized approach to emergency management',
        duration: '16 hours',
        certification: 'FEMA/ODPEM Certificate',
        provider: 'ODPEM / FEMA',
        frequency: 'Every 3 years',
        targetAudience: ['Emergency managers', 'Coordinators', 'Supervisors'],
        topics: [
          'ICS structure and organization',
          'Command and control',
          'Resource management',
          'Unified command',
          'Multi-agency coordination'
        ],
        resources: [
          {
            name: 'FEMA ICS Training',
            url: 'https://training.fema.gov',
            type: 'online'
          }
        ]
      }
    ]
  },
  {
    id: 'disaster-specific',
    name: 'Disaster-Specific Training',
    icon: '🌪️',
    description: 'Specialized training for specific disaster types',
    required: true,
    trainings: [
      {
        id: 'hurricane-preparedness',
        name: 'Hurricane Preparedness & Response',
        description: 'Comprehensive hurricane management training',
        duration: '12 hours',
        certification: 'ODPEM Certificate',
        provider: 'ODPEM',
        frequency: 'Annual (before hurricane season)',
        targetAudience: ['All emergency personnel', 'Parish coordinators', 'Shelter managers'],
        topics: [
          'Hurricane formation and tracking',
          'Evacuation planning and execution',
          'Shelter operations',
          'Post-hurricane assessment',
          'Recovery coordination'
        ],
        prerequisites: ['Basic Emergency Preparedness'],
        resources: [
          {
            name: 'ODPEM Hurricane Training',
            url: 'https://www.odpem.org.jm',
            type: 'provider'
          }
        ]
      },
      {
        id: 'flood-response',
        name: 'Flood Response & Water Rescue',
        description: 'Safe flood response and water rescue techniques',
        duration: '16 hours',
        certification: 'Water Rescue Certification',
        provider: 'Jamaica Fire Brigade / ODPEM',
        frequency: 'Every 2 years',
        targetAudience: ['Fire personnel', 'Search and rescue teams', 'Emergency responders'],
        topics: [
          'Flood safety protocols',
          'Swift water rescue',
          'Boat operations',
          'Victim extraction',
          'Flood damage assessment'
        ],
        prerequisites: ['Basic First Aid & CPR'],
        resources: []
      },
      {
        id: 'earthquake-response',
        name: 'Earthquake Response & Structural Assessment',
        description: 'Earthquake safety and structural assessment',
        duration: '8 hours',
        certification: 'Certificate of Completion',
        provider: 'ODPEM / Building Department',
        frequency: 'Every 3 years',
        targetAudience: ['Emergency responders', 'Engineers', 'Building inspectors'],
        topics: [
          'Earthquake safety protocols',
          'Structural damage assessment',
          'Search and rescue in collapsed structures',
          'Aftershock safety',
          'Building safety evaluation'
        ]
      }
    ]
  },
  {
    id: 'specialized-skills',
    name: 'Specialized Skills',
    icon: '🔧',
    description: 'Advanced and specialized emergency management skills',
    required: false,
    trainings: [
      {
        id: 'shelter-management',
        name: 'Emergency Shelter Management',
        description: 'Operating and managing emergency shelters',
        duration: '8 hours',
        certification: 'Shelter Manager Certificate',
        provider: 'ODPEM / Red Cross',
        frequency: 'Every 2 years',
        targetAudience: ['Shelter managers', 'Volunteers', 'Coordinators'],
        topics: [
          'Shelter setup and operations',
          'Registration and intake procedures',
          'Health and safety in shelters',
          'Resource management',
          'Shelter closure procedures'
        ]
      },
      {
        id: 'damage-assessment',
        name: 'Rapid Damage Assessment',
        description: 'Systematic damage assessment techniques',
        duration: '6 hours',
        certification: 'Damage Assessor Certificate',
        provider: 'ODPEM',
        frequency: 'Every 2 years',
        targetAudience: ['Assessors', 'Engineers', 'Coordinators'],
        topics: [
          'Assessment methodologies',
          'Damage classification',
          'Data collection and reporting',
          'Safety during assessment',
          'Resource needs estimation'
        ]
      },
      {
        id: 'psychological-first-aid',
        name: 'Psychological First Aid (PFA)',
        description: 'Mental health support during and after disasters',
        duration: '6 hours',
        certification: 'PFA Certificate',
        provider: 'Ministry of Health / Mental Health Services',
        frequency: 'Every 2 years',
        targetAudience: ['All emergency personnel', 'Counselors', 'Community workers'],
        topics: [
          'Recognizing trauma and stress',
          'Basic psychological support',
          'Crisis intervention',
          'Self-care for responders',
          'Referral to professional services'
        ]
      },
      {
        id: 'logistics-coordination',
        name: 'Emergency Logistics & Supply Chain',
        description: 'Managing resources and supplies during emergencies',
        duration: '10 hours',
        certification: 'Logistics Coordinator Certificate',
        provider: 'ODPEM',
        frequency: 'Every 2 years',
        targetAudience: ['Logistics staff', 'Coordinators', 'Supply managers'],
        topics: [
          'Supply chain management',
          'Resource tracking',
          'Distribution planning',
          'Warehouse operations',
          'Donation management'
        ]
      }
    ]
  },
  {
    id: 'leadership-management',
    name: 'Leadership & Management',
    icon: '👥',
    description: 'Leadership skills for emergency management',
    required: false,
    trainings: [
      {
        id: 'emergency-management-leadership',
        name: 'Emergency Management Leadership',
        description: 'Leadership skills for emergency coordinators',
        duration: '20 hours',
        certification: 'Emergency Management Leadership Certificate',
        provider: 'ODPEM / University Partnerships',
        frequency: 'Every 3 years',
        targetAudience: ['Emergency managers', 'Coordinators', 'Supervisors'],
        topics: [
          'Crisis leadership',
          'Decision-making under pressure',
          'Team management',
          'Stakeholder coordination',
          'Strategic planning'
        ],
        prerequisites: ['Incident Command System (ICS)']
      },
      {
        id: 'volunteer-coordination',
        name: 'Volunteer Coordination & Management',
        description: 'Effectively managing volunteers during emergencies',
        duration: '6 hours',
        certification: 'Certificate of Completion',
        provider: 'ODPEM / Volunteer Organizations',
        frequency: 'Annual',
        targetAudience: ['Volunteer coordinators', 'Community leaders'],
        topics: [
          'Volunteer recruitment',
          'Training and orientation',
          'Assignment and supervision',
          'Safety and liability',
          'Recognition and retention'
        ]
      }
    ]
  },
  {
    id: 'technology-tools',
    name: 'Technology & Tools',
    icon: '💻',
    description: 'Training on emergency management systems and tools',
    required: false,
    trainings: [
      {
        id: 'emergency-management-systems',
        name: 'Emergency Management Information Systems',
        description: 'Using technology for emergency coordination',
        duration: '4 hours',
        certification: 'System User Certificate',
        provider: 'ODPEM / System Vendors',
        frequency: 'As needed (when systems updated)',
        targetAudience: ['System users', 'Coordinators', 'Data managers'],
        topics: [
          'System navigation',
          'Data entry and reporting',
          'Resource tracking',
          'Communication tools',
          'Data analysis'
        ]
      },
      {
        id: 'gis-mapping',
        name: 'GIS & Mapping for Emergency Management',
        description: 'Using geographic information systems for emergency planning',
        duration: '8 hours',
        certification: 'GIS User Certificate',
        provider: 'ODPEM / Technical Partners',
        frequency: 'Every 2 years',
        targetAudience: ['Planners', 'Coordinators', 'Technical staff'],
        topics: [
          'Basic GIS concepts',
          'Map reading and creation',
          'Hazard mapping',
          'Resource mapping',
          'Damage assessment mapping'
        ]
      }
    ]
  }
]

// Get all trainings
export const getAllTrainings = () => {
  return trainingCategories.flatMap(category => 
    category.trainings.map(training => ({
      ...training,
      categoryId: category.id,
      categoryName: category.name,
      categoryIcon: category.icon,
      required: category.required
    }))
  )
}

// Get trainings by category
export const getTrainingsByCategory = (categoryId) => {
  const category = trainingCategories.find(cat => cat.id === categoryId)
  return category ? category.trainings : []
}

// Get required trainings
export const getRequiredTrainings = () => {
  return getAllTrainings().filter(training => training.required || training.categoryId === 'basic-preparedness' || training.categoryId === 'disaster-specific')
}

// Search trainings
export const searchTrainings = (query) => {
  const lowerQuery = query.toLowerCase()
  return getAllTrainings().filter(training =>
    training.name.toLowerCase().includes(lowerQuery) ||
    training.description.toLowerCase().includes(lowerQuery) ||
    training.topics.some(topic => topic.toLowerCase().includes(lowerQuery))
  )
}

// Get training by ID
export const getTrainingById = (trainingId) => {
  return getAllTrainings().find(training => training.id === trainingId)
}



