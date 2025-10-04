-- Supabase RLS policies for dynamic-only QR codes (single-table model)
-- Table: public.qr_codes

-- Enable Row Level Security
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;

-- Users can view their own QR codes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'qr_codes'
      AND policyname = 'Users can view own QR codes'
  ) THEN
    CREATE POLICY "Users can view own QR codes"
      ON public.qr_codes FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END$$;

-- Users can insert their own QR codes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'qr_codes'
      AND policyname = 'Users can create QR codes'
  ) THEN
    CREATE POLICY "Users can create QR codes"
      ON public.qr_codes FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

-- Users can update only their own QR codes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'qr_codes'
      AND policyname = 'Users can update own QR codes'
  ) THEN
    CREATE POLICY "Users can update own QR codes"
      ON public.qr_codes FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END$$;

-- Users can delete only their own QR codes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'qr_codes'
      AND policyname = 'Users can delete own QR codes'
  ) THEN
    CREATE POLICY "Users can delete own QR codes"
      ON public.qr_codes FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END$$;

-- Public read access for active QR codes (for redirect lookups)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'qr_codes'
      AND policyname = 'Public can view active QR codes'
  ) THEN
    CREATE POLICY "Public can view active QR codes"
      ON public.qr_codes FOR SELECT
      USING (is_active = true);
  END IF;
END$$;

-- Notes:
-- - This policy set assumes columns: user_id (uuid), short_code (varchar),
--   destination_url (text), is_active (boolean), qr_image_data (text).
-- - Queries used from the app should filter by short_code when performing
--   public redirects, e.g. WHERE short_code = $1 AND is_active = true.
-- - Owner-scoped policies use auth.uid() matching the Supabase Auth user.

