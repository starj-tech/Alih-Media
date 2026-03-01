DROP POLICY IF EXISTS "Admins can view all files" ON storage.objects;

CREATE POLICY "Admins can view all files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'berkas-files' AND is_admin(auth.uid())
);

-- Also allow admins to upload files (for foto bangunan)
CREATE POLICY "Admins can upload files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'berkas-files' AND is_admin(auth.uid())
);