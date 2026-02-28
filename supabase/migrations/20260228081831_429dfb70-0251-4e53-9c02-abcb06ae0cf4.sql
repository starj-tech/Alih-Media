
-- Add new enum values to app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_user';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin_arsip';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin_validasi_su';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin_validasi_bt';
