-- ============================================================
-- MIGRATION GUIDE - Supabase Project: zickawmielbmqwgphels
-- Aplikasi Alih Media - BPN Kabupaten Bogor
-- ============================================================
-- Jalankan seluruh SQL ini di SQL Editor dashboard Supabase Anda
-- URL: https://supabase.com/dashboard/project/zickawmielbmqwgphels/sql
-- ============================================================

-- ==========================================
-- 1. ENUM TYPES
-- ==========================================

CREATE TYPE public.app_role AS ENUM (
  'admin', 'user', 'super_admin', 'super_user', 
  'admin_arsip', 'admin_validasi_su', 'admin_validasi_bt'
);

CREATE TYPE public.berkas_status AS ENUM (
  'Proses', 'Validasi SU & Bidang', 'Validasi BT', 'Selesai', 'Ditolak'
);

CREATE TYPE public.jenis_hak AS ENUM (
  'HM', 'HGB', 'HP', 'HGU', 'HMSRS', 'HPL', 'HW'
);

CREATE TYPE public.pengguna_type AS ENUM (
  'Perorangan', 'Staf PPAT', 'Notaris/PPAT', 'Bank', 'PT/Badan Hukum'
);

-- ==========================================
-- 2. TABLES
-- ==========================================

-- Profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  name text NOT NULL,
  email text NOT NULL,
  no_telepon text NOT NULL DEFAULT ''::text,
  pengguna public.pengguna_type NOT NULL DEFAULT 'Perorangan'::pengguna_type,
  nama_instansi text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- User roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  role public.app_role NOT NULL DEFAULT 'user'::app_role
);

-- Berkas table
CREATE TABLE public.berkas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tanggal_pengajuan date NOT NULL DEFAULT CURRENT_DATE,
  nama_pemegang_hak text NOT NULL,
  nama_pemilik_sertifikat text,
  no_hak text NOT NULL,
  no_su_tahun text NOT NULL,
  jenis_hak public.jenis_hak NOT NULL,
  kecamatan text NOT NULL,
  desa text NOT NULL,
  no_telepon text NOT NULL,
  no_wa_pemohon text,
  link_shareloc text,
  status public.berkas_status NOT NULL DEFAULT 'Proses'::berkas_status,
  file_sertifikat_url text,
  file_ktp_url text,
  file_foto_bangunan_url text,
  validated_by uuid,
  validated_at timestamptz,
  catatan_penolakan text,
  rejected_from_status text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Validation logs table
CREATE TABLE public.validation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  berkas_id uuid NOT NULL,
  admin_id uuid NOT NULL,
  action text NOT NULL,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Password reset OTPs table
CREATE TABLE public.password_reset_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  phone text NOT NULL,
  otp_code text NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ==========================================
-- 3. DATABASE FUNCTIONS
-- ==========================================

-- Function: has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function: is_admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'super_admin', 'admin_arsip', 'admin_validasi_su', 'admin_validasi_bt')
  )
$$;

-- Function: get_user_role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Function: get_today_submission_count
CREATE OR REPLACE FUNCTION public.get_today_submission_count(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::integer 
  FROM public.berkas 
  WHERE user_id = _user_id 
  AND created_at::date = CURRENT_DATE
$$;

-- Function: update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Function: handle_new_user (trigger function)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, no_telepon, pengguna, nama_instansi)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'no_telepon', ''),
    COALESCE(NEW.raw_user_meta_data->>'pengguna', 'Perorangan')::pengguna_type,
    NEW.raw_user_meta_data->>'nama_instansi'
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  RETURN NEW;
END;
$$;

-- Function: cleanup_expired_otps
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.password_reset_otps WHERE expires_at < now();
  RETURN NEW;
END;
$$;

-- ==========================================
-- 4. TRIGGERS
-- ==========================================

-- Auto-create profile & role when new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update updated_at on berkas
CREATE TRIGGER update_berkas_updated_at
  BEFORE UPDATE ON public.berkas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Cleanup expired OTPs on new insert
CREATE TRIGGER cleanup_otps_on_insert
  BEFORE INSERT ON public.password_reset_otps
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_expired_otps();

-- ==========================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.berkas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_otps ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 6. RLS POLICIES
-- ==========================================

-- === PROFILES ===
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "All admins can view profiles" ON public.profiles
  FOR SELECT USING (is_admin(auth.uid()));

-- === USER_ROLES ===
CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all roles" ON public.user_roles
  FOR SELECT USING (
    has_role(auth.uid(), 'super_admin'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admin can manage roles" ON public.user_roles
  FOR ALL USING (
    has_role(auth.uid(), 'super_admin'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- === BERKAS ===
CREATE POLICY "Users can create own berkas" ON public.berkas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own berkas" ON public.berkas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own berkas" ON public.berkas
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own berkas" ON public.berkas
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "All admins can view berkas" ON public.berkas
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "All admins can update berkas" ON public.berkas
  FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "All admins can delete berkas" ON public.berkas
  FOR DELETE USING (is_admin(auth.uid()));

-- === VALIDATION_LOGS ===
CREATE POLICY "Admins can view validation logs" ON public.validation_logs
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert validation logs" ON public.validation_logs
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

-- === PASSWORD_RESET_OTPS (no RLS policies - accessed via service role) ===

-- ==========================================
-- 7. STORAGE BUCKET
-- ==========================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('berkas-files', 'berkas-files', false);

-- Storage policies: authenticated users can upload
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'berkas-files');

-- Users can view own files, admins can view all
CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'berkas-files');

-- Users can update own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'berkas-files');

-- Users can delete own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'berkas-files');

-- ==========================================
-- 8. ENABLE REALTIME (optional)
-- ==========================================
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.berkas;

-- ==========================================
-- DONE! Database siap digunakan.
-- ==========================================
