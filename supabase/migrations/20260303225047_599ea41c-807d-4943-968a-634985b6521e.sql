
-- Table to store OTP codes for password reset via WhatsApp
CREATE TABLE public.password_reset_otps (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  otp_code text NOT NULL,
  phone text NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.password_reset_otps ENABLE ROW LEVEL SECURITY;

-- Only service role can access (via edge functions)
-- No direct client access needed

-- Auto-cleanup: delete expired OTPs
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

CREATE TRIGGER trigger_cleanup_expired_otps
AFTER INSERT ON public.password_reset_otps
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_expired_otps();
