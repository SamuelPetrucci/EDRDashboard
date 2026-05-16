-- Three-role MVP: country_admin (Administrator), parish_manager, data_officer only.
-- Migrates legacy roles; redefines is_platform_admin() as country_admin for existing RLS policies.

-- ---------------------------------------------------------------------------
-- Remap legacy roles before tightening CHECK constraints
-- ---------------------------------------------------------------------------

UPDATE public.profiles
SET
  role = CASE role
    WHEN 'platform_admin' THEN 'country_admin'
    WHEN 'country_executive' THEN 'country_admin'
    WHEN 'auditor' THEN 'country_admin'
    WHEN 'field_user' THEN 'data_officer'
    ELSE role
  END,
  updated_at = now()
WHERE
  role IN (
    'platform_admin',
    'country_executive',
    'auditor',
    'field_user'
  );

UPDATE public.user_invitations
SET
  intended_role = CASE intended_role
    WHEN 'platform_admin' THEN 'country_admin'
    WHEN 'country_executive' THEN 'country_admin'
    WHEN 'auditor' THEN 'country_admin'
    WHEN 'field_user' THEN 'data_officer'
    ELSE intended_role
  END,
  updated_at = now()
WHERE
  intended_role IN (
    'platform_admin',
    'country_executive',
    'auditor',
    'field_user'
  );

-- ---------------------------------------------------------------------------
-- Role constraints (profiles + invitations)
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (
  role IN ('country_admin', 'parish_manager', 'data_officer')
);

ALTER TABLE public.user_invitations DROP CONSTRAINT IF EXISTS user_invitations_role_check;

ALTER TABLE public.user_invitations ADD CONSTRAINT user_invitations_role_check CHECK (
  intended_role IN ('country_admin', 'parish_manager', 'data_officer')
);

-- ---------------------------------------------------------------------------
-- New sign-ups default to data_officer (invite/grants still drive access)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'data_officer'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Platform-wide privileges: Administrator uses slug country_admin (name retained for RLS compatibility)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    EXISTS (
      SELECT
        1
      FROM
        public.profiles p
      WHERE
        p.id = auth.uid ()
        AND p.role = 'country_admin'
    );
$$;

-- ---------------------------------------------------------------------------
-- KPI submissions: Data Officers create drafts (only when KPI migration applied).
-- Skip if public.kpi_submissions does not exist yet — apply 20260515120000 first,
-- then run migration repair / re-push; policy matches repo once table exists.
-- ---------------------------------------------------------------------------

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
