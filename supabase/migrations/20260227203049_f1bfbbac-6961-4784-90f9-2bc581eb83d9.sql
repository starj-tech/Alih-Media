
-- Make bucket public
UPDATE storage.buckets SET public = true WHERE id = 'berkas-files';

-- Add user update policy for berkas if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'berkas' AND policyname = 'Users can update own berkas'
  ) THEN
    CREATE POLICY "Users can update own berkas"
    ON public.berkas FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
