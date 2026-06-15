-- Fix RLS policies for profiles table
-- Allow authenticated users to read their own profile
-- Allow admins to read all profiles

DO $$
BEGIN
  -- Drop existing policies if any to avoid conflicts
  DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

  -- Enable RLS (idempotent)
  ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
END $$;

-- Policy 1: Users can read their own profile
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Admins can read all profiles (needed for user management)
CREATE POLICY "Admins can read all profiles" ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Policy 3: Users can update their own profile (non-role fields)
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);