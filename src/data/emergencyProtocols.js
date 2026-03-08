// Emergency types and recovery protocols knowledge base

export const emergencyTypes = [
  {
    id: 'hurricane',
    name: 'Hurricane',
    icon: '🌪️',
    description: 'Tropical cyclones with sustained winds of 74 mph or higher',
    season: 'June 1 - November 30',
    commonInJamaica: true,
    phases: {
      preparedness: {
        title: 'Pre-Disaster Preparedness (Before Hurricane Season)',
        timeline: 'Year-round, intensified May-November',
        actions: [
          {
            category: 'Planning',
            items: [
              'Develop and update family/household emergency plan',
              'Identify evacuation routes and shelters',
              'Review insurance coverage (property, flood, wind)',
              'Create inventory of valuable possessions (photos/videos)',
              'Establish communication plan with family members'
            ]
          },
          {
            category: 'Supplies',
            items: [
              'Build emergency kit (3-7 days of supplies)',
              'Stock non-perishable food and water (1 gallon per person per day)',
              'Gather essential documents (IDs, insurance, medical records)',
              'Prepare first aid kit and medications',
              'Stock batteries, flashlights, portable radio'
            ]
          },
          {
            category: 'Property Protection',
            items: [
              'Trim trees and remove dead branches',
              'Secure or remove outdoor items that could become projectiles',
              'Install hurricane shutters or board windows',
              'Reinforce garage doors and entry points',
              'Clear gutters and drainage systems'
            ]
          },
          {
            category: 'Community Coordination',
            items: [
              'Participate in community preparedness meetings',
              'Know your parish emergency management contacts',
              'Join neighborhood watch or community response groups',
              'Understand local evacuation procedures'
            ]
          }
        ]
      },
      response: {
        title: 'Immediate Response (During Hurricane)',
        timeline: 'Storm impact period',
        actions: [
          {
            category: 'Safety First',
            items: [
              'Stay indoors in a secure location (interior room, away from windows)',
              'Do not go outside during the eye of the storm',
              'Avoid using candles (use flashlights instead)',
              'Stay away from windows and glass doors',
              'If in flood-prone area, move to higher ground'
            ]
          },
          {
            category: 'Communication',
            items: [
              'Monitor official weather updates via battery-powered radio',
              'Conserve phone battery - use only for emergencies',
              'Check on neighbors if safe to do so',
              'Follow official evacuation orders if issued'
            ]
          },
          {
            category: 'Emergency Services',
            items: [
              'Call 119 for emergencies only',
              'Do not call emergency services for non-emergency situations',
              'Report downed power lines immediately',
              'Report structural damage to authorities'
            ]
          }
        ]
      },
      recovery: {
        title: 'Recovery & Relief (After Hurricane)',
        timeline: 'Immediate to long-term (weeks to years)',
        actions: [
          {
            category: 'Immediate (0-72 hours)',
            items: [
              'Assess damage safely (watch for downed power lines, unstable structures)',
              'Document all damage with photos/videos for insurance',
              'Check on family, neighbors, and vulnerable community members',
              'Avoid floodwaters (may be contaminated or electrically charged)',
              'Use generators safely (outdoors, away from windows)',
              'Boil water if water system compromised',
              'Report injuries and urgent needs to emergency services'
            ]
          },
          {
            category: 'Short-Term (3-30 days)',
            items: [
              'File insurance claims promptly',
              'Apply for disaster assistance (FEMA, local programs)',
              'Secure property to prevent further damage',
              'Coordinate with contractors for repairs',
              'Access temporary housing if needed',
              'Connect with community recovery resources',
              'Address mental health and trauma support needs'
            ]
          },
          {
            category: 'Long-Term (1 month - years)',
            items: [
              'Rebuild with resilience in mind (hurricane-resistant materials)',
              'Implement hazard mitigation measures',
              'Participate in community recovery planning',
              'Update emergency plans based on lessons learned',
              'Support vulnerable populations in recovery',
              'Engage in economic recovery initiatives',
              'Document lessons learned for future preparedness'
            ]
          }
        ]
      }
    },
    resources: [
      {
        name: 'ODPEM (Office of Disaster Preparedness and Emergency Management)',
        url: 'https://www.odpem.org.jm',
        description: 'Jamaica\'s national disaster management agency'
      },
      {
        name: 'NHC (National Hurricane Center)',
        url: 'https://www.nhc.noaa.gov',
        description: 'US National Hurricane Center tracking and forecasts'
      },
      {
        name: 'FEMA Hurricane Preparedness',
        url: 'https://www.ready.gov/hurricanes',
        description: 'Federal Emergency Management Agency guidance'
      }
    ]
  },
  {
    id: 'flood',
    name: 'Flood',
    icon: '🌊',
    description: 'Overflow of water onto normally dry land',
    season: 'Year-round, peak during rainy season (May-June, September-October)',
    commonInJamaica: true,
    phases: {
      preparedness: {
        title: 'Flood Preparedness',
        timeline: 'Year-round',
        actions: [
          {
            category: 'Risk Assessment',
            items: [
              'Identify if your property is in a flood zone',
              'Understand local drainage patterns',
              'Know elevation of your property relative to nearby water sources',
              'Review historical flood data for your area'
            ]
          },
          {
            category: 'Property Protection',
            items: [
              'Install sump pumps if in basement',
              'Elevate electrical panels and appliances',
              'Install backflow valves in sewer lines',
              'Maintain gutters and drainage systems',
              'Consider flood barriers for low-lying entrances'
            ]
          },
          {
            category: 'Planning',
            items: [
              'Have evacuation plan for flood-prone areas',
              'Know safe routes to higher ground',
              'Keep important documents in waterproof containers',
              'Maintain flood insurance coverage'
            ]
          }
        ]
      },
      response: {
        title: 'During Flood',
        timeline: 'Flood event period',
        actions: [
          {
            category: 'Safety',
            items: [
              'Evacuate immediately if ordered',
              'Never drive through flooded roads (Turn Around, Don\'t Drown)',
              'Move to higher ground',
              'Avoid walking through floodwaters (may be contaminated, hidden hazards)',
              'Stay away from downed power lines near water'
            ]
          },
          {
            category: 'Property',
            items: [
              'Turn off electricity at main breaker if safe to do so',
              'Move valuables to higher floors',
              'Do not attempt to rescue others unless trained',
              'Listen to official updates'
            ]
          }
        ]
      },
      recovery: {
        title: 'Flood Recovery',
        timeline: 'Post-flood period',
        actions: [
          {
            category: 'Immediate',
            items: [
              'Wait for official clearance before returning',
              'Document all damage with photos',
              'Wear protective gear when cleaning (gloves, boots, masks)',
              'Remove standing water and begin drying process',
              'Disinfect all affected surfaces',
              'Discard contaminated food and water'
            ]
          },
          {
            category: 'Health',
            items: [
              'Watch for signs of waterborne illness',
              'Test well water before use',
              'Address mold growth promptly',
              'Seek medical attention for flood-related injuries'
            ]
          },
          {
            category: 'Long-Term',
            items: [
              'File insurance claims',
              'Implement flood mitigation measures',
              'Elevate utilities and appliances',
              'Consider relocation if in high-risk area'
            ]
          }
        ]
      }
    },
    resources: [
      {
        name: 'Jamaica Meteorological Service',
        url: 'https://metservice.gov.jm',
        description: 'Weather forecasts and flood warnings'
      }
    ]
  },
  {
    id: 'earthquake',
    name: 'Earthquake',
    icon: '🌍',
    description: 'Sudden shaking of the ground caused by seismic activity',
    season: 'Year-round (unpredictable)',
    commonInJamaica: true,
    phases: {
      preparedness: {
        title: 'Earthquake Preparedness',
        timeline: 'Year-round',
        actions: [
          {
            category: 'Structural Safety',
            items: [
              'Secure heavy furniture to walls',
              'Anchor water heaters and gas appliances',
              'Install latches on cabinets',
              'Reinforce masonry structures',
              'Conduct structural assessments'
            ]
          },
          {
            category: 'Planning',
            items: [
              'Practice Drop, Cover, and Hold On',
              'Identify safe spots in each room',
              'Know how to shut off gas, water, and electricity',
              'Prepare emergency communication plan',
              'Store emergency supplies'
            ]
          }
        ]
      },
      response: {
        title: 'During Earthquake',
        timeline: 'Shaking period',
        actions: [
          {
            category: 'Immediate Action',
            items: [
              'DROP to your hands and knees',
              'COVER your head and neck with arms',
              'HOLD ON to sturdy furniture',
              'Stay away from windows, glass, and heavy objects',
              'If outdoors, move to open area away from buildings',
              'If driving, pull over and stay in vehicle'
            ]
          }
        ]
      },
      recovery: {
        title: 'Post-Earthquake',
        timeline: 'After shaking stops',
        actions: [
          {
            category: 'Immediate',
            items: [
              'Check for injuries and provide first aid',
              'Check for gas leaks (smell, listen)',
              'Inspect for structural damage',
              'Avoid damaged buildings',
              'Be prepared for aftershocks',
              'Listen to official updates'
            ]
          },
          {
            category: 'Safety',
            items: [
              'Shut off utilities if damaged',
              'Avoid using matches or lighters (gas leaks)',
              'Do not enter damaged buildings',
              'Report damage to authorities'
            ]
          }
        ]
      }
    },
    resources: []
  },
  {
    id: 'wildfire',
    name: 'Wildfire',
    icon: '🔥',
    description: 'Uncontrolled fires in vegetation',
    season: 'Dry season (December-April)',
    commonInJamaica: false,
    phases: {
      preparedness: {
        title: 'Wildfire Preparedness',
        timeline: 'Year-round, especially dry season',
        actions: [
          {
            category: 'Property Protection',
            items: [
              'Create defensible space around structures',
              'Remove flammable vegetation near buildings',
              'Use fire-resistant building materials',
              'Maintain clear access roads',
              'Have water sources accessible'
            ]
          }
        ]
      },
      response: {
        title: 'During Wildfire',
        timeline: 'Fire event',
        actions: [
          {
            category: 'Evacuation',
            items: [
              'Evacuate immediately if ordered',
              'Follow designated evacuation routes',
              'Take essential items only',
              'Close all windows and doors',
              'Leave lights on for visibility'
            ]
          }
        ]
      },
      recovery: {
        title: 'Wildfire Recovery',
        timeline: 'Post-fire',
        actions: [
          {
            category: 'Safety',
            items: [
              'Wait for official clearance before returning',
              'Watch for hot spots and smoldering',
              'Be cautious of unstable structures',
              'Watch for falling trees and debris'
            ]
          }
        ]
      }
    },
    resources: []
  },
  {
    id: 'tornado',
    name: 'Tornado',
    icon: '🌪️',
    description: 'Violently rotating column of air',
    season: 'Year-round, peak during hurricane season',
    commonInJamaica: false,
    phases: {
      preparedness: {
        title: 'Tornado Preparedness',
        timeline: 'Year-round',
        actions: [
          {
            category: 'Planning',
            items: [
              'Identify safe room (interior, windowless, lowest floor)',
              'Practice tornado drills',
              'Know warning signs (dark sky, rotating clouds, hail)',
              'Have emergency supplies in safe location'
            ]
          }
        ]
      },
      response: {
        title: 'During Tornado',
        timeline: 'Tornado event',
        actions: [
          {
            category: 'Safety',
            items: [
              'Go to safe room immediately',
              'Cover yourself with mattress or heavy blankets',
              'Protect head and neck',
              'If in vehicle, get out and find low-lying area',
              'Never try to outrun tornado'
            ]
          }
        ]
      },
      recovery: {
        title: 'Tornado Recovery',
        timeline: 'Post-tornado',
        actions: [
          {
            category: 'Immediate',
            items: [
              'Check for injuries',
              'Avoid damaged buildings',
              'Watch for downed power lines',
              'Document damage',
              'Contact insurance'
            ]
          }
        ]
      }
    },
    resources: []
  },
  {
    id: 'cyber-attack',
    name: 'Cyber Attack',
    icon: '💻',
    description: 'Malicious cyber activities targeting critical infrastructure, systems, or data',
    season: 'Year-round (constant threat)',
    commonInJamaica: true,
    phases: {
      preparedness: {
        title: 'Cyber Security Preparedness',
        timeline: 'Ongoing',
        actions: [
          {
            category: 'System Security',
            items: [
              'Implement multi-factor authentication (MFA) on all critical systems',
              'Regular security updates and patches for all software',
              'Network segmentation to limit breach impact',
              'Backup systems and data regularly (3-2-1 rule: 3 copies, 2 different media, 1 off-site)',
              'Install and maintain antivirus/anti-malware software',
              'Use strong, unique passwords and password managers',
              'Implement firewalls and intrusion detection systems'
            ]
          },
          {
            category: 'Staff Training',
            items: [
              'Regular cybersecurity awareness training for all staff',
              'Phishing simulation exercises',
              'Incident response training and drills',
              'Establish clear reporting procedures for suspicious activity',
              'Designate cybersecurity incident response team'
            ]
          },
          {
            category: 'Critical Infrastructure Protection',
            items: [
              'Identify and protect critical systems (SCADA, power grid, water systems)',
              'Air-gapped backups for critical systems',
              'Redundant communication systems (radio, satellite)',
              'Physical security for server rooms and data centers',
              'Vendor security assessments for third-party systems'
            ]
          },
          {
            category: 'Incident Response Planning',
            items: [
              'Develop cyber incident response plan',
              'Establish communication protocols for cyber incidents',
              'Identify key stakeholders (IT, legal, PR, law enforcement)',
              'Create contact list for cybersecurity experts and vendors',
              'Practice tabletop exercises for cyber scenarios'
            ]
          }
        ]
      },
      response: {
        title: 'During Cyber Attack',
        timeline: 'Immediate response period',
        actions: [
          {
            category: 'Immediate Actions',
            items: [
              'Isolate affected systems from network immediately',
              'Activate incident response team',
              'Preserve evidence (logs, screenshots, affected systems)',
              'Assess scope and impact of attack',
              'Notify IT security team and management',
              'Do not delete or modify affected systems until investigation'
            ]
          },
          {
            category: 'Communication',
            items: [
              'Notify law enforcement (Cybercrime Unit) if criminal activity suspected',
              'Inform key stakeholders without causing panic',
              'Use secure, alternative communication channels if primary systems compromised',
              'Coordinate with national cybersecurity agencies (if applicable)',
              'Prepare public communication if data breach affects citizens'
            ]
          },
          {
            category: 'System Protection',
            items: [
              'Disconnect compromised systems from network',
              'Change all passwords and credentials',
              'Enable additional security measures',
              'Monitor for additional attack vectors',
              'Activate backup systems if primary systems compromised',
              'Block malicious IP addresses and domains'
            ]
          },
          {
            category: 'Service Continuity',
            items: [
              'Activate manual/backup procedures for critical services',
              'Use alternative communication methods',
              'Prioritize critical operations',
              'Coordinate with other agencies for resource sharing',
              'Maintain essential services using redundant systems'
            ]
          }
        ]
      },
      recovery: {
        title: 'Post-Cyber Attack Recovery',
        timeline: 'Immediate to long-term',
        actions: [
          {
            category: 'Immediate (0-24 hours)',
            items: [
              'Complete forensic analysis of attack',
              'Identify all compromised systems and data',
              'Restore systems from clean backups',
              'Verify integrity of restored systems',
              'Notify affected parties if personal data compromised',
              'File incident reports with relevant authorities'
            ]
          },
          {
            category: 'Short-Term (1-7 days)',
            items: [
              'Implement additional security measures based on lessons learned',
              'Update security policies and procedures',
              'Conduct security audit of all systems',
              'Provide support to affected users/staff',
              'Monitor for follow-up attacks',
              'Review and update incident response plan'
            ]
          },
          {
            category: 'Long-Term (1 week+)',
            items: [
              'Implement enhanced security measures',
              'Regular security assessments and penetration testing',
              'Update training programs based on attack type',
              'Review and strengthen vendor security requirements',
              'Establish ongoing monitoring and threat intelligence',
              'Document lessons learned and share with other agencies'
            ]
          }
        ]
      }
    },
    resources: [
      {
        name: 'Jamaica Cyber Incident Response Team',
        url: '#',
        description: 'National cybersecurity response coordination'
      },
      {
        name: 'CERT-Jamaica',
        url: '#',
        description: 'Computer Emergency Response Team'
      }
    ]
  },
  {
    id: 'infrastructure-failure',
    name: 'Infrastructure Failure',
    icon: '⚡',
    description: 'Failures in critical infrastructure: power grid, water systems, telecommunications, transportation',
    season: 'Year-round',
    commonInJamaica: true,
    phases: {
      preparedness: {
        title: 'Infrastructure Resilience Planning',
        timeline: 'Ongoing',
        actions: [
          {
            category: 'Power Grid',
            items: [
              'Maintain backup generators at critical facilities',
              'Regular generator testing and maintenance',
              'Fuel storage for extended outages',
              'Identify critical facilities requiring priority power restoration',
              'Coordinate with power utility for emergency response'
            ]
          },
          {
            category: 'Water Systems',
            items: [
              'Emergency water storage (minimum 3 days per person)',
              'Water purification methods and supplies',
              'Identify alternative water sources',
              'Backup water treatment systems',
              'Coordination with water utility for emergency response'
            ]
          },
          {
            category: 'Telecommunications',
            items: [
              'Redundant communication systems (radio, satellite phones)',
              'Battery-powered communication devices',
              'Alternative internet connectivity options',
              'Emergency communication protocols',
              'Backup data centers and cloud services'
            ]
          },
          {
            category: 'Transportation',
            items: [
              'Alternative transportation routes',
              'Emergency vehicle fleet maintenance',
              'Fuel reserves for emergency vehicles',
              'Coordination with transportation authorities',
              'Evacuation route planning'
            ]
          }
        ]
      },
      response: {
        title: 'During Infrastructure Failure',
        timeline: 'Failure period',
        actions: [
          {
            category: 'Immediate Assessment',
            items: [
              'Assess scope and duration of failure',
              'Identify affected areas and populations',
              'Determine cause (natural, technical, malicious)',
              'Estimate restoration timeline',
              'Prioritize critical services'
            ]
          },
          {
            category: 'Service Continuity',
            items: [
              'Activate backup systems (generators, water storage)',
              'Implement manual procedures where automated systems fail',
              'Deploy mobile/portable resources',
              'Coordinate with utility companies for restoration',
              'Establish emergency communication channels'
            ]
          },
          {
            category: 'Public Communication',
            items: [
              'Provide regular updates on situation and restoration progress',
              'Issue water conservation orders if applicable',
              'Advise on alternative routes if transportation affected',
              'Share information on available resources and services',
              'Use multiple communication channels (radio, social media, SMS)'
            ]
          },
          {
            category: 'Resource Management',
            items: [
              'Distribute emergency supplies (water, food, fuel)',
              'Coordinate resource sharing between agencies',
              'Request assistance from neighboring parishes if needed',
              'Manage fuel reserves for critical operations',
              'Prioritize services for vulnerable populations'
            ]
          }
        ]
      },
      recovery: {
        title: 'Infrastructure Restoration',
        timeline: 'Restoration period',
        actions: [
          {
            category: 'Immediate',
            items: [
              'Coordinate with utility companies for restoration',
              'Prioritize critical facilities (hospitals, emergency services)',
              'Monitor restoration progress',
              'Provide updates to public',
              'Assess damage and repair needs'
            ]
          },
          {
            category: 'Short-Term',
            items: [
              'Complete full system restoration',
              'Conduct post-incident review',
              'Identify vulnerabilities and improvement opportunities',
              'Update emergency procedures based on lessons learned',
              'Restore normal operations'
            ]
          },
          {
            category: 'Long-Term',
            items: [
              'Implement infrastructure improvements',
              'Enhance redundancy and backup systems',
              'Update maintenance schedules',
              'Strengthen coordination with utility providers',
              'Invest in resilient infrastructure upgrades'
            ]
          }
        ]
      }
    },
    resources: []
  },
  {
    id: 'civil-unrest',
    name: 'Civil Unrest',
    icon: '🚨',
    description: 'Public demonstrations, riots, or civil disturbances',
    season: 'Year-round',
    commonInJamaica: false,
    phases: {
      preparedness: {
        title: 'Civil Unrest Preparedness',
        timeline: 'Ongoing',
        actions: [
          {
            category: 'Intelligence & Monitoring',
            items: [
              'Monitor social media and public sentiment',
              'Maintain communication with community leaders',
              'Track potential flashpoints and tensions',
              'Coordinate with law enforcement for threat assessment',
              'Establish early warning systems'
            ]
          },
          {
            category: 'Security Measures',
            items: [
              'Secure critical facilities and infrastructure',
              'Develop evacuation plans for government buildings',
              'Establish secure communication channels',
              'Coordinate with security forces',
              'Protect essential personnel and assets'
            ]
          },
          {
            category: 'Community Engagement',
            items: [
              'Maintain open dialogue with community groups',
              'Address grievances proactively',
              'Engage with youth and community leaders',
              'Promote peaceful conflict resolution',
              'Build trust with communities'
            ]
          },
          {
            category: 'Response Planning',
            items: [
              'Develop de-escalation protocols',
              'Plan for safe evacuation routes',
              'Coordinate with law enforcement response',
              'Prepare communication strategies',
              'Identify safe zones and shelters'
            ]
          }
        ]
      },
      response: {
        title: 'During Civil Unrest',
        timeline: 'Unrest period',
        actions: [
          {
            category: 'Safety First',
            items: [
              'Avoid areas of active unrest',
              'Stay indoors if safe to do so',
              'Follow official instructions and curfews',
              'Do not engage with or provoke demonstrators',
              'Keep emergency supplies ready'
            ]
          },
          {
            category: 'Communication',
            items: [
              'Monitor official updates from authorities',
              'Use social media responsibly (avoid spreading rumors)',
              'Check on family and neighbors safely',
              'Report dangerous situations to authorities',
              'Stay informed but avoid unnecessary travel'
            ]
          },
          {
            category: 'Emergency Services',
            items: [
              'Call 119 for emergencies only',
              'Report violence or threats to police',
              'Seek medical attention if injured',
              'Follow evacuation orders if issued',
              'Coordinate with emergency services for assistance'
            ]
          },
          {
            category: 'De-escalation',
            items: [
              'Engage with community leaders for dialogue',
              'Address immediate concerns where possible',
              'Maintain open communication channels',
              'Work with mediators if available',
              'Focus on protecting lives and property'
            ]
          }
        ]
      },
      recovery: {
        title: 'Post-Unrest Recovery',
        timeline: 'Recovery period',
        actions: [
          {
            category: 'Immediate',
            items: [
              'Assess damage to property and infrastructure',
              'Provide medical assistance to injured',
              'Restore essential services',
              'Secure affected areas',
              'Document incidents for investigation'
            ]
          },
          {
            category: 'Community Healing',
            items: [
              'Facilitate community dialogue and reconciliation',
              'Address underlying grievances',
              'Provide support services to affected communities',
              'Engage with community leaders',
              'Promote healing and unity'
            ]
          },
          {
            category: 'Long-Term',
            items: [
              'Implement community development initiatives',
              'Address root causes of unrest',
              'Strengthen community-police relations',
              'Improve social services and opportunities',
              'Build resilience and social cohesion'
            ]
          }
        ]
      }
    },
    resources: []
  },
  {
    id: 'terrorism-security',
    name: 'Terrorism & Security Threats',
    icon: '🛡️',
    description: 'Terrorist attacks, bomb threats, active shooter situations, or other security threats',
    season: 'Year-round',
    commonInJamaica: false,
    phases: {
      preparedness: {
        title: 'Security Threat Preparedness',
        timeline: 'Ongoing',
        actions: [
          {
            category: 'Security Measures',
            items: [
              'Implement access control at critical facilities',
              'Conduct security assessments and vulnerability analyses',
              'Install surveillance and monitoring systems',
              'Establish security protocols and procedures',
              'Train staff on security awareness and response'
            ]
          },
          {
            category: 'Threat Assessment',
            items: [
              'Monitor threat intelligence from security agencies',
              'Maintain communication with law enforcement',
              'Conduct regular security drills and exercises',
              'Identify and protect high-value targets',
              'Coordinate with national security agencies'
            ]
          },
          {
            category: 'Response Planning',
            items: [
              'Develop evacuation and shelter-in-place procedures',
              'Establish communication protocols for security incidents',
              'Plan for lockdown procedures',
              'Coordinate with law enforcement response',
              'Prepare for mass casualty incidents'
            ]
          },
          {
            category: 'Public Awareness',
            items: [
              'Promote "See Something, Say Something" awareness',
              'Educate public on reporting suspicious activity',
              'Provide guidance on recognizing threats',
              'Maintain public vigilance without causing panic',
              'Build community resilience'
            ]
          }
        ]
      },
      response: {
        title: 'During Security Threat',
        timeline: 'Threat period',
        actions: [
          {
            category: 'Immediate Actions',
            items: [
              'Follow Run, Hide, Fight protocol for active threats',
              'Call 119 immediately to report threat',
              'Evacuate if safe to do so, or shelter in place',
              'Lock doors and barricade if sheltering',
              'Turn off lights and silence phones',
              'Stay quiet and out of sight'
            ]
          },
          {
            category: 'Communication',
            items: [
              'Follow official instructions from authorities',
              'Do not spread unverified information',
              'Use emergency communication channels',
              'Coordinate with law enforcement',
              'Provide accurate information to responders'
            ]
          },
          {
            category: 'Law Enforcement Response',
            items: [
              'Cooperate fully with law enforcement',
              'Provide information about threat or incident',
              'Follow evacuation orders immediately',
              'Do not interfere with security operations',
              'Report suspicious activity or persons'
            ]
          },
          {
            category: 'Medical Response',
            items: [
              'Provide first aid if safe to do so',
              'Coordinate with medical responders',
              'Establish casualty collection points',
              'Prioritize critical injuries',
              'Prepare for mass casualty triage'
            ]
          }
        ]
      },
      recovery: {
        title: 'Post-Incident Recovery',
        timeline: 'Recovery period',
        actions: [
          {
            category: 'Immediate',
            items: [
              'Secure scene for investigation',
              'Provide medical assistance to injured',
              'Account for all personnel and visitors',
              'Coordinate with law enforcement investigation',
              'Provide support to victims and families'
            ]
          },
          {
            category: 'Psychological Support',
            items: [
              'Provide crisis counseling services',
              'Support first responders and witnesses',
              'Address trauma and stress reactions',
              'Connect affected individuals with mental health services',
              'Promote community resilience'
            ]
          },
          {
            category: 'Long-Term',
            items: [
              'Review and strengthen security measures',
              'Update security protocols based on lessons learned',
              'Enhance coordination with security agencies',
              'Improve threat detection and prevention',
              'Build community resilience and vigilance'
            ]
          }
        ]
      }
    },
    resources: [
      {
        name: 'Jamaica Constabulary Force',
        url: 'https://www.jcf.gov.jm',
        description: 'National police force and security coordination'
      }
    ]
  },
  {
    id: 'chemical-industrial',
    name: 'Chemical & Industrial Accidents',
    icon: '☢️',
    description: 'Chemical spills, industrial accidents, hazardous material releases',
    season: 'Year-round',
    commonInJamaica: false,
    phases: {
      preparedness: {
        title: 'Hazmat Preparedness',
        timeline: 'Ongoing',
        actions: [
          {
            category: 'Risk Assessment',
            items: [
              'Identify facilities using hazardous materials',
              'Maintain inventory of hazardous materials in area',
              'Assess risks and potential impact zones',
              'Coordinate with industrial facilities on safety measures',
              'Develop evacuation plans for high-risk areas'
            ]
          },
          {
            category: 'Response Capabilities',
            items: [
              'Train personnel on hazmat response',
              'Maintain hazmat response equipment',
              'Coordinate with fire department and hazmat teams',
              'Establish decontamination procedures',
              'Plan for mass decontamination if needed'
            ]
          },
          {
            category: 'Public Awareness',
            items: [
              'Educate public on shelter-in-place procedures',
              'Provide information on recognizing chemical hazards',
              'Distribute emergency information materials',
              'Conduct community drills',
              'Establish warning systems'
            ]
          }
        ]
      },
      response: {
        title: 'During Chemical/Industrial Incident',
        timeline: 'Incident period',
        actions: [
          {
            category: 'Immediate Safety',
            items: [
              'Evacuate upwind and uphill if possible',
              'Shelter in place if evacuation not possible (seal windows/doors)',
              'Avoid contact with visible plumes or spills',
              'Cover nose and mouth with cloth if exposed',
              'Remove contaminated clothing if safe to do so',
              'Seek medical attention if exposed'
            ]
          },
          {
            category: 'Communication',
            items: [
              'Follow official instructions from authorities',
              'Monitor emergency alerts and updates',
              'Do not approach incident site',
              'Report incident to 119',
              'Share accurate information, avoid rumors'
            ]
          },
          {
            category: 'Emergency Response',
            items: [
              'Activate hazmat response teams',
              'Establish incident command',
              'Set up exclusion zones',
              'Coordinate evacuation if necessary',
              'Provide medical treatment for exposed individuals'
            ]
          }
        ]
      },
      recovery: {
        title: 'Post-Incident Recovery',
        timeline: 'Recovery period',
        actions: [
          {
            category: 'Immediate',
            items: [
              'Conduct environmental assessment',
              'Decontaminate affected areas',
              'Monitor air and water quality',
              'Provide medical follow-up for exposed individuals',
              'Secure incident site'
            ]
          },
          {
            category: 'Long-Term',
            items: [
              'Investigate cause of incident',
              'Implement safety improvements',
              'Update safety regulations if needed',
              'Restore affected areas',
              'Review and strengthen prevention measures'
            ]
          }
        ]
      }
    },
    resources: []
  }
]

// Get protocol for specific emergency type
export const getEmergencyProtocol = (emergencyTypeId) => {
  return emergencyTypes.find(type => type.id === emergencyTypeId)
}

// Get all emergency types
export const getAllEmergencyTypes = () => {
  return emergencyTypes
}

