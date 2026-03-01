
CREATE TABLE public.validation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  berkas_id uuid NOT NULL,
  admin_id uuid NOT NULL,
  action text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.validation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view validation logs"
ON public.validation_logs
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert validation logs"
ON public.validation_logs
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Migrate existing data
INSERT INTO public.validation_logs (berkas_id, admin_id, action, created_at)
SELECT id, validated_by, status, COALESCE(validated_at, now())
FROM public.berkas
WHERE validated_by IS NOT NULL;
