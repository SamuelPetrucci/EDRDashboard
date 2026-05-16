-- Official operational tables for parish metrics captured in Postgres (replacing browser localStorage).
-- Aligns with DRIS workflow: Data Officers enter scoped rows; Managers approve (updates reviewed_*).
-- Audit trail appended via trigger.

-- ---------------------------------------------------------------------------
-- Parish inventory / resource metrics (one row per jurisdiction + category + metric)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.parish_inventory_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  jurisdiction_id UUID NOT NULL REFERENCES public.jurisdictions (id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  metric_key TEXT NOT NULL,
  value_numeric NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  workflow_status TEXT NOT NULL DEFAULT 'draft',
  entered_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  reviewed_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now (),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now (),
  CONSTRAINT parish_inventory_metrics_category_check CHECK (
    category IN ('equipment', 'personnel', 'supplies', 'other')
  ),
  CONSTRAINT parish_inventory_metrics_workflow_check CHECK (
    workflow_status IN ('draft', 'submitted', 'approved', 'rejected')
  ),
  CONSTRAINT parish_inventory_metrics_jurisdiction_metric_uniq UNIQUE (jurisdiction_id, category, metric_key)
);

CREATE INDEX IF NOT EXISTS parish_inventory_metrics_jurisdiction_idx ON public.parish_inventory_metrics (jurisdiction_id);

CREATE INDEX IF NOT EXISTS parish_inventory_metrics_status_idx ON public.parish_inventory_metrics (workflow_status);

CREATE INDEX IF NOT EXISTS parish_inventory_metrics_entered_by_idx ON public.parish_inventory_metrics (entered_by);

COMMENT ON TABLE public.parish_inventory_metrics IS 'Operational counts per parish/jurisdiction; sourced from Data Officers, approved by Parish Managers.';

-- ---------------------------------------------------------------------------
-- Append-only audit log (generic rows for inventory + future tables)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.dris_audit_log (
  id BIGSERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL,
  actor_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now (),
  CONSTRAINT dris_audit_log_action_check CHECK (action IN ('INSERT', 'UPDATE', 'DELETE'))
);

CREATE INDEX IF NOT EXISTS dris_audit_log_table_record_idx ON public.dris_audit_log (table_name, record_id);

CREATE INDEX IF NOT EXISTS dris_audit_log_created_idx ON public.dris_audit_log (created_at DESC);

COMMENT ON TABLE public.dris_audit_log IS 'Mandatory audit entries for operational writes; INSERT via trigger only in MVP.';

-- ---------------------------------------------------------------------------
-- updated_at + audit triggers
-- ---------------------------------------------------------------------------

DROP TRIGGER IF EXISTS parish_inventory_metrics_set_updated_at ON public.parish_inventory_metrics;

CREATE TRIGGER parish_inventory_metrics_set_updated_at BEFORE
UPDATE ON public.parish_inventory_metrics FOR EACH ROW
EXECUTE FUNCTION public.set_kpi_row_updated_at ();

CREATE OR REPLACE FUNCTION public.audit_parish_inventory_metrics ()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  aid UUID := auth.uid ();
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.dris_audit_log (table_name, record_id, action, actor_id, old_data)
    VALUES (
      'parish_inventory_metrics',
      OLD.id,
      'DELETE',
      aid,
      to_jsonb (OLD)
    );

    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.dris_audit_log (table_name, record_id, action, actor_id, old_data, new_data)
    VALUES (
      'parish_inventory_metrics',
      NEW.id,
      'UPDATE',
      aid,
      to_jsonb (OLD),
      to_jsonb (NEW)
    );

    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.dris_audit_log (table_name, record_id, action, actor_id, new_data)
    VALUES (
      'parish_inventory_metrics',
      NEW.id,
      'INSERT',
      aid,
      to_jsonb (NEW)
    );

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS parish_inventory_metrics_audit ON public.parish_inventory_metrics;

CREATE TRIGGER parish_inventory_metrics_audit
AFTER INSERT
OR
UPDATE OR DELETE ON public.parish_inventory_metrics FOR EACH ROW
EXECUTE FUNCTION public.audit_parish_inventory_metrics ();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.parish_inventory_metrics ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.dris_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "parish_inventory_select" ON public.parish_inventory_metrics;

CREATE POLICY "parish_inventory_select" ON public.parish_inventory_metrics FOR
SELECT
  TO authenticated USING (
    public.is_platform_admin ()
    OR entered_by = auth.uid ()
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

DROP POLICY IF EXISTS "parish_inventory_insert" ON public.parish_inventory_metrics;

CREATE POLICY "parish_inventory_insert" ON public.parish_inventory_metrics FOR INSERT TO authenticated
WITH
  CHECK (
    entered_by = auth.uid ()
    AND (
      SELECT
        p.role
      FROM
        public.profiles p
      WHERE
        p.id = auth.uid ()
    ) IN ('data_officer', 'country_admin')
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

DROP POLICY IF EXISTS "parish_inventory_update" ON public.parish_inventory_metrics;

CREATE POLICY "parish_inventory_update" ON public.parish_inventory_metrics FOR
UPDATE TO authenticated USING (
  public.is_platform_admin ()
  OR (
    entered_by = auth.uid ()
    AND (
      SELECT
        p.role
      FROM
        public.profiles p
      WHERE
        p.id = auth.uid ()
    ) = 'data_officer'
    AND workflow_status IN ('draft', 'submitted', 'rejected')
  )
)
WITH
  CHECK (
    public.is_platform_admin ()
    OR entered_by = auth.uid ()
  );

DROP POLICY IF EXISTS "parish_inventory_delete" ON public.parish_inventory_metrics;

CREATE POLICY "parish_inventory_delete" ON public.parish_inventory_metrics FOR DELETE TO authenticated USING (public.is_platform_admin ());

DROP POLICY IF EXISTS "dris_audit_select_admin" ON public.dris_audit_log;

CREATE POLICY "dris_audit_select_admin" ON public.dris_audit_log FOR SELECT TO authenticated USING (public.is_platform_admin ());
