
-- Add columns for Super User manual input
ALTER TABLE public.berkas 
ADD COLUMN nama_pemilik_sertifikat text,
ADD COLUMN no_wa_pemohon text;
