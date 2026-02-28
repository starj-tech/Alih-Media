
ALTER TABLE public.berkas
  ADD COLUMN IF NOT EXISTS file_sertifikat_url TEXT,
  ADD COLUMN IF NOT EXISTS file_ktp_url TEXT;
