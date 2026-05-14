# DRIS / LTDRR dashboard — overview

Long-term disaster recovery resilience tooling for Jamaica’s 14 parishes (and optional USA test mode in the app).

## What it does

- **Global overview** — parish summaries, feeds, and optional 3D globe (Mapbox).
- **Parish dashboard** — equipment/personnel views and parish context.
- **LTDRR scorecard** — nine recovery domains with weighted criteria (browser persistence today; backend is the next step).
- **Intel** — map layers (flights, ships, hazards, webcams, news) driven by optional API keys.

## Parishes (Jamaica)

Kingston, St. Andrew, St. Catherine, Clarendon, Manchester, St. Ann, St. Mary, Portland, St. Thomas, St. Elizabeth, Westmoreland, Hanover, Trelawny, St. James.

## Scorecard domains (74 points total)

1. Governance & Leadership (10)  
2. Community Planning & Capacity Building (8)  
3. Infrastructure Systems (8)  
4. Economic Recovery (8)  
5. Financial & Resource Management (8)  
6. Housing Recovery (8)  
7. Health & Social Services (8)  
8. Natural & Cultural Resources (8)  
9. Public Information & Community Engagement (8)  

### Scoring scale

- **0** — Not started (need support)  
- **1** — In progress (restoring)  
- **2** — Fully implemented (resilient)  

### Recovery status bands

- **Resilient** — 80–100%  
- **Restoring** — 60–79%  
- **Need support** — 0–59%  

## Run locally

```bash
npm install
```

Copy `.env.example` to `.env` and set **Supabase** + **Mapbox** (see comments in `.env.example`). Optional Intel keys: [`MANUAL_SETUP.md`](../MANUAL_SETUP.md).

```bash
npm run dev
```

Dev server URL is printed by Vite (commonly `http://localhost:5173` unless configured otherwise).

```bash
npm run build
```

Output: `dist/`.

## Stack

React 18, React Router, Vite, Mapbox/Leaflet where used, Supabase client for auth when configured.

## Deploy

- **GitHub** — create repo, `git remote add origin …`, `git push -u origin main`.
- **Vercel** — import repo, `npm run build`, output `dist`; rewrites live in `vercel.json`.

## License

SkillVantage Enterprise │ Confidential and proprietary. Unauthorized use or disclosure prohibited.
