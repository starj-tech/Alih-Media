
-- Add pengguna type enum
CREATE TYPE public.pengguna_type AS ENUM ('Perorangan', 'Staf PPAT', 'Notaris/PPAT', 'Bank', 'PT/Badan Hukum');

-- Add new columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN no_telepon text NOT NULL DEFAULT '',
  ADD COLUMN pengguna pengguna_type NOT NULL DEFAULT 'Perorangan',
  ADD COLUMN nama_instansi text;
