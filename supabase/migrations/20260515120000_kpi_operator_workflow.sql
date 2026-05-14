-- KPI catalog, parish/state submissions, evidence attachments, operator tasks.
-- Supports field users (submit) and data officers (validate) per UI framework; review via service RPC or future Edge Function.

-- ---------------------------------------------------------------------------
-- KPI catalog
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.kpi_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kpi_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  domain_id UUID NOT NULL REFERENCES public.kpi_domains (id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  response_min INT NOT NULL DEFAULT 0,
  response_max INT NOT NULL DEFAULT 3,
  allows_na BOOLEAN NOT NULL DEFAULT TRUE,
  requires_evidence BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT kpi_definitions_domain_code_uniq UNIQUE (domain_id, code)
);

CREATE INDEX IF NOT EXISTS kpi_definitions_domain_idx ON public.kpi_definitions (domain_id);

-- ---------------------------------------------------------------------------
-- Submissions & evidence (scorecard line items per jurisdiction)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.kpi_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  kpi_definition_id UUID NOT NULL REFERENCES public.kpi_definitions (id) ON DELETE RESTRICT,
  jurisdiction_id UUID NOT NULL REFERENCES public.jurisdictions (id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  score_value INT,
  is_na BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  workflow_status TEXT NOT NULL DEFAULT 'draft',
  evidence_complete BOOLEAN NOT NULL DEFAULT FALSE,
  reviewed_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT kpi_submissions_workflow_check CHECK (
    workflow_status IN (
      'draft',
      'submitted',
      'pending_validation',
      'approved',
      'rejected',
      'returned'
    )
  )
);

CREATE INDEX IF NOT EXISTS kpi_submissions_jurisdiction_idx ON public.kpi_submissions (jurisdiction_id);

CREATE INDEX IF NOT EXISTS kpi_submissions_status_idx ON public.kpi_submissions (workflow_status);

CREATE INDEX IF NOT EXISTS kpi_submissions_submitter_idx ON public.kpi_submissions (submitted_by);

CREATE TABLE IF NOT EXISTS public.kpi_submission_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  submission_id UUID NOT NULL REFERENCES public.kpi_submissions (id) ON DELETE CASCADE,
  storage_bucket TEXT NOT NULL DEFAULT 'kpi-evidence',
  storage_path TEXT NOT NULL,
  file_name TEXT,
  mime_type TEXT,
  uploaded_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS kpi_submission_evidence_sub_idx ON public.kpi_submission_evidence (submission_id);

-- ---------------------------------------------------------------------------
-- Operator tasks (My tasks — field persona)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.operator_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  assigned_to UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  jurisdiction_id UUID REFERENCES public.jurisdictions (id) ON DELETE SET NULL,
  due_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'open',
  task_type TEXT NOT NULL DEFAULT 'kpi_update',
  related_submission_id UUID REFERENCES public.kpi_submissions (id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT operator_tasks_status_check CHECK (status IN ('open', 'in_progress', 'done', 'cancelled')),
  CONSTRAINT operator_tasks_type_check CHECK (task_type IN ('kpi_update', 'evidence_upload', 'resource_data', 'other'))
);

CREATE INDEX IF NOT EXISTS operator_tasks_assignee_idx ON public.operator_tasks (assigned_to, status);

-- ---------------------------------------------------------------------------
-- Seed domains + sample KPIs (aligns with executive radar domains)
-- ---------------------------------------------------------------------------

INSERT INTO
  public.kpi_domains (code, name, sort_order)
VALUES
  ('governance', 'Governance', 10),
  ('infrastructure', 'Infrastructure', 20),
  ('housing', 'Housing', 30),
  ('health', 'Health', 40),
  ('economy', 'Economy', 50),
  ('finance', 'Finance', 60),
  ('community', 'Community', 70)
ON CONFLICT (code) DO NOTHING;

INSERT INTO
  public.kpi_definitions (domain_id, code, title, description, sort_order, requires_evidence)
SELECT
  d.id,
  v.code,
  v.title,
  v.description,
  v.sort_order,
  v.requires_evidence
FROM
  public.kpi_domains d
  INNER JOIN (
    VALUES
      ('governance', 'recovery_plan', 'Recovery plan approved', 'National or parish recovery plan formally approved.', 1, TRUE),
      ('governance', 'recovery_coordinator', 'Recovery coordinator appointed', 'Designated coordinator in post.', 2, FALSE),
      ('housing', 'temp_housing', 'Temporary housing availability', 'Interim housing stock meets targets.', 1, TRUE),
      ('infrastructure', 'infra_restored', 'Public infrastructure restored', 'Critical infrastructure service levels.', 1, TRUE),
      ('health', 'health_facilities', 'Health facilities operational', 'Hospitals and clinics meeting readiness.', 1, TRUE),
      ('finance', 'financial_tracking', 'Financial tracking system', 'Transparency of recovery spend.', 1, TRUE),
      ('economy', 'business_continuity', 'Business continuity support', 'MSME and employer continuity programs.', 1, FALSE),
      ('community', 'community_engagement', 'Community engagement', 'Participation and feedback loops.', 1, FALSE)
  ) AS v (domain_code, code, title, description, sort_order, requires_evidence) ON d.code = v.domain_code
ON CONFLICT (domain_id, code) DO NOTHING;

CREATE OR REPLACE FUNCTION public.set_kpi_row_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS kpi_definitions_set_updated_at ON public.kpi_definitions;

CREATE TRIGGER kpi_definitions_set_updated_at BEFORE
UPDATE ON public.kpi_definitions FOR EACH ROW
EXECUTE FUNCTION public.set_kpi_row_updated_at ();

