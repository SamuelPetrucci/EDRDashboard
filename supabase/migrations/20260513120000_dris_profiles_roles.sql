-- DRIS roles: single source of truth in public.profiles (safe for RLS).
-- Do not rely on raw_user_meta_data for authorization — it is user-editable.
-- Change roles via Supabase Table Editor (service role) or SQL as an admin.

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'field_user',
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT profiles_role_check CHECK (
    role IN (
      'country_executive',
      'country_admin',
      'parish_manager',
      'data_officer',
      'field_user',
      'auditor'
    )
  )
);

CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by owner" ON public.profiles;
CREATE POLICY "Profiles are viewable by owner" ON public.profiles FOR SELECT USING (auth.uid () = id);

COMMENT ON TABLE public.profiles IS 'DRIS user profile; role drives UI routing and future RLS. Role changes: Table Editor / SQL as admin (service role).';

-- New sign-ups get a profile row automatically.
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user ();

-- Backfill existing Auth users (run once after migration).
INSERT INTO public.profiles (id, display_name, role)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  'field_user'
FROM
  auth.users u
WHERE
  NOT EXISTS (
    SELECT
      1
    FROM
      public.profiles p
    WHERE
      p.id = u.id
  )
ON CONFLICT (id) DO NOTHING;
