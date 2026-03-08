# LTDRR AI Dashboard

Long-Term Disaster Recovery Resilience AI Dashboard for Jamaica's 14 Parishes

## Overview

This dashboard provides a comprehensive view of disaster recovery readiness across Jamaica's 14 parishes, tracking equipment, personnel, and LTDRR scorecard metrics.

## Features

- **Global Overview**: View all 14 parishes with summary statistics
- **Parish Dashboard**: Detailed view of each parish with equipment and personnel inventory
- **LTDRR Scorecard**: Interactive scoring system for 9 recovery domains
- **Equipment & Personnel Tracking**: Real-time inventory management

## Jamaica's 14 Parishes

1. Kingston
2. St. Andrew
3. St. Catherine
4. Clarendon
5. Manchester
6. St. Ann
7. St. Mary
8. Portland
9. St. Thomas
10. St. Elizabeth
11. Westmoreland
12. Hanover
13. Trelawny
14. St. James

## LTDRR Scorecard Domains

1. Governance & Leadership (10 points)
2. Community Planning & Capacity Building (8 points)
3. Infrastructure Systems (8 points)
4. Economic Recovery (8 points)
5. Financial & Resource Management (8 points)
6. Housing Recovery (8 points)
7. Health & Social Services (8 points)
8. Natural & Cultural Resources (8 points)
9. Public Information & Community Engagement (8 points)

**Total Possible Score: 74 points**

## Scoring System

- **0** = Not Started (Need Support)
- **1** = In Progress (Restoring)
- **2** = Fully Implemented (Resilient)

### Recovery Status

- **Resilient**: 80-100% (High recovery readiness)
- **Restoring**: 60-79% (Moderate capability)
- **Need Support**: 0-59% (Lacking in capacity)

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Build

```bash
npm run build
```

## Project Structure

```
src/
├── components/       # Reusable components
│   └── Layout.jsx   # Main layout with navigation
├── pages/           # Page components
│   ├── GlobalOverview.jsx
│   ├── ParishDashboard.jsx
│   └── ScorecardView.jsx
├── data/            # Data models
│   ├── jamaicaParishes.js
│   └── scorecardDomains.js
└── main.jsx         # Application entry point
```

## Technology Stack

- React 18
- React Router DOM
- Vite
- Lucide React (Icons)
- CSS3

## Deployment

### Push to GitHub

1. Create a new repository on [GitHub](https://github.com/new) (e.g. name: `EDR-Dashboard`). Do not add a README, .gitignore, or license.
2. From this project folder, add the remote and push:
   ```powershell
   git remote add origin https://github.com/YOUR_USERNAME/EDR-Dashboard.git
   git push -u origin main
   ```
   Or run the helper script (after creating the repo):
   ```powershell
   .\push-to-github.ps1 https://github.com/YOUR_USERNAME/EDR-Dashboard.git
   ```

### Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (e.g. with GitHub).
2. **Add New Project** → **Import** your GitHub repository.
3. Leave the default **Build Command** (`npm run build`) and **Output Directory** (`dist`).
4. Click **Deploy**. The app will be live at a `*.vercel.app` URL; client-side routes work via `vercel.json` rewrites.

## Next Steps

- [ ] Add data persistence (localStorage/API)
- [ ] Implement equity lenses dashboard
- [ ] Add radar chart visualization
- [ ] Create scenario builder
- [ ] Add export functionality
- [ ] Implement AI recommendations

## License

SkillVantage Enterprise │ Confidential and proprietary. Unauthorized use or disclosure prohibited.



# jamciaEDRdashnoard
