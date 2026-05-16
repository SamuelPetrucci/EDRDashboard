# DRIS official Postgres schema (overview)

Apply migrations in `supabase/migrations/` in lexical order (timestamp prefixes). After a **full reset**, run `supabase db push` or paste SQL in order.

## Reset tooling

| Approach | Use when |
|----------|----------|
| `CONFIRM_DRIS_DATABASE_RESET=yes node scripts/reset-database.mjs` | Hosted/dev project: deletes Auth users + **drops `public`** (needs `DATABASE_URL` + service role). Then re-apply migrations. |
| `supabase db reset` | Local Supabase CLI stack only — wipes linked Docker DB and reapplies migrations. |

Never run the JS reset against production without backups.

## Core domains

### Identity & access

| Object | Purpose |
|--------|---------|
| `auth.users` | Supabase Auth (managed). |
| `public.profiles` | DRIS role, display name; `id` = `auth.users.id`. |
| `public.user_country_access` | Country-wide visibility for a user. |
| `public.user_jurisdiction_access` | Parish / state row visibility. |
| `public.user_invitations` / `user_invitation_scopes` | Invite pipeline + scopes until acceptance. |

Roles (`profiles.role`): `country_admin`, `parish_manager`, `data_officer`.

Helper SQL: `public.is_platform_admin()` → true for `country_admin` (legacy name; gates KPI catalog writes, invitations, audit reads).

### Geography (reference)

| Object | Purpose |
|--------|---------|
| `public.countries` | Jamaica, United States (seeded). |
| `public.jurisdictions` | Parishes + US states (seeded, deterministic UUIDs). |

### KPI / scorecard workflow

| Object | Purpose |
|--------|---------|
| `public.kpi_domains` / `kpi_definitions` | KPI catalog. |
| `public.kpi_submissions` | Per-jurisdiction KPI values + `workflow_status`. |
| `public.kpi_submission_evidence` | File metadata for evidence rows. |
| `public.operator_tasks` | Optional task queue. |

Insert KPI drafts: **`data_officer`** (RLS). Approvals should move to **`SECURITY DEFINER` RPCs** when you wire Parish Manager actions.

### Operational inventory (database-backed metrics)

Replaces browser-only inventory storage for parish dashboards.

| Object | Purpose |
|--------|---------|
| `public.parish_inventory_metrics` | One row per `(jurisdiction_id, category, metric_key)` — counts, workflow (`draft` → `submitted` → `approved` / `rejected`), `entered_by`, `reviewed_by`. |
| `public.dris_audit_log` | Append-only audit (`INSERT`/`UPDATE`/`DELETE`) for inventory rows; **SELECT** restricted to **`country_admin`** in MVP. |

**Categories:** `equipment`, `personnel`, `supplies`, `other`.

Parish Managers cannot update these rows directly under current RLS; add a **`SECURITY DEFINER` RPC** (e.g. approve/reject) when wiring manager approvals.

### Scoped content & snapshots (existing migrations)

News, intel, scorecard snapshots, AI summaries — see `20260514120000_global_model_rls.sql` and related policies.

## Wiring the app

1. Reads/writes must use **`session.user.id`** as `profiles.id` for `entered_by`, `submitted_by`, etc.
2. Prefer **`supabase.from('parish_inventory_metrics').upsert(...)`** with jurisdiction IDs from **`jurisdictions`** (same codes as parish routes).
3. Phase out **`equipmentStorage.js` / localStorage** once UI reads from Supabase.

## Migration dependency graph (conceptual)

```
profiles roles trigger
    → global geography + memberships + invitations + content RLS
    → KPI catalog + submissions + evidence + tasks
    → three-role RBAC + KPI insert alignment
    → operational inventory + audit (this doc’s newest operational slice)
```

Product cleanup priorities and data-capture workshop checklist: **[`docs/PROJECT_CLEANUP_AND_DATA_PLAN.md`](../docs/PROJECT_CLEANUP_AND_DATA_PLAN.md)**.
