# Project cleanup & data capture planning

Use this as a working checklist: **clean up technical debt first**, then **decide what “truth” lives in Postgres** before building more UI.

---

## 1. Cleanup backlog (recommended order)

### High impact — single source of truth

| Item | Why | Suggested outcome |
|------|-----|-------------------|
| **Inventory / scorecard reads** | Parish dashboards and maps still use **`equipmentStorage.js`** + **`scorecardStorage.js`** (`localStorage`). Not scoped per login; no approvals. | Read/write **`parish_inventory_metrics`** and **`kpi_submissions`** when Supabase is configured; keep localStorage **only** as offline/demo fallback behind a flag. |
| **Identity in editors** | **`EditableInventory`** and **`EmergencyBanner`** use **`getCurrentUser()`** from **`userRoles.js`** instead of **`AuthContext`** / **`session.user.id`**. | When authenticated, always use **`auth.uid()`** for `entered_by`, banner `updatedBy`, and permission checks aligned with **`profiles.role`**. |
| **Legacy role helpers** | **`userRoles.js`** duplicates concepts already on **`profiles`** (three-role MVP). | Narrow **`userRoles`** to demo/offline helpers only, or delete unused exports after migrating callers. |

### Medium impact — clarity & maintenance

| Item | Why | Suggested outcome |
|------|-----|-------------------|
| **Data Officer workspace** | Still mostly placeholder text; KPI tables exist in DB. | Spec minimal MVP screens: jurisdiction picker → KPI grid → draft/submit → evidence upload stub. |
| **Parish Manager approvals** | RLS intentionally blocks managers from arbitrary edits on **`parish_inventory_metrics`**. | Add **`SECURITY DEFINER` RPCs** (`approve_*`, `reject_*`) with jurisdiction checks + audit. |
| **Untracked / duplicate assets** | Roadmap PDFs, duplicate filenames clutter repo perception. | Keep one canonical roadmap path under **`Roadmap/`**; `.gitignore` or archive duplicates if they are not source-controlled intentionally. |

### Lower impact — hygiene

| Item | Why |
|------|-----|
| Root **`README.md`** | Missing — add “what this app is”, env vars pointer to **`MANUAL_SETUP.md`** / **`.env.example`**, `npm run db:reset` warning. |
| **`npm audit`** | Address moderate/high CVEs when convenient (deps churn). |

---

## 2. Planning workshop — what data do we capture?

Answer these **before** adding tables or forms. Capture decisions in bullets your team agrees on.

### A. Domains (what classes of data exist?)

Examples DRIS already hints at:

- **Readiness / KPI** — structured scores + evidence ( **`kpi_*`** ).
- **Operational counts** — inventory-style metrics per parish (**`parish_inventory_metrics`**).
- **Master entities** — facilities, contacts, workforce rows (may stay separate from KPI line items).
- **Intel / feeds** — external or curated (**`news_stories`**, **`intel_items`** — often admin-managed).
- **Audit / lineage** — who changed what, when (**`dris_audit_log`**, submission review fields).

For **each domain**, decide:

1. **Owner role** — who enters vs who approves vs who only reads?
2. **Grain** — per parish? per facility? per month?
3. **Lifecycle** — draft → submitted → approved → locked?
4. **Evidence** — required for which fields?
5. **Retention** — history forever vs snapshots?

### B. Minimum viable datasets (Phase 1 product)

Pick **three to five** concrete datasets for v1 (avoid boiling the ocean):

| Dataset | Example metrics / rows | Table(s) today | Gap |
|---------|-------------------------|----------------|-----|
| Parish inventory | generators, shelters, personnel counts | `parish_inventory_metrics` | UI + jurisdiction UUID resolution |
| KPI readiness | recovery plan, coordinator, housing… | `kpi_definitions` / `kpi_submissions` | Data Officer UI + manager RPC |
| (Optional) Contacts directory | keyed contacts per parish | `contacts` static vs DB | Decide |

### C. Non-goals (explicit)

List what you **will not** store in v1 (reduces schema creep):

- e.g. raw PII vaults, unrelated ERP exports, duplicate spreadsheets without workflow.

---

## 3. After decisions — schema alignment

1. Update **`supabase/SCHEMA.md`** with any **new entities** or renamed domains.
2. Add migrations **only** for agreed entities (prefer additive migrations).
3. Wire **one vertical slice** end-to-end (e.g. one KPI + one inventory metric on one parish) before scaling screens.

---

## 4. Related files

| Doc / path | Purpose |
|------------|---------|
| [`supabase/SCHEMA.md`](../supabase/SCHEMA.md) | Current Postgres overview |
| [`MANUAL_SETUP.md`](../MANUAL_SETUP.md) | Env, demo users, destructive **`db:reset`** |
| [`scripts/reset-database.mjs`](../scripts/reset-database.mjs) | Nuclear reset script |
