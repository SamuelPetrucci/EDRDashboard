-- Ensures kpi_sub INSERT policy matches three-role MVP after KPI tables exist.
-- Idempotent: safe if 20260516100000_three_role_rbac.sql already applied the same policy.

DO $rbac$
BEGIN
  IF EXISTS (
    SELECT
      1
    FROM
      pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE
      n.nspname = 'public'
      AND c.relname = 'kpi_submissions'
      AND c.relkind = 'r'
  ) THEN
    DROP POLICY IF EXISTS "kpi_sub_insert" ON public.kpi_submissions;

    EXECUTE $policy$
CREATE POLICY "kpi_sub_insert" ON public.kpi_submissions FOR INSERT TO authenticated
WITH CHECK (
  submitted_by = auth.uid ()
  AND (
    SELECT
      p.role
    FROM
      public.profiles p
    WHERE
      p.id = auth.uid ()
  ) = 'data_officer'
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
)
    $policy$;
  END IF;
END $rbac$;
