# LTDRR AI Dashboard - Comprehensive Design Explanation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture & Data Flow](#architecture--data-flow)
3. [Data Models](#data-models)
4. [Component Structure](#component-structure)
5. [Scoring System](#scoring-system)
6. [User Interface Design](#user-interface-design)
7. [Navigation Flow](#navigation-flow)
8. [Key Features Explained](#key-features-explained)

---

## System Overview

### Purpose
The **Long-Term Disaster Recovery Resilience (LTDRR) AI Dashboard** is designed to help Jamaica's 14 parishes assess, track, and improve their disaster recovery readiness. It combines:

1. **Resource Tracking**: Equipment and personnel inventory for each parish
2. **Assessment Tool**: LTDRR Scorecard with 9 domains and 74 criteria
3. **Visualization**: Interactive dashboards showing recovery health status
4. **Strategic Planning**: Data-driven insights for improving resilience

### Core Concept
The system uses a **0/1/2 scoring model** where:
- **0** = Not Started (Need Support - Red)
- **1** = In Progress (Restoring - Yellow)  
- **2** = Fully Implemented (Resilient - Green)

Scores are calculated as percentages and categorized into three recovery statuses:
- **Resilient**: 80-100% (High readiness)
- **Restoring**: 60-79% (Moderate capability)
- **Need Support**: 0-59% (Lacking capacity)

---

## Architecture & Data Flow

### Technology Stack
```
Frontend Framework: React 18
Routing: React Router DOM v6
Build Tool: Vite
Styling: CSS3 with CSS Variables
Icons: Lucide React
```

### Application Structure
```
┌─────────────────────────────────────┐
│         Layout Component            │
│  (Header, Navigation, Footer)       │
└─────────────────────────────────────┘
              │
              ├─── Global Overview Page
              │    (All 14 parishes summary)
              │
              ├─── Parish Dashboard Page
              │    (Individual parish details)
              │
              └─── Scorecard View Page
                   (LTDRR assessment tool)
```

### Data Flow Pattern
```
Static Data Files (jamaicaParishes.js, scorecardDomains.js)
         │
         ├───→ Components (Read data)
         │
         ├───→ State Management (useState hooks)
         │
         └───→ UI Rendering (Display & Interaction)
```

---

## Data Models

### 1. Parish Data Structure (`jamaicaParishes.js`)

Each of the 14 parishes has this structure:

```javascript
{
  id: 'kingston',                    // Unique identifier for routing
  name: 'Kingston',                  // Display name
  region: 'Southeast',               // Geographic region
  population: 937700,                 // Total population
  area: '22.66 km²',                 // Geographic area
  
  equipment: {                        // Physical resources inventory
    emergencyVehicles: 45,           // Ambulances, fire trucks, etc.
    generators: 120,                 // Backup power units
    waterTrucks: 15,                 // Water distribution vehicles
    medicalSupplies: 850,            // Medical equipment units
    communicationEquipment: 200,    // Radios, satellite phones, etc.
    searchAndRescue: 30,             // SAR equipment units
    heavyMachinery: 25               // Bulldozers, excavators, etc.
  },
  
  personnel: {                        // Human resources inventory
    emergencyResponders: 180,        // First responders
    medicalStaff: 250,               // Doctors, nurses, paramedics
    engineers: 45,                   // Civil, structural engineers
    logisticsStaff: 60,              // Supply chain coordinators
    communicationSpecialists: 35,    // Radio operators, IT
    volunteers: 500,                 // Trained volunteers
    coordinators: 12                 // Recovery coordinators
  },
  
  scorecard: {                        // LTDRR assessment results
    overallScore: 0,                 // Percentage (0-100)
    domains: {}                      // Domain-specific scores
  },
  
  lastUpdated: '2024-01-15T...'      // ISO timestamp
}
```

**Why This Structure?**
- **Equipment & Personnel**: Critical for understanding resource availability during disasters
- **Scorecard Integration**: Links resource data to recovery readiness assessment
- **Regional Grouping**: Helps identify patterns across geographic regions

### 2. Scorecard Domain Structure (`scorecardDomains.js`)

The LTDRR Scorecard has **9 domains**, each containing multiple criteria:

```javascript
{
  id: 'governance-leadership',       // Unique domain identifier
  name: 'Governance & Leadership',   // Display name
  description: 'Leadership structures...', // Context
  maxScore: 10,                      // Maximum possible points (5 criteria × 2)
  
  criteria: [                        // Individual assessment items
    {
      id: 'recovery-coordinator',    // Unique criterion ID
      name: 'Long-Term Recovery Coordinator Appointed',
      description: 'Has a designated recovery coordinator been appointed?',
      score: 0,                      // Current score (0, 1, or 2)
      notes: ''                      // Optional notes/evidence
    },
    // ... more criteria
  ]
}
```

**The 9 Domains:**
1. **Governance & Leadership** (10 points) - 5 criteria
2. **Community Planning & Capacity Building** (8 points) - 4 criteria
3. **Infrastructure Systems** (8 points) - 4 criteria
4. **Economic Recovery** (8 points) - 4 criteria
5. **Financial & Resource Management** (8 points) - 4 criteria
6. **Housing Recovery** (8 points) - 4 criteria
7. **Health & Social Services** (8 points) - 4 criteria
8. **Natural & Cultural Resources** (8 points) - 4 criteria
9. **Public Information & Community Engagement** (8 points) - 4 criteria

**Total: 74 points** (matches the document specification)

---

## Component Structure

### 1. Layout Component (`Layout.jsx`)

**Purpose**: Wraps all pages with consistent header, navigation, and footer

**Structure**:
```
┌─────────────────────────────────────┐
│  Header (SkillVantage Logo + Nav)   │
├─────────────────────────────────────┤
│                                     │
│         Main Content Area           │
│    (Routes render here)             │
│                                     │
├─────────────────────────────────────┤
│  Footer (Copyright Notice)          │
└─────────────────────────────────────┘
```

**Navigation Links**:
- **Global Overview** (`/`) - Home page
- **Scorecard** (`/scorecard`) - Assessment tool
- **Parishes** (`/parish/:id`) - Individual parish views

**Design Pattern**: Layout component uses React Router's `children` prop pattern to render different page components while maintaining consistent UI structure.

### 2. Global Overview Page (`GlobalOverview.jsx`)

**Purpose**: Provides a high-level view of all 14 parishes

**Components**:
1. **Summary Cards** (4 cards):
   - Total Parishes (14)
   - Total Population (aggregated)
   - Total Personnel (aggregated)
   - Total Equipment Units (aggregated)

2. **Parishes Grid**:
   - Card for each of 14 parishes
   - Shows: Name, Region, Population, Emergency Vehicles, Total Personnel
   - Clickable → navigates to individual parish dashboard

**Data Flow**:
```javascript
getAllParishes() → Array of 14 parishes
  ↓
Calculate aggregates (sum population, personnel, equipment)
  ↓
Render summary cards + parish cards
```

**Visual Design**:
- Grid layout (responsive: 3 columns → 2 → 1 on mobile)
- Hover effects for interactivity
- Color-coded regions
- Quick stats visible at a glance

### 3. Parish Dashboard Page (`ParishDashboard.jsx`)

**Purpose**: Detailed view of a single parish's resources and status

**URL Pattern**: `/parish/:parishId` (e.g., `/parish/kingston`)

**Components**:
1. **Header Section**:
   - Parish name and region badge
   - Back navigation link

2. **Quick Stats Cards** (4 cards):
   - Population
   - Total Personnel
   - Total Equipment
   - Area

3. **Equipment Inventory Section**:
   - Grid showing all equipment types and quantities
   - Visual cards with labels and values

4. **Personnel Resources Section**:
   - Grid showing all personnel types and counts
   - Organized by role/function

5. **Scorecard Link**:
   - Quick access to LTDRR assessment for this parish

**Data Flow**:
```javascript
URL parameter (:parishId) → getParishById(parishId)
  ↓
Extract equipment and personnel objects
  ↓
Calculate totals and render sections
```

**Key Feature**: This page answers the question: *"What resources does this parish have available for disaster response?"*

### 4. Scorecard View Page (`ScorecardView.jsx`)

**Purpose**: Interactive LTDRR assessment tool

**Components**:
1. **Overall Score Card**:
   - Large circular gauge showing overall percentage
   - Recovery status badge (Resilient/Restoring/Need Support)
   - Total points (X / 74)

2. **Domain Cards** (9 cards, one per domain):
   - Domain name and description
   - Domain score percentage
   - Domain status badge
   - List of criteria with scoring buttons
   - Progress bar showing domain completion

3. **Criterion Rows** (within each domain):
   - Criterion name and description
   - Three scoring buttons (0, 1, 2)
   - Visual feedback (active button highlighted)
   - Score labels (No / Progress / Yes)

**Scoring Interaction**:
```javascript
User clicks score button (0, 1, or 2)
  ↓
handleScoreChange(domainId, criterionId, newScore)
  ↓
Update state: setDomains(updated domains)
  ↓
Recalculate: calculateDomainScore() → calculateOverallScore()
  ↓
Update UI: Status badges, progress bars, percentages
```

**State Management**:
- Uses React `useState` hook to manage domain scores
- State structure mirrors `scorecardDomains` array
- Changes are immediate (no persistence yet - future enhancement)

**Calculation Logic**:
```javascript
// Domain Score
domainScore = (sum of criterion scores / maxScore) × 100

// Overall Score  
overallScore = (sum of all criterion scores / 74) × 100

// Status Determination
if (score >= 80) → "Resilient" (Green)
if (score >= 60) → "Restoring" (Yellow)
else → "Need Support" (Red)
```

---

## Scoring System

### The 0/1/2 Model

**Why This System?**
- Simple and intuitive (not started / in progress / complete)
- Matches the document's specification
- Easy to understand for non-technical users
- Allows for granular tracking without complexity

### Score Calculation Flow

```
Individual Criterion Score (0, 1, or 2)
         │
         ├───→ Domain Score = Sum of criteria scores
         │     Domain % = (Domain Score / Domain Max) × 100
         │
         └───→ Overall Score = Sum of all criteria scores
               Overall % = (Overall Score / 74) × 100
```

### Example Calculation

**Governance & Leadership Domain:**
- Recovery Coordinator: 2 points
- Task Force: 1 point
- Recovery Plan: 2 points
- Tribal Sovereignty: 0 points
- Legal Authorities: 2 points
- **Domain Score**: 7 / 10 = 70% (Restoring)

**Overall Score:**
- If all domains average 70%:
- **Overall**: 51.8 / 74 = 70% (Restoring)

### Status Thresholds

The system uses three color-coded statuses:

1. **Resilient (Green)**: 80-100%
   - Indicates high recovery readiness
   - Parish is well-prepared
   - Can serve as mentor to others

2. **Restoring (Yellow)**: 60-79%
   - Moderate capability
   - Some gaps exist
   - Needs targeted improvements

3. **Need Support (Red)**: 0-59%
   - Lacking in capacity
   - Significant gaps
   - Requires immediate attention

---

## User Interface Design

### Color System (CSS Variables)

```css
--primary-color: #0066cc        /* Main brand color */
--secondary-color: #004499      /* Darker shade */
--resilient-color: #28a745      /* Green - 80-100% */
--restoring-color: #ffc107      /* Yellow - 60-79% */
--need-support-color: #dc3545   /* Red - 0-59% */
--bg-color: #f5f5f5             /* Light gray background */
--card-bg: #ffffff              /* White cards */
--text-primary: #212529         /* Dark text */
--text-secondary: #6c757d       /* Gray text */
--border-color: #dee2e6         /* Light borders */
```

**Design Philosophy**:
- Clean, professional appearance
- High contrast for accessibility
- Color-coded status indicators
- Consistent spacing and typography

### Responsive Design

**Breakpoints**:
- **Desktop**: 3-4 column grids, full navigation
- **Tablet**: 2 column grids, condensed navigation
- **Mobile**: Single column, stacked layout, hamburger menu (future)

**Adaptive Elements**:
- Grid layouts use `auto-fill` with `minmax()` for flexibility
- Cards stack vertically on small screens
- Font sizes scale appropriately
- Touch-friendly button sizes (50px minimum)

### Visual Hierarchy

1. **Primary Actions**: Large, colored buttons
2. **Secondary Information**: Smaller text, muted colors
3. **Status Indicators**: Bold, color-coded badges
4. **Data Values**: Large numbers, clear labels
5. **Navigation**: Always visible, consistent placement

---

## Navigation Flow

### User Journey

```
1. Landing Page (Global Overview)
   │
   ├───→ Click Parish Card
   │     │
   │     └───→ Parish Dashboard
   │           │
   │           └───→ Click "View Scorecard"
   │                 │
   │                 └───→ Scorecard View
   │
   └───→ Click "Scorecard" in Nav
         │
         └───→ Scorecard View
               │
               └───→ Score criteria
                     │
                     └───→ See updated status
```

### Route Structure

```
/ (Global Overview)
  ├─── /parish/:parishId (Parish Dashboard)
  │     Examples:
  │     - /parish/kingston
  │     - /parish/st-andrew
  │     - /parish/st-catherine
  │
  └─── /scorecard (Scorecard View)
```

**URL Parameters**:
- `:parishId` is extracted using `useParams()` hook
- Used to look up parish data from `jamaicaParishes` array
- Enables deep linking (can bookmark specific parish)

---

## Key Features Explained

### 1. Equipment & Personnel Tracking

**Why Track This?**
During disasters, knowing available resources is critical:
- **Equipment**: Can we respond? Do we have generators, vehicles, medical supplies?
- **Personnel**: Who can we deploy? How many responders, medical staff, engineers?

**Data Structure**:
- Equipment: 7 categories (vehicles, generators, water trucks, etc.)
- Personnel: 7 categories (responders, medical, engineers, etc.)
- Each parish has different quantities based on size/population

**Future Enhancement**: 
- Real-time updates from field
- Equipment status (operational/maintenance/out of service)
- Personnel availability (on-duty/off-duty/deployed)

### 2. Interactive Scorecard

**User Interaction**:
1. User views a domain (e.g., "Governance & Leadership")
2. Sees list of criteria with descriptions
3. Clicks button (0, 1, or 2) to score each criterion
4. System immediately recalculates:
   - Domain score percentage
   - Domain status (Resilient/Restoring/Need Support)
   - Overall score percentage
   - Overall status

**Visual Feedback**:
- Active button highlighted with status color
- Progress bars show completion
- Status badges update in real-time
- Score percentages recalculate instantly

**Why Interactive?**
- Allows users to experiment with different scenarios
- Immediate feedback helps understand impact of improvements
- Encourages engagement and understanding

### 3. Status-Based Color Coding

**Consistent Visual Language**:
- **Green** = Good (Resilient)
- **Yellow** = Moderate (Restoring)
- **Red** = Needs Attention (Need Support)

**Applied To**:
- Overall score card border
- Status badges
- Progress bars
- Score button highlights
- Domain status indicators

**Accessibility**: Colors are paired with text labels, not color-only indicators

### 4. Aggregate Statistics

**Global Overview Calculations**:
```javascript
// Total Population
sum = parish1.population + parish2.population + ... + parish14.population

// Total Personnel
sum = sum of all personnel categories across all parishes

// Total Equipment
sum = sum of all equipment categories across all parishes
```

**Purpose**: 
- Quick understanding of Jamaica's overall capacity
- Identify resource distribution patterns
- Support strategic planning at national level

---

## Data Relationships

### How Data Connects

```
Parish Data (jamaicaParishes.js)
    │
    ├───→ Equipment Inventory
    │     └───→ Used in Parish Dashboard
    │
    ├───→ Personnel Resources
    │     └───→ Used in Parish Dashboard
    │
    └───→ Scorecard Object
          └───→ Links to Scorecard Domains
                └───→ Used in Scorecard View
```

**Current State**: 
- Equipment/Personnel data is **static** (hardcoded)
- Scorecard data is **dynamic** (managed in component state)
- **Future**: Both will be stored in database/API

### Scorecard Integration

**Current Design**:
- Scorecard is **global** (not parish-specific yet)
- All parishes would use the same assessment criteria
- Scores are calculated in real-time as user interacts

**Future Enhancement**:
- Each parish has its own scorecard instance
- Scores stored per parish
- Historical tracking (scores over time)
- Comparison views (parish vs parish)

---

## Component Communication

### State Management Pattern

**Current Approach**: Local component state with `useState`

```javascript
// ScorecardView.jsx
const [domains, setDomains] = useState(scorecardDomains)

// When user scores a criterion:
handleScoreChange(domainId, criterionId, newScore)
  → Updates domains state
  → Triggers re-render
  → Recalculates scores
  → Updates UI
```

**Why This Pattern?**
- Simple for MVP
- No external dependencies
- Easy to understand
- Sufficient for current needs

**Future Enhancement**:
- Context API for global state
- Redux/Zustand for complex state
- Backend API for persistence
- Real-time updates via WebSockets

---

## Styling Architecture

### CSS Organization

```
Global Styles (index.css)
  ├─── CSS Variables (color system)
  ├─── Reset styles
  └─── Base typography

Component Styles (ComponentName.css)
  ├─── Layout-specific styles
  ├─── Component-specific styles
  └─── Responsive breakpoints
```

### Design System Principles

1. **Consistency**: Same spacing, colors, typography throughout
2. **Modularity**: Each component has its own CSS file
3. **Reusability**: CSS variables for easy theming
4. **Responsiveness**: Mobile-first approach
5. **Accessibility**: High contrast, readable fonts, semantic HTML

---

## Current Limitations & Future Enhancements

### What's Missing (Planned Features)

1. **Data Persistence**:
   - Currently: Data resets on page refresh
   - Future: localStorage or backend API

2. **Parish-Specific Scorecards**:
   - Currently: One global scorecard
   - Future: Each parish has own scorecard instance

3. **Visualizations**:
   - Radar chart for domain scores
   - Trend charts over time
   - Comparison charts (parish vs parish)

4. **Equity Lenses**:
   - Track scores by population groups
   - Women, LGBTQ+, children, low-income, etc.
   - Equity-adjusted scores

5. **AI Recommendations**:
   - Automated scoring from documents
   - Action plan generation
   - Resource allocation suggestions

6. **Export/Import**:
   - PDF reports
   - Excel exports
   - Data import from spreadsheets

---

## Summary

This dashboard is designed as a **foundation** for a comprehensive disaster recovery management system. It:

1. **Tracks Resources**: Know what equipment and personnel each parish has
2. **Assesses Readiness**: Uses LTDRR Scorecard to measure recovery capability
3. **Visualizes Status**: Clear, color-coded indicators of recovery health
4. **Enables Planning**: Data-driven insights for improving resilience

The architecture is **modular** and **extensible**, allowing for incremental feature additions as requirements evolve. The current implementation provides the core functionality needed to start tracking and assessing disaster recovery readiness across Jamaica's 14 parishes.



