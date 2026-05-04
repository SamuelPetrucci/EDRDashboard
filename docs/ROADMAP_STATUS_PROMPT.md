# Prompt: add current status to the functional roadmap

Use this with ChatGPT, Cursor, or another LLM. **Paste the “LLM instructions” block first**, then your **filled status template** (or free-form notes). Ask the model to **update** [`PROJECT_COMPLETION_ROADMAP.md`](./PROJECT_COMPLETION_ROADMAP.md) in place or return a **patch-style** new section you can merge.

---

## 1) Status tags (use these in the template)

| Tag | Meaning |
|-----|--------|
| `done` | Shipped / in use, meets exit intent for that bullet |
| `in_progress` | Actively being built |
| `partial` | Started but missing key pieces |
| `blocked` | Waiting on vendor, legal, access, or dependency |
| `not_started` | No meaningful work yet |
| `n/a` | Out of scope for your program |

---

## 2) Fill-in template (copy and complete)

**As of (date):** YYYY-MM-DD  
**Target tier:** MVP | Pilot | Production (pick one for this update)

### Phase 1 — Foundation
- Repo / branching / tags: `___` — notes: ___  
- `.env.example` + env matrix: `___` — notes: ___  
- CI (build on PR): `___` — notes: ___  
- Production + preview deploy: `___` — notes: ___  
- Serverless / proxy pattern for secrets: `___` — notes: ___  

### Phase 2 — Core (API, auth, RBAC)
- Backend + DB for scorecard / inventory / history: `___` — notes: ___  
- Auth (which IdP or method): `___` — notes: ___  
- RBAC enforced on API: `___` — notes: ___  
- Jurisdiction model (JM / US / tenant): `___` — notes: ___  

### Phase 3 — Operational feeds
- Official alerts / weather / comms (which sources live): `___` — notes: ___  
- Source + freshness labeling in UI: `___` — notes: ___  
- Emergency banner via API/admin: `___` — notes: ___  

### Phase 4 — News & policy
- News API deployed + `VITE_NEWS_API_URL` set: `___` — notes: ___  
- Scoring / dedupe / region keywords: `___` — notes: ___  
- Edge caching / rate-limit handling: `___` — notes: ___  

### Phase 5 — Intel (numbered items from roadmap)
1. Map-bounds flights/ships: `___` — notes: ___  
2. Search + flyTo: `___` — notes: ___  
3. Click-to-area + “Feeds for this area” panel: `___` — notes: ___  
4. Weather radar overlay: `___` — notes: ___  
5. Real AIS: `___` — notes: ___  
6. GDACS / USGS overlays: `___` — notes: ___  
7. Cameras near point (UX): `___` — notes: ___  

### Phase 6 — Satellite / basemap
- Mapbox (or other) decision recorded: `___` — notes: ___  
- Radar vs EO scope decided: `___` — notes: ___  
- Costs / attribution approved: `___` — notes: ___  

### Phase 7 — Hardening & launch
- Security / dependency posture: `___` — notes: ___  
- Observability (errors, API logs): `___` — notes: ___  
- A11y pass on primary flows: `___` — notes: ___  
- Runbooks / training: `___` — notes: ___  

### Cross-cutting
- Biggest win since last update: ___  
- Top 3 blockers: 1) ___ 2) ___ 3) ___  
- Next 30-day focus: ___  

---

## 3) LLM instructions (paste this + your filled template)

```markdown
You are updating the DRIS / EDR Dashboard functional roadmap document.

**Source structure:** The roadmap has Phases 1–7 (Foundation → Core → Operational feeds → News → Intel platform → Satellite strategy → Hardening). It also defines MVP / Pilot / Production tiers and links to INTEL_PLATFORM_ROADMAP.md.

**Task:**
1. Read the status information I provide below (tags: done, in_progress, partial, blocked, not_started, n/a).
2. Produce **updated markdown** that I can paste into `docs/PROJECT_COMPLETION_ROADMAP.md`:
   - Add a new section **“## Current status”** immediately **after** the opening intro paragraph (or after “What completion means”), dated **As of YYYY-MM-DD** from my input.
   - Include:
     - **Executive snapshot:** 5–8 bullets: overall readiness vs stated target tier, what’s strongest, what’s blocking launch.
     - **Status table:** rows = Phase 1–7; columns = **Phase** | **Summary status** (one of: Not started | Partial | In progress | Done | Blocked) | **Notes** (short).
     - **Phase detail:** under each phase, a bullet list of roadmap items with **status emoji or tag** + one line note where useful (only for items I gave data for; mark unknown as “TBD”).
   - Refresh the existing **“## Current snapshot (baseline)”** section so it doesn’t contradict the new status (merge facts; keep it concise).
3. Do **not** remove Phase goals or exit criteria; only add/amend status material.
4. Keep tone factual; no invented completion — if I didn’t specify something, say **TBD** or leave out.
5. At the bottom of “Current status”, add **“Next update due”** as 30 days from the status date unless I specify otherwise.

**My status input:**

[PASTE YOUR FILLED TEMPLATE OR FREE-FORM NOTES HERE]
```

---

## 4) Optional: minimal one-shot prompt (quick update)

If you only have time for a short note:

```markdown
Update `docs/PROJECT_COMPLETION_ROADMAP.md` by inserting a "## Current status" section dated today. Here’s our situation in plain language:

[Paste 5–15 sentences: what shipped, what’s in progress, blockers, next focus]

Rules: add a phase summary table (Phases 1–7), don’t delete roadmap goals, mark gaps as TBD.
```

---

## Related file

- [`PROJECT_COMPLETION_ROADMAP.md`](./PROJECT_COMPLETION_ROADMAP.md) — merge the model output here (or ask the model for a unified full document).
