
-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create enum for berkas status
CREATE TYPE public.berkas_status AS ENUM ('Proses', 'Validasi SU & Bidang', 'Validasi BT', 'Selesai', 'Ditolak');

-- Create enum for jenis hak
CREATE TYPE public.jenis_hak AS ENUM ('HM', 'HGB', 'HP', 'HGU', 'HMSRS', 'HPL', 'HW');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create berkas table
CREATE TABLE public.berkas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tanggal_pengajuan DATE NOT NULL DEFAULT CURRENT_DATE,
  nama_pemegang_hak TEXT NOT NULL,
  no_telepon TEXT NOT NULL,
  no_su_tahun TEXT NOT NULL,
  jenis_hak jenis_hak NOT NULL,
  no_hak TEXT NOT NULL,
  desa TEXT NOT NULL,
  kecamatan TEXT NOT NULL,
  status berkas_status NOT NULL DEFAULT 'Proses',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  link_shareloc TEXT,
  catatan_penolakan TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.berkas ENABLE ROW LEVEL SECURITY;

-- Create storage bucket for file uploads (KTP & Sertifikat)
INSERT INTO storage.buckets (id, name, public) VALUES ('berkas-files', 'berkas-files', false);

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Auto-create profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), NEW.email);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_berkas_updated_at
  BEFORE UPDATE ON public.berkas FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for berkas
CREATE POLICY "Users can view own berkas"
  ON public.berkas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own berkas"
  ON public.berkas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all berkas"
  ON public.berkas FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update berkas"
  ON public.berkas FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete berkas"
  ON public.berkas FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Storage policies for berkas files
CREATE POLICY "Users can upload own files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'berkas-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'berkas-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'berkas-files' AND public.has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX idx_berkas_user_id ON public.berkas(user_id);
CREATE INDEX idx_berkas_status ON public.berkas(status);
CREATE INDEX idx_berkas_desa ON public.berkas(desa);
CREATE INDEX idx_berkas_no_hak ON public.berkas(no_hak);
CREATE INDEX idx_berkas_no_su_tahun ON public.berkas(no_su_tahun);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
