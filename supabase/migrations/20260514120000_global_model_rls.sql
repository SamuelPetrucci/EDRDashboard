-- Global geography (v1: US + Jamaica), memberships, invitations, scoped content, AI summaries, RLS.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Geography
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  iso3166_alpha2 TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT countries_iso_len CHECK (char_length(iso3166_alpha2) = 2)
);

CREATE INDEX IF NOT EXISTS countries_active_idx ON public.countries (is_active);

CREATE TABLE IF NOT EXISTS public.jurisdictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  country_id UUID NOT NULL REFERENCES public.countries (id) ON DELETE CASCADE,
  parent_jurisdiction_id UUID REFERENCES public.jurisdictions (id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  kind TEXT NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT jurisdictions_kind_check CHECK (
    kind IN ('region', 'state', 'county', 'parish')
  ),
  CONSTRAINT jurisdictions_country_code_uniq UNIQUE (country_id, code)
);

CREATE INDEX IF NOT EXISTS jurisdictions_country_idx ON public.jurisdictions (country_id);
CREATE INDEX IF NOT EXISTS jurisdictions_parent_idx ON public.jurisdictions (parent_jurisdiction_id);
CREATE INDEX IF NOT EXISTS jurisdictions_kind_idx ON public.jurisdictions (country_id, kind);

-- Deterministic seed namespace for uuid_generate_v5
DO $$
DECLARE
  ns CONSTANT uuid := '6ba7b810-9dad-11d1-80b4-00c04fd430c8'::uuid;
  jm_id uuid;
  us_id uuid;
