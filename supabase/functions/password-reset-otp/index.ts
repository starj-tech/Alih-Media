import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateOTP(): string {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < 6; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const { action, email, phone, otp, newPassword } = await req.json();

    if (action === 'send-otp') {
      // Find user by email
      if (!email) {
        return new Response(JSON.stringify({ error: 'Email harus diisi' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, name, no_telepon')
        .eq('email', email)
        .single();

      if (!profile) {
        return new Response(JSON.stringify({ error: 'Akun dengan email tersebut tidak ditemukan' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!profile.no_telepon || profile.no_telepon.replace(/\D/g, '').length < 10) {
        return new Response(JSON.stringify({ error: 'Nomor telepon tidak terdaftar pada akun ini' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Generate OTP
      const otpCode = generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Delete existing OTPs for this user
      await supabase
        .from('password_reset_otps')
        .delete()
        .eq('user_id', profile.user_id);

      // Store OTP
      await supabase.from('password_reset_otps').insert({
        user_id: profile.user_id,
        otp_code: otpCode,
        phone: profile.no_telepon,
        expires_at: expiresAt.toISOString(),
      });

      // Send OTP via WhatsApp (Fonnte)
      const fonntToken = Deno.env.get('FONNTE_TOKEN');
      if (!fonntToken) {
        return new Response(JSON.stringify({ error: 'WhatsApp service not configured' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let cleaned = profile.no_telepon.replace(/\D/g, '');
      if (cleaned.startsWith('0')) cleaned = '62' + cleaned.slice(1);
      if (!cleaned.startsWith('62')) cleaned = '62' + cleaned;

      const message = `*Reset Password - Aplikasi Alih Media*\n\nYth. ${profile.name},\n\nKode OTP untuk reset password Anda adalah:\n\n*${otpCode}*\n\nKode ini berlaku selama 5 menit.\n\n⚠️ Jangan berikan kode ini kepada siapapun.\n\nTerima Kasih,\nKantor Pertanahan Kabupaten Bogor II`;

      const formData = new FormData();
      formData.append('target', cleaned);
      formData.append('message', message);

      await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: { Authorization: fonntToken },
        body: formData,
      });

      // Mask phone for display
      const maskedPhone = cleaned.slice(0, 4) + '****' + cleaned.slice(-4);

      return new Response(JSON.stringify({ 
        success: true, 
        maskedPhone,
        message: 'Kode OTP telah dikirim via WhatsApp' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'verify-otp') {
      if (!email || !otp) {
        return new Response(JSON.stringify({ error: 'Email dan OTP harus diisi' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', email)
        .single();

      if (!profile) {
        return new Response(JSON.stringify({ error: 'Akun tidak ditemukan' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: otpRecord } = await supabase
        .from('password_reset_otps')
        .select('*')
        .eq('user_id', profile.user_id)
        .eq('otp_code', otp)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (!otpRecord) {
        return new Response(JSON.stringify({ error: 'Kode OTP tidak valid atau sudah kadaluarsa' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Mark as verified
      await supabase
        .from('password_reset_otps')
        .update({ verified: true })
        .eq('id', otpRecord.id);

      return new Response(JSON.stringify({ success: true, message: 'OTP terverifikasi' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'reset-password') {
      if (!email || !otp || !newPassword) {
        return new Response(JSON.stringify({ error: 'Semua field harus diisi' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (newPassword.length < 6) {
        return new Response(JSON.stringify({ error: 'Password minimal 6 karakter' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', email)
        .single();

      if (!profile) {
        return new Response(JSON.stringify({ error: 'Akun tidak ditemukan' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check verified OTP
      const { data: otpRecord } = await supabase
        .from('password_reset_otps')
        .select('*')
        .eq('user_id', profile.user_id)
        .eq('otp_code', otp)
        .eq('verified', true)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (!otpRecord) {
        return new Response(JSON.stringify({ error: 'OTP belum diverifikasi atau sudah kadaluarsa' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Reset password
      const { error: pwError } = await supabase.auth.admin.updateUserById(
        profile.user_id,
        { password: newPassword }
      );

      if (pwError) throw pwError;

      // Clean up OTPs
      await supabase
        .from('password_reset_otps')
        .delete()
        .eq('user_id', profile.user_id);

      return new Response(JSON.stringify({ success: true, message: 'Password berhasil diubah' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
