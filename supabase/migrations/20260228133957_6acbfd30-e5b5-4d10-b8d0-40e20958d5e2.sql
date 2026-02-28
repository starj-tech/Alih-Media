
-- Fix: All berkas policies are still RESTRICTIVE. Recreate as PERMISSIVE and add user DELETE.
DROP POLICY IF EXISTS "Users can create own berkas" ON public.berkas;
DROP POLICY IF EXISTS "Users can view own berkas" ON public.berkas;
DROP POLICY IF EXISTS "Users can update own berkas" ON public.berkas;
DROP POLICY IF EXISTS "All admins can view berkas" ON public.berkas;
DROP POLICY IF EXISTS "All admins can update berkas" ON public.berkas;
DROP POLICY IF EXISTS "All admins can delete berkas" ON public.berkas;
DROP POLICY IF EXISTS "Users can delete own berkas" ON public.berkas;

CREATE POLICY "Users can create own berkas" ON public.berkas AS PERMISSIVE
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own berkas" ON public.berkas AS PERMISSIVE
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own berkas" ON public.berkas AS PERMISSIVE
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own berkas" ON public.berkas AS PERMISSIVE
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "All admins can view berkas" ON public.berkas AS PERMISSIVE
  FOR SELECT TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "All admins can update berkas" ON public.berkas AS PERMISSIVE
  FOR UPDATE TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "All admins can delete berkas" ON public.berkas AS PERMISSIVE
  FOR DELETE TO authenticated USING (is_admin(auth.uid()));