BEGIN
  INSERT INTO public.countries (id, iso3166_alpha2, name, slug)
  VALUES
    (uuid_generate_v5 (ns, 'dris:country:JM'), 'JM', 'Jamaica', 'jamaica'),
    (uuid_generate_v5 (ns, 'dris:country:US'), 'US', 'United States', 'united-states')
  ON CONFLICT (slug) DO NOTHING;

  SELECT id INTO jm_id FROM public.countries WHERE slug = 'jamaica' LIMIT 1;
  SELECT id INTO us_id FROM public.countries WHERE slug = 'united-states' LIMIT 1;

  -- Jamaica parishes (codes match app routes / regionCatalog)
  INSERT INTO public.jurisdictions (id, country_id, parent_jurisdiction_id, name, code, kind)
  VALUES
    (uuid_generate_v5 (ns, 'dris:jm:kingston'), jm_id, NULL, 'Kingston', 'kingston', 'parish'),
    (uuid_generate_v5 (ns, 'dris:jm:st-andrew'), jm_id, NULL, 'St. Andrew', 'st-andrew', 'parish'),
    (uuid_generate_v5 (ns, 'dris:jm:st-catherine'), jm_id, NULL, 'St. Catherine', 'st-catherine', 'parish'),
    (uuid_generate_v5 (ns, 'dris:jm:clarendon'), jm_id, NULL, 'Clarendon', 'clarendon', 'parish'),
    (uuid_generate_v5 (ns, 'dris:jm:manchester'), jm_id, NULL, 'Manchester', 'manchester', 'parish'),
    (uuid_generate_v5 (ns, 'dris:jm:st-ann'), jm_id, NULL, 'St. Ann', 'st-ann', 'parish'),
    (uuid_generate_v5 (ns, 'dris:jm:st-mary'), jm_id, NULL, 'St. Mary', 'st-mary', 'parish'),
    (uuid_generate_v5 (ns, 'dris:jm:portland'), jm_id, NULL, 'Portland', 'portland', 'parish'),
    (uuid_generate_v5 (ns, 'dris:jm:st-thomas'), jm_id, NULL, 'St. Thomas', 'st-thomas', 'parish'),
    (uuid_generate_v5 (ns, 'dris:jm:st-elizabeth'), jm_id, NULL, 'St. Elizabeth', 'st-elizabeth', 'parish'),
    (uuid_generate_v5 (ns, 'dris:jm:westmoreland'), jm_id, NULL, 'Westmoreland', 'westmoreland', 'parish'),
    (uuid_generate_v5 (ns, 'dris:jm:hanover'), jm_id, NULL, 'Hanover', 'hanover', 'parish'),
    (uuid_generate_v5 (ns, 'dris:jm:trelawny'), jm_id, NULL, 'Trelawny', 'trelawny', 'parish'),
    (uuid_generate_v5 (ns, 'dris:jm:st-james'), jm_id, NULL, 'St. James', 'st-james', 'parish')
  ON CONFLICT (country_id, code) DO NOTHING;

  -- US states (codes match usStates.js ids)
  INSERT INTO public.jurisdictions (id, country_id, parent_jurisdiction_id, name, code, kind)
  VALUES
    (uuid_generate_v5 (ns, 'dris:us:alabama'), us_id, NULL, 'Alabama', 'alabama', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:alaska'), us_id, NULL, 'Alaska', 'alaska', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:arizona'), us_id, NULL, 'Arizona', 'arizona', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:arkansas'), us_id, NULL, 'Arkansas', 'arkansas', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:california'), us_id, NULL, 'California', 'california', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:colorado'), us_id, NULL, 'Colorado', 'colorado', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:connecticut'), us_id, NULL, 'Connecticut', 'connecticut', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:delaware'), us_id, NULL, 'Delaware', 'delaware', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:florida'), us_id, NULL, 'Florida', 'florida', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:georgia'), us_id, NULL, 'Georgia', 'georgia', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:hawaii'), us_id, NULL, 'Hawaii', 'hawaii', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:idaho'), us_id, NULL, 'Idaho', 'idaho', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:illinois'), us_id, NULL, 'Illinois', 'illinois', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:indiana'), us_id, NULL, 'Indiana', 'indiana', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:iowa'), us_id, NULL, 'Iowa', 'iowa', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:kansas'), us_id, NULL, 'Kansas', 'kansas', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:kentucky'), us_id, NULL, 'Kentucky', 'kentucky', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:louisiana'), us_id, NULL, 'Louisiana', 'louisiana', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:maine'), us_id, NULL, 'Maine', 'maine', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:maryland'), us_id, NULL, 'Maryland', 'maryland', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:massachusetts'), us_id, NULL, 'Massachusetts', 'massachusetts', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:michigan'), us_id, NULL, 'Michigan', 'michigan', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:minnesota'), us_id, NULL, 'Minnesota', 'minnesota', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:mississippi'), us_id, NULL, 'Mississippi', 'mississippi', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:missouri'), us_id, NULL, 'Missouri', 'missouri', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:montana'), us_id, NULL, 'Montana', 'montana', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:nebraska'), us_id, NULL, 'Nebraska', 'nebraska', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:nevada'), us_id, NULL, 'Nevada', 'nevada', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:new-hampshire'), us_id, NULL, 'New Hampshire', 'new-hampshire', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:new-jersey'), us_id, NULL, 'New Jersey', 'new-jersey', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:new-mexico'), us_id, NULL, 'New Mexico', 'new-mexico', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:new-york'), us_id, NULL, 'New York', 'new-york', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:north-carolina'), us_id, NULL, 'North Carolina', 'north-carolina', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:north-dakota'), us_id, NULL, 'North Dakota', 'north-dakota', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:ohio'), us_id, NULL, 'Ohio', 'ohio', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:oklahoma'), us_id, NULL, 'Oklahoma', 'oklahoma', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:oregon'), us_id, NULL, 'Oregon', 'oregon', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:pennsylvania'), us_id, NULL, 'Pennsylvania', 'pennsylvania', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:rhode-island'), us_id, NULL, 'Rhode Island', 'rhode-island', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:south-carolina'), us_id, NULL, 'South Carolina', 'south-carolina', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:south-dakota'), us_id, NULL, 'South Dakota', 'south-dakota', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:tennessee'), us_id, NULL, 'Tennessee', 'tennessee', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:texas'), us_id, NULL, 'Texas', 'texas', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:utah'), us_id, NULL, 'Utah', 'utah', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:vermont'), us_id, NULL, 'Vermont', 'vermont', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:virginia'), us_id, NULL, 'Virginia', 'virginia', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:washington'), us_id, NULL, 'Washington', 'washington', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:west-virginia'), us_id, NULL, 'West Virginia', 'west-virginia', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:wisconsin'), us_id, NULL, 'Wisconsin', 'wisconsin', 'state'),
    (uuid_generate_v5 (ns, 'dris:us:wyoming'), us_id, NULL, 'Wyoming', 'wyoming', 'state')
  ON CONFLICT (country_id, code) DO NOTHING;
END;
$$;

-- ---------------------------------------------------------------------------
-- Profiles: new columns + platform_admin role
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS locale TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (
  role IN (
    'platform_admin',
    'country_executive',
    'country_admin',
    'parish_manager',
    'data_officer',
    'field_user',
    'auditor'
  )
);

