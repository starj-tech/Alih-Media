
-- Drop all restrictive policies on berkas and recreate as permissive
DROP POLICY IF EXISTS "Users can create own berkas" ON public.berkas;
DROP POLICY IF EXISTS "Users can update own berkas" ON public.berkas;
DROP POLICY IF EXISTS "Users can view own berkas" ON public.berkas;
DROP POLICY IF EXISTS "All admins can view berkas" ON public.berkas;
DROP POLICY IF EXISTS "All admins can update berkas" ON public.berkas;
DROP POLICY IF EXISTS "All admins can delete berkas" ON public.berkas;

-- Recreate as PERMISSIVE
CREATE POLICY "Users can create own berkas" ON public.berkas
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own berkas" ON public.berkas
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own berkas" ON public.berkas
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "All admins can view berkas" ON public.berkas
  FOR SELECT TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "All admins can update berkas" ON public.berkas
  FOR UPDATE TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "All admins can delete berkas" ON public.berkas
  FOR DELETE TO authenticated
  USING (is_admin(auth.uid()));
