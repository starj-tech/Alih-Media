
-- Add tracking columns for admin validation
ALTER TABLE public.berkas ADD COLUMN IF NOT EXISTS validated_by uuid;
ALTER TABLE public.berkas ADD COLUMN IF NOT EXISTS validated_at timestamptz;

-- Function to count today's submissions
CREATE OR REPLACE FUNCTION public.get_today_submission_count(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::integer 
  FROM public.berkas 
  WHERE user_id = _user_id 
  AND created_at::date = CURRENT_DATE
$$;

-- Helper: check if user is any admin role
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'super_admin', 'admin_arsip', 'admin_validasi_su', 'admin_validasi_bt')
  )
$$;

-- Update RLS policies for berkas - drop old ones
DROP POLICY IF EXISTS "Admins can delete berkas " ON public.berkas;
DROP POLICY IF EXISTS "Admins can update berkas " ON public.berkas;
DROP POLICY IF EXISTS "Admins can view all berkas " ON public.berkas;
DROP POLICY IF EXISTS "Admins can delete berkas" ON public.berkas;
DROP POLICY IF EXISTS "Admins can update berkas" ON public.berkas;
DROP POLICY IF EXISTS "Admins can view all berkas" ON public.berkas;

CREATE POLICY "All admins can view berkas" ON public.berkas
FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "All admins can update berkas" ON public.berkas
FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "All admins can delete berkas" ON public.berkas
FOR DELETE USING (public.is_admin(auth.uid()));

-- Update profiles RLS
DROP POLICY IF EXISTS "Admins can view all profiles " ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "All admins can view profiles" ON public.profiles
FOR SELECT USING (public.is_admin(auth.uid()));

-- Update user_roles RLS
DROP POLICY IF EXISTS "Admins can manage roles " ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles " ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

CREATE POLICY "Admin can view all roles" ON public.user_roles
FOR SELECT USING (
  has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admin can manage roles" ON public.user_roles
FOR ALL USING (
  has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin')
);