CREATE OR REPLACE FUNCTION public.set_profiles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at BEFORE
UPDATE ON public.profiles FOR EACH ROW
EXECUTE FUNCTION public.set_profiles_updated_at ();

-- ---------------------------------------------------------------------------
-- Memberships & invitations
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_country_access (
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  country_id UUID NOT NULL REFERENCES public.countries (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, country_id)
);

CREATE TABLE IF NOT EXISTS public.user_jurisdiction_access (
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  jurisdiction_id UUID NOT NULL REFERENCES public.jurisdictions (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, jurisdiction_id)
);

CREATE TABLE IF NOT EXISTS public.user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  email TEXT NOT NULL,
  invited_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  intended_role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ,
  personal_message TEXT,
  supabase_user_id UUID,
  invite_sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_invitations_status_check CHECK (
    status IN ('pending', 'accepted', 'revoked', 'expired')
  ),
  CONSTRAINT user_invitations_role_check CHECK (
    intended_role IN (
      'platform_admin',
      'country_executive',
      'country_admin',
      'parish_manager',
      'data_officer',
      'field_user',
      'auditor'
    )
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS user_invitations_one_pending_email ON public.user_invitations (lower(email))
WHERE
  status = 'pending';

CREATE TABLE IF NOT EXISTS public.user_invitation_scopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  invitation_id UUID NOT NULL REFERENCES public.user_invitations (id) ON DELETE CASCADE,
  country_id UUID NOT NULL REFERENCES public.countries (id) ON DELETE CASCADE,
  jurisdiction_id UUID REFERENCES public.jurisdictions (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_invitation_scopes_inv_idx ON public.user_invitation_scopes (invitation_id);

-- ---------------------------------------------------------------------------
-- Scoped content
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.news_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  title TEXT NOT NULL,
  summary TEXT,
  source TEXT,
  url TEXT,
  published_at TIMESTAMPTZ,
  country_id UUID REFERENCES public.countries (id) ON DELETE SET NULL,
  jurisdiction_id UUID REFERENCES public.jurisdictions (id) ON DELETE SET NULL,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  created_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS news_stories_scope_idx ON public.news_stories (country_id, jurisdiction_id);

CREATE TABLE IF NOT EXISTS public.scorecard_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  as_of_date DATE NOT NULL,
  overall_score NUMERIC,
  classification TEXT,
  domain_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  country_id UUID NOT NULL REFERENCES public.countries (id) ON DELETE CASCADE,
  jurisdiction_id UUID REFERENCES public.jurisdictions (id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'manual',
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS scorecard_snapshots_lookup_idx ON public.scorecard_snapshots (country_id, jurisdiction_id, as_of_date DESC);

CREATE TABLE IF NOT EXISTS public.intel_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  title TEXT NOT NULL,
  body TEXT,
  severity TEXT,
  category TEXT,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  country_id UUID REFERENCES public.countries (id) ON DELETE SET NULL,
  jurisdiction_id UUID REFERENCES public.jurisdictions (id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS intel_items_scope_idx ON public.intel_items (country_id, jurisdiction_id);

-- ---------------------------------------------------------------------------
-- AI summaries
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ai_area_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  scope TEXT NOT NULL,
  country_id UUID REFERENCES public.countries (id) ON DELETE CASCADE,
  jurisdiction_id UUID REFERENCES public.jurisdictions (id) ON DELETE CASCADE,
  summary_md TEXT,
  summary_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  model TEXT,
  prompt_version TEXT,
  input_snapshot_hash TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ai_area_summaries_scope_check CHECK (scope IN ('global', 'country', 'jurisdiction')),
  CONSTRAINT ai_area_summaries_status_check CHECK (status IN ('draft', 'published')),
  CONSTRAINT ai_area_summaries_scope_fks CHECK (
    CASE scope
      WHEN 'global' THEN country_id IS NULL
      AND jurisdiction_id IS NULL
      WHEN 'country' THEN country_id IS NOT NULL
      AND jurisdiction_id IS NULL
      WHEN 'jurisdiction' THEN country_id IS NOT NULL
      AND jurisdiction_id IS NOT NULL
    END
  )
);

CREATE INDEX IF NOT EXISTS ai_area_summaries_scope_idx ON public.ai_area_summaries (scope, country_id, jurisdiction_id);

CREATE TABLE IF NOT EXISTS public.ai_summary_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  ai_summary_id UUID NOT NULL REFERENCES public.ai_area_summaries (id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  source_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ai_summary_sources_type_check CHECK (source_type IN ('news_story', 'intel_item', 'scorecard_snapshot'))
);

CREATE INDEX IF NOT EXISTS ai_summary_sources_summary_idx ON public.ai_summary_sources (ai_summary_id);

-- ---------------------------------------------------------------------------
-- Auth trigger: default profile (invite grants applied after sign-in — see apply_pending_invitation)
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
    'field_user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Called from the app after session is established so role + memberships apply once the user exists
-- (inviteUserByEmail creates auth.users immediately; we must not grant access in handle_new_user).
CREATE OR REPLACE FUNCTION public.apply_pending_invitation()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  em TEXT;
  inv public.user_invitations%ROWTYPE;
  uid uuid := auth.uid ();
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('applied', false, 'reason', 'not_authenticated');
  END IF;

  SELECT
    a.email INTO em
  FROM
    auth.users a
  WHERE
    a.id = uid;

  IF em IS NULL THEN
    RETURN jsonb_build_object('applied', false, 'reason', 'no_email');
  END IF;

  SELECT
    * INTO inv
  FROM
    public.user_invitations
  WHERE
    lower(email) = lower(em)
    AND status = 'pending'
  ORDER BY
    created_at DESC
  LIMIT 1;

  IF inv.id IS NULL THEN
    RETURN jsonb_build_object('applied', false, 'reason', 'no_pending_invitation');
  END IF;

  IF inv.expires_at IS NOT NULL AND inv.expires_at < now() THEN
    UPDATE public.user_invitations
    SET
      status = 'expired',
      updated_at = now()
    WHERE
      id = inv.id;

    RETURN jsonb_build_object('applied', false, 'reason', 'expired');
  END IF;

  UPDATE public.profiles
  SET
    role = inv.intended_role,
    updated_at = now()
  WHERE
    id = uid;

  INSERT INTO public.user_country_access (user_id, country_id)
  SELECT DISTINCT
    uid,
    s.country_id
  FROM
    public.user_invitation_scopes s
  WHERE
    s.invitation_id = inv.id
    AND s.jurisdiction_id IS NULL
  ON CONFLICT DO NOTHING;

  INSERT INTO public.user_jurisdiction_access (user_id, jurisdiction_id)
  SELECT DISTINCT
    uid,
    s.jurisdiction_id
  FROM
    public.user_invitation_scopes s
  WHERE
    s.invitation_id = inv.id
    AND s.jurisdiction_id IS NOT NULL
  ON CONFLICT DO NOTHING;

  UPDATE public.user_invitations
  SET
    status = 'accepted',
    supabase_user_id = uid,
    accepted_at = now(),
    updated_at = now()
  WHERE
    id = inv.id;

  RETURN jsonb_build_object('applied', true, 'role', inv.intended_role);
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_pending_invitation () TO authenticated;

-- ---------------------------------------------------------------------------
-- RLS helpers
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
        AND p.role = 'platform_admin'
    );
$$;

CREATE OR REPLACE FUNCTION public.user_has_country_access(p_country uuid)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_platform_admin ()
    OR EXISTS (
      SELECT
        1
      FROM
        public.user_country_access u
      WHERE
        u.user_id = auth.uid ()
        AND u.country_id = p_country
    );
$$;

CREATE OR REPLACE FUNCTION public.user_has_jurisdiction_access(p_jurisdiction uuid)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_platform_admin ()
    OR EXISTS (
      SELECT
        1
      FROM
        public.user_jurisdiction_access u
      WHERE
        u.user_id = auth.uid ()
        AND u.jurisdiction_id = p_jurisdiction
    )
    OR EXISTS (
      SELECT
        1
      FROM
        public.jurisdictions j
      JOIN public.user_country_access u ON u.country_id = j.country_id
        AND u.user_id = auth.uid ()
      WHERE
        j.id = p_jurisdiction
    );
$$;

CREATE OR REPLACE FUNCTION public.user_can_read_news_intel(p_country uuid, p_jurisdiction uuid)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    CASE
      WHEN p_country IS NULL
      AND p_jurisdiction IS NULL THEN TRUE
      WHEN p_jurisdiction IS NOT NULL THEN public.user_has_jurisdiction_access (p_jurisdiction)
      ELSE public.user_has_country_access (p_country)
    END;
$$;

GRANT EXECUTE ON FUNCTION public.is_platform_admin () TO authenticated;

GRANT EXECUTE ON FUNCTION public.user_has_country_access (uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION public.user_has_jurisdiction_access (uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION public.user_can_read_news_intel (uuid, uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- RLS: enable + policies
-- ---------------------------------------------------------------------------

ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jurisdictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_country_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_jurisdiction_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_invitation_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scorecard_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intel_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_area_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_summary_sources ENABLE ROW LEVEL SECURITY;

-- countries / jurisdictions: readable by any authenticated user (reference data); writes platform_admin only
DROP POLICY IF EXISTS "countries_select_auth" ON public.countries;
CREATE POLICY "countries_select_auth" ON public.countries FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "countries_write_platform" ON public.countries;
CREATE POLICY "countries_write_platform" ON public.countries FOR ALL TO authenticated USING (public.is_platform_admin ())
WITH
  CHECK (public.is_platform_admin ());

DROP POLICY IF EXISTS "jurisdictions_select_auth" ON public.jurisdictions;
CREATE POLICY "jurisdictions_select_auth" ON public.jurisdictions FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "jurisdictions_write_platform" ON public.jurisdictions;
CREATE POLICY "jurisdictions_write_platform" ON public.jurisdictions FOR ALL TO authenticated USING (public.is_platform_admin ())
WITH
  CHECK (public.is_platform_admin ());

-- memberships
DROP POLICY IF EXISTS "uca_select" ON public.user_country_access;
CREATE POLICY "uca_select" ON public.user_country_access FOR SELECT TO authenticated USING (
  user_id = auth.uid ()
  OR public.is_platform_admin ()
);

DROP POLICY IF EXISTS "uca_write_platform" ON public.user_country_access;
CREATE POLICY "uca_write_platform" ON public.user_country_access FOR ALL TO authenticated USING (public.is_platform_admin ())
WITH
  CHECK (public.is_platform_admin ());

DROP POLICY IF EXISTS "uja_select" ON public.user_jurisdiction_access;
CREATE POLICY "uja_select" ON public.user_jurisdiction_access FOR SELECT TO authenticated USING (
  user_id = auth.uid ()
  OR public.is_platform_admin ()
);

DROP POLICY IF EXISTS "uja_write_platform" ON public.user_jurisdiction_access;
CREATE POLICY "uja_write_platform" ON public.user_jurisdiction_access FOR ALL TO authenticated USING (public.is_platform_admin ())
WITH
  CHECK (public.is_platform_admin ());

-- invitations
DROP POLICY IF EXISTS "inv_select_platform" ON public.user_invitations;
CREATE POLICY "inv_select_platform" ON public.user_invitations FOR SELECT TO authenticated USING (public.is_platform_admin ());

DROP POLICY IF EXISTS "inv_insert_platform" ON public.user_invitations;
CREATE POLICY "inv_insert_platform" ON public.user_invitations FOR INSERT TO authenticated WITH CHECK (public.is_platform_admin ());

DROP POLICY IF EXISTS "inv_update_platform" ON public.user_invitations;
CREATE POLICY "inv_update_platform" ON public.user_invitations FOR
UPDATE TO authenticated USING (public.is_platform_admin ())
WITH
  CHECK (public.is_platform_admin ());

DROP POLICY IF EXISTS "inv_scope_select_platform" ON public.user_invitation_scopes;
CREATE POLICY "inv_scope_select_platform" ON public.user_invitation_scopes FOR SELECT TO authenticated USING (public.is_platform_admin ());

DROP POLICY IF EXISTS "inv_scope_write_platform" ON public.user_invitation_scopes;
CREATE POLICY "inv_scope_write_platform" ON public.user_invitation_scopes FOR ALL TO authenticated USING (public.is_platform_admin ())
WITH
  CHECK (public.is_platform_admin ());

-- news / intel read scoped; write platform_admin
DROP POLICY IF EXISTS "news_select" ON public.news_stories;
CREATE POLICY "news_select" ON public.news_stories FOR SELECT TO authenticated USING (
  public.user_can_read_news_intel (country_id, jurisdiction_id)
);

DROP POLICY IF EXISTS "news_write_platform" ON public.news_stories;
CREATE POLICY "news_write_platform" ON public.news_stories FOR ALL TO authenticated USING (public.is_platform_admin ())
WITH
  CHECK (public.is_platform_admin ());

DROP POLICY IF EXISTS "intel_select" ON public.intel_items;
CREATE POLICY "intel_select" ON public.intel_items FOR SELECT TO authenticated USING (
  public.user_can_read_news_intel (country_id, jurisdiction_id)
);

DROP POLICY IF EXISTS "intel_write_platform" ON public.intel_items;
CREATE POLICY "intel_write_platform" ON public.intel_items FOR ALL TO authenticated USING (public.is_platform_admin ())
WITH
  CHECK (public.is_platform_admin ());

-- scorecards + AI: read if jurisdiction null + country access, or jurisdiction access, or global AI
DROP POLICY IF EXISTS "scorecard_select" ON public.scorecard_snapshots;
CREATE POLICY "scorecard_select" ON public.scorecard_snapshots FOR SELECT TO authenticated USING (
  public.is_platform_admin ()
  OR (
    jurisdiction_id IS NULL
    AND public.user_has_country_access (country_id)
  )
  OR (
    jurisdiction_id IS NOT NULL
    AND public.user_has_jurisdiction_access (jurisdiction_id)
  )
);

DROP POLICY IF EXISTS "scorecard_write_platform" ON public.scorecard_snapshots;
CREATE POLICY "scorecard_write_platform" ON public.scorecard_snapshots FOR ALL TO authenticated USING (public.is_platform_admin ())
WITH
  CHECK (public.is_platform_admin ());

DROP POLICY IF EXISTS "ai_select" ON public.ai_area_summaries;
CREATE POLICY "ai_select" ON public.ai_area_summaries FOR SELECT TO authenticated USING (
  public.is_platform_admin ()
  OR (
    scope = 'global'
  )
  OR (
    scope = 'country'
    AND public.user_has_country_access (country_id)
  )
  OR (
    scope = 'jurisdiction'
    AND public.user_has_jurisdiction_access (jurisdiction_id)
  )
);

DROP POLICY IF EXISTS "ai_write_platform" ON public.ai_area_summaries;
CREATE POLICY "ai_write_platform" ON public.ai_area_summaries FOR ALL TO authenticated USING (public.is_platform_admin ())
WITH
  CHECK (public.is_platform_admin ());

DROP POLICY IF EXISTS "ai_src_select" ON public.ai_summary_sources;
CREATE POLICY "ai_src_select" ON public.ai_summary_sources FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT
      1
    FROM
      public.ai_area_summaries a
    WHERE
      a.id = ai_summary_id
  )
);

DROP POLICY IF EXISTS "ai_src_write_platform" ON public.ai_summary_sources;
CREATE POLICY "ai_src_write_platform" ON public.ai_summary_sources FOR ALL TO authenticated USING (public.is_platform_admin ())
WITH
  CHECK (public.is_platform_admin ());

-- profiles: broaden select + update
DROP POLICY IF EXISTS "Profiles are viewable by owner" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own_or_platform" ON public.profiles;
CREATE POLICY "profiles_select_own_or_platform" ON public.profiles FOR SELECT TO authenticated USING (
  auth.uid () = id
  OR public.is_platform_admin ()
);

DROP POLICY IF EXISTS "profiles_update_own_or_platform" ON public.profiles;
CREATE POLICY "profiles_update_own_or_platform" ON public.profiles FOR
UPDATE TO authenticated USING (
  auth.uid () = id
  OR public.is_platform_admin ()
)
WITH
  CHECK (
    public.is_platform_admin ()
    OR (
      auth.uid () = id
      AND role = (
        SELECT
          p.role
        FROM
          public.profiles p
        WHERE
          p.id = auth.uid ()
      )
    )
  );

COMMENT ON TABLE public.countries IS 'DRIS v1 seed: Jamaica + United States.';
COMMENT ON TABLE public.scorecard_snapshots IS 'Scores at state/parish/county; jurisdiction_id null = national snapshot for country_id.';

-- Platform admin: list profiles with auth email (SECURITY DEFINER; gated inside).
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_platform_admin () THEN
    RAISE EXCEPTION 'forbidden' USING errcode = '42501';
  END IF;

  RETURN (
    SELECT
      COALESCE(
        jsonb_agg(to_jsonb (s)),
        '[]'::jsonb
      )
    FROM
      (
        SELECT
          p.id,
          u.email::text AS email,
          p.display_name,
          p.role,
          p.created_at
        FROM
          public.profiles p
          INNER JOIN auth.users u ON u.id = p.id
        ORDER BY
          p.created_at DESC
      ) s
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_users () TO authenticated;