DROP TRIGGER IF EXISTS kpi_submissions_set_updated_at ON public.kpi_submissions;

CREATE TRIGGER kpi_submissions_set_updated_at BEFORE
UPDATE ON public.kpi_submissions FOR EACH ROW
EXECUTE FUNCTION public.set_kpi_row_updated_at ();

DROP TRIGGER IF EXISTS operator_tasks_set_updated_at ON public.operator_tasks;

CREATE TRIGGER operator_tasks_set_updated_at BEFORE
UPDATE ON public.operator_tasks FOR EACH ROW
EXECUTE FUNCTION public.set_kpi_row_updated_at ();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.kpi_domains ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.kpi_definitions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.kpi_submissions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.kpi_submission_evidence ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.operator_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kpi_domains_select" ON public.kpi_domains;
CREATE POLICY "kpi_domains_select" ON public.kpi_domains FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "kpi_domains_write" ON public.kpi_domains;
CREATE POLICY "kpi_domains_write" ON public.kpi_domains FOR ALL TO authenticated USING (public.is_platform_admin ())
WITH
  CHECK (public.is_platform_admin ());

DROP POLICY IF EXISTS "kpi_defs_select" ON public.kpi_definitions;
CREATE POLICY "kpi_defs_select" ON public.kpi_definitions FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "kpi_defs_write" ON public.kpi_definitions;
CREATE POLICY "kpi_defs_write" ON public.kpi_definitions FOR ALL TO authenticated USING (public.is_platform_admin ())
WITH
  CHECK (public.is_platform_admin ());

-- Submissions: read within geographic scope; create as self in allowed jurisdictions
DROP POLICY IF EXISTS "kpi_sub_select" ON public.kpi_submissions;
CREATE POLICY "kpi_sub_select" ON public.kpi_submissions FOR SELECT TO authenticated USING (
  public.is_platform_admin ()
  OR submitted_by = auth.uid ()
  OR public.user_has_jurisdiction_access (jurisdiction_id)
  OR public.user_has_country_access (
    (
      SELECT
        j.country_id
      FROM
        public.jurisdictions j
      WHERE
        j.id = jurisdiction_id
    )
  )
);

DROP POLICY IF EXISTS "kpi_sub_insert" ON public.kpi_submissions;
CREATE POLICY "kpi_sub_insert" ON public.kpi_submissions FOR INSERT TO authenticated
WITH
  CHECK (
    submitted_by = auth.uid ()
    AND (
      SELECT
        p.role
      FROM
        public.profiles p
      WHERE
        p.id = auth.uid ()
    ) IN ('field_user', 'parish_manager')
    AND (
      public.user_has_jurisdiction_access (jurisdiction_id)
      OR public.user_has_country_access (
        (
          SELECT
            j.country_id
          FROM
            public.jurisdictions j
          WHERE
            j.id = jurisdiction_id
        )
      )
    )
  );

DROP POLICY IF EXISTS "kpi_sub_update" ON public.kpi_submissions;
CREATE POLICY "kpi_sub_update" ON public.kpi_submissions FOR
UPDATE TO authenticated USING (
  public.is_platform_admin ()
  OR (
    submitted_by = auth.uid ()
    AND workflow_status IN ('draft', 'returned')
  )
)
WITH
  CHECK (
    public.is_platform_admin ()
    OR submitted_by = auth.uid ()
  );

-- Evidence: visible with parent submission; upload only owner of draft/returned submission
DROP POLICY IF EXISTS "kpi_evi_select" ON public.kpi_submission_evidence;
CREATE POLICY "kpi_evi_select" ON public.kpi_submission_evidence FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT
      1
    FROM
      public.kpi_submissions s
    WHERE
      s.id = submission_id
  )
);

DROP POLICY IF EXISTS "kpi_evi_insert" ON public.kpi_submission_evidence;
CREATE POLICY "kpi_evi_insert" ON public.kpi_submission_evidence FOR INSERT TO authenticated
WITH
  CHECK (
    uploaded_by = auth.uid ()
    AND EXISTS (
      SELECT
        1
      FROM
        public.kpi_submissions s
      WHERE
        s.id = submission_id
        AND s.submitted_by = auth.uid ()
        AND s.workflow_status IN ('draft', 'returned', 'submitted')
    )
  );

-- Tasks: assignee (and creator) can read/update; platform admin all
DROP POLICY IF EXISTS "op_tasks_select" ON public.operator_tasks;
CREATE POLICY "op_tasks_select" ON public.operator_tasks FOR SELECT TO authenticated USING (
  public.is_platform_admin ()
  OR assigned_to = auth.uid ()
  OR created_by = auth.uid ()
);

DROP POLICY IF EXISTS "op_tasks_write" ON public.operator_tasks;
CREATE POLICY "op_tasks_write" ON public.operator_tasks FOR ALL TO authenticated USING (public.is_platform_admin ())
WITH
  CHECK (public.is_platform_admin ());

DROP POLICY IF EXISTS "op_tasks_update_assignee" ON public.operator_tasks;
CREATE POLICY "op_tasks_update_assignee" ON public.operator_tasks FOR
UPDATE TO authenticated USING (assigned_to = auth.uid ())
WITH
  CHECK (assigned_to = auth.uid ());

COMMENT ON TABLE public.kpi_submissions IS 'Per-jurisdiction KPI responses; workflow drives validation; data officer approve/reject via SECURITY DEFINER RPC recommended.';
COMMENT ON TABLE public.operator_tasks IS 'Field operator task list; assign via platform admin or parish manager tools.';
