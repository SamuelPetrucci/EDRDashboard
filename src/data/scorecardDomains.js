// LTDRR Scorecard Domain Structure
// Based on the 9 core domains with 0/1/2 scoring system

export const scorecardDomains = [
  {
    id: 'governance-leadership',
    name: 'Governance & Leadership',
    description: 'Leadership structures, coordination, and legal authorities',
    maxScore: 10, // 5 criteria × 2 points each
    criteria: [
      {
        id: 'recovery-coordinator',
        name: 'Long-Term Recovery Coordinator Appointed',
        description: 'Has a designated recovery coordinator been appointed?',
        score: 0, // 0 = No, 1 = In Progress, 2 = Yes
        notes: ''
      },
      {
        id: 'recovery-task-force',
        name: 'Long-Term Recovery Task Force Formed',
        description: 'Is there an active recovery task force?',
        score: 0,
        notes: ''
      },
      {
        id: 'recovery-plan',
        name: 'Long-Term Recovery Plan Pre-Developed',
        description: 'Does a pre-disaster recovery plan exist?',
        score: 0,
        notes: ''
      },
      {
        id: 'tribal-sovereignty',
        name: 'Tribal Sovereignty Integrated (If Applicable)',
        description: 'Are tribal nations integrated into recovery planning?',
        score: 0,
        notes: ''
      },
      {
        id: 'legal-authorities',
        name: 'Legal Authorities Reviewed',
        description: 'Have legal authorities been reviewed and established?',
        score: 0,
        notes: ''
      }
    ]
  },
  {
    id: 'capacity-building',
    name: 'Community Planning & Capacity Building',
    description: 'Pre-disaster planning, partnerships, and training',
    maxScore: 8, // 4 criteria × 2 points each
    criteria: [
      {
        id: 'pdrp-exists',
        name: 'Pre-Disaster Recovery Plan (PDRP) Exists',
        description: 'Is there a comprehensive pre-disaster recovery plan?',
        score: 0,
        notes: ''
      },
      {
        id: 'inclusive-partners',
        name: 'Inclusive Partner Engagement',
        description: 'Are diverse partners engaged in planning?',
        score: 0,
        notes: ''
      },
      {
        id: 'technical-assistance',
        name: 'Technical Assistance Partnerships',
        description: 'Are technical assistance partnerships established?',
        score: 0,
        notes: ''
      },
      {
        id: 'training-exercises',
        name: 'Training & Simulation Exercises',
        description: 'Are regular training and simulation exercises conducted?',
        score: 0,
        notes: ''
      }
    ]
  },
  {
    id: 'infrastructure',
    name: 'Infrastructure Systems',
    description: 'Critical infrastructure identification and continuity',
    maxScore: 8, // 4 criteria × 2 points each
    criteria: [
      {
        id: 'critical-infrastructure',
        name: 'Critical Infrastructure Identified',
        description: 'Have critical infrastructure assets been identified?',
        score: 0,
        notes: ''
      },
      {
        id: 'utility-continuity',
        name: 'Utility Continuity Plans',
        description: 'Do utility continuity plans exist?',
        score: 0,
        notes: ''
      },
      {
        id: 'public-works',
        name: 'Public Works Recovery Strategy',
        description: 'Is there a public works recovery strategy?',
        score: 0,
        notes: ''
      },
      {
        id: 'hazard-mitigation',
        name: 'Hazard Mitigation Strategies',
        description: 'Are hazard mitigation strategies in place?',
        score: 0,
        notes: ''
      }
    ]
  },
  {
    id: 'economic-recovery',
    name: 'Economic Recovery',
    description: 'Business support, diversification, and job restoration',
    maxScore: 8, // 4 criteria × 2 points each
    criteria: [
      {
        id: 'small-business',
        name: 'Small Business Support Strategy',
        description: 'Is there a strategy to support small businesses?',
        score: 0,
        notes: ''
      },
      {
        id: 'economic-diversification',
        name: 'Economic Diversification Plan',
        description: 'Is there a plan for economic diversification?',
        score: 0,
        notes: ''
      },
      {
        id: 'job-restoration',
        name: 'Job Restoration Partnerships',
        description: 'Are partnerships in place for job restoration?',
        score: 0,
        notes: ''
      },
      {
        id: 'tourism-agriculture',
        name: 'Tourism & Agriculture Recovery',
        description: 'Are recovery plans in place for key sectors?',
        score: 0,
        notes: ''
      }
    ]
  },
  {
    id: 'financial-management',
    name: 'Financial & Resource Management',
    description: 'Finance plans, grant management, and procurement',
    maxScore: 8, // 4 criteria × 2 points each
    criteria: [
      {
        id: 'finance-plan',
        name: 'Long-Term Recovery Finance Plan',
        description: 'Is there a comprehensive finance plan?',
        score: 0,
        notes: ''
      },
      {
        id: 'grant-management',
        name: 'Grant Management Capacity',
        description: 'Is there capacity to manage grants?',
        score: 0,
        notes: ''
      },
      {
        id: 'procurement',
        name: 'Procurement Readiness',
        description: 'Is procurement system ready for recovery?',
        score: 0,
        notes: ''
      },
      {
        id: 'cost-tracking',
        name: 'Cost Tracking Systems',
        description: 'Are systems in place to track costs?',
        score: 0,
        notes: ''
      }
    ]
  },
  {
    id: 'housing-recovery',
    name: 'Housing Recovery',
    description: 'Damage assessments, temporary housing, and rebuilding',
    maxScore: 8, // 4 criteria × 2 points each
    criteria: [
      {
        id: 'damage-assessments',
        name: 'Housing Damage Assessments Ready',
        description: 'Are damage assessment protocols ready?',
        score: 0,
        notes: ''
      },
      {
        id: 'temporary-housing',
        name: 'Temporary Housing Plan',
        description: 'Is there a plan for temporary housing?',
        score: 0,
        notes: ''
      },
      {
        id: 'affordable-housing',
        name: 'Affordable Housing Strategy',
        description: 'Is there a strategy for affordable housing?',
        score: 0,
        notes: ''
      },
      {
        id: 'resilience-rebuilding',
        name: 'Resilience in Rebuilding',
        description: 'Are resilience measures included in rebuilding?',
        score: 0,
        notes: ''
      }
    ]
  },
  {
    id: 'health-social',
    name: 'Health & Social Services',
    description: 'Public health, continuity of care, and vulnerable populations',
    maxScore: 8, // 4 criteria × 2 points each
    criteria: [
      {
        id: 'public-health',
        name: 'Public Health Recovery Plan',
        description: 'Is there a public health recovery plan?',
        score: 0,
        notes: ''
      },
      {
        id: 'continuity-care',
        name: 'Continuity of Care',
        description: 'Are continuity of care plans in place?',
        score: 0,
        notes: ''
      },
      {
        id: 'social-services',
        name: 'Social Services Mapping',
        description: 'Have social services been mapped?',
        score: 0,
        notes: ''
      },
      {
        id: 'vulnerable-populations',
        name: 'Vulnerable Populations Tracked',
        description: 'Are vulnerable populations being tracked?',
        score: 0,
        notes: ''
      }
    ]
  },
  {
    id: 'natural-cultural',
    name: 'Natural & Cultural Resources',
    description: 'Historic preservation, environmental remediation, and nature-based mitigation',
    maxScore: 8, // 4 criteria × 2 points each
    criteria: [
      {
        id: 'historic-preservation',
        name: 'Historic Preservation Protocols',
        description: 'Are historic preservation protocols in place?',
        score: 0,
        notes: ''
      },
      {
        id: 'environmental-remediation',
        name: 'Environmental Remediation Plans',
        description: 'Are environmental remediation plans ready?',
        score: 0,
        notes: ''
      },
      {
        id: 'nature-based',
        name: 'Nature-Based Mitigation',
        description: 'Are nature-based mitigation strategies included?',
        score: 0,
        notes: ''
      },
      {
        id: 'parks-open-space',
        name: 'Parks & Open Space Recovery',
        description: 'Are plans in place for parks and open spaces?',
        score: 0,
        notes: ''
      }
    ]
  },
  {
    id: 'public-engagement',
    name: 'Public Information & Community Engagement',
    description: 'Crisis communication, feedback loops, and transparency',
    maxScore: 8, // 4 criteria × 2 points each
    criteria: [
      {
        id: 'crisis-communication',
        name: 'Crisis Communication Plan',
        description: 'Is there a crisis communication plan?',
        score: 0,
        notes: ''
      },
      {
        id: 'feedback-loops',
        name: 'Community Feedback Loops',
        description: 'Are community feedback mechanisms in place?',
        score: 0,
        notes: ''
      },
      {
        id: 'media-coordination',
        name: 'Media Coordination',
        description: 'Is media coordination established?',
        score: 0,
        notes: ''
      },
      {
        id: 'transparency-tools',
        name: 'Transparency Tools',
        description: 'Are transparency tools available to the public?',
        score: 0,
        notes: ''
      }
    ]
  }
]

// Total possible score: 74 points (as per document)
export const TOTAL_POSSIBLE_SCORE = 74

// Calculate domain score percentage
export const calculateDomainScore = (domain) => {
  const totalScore = domain.criteria.reduce((sum, criterion) => sum + criterion.score, 0)
  return (totalScore / domain.maxScore) * 100
}

// Calculate overall score percentage
export const calculateOverallScore = (domains) => {
  const totalScore = domains.reduce((sum, domain) => {
    const domainScore = domain.criteria.reduce((dSum, criterion) => dSum + criterion.score, 0)
    return sum + domainScore
  }, 0)
  return (totalScore / TOTAL_POSSIBLE_SCORE) * 100
}

// Get recovery status based on score
export const getRecoveryStatus = (score) => {
  if (score >= 80) return { status: 'Resilient', color: 'var(--resilient-color)' }
  if (score >= 60) return { status: 'Restoring', color: 'var(--restoring-color)' }
  return { status: 'Need Support', color: 'var(--need-support-color)' }
}



