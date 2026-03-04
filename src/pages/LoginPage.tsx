import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Mail, Lock, LogIn, UserPlus, User, Phone, Building2, KeyRound, ArrowLeft, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import logoBpn from '@/assets/logo-bpn.png';
import loginBg from '@/assets/login-bg.jpeg';

const penggunaOptions = [
  'Perorangan',
  'Staf PPAT',
  'Notaris/PPAT',
  'Bank',
  'PT/Badan Hukum',
] as const;

const needsInstansi = (val: string) => ['Staf PPAT', 'Bank', 'PT/Badan Hukum'].includes(val);

type ForgotStep = 'choose' | 'email-sent' | 'otp-send' | 'otp-verify' | 'reset-password';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [regName, setRegName] = useState('');
  const [regNoTelepon, setRegNoTelepon] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPengguna, setRegPengguna] = useState('');
  const [regNamaInstansi, setRegNamaInstansi] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState<ForgotStep>('choose');
  const [forgotEmail, setForgotEmail] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { toast.error('Email dan password harus diisi'); return; }
    setLoading(true);
    const result = await login(email, password);
    if ('error' in result) {
      toast.error(result.error);
    } else {
      toast.success('Login berhasil!');
      const isAdmin = ['admin', 'super_admin', 'admin_arsip', 'admin_validasi_su', 'admin_validasi_bt'].includes(result.role);
      navigate(isAdmin ? '/admin/dashboard' : '/user/dashboard');
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword || !regNoTelepon || !regPengguna) {
      toast.error('Semua field wajib harus diisi');
      return;
    }
    if (regNoTelepon.replace(/\D/g, '').length < 10) {
      toast.error('Nomor telepon minimal 10 digit');
      return;
    }
    if (needsInstansi(regPengguna) && !regNamaInstansi.trim()) {
      toast.error('Nama instansi harus diisi');
      return;
    }
    if (regPassword.length < 6) { toast.error('Password minimal 6 karakter'); return; }
    setLoading(true);
    const result = await register(regName, regEmail, regPassword, {
      no_telepon: regNoTelepon,
      pengguna: regPengguna,
      nama_instansi: needsInstansi(regPengguna) ? regNamaInstansi : undefined,
    });
    if (typeof result === 'string') {
      toast.error(result);
    } else {
      toast.success('Registrasi berhasil!');
      setShowRegister(false);
      navigate('/user/dashboard');
    }
    setLoading(false);
  };

  const resetRegForm = () => {
    setRegName(''); setRegNoTelepon(''); setRegEmail('');
    setRegPengguna(''); setRegNamaInstansi(''); setRegPassword('');
  };

  const openForgot = () => {
    setForgotEmail('');
    setOtpValue('');
    setNewPassword('');
    setConfirmPassword('');
    setMaskedPhone('');
    setForgotStep('choose');
    setShowForgot(true);
  };

  // Email reset
  const handleEmailReset = async () => {
    if (!forgotEmail.trim()) { toast.error('Email harus diisi'); return; }
    setForgotLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/#/reset-password`,
    });
    setForgotLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setForgotStep('email-sent');
    }
  };

  // WhatsApp OTP send
  const handleSendOtp = async () => {
    if (!forgotEmail.trim()) { toast.error('Email harus diisi'); return; }
    setForgotLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('password-reset-otp', {
        body: { action: 'send-otp', email: forgotEmail },
      });
      if (error) {
        // Try to extract error message from response context
        const ctx = (error as any)?.context;
        if (ctx && typeof ctx.json === 'function') {
          try {
            const body = await ctx.json();
            if (body?.error) { toast.error(body.error); setForgotLoading(false); return; }
          } catch {}
        }
        throw error;
      }
      if (data?.error) { toast.error(data.error); setForgotLoading(false); return; }
      setMaskedPhone(data.maskedPhone || '');
      toast.success('Kode OTP telah dikirim via WhatsApp');
      setForgotStep('otp-verify');
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengirim OTP');
    }
    setForgotLoading(false);
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (otpValue.length !== 6) { toast.error('Masukkan 6 digit kode OTP'); return; }
    setForgotLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('password-reset-otp', {
        body: { action: 'verify-otp', email: forgotEmail, otp: otpValue },
      });
      if (error) {
        const ctx = (error as any)?.context;
        if (ctx && typeof ctx.json === 'function') {
          try { const body = await ctx.json(); if (body?.error) { toast.error(body.error); setForgotLoading(false); return; } } catch {}
        }
        throw error;
      }
      if (data?.error) { toast.error(data.error); setForgotLoading(false); return; }
      toast.success('OTP terverifikasi!');
      setForgotStep('reset-password');
    } catch (err: any) {
      toast.error(err.message || 'Gagal verifikasi OTP');
    }
    setForgotLoading(false);
  };

  // Reset password via OTP
  const handleResetPassword = async () => {
    if (newPassword.length < 6) { toast.error('Password minimal 6 karakter'); return; }
    if (newPassword !== confirmPassword) { toast.error('Konfirmasi password tidak cocok'); return; }
    setForgotLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('password-reset-otp', {
        body: { action: 'reset-password', email: forgotEmail, otp: otpValue, newPassword },
      });
      if (error) {
        const ctx = (error as any)?.context;
        if (ctx && typeof ctx.json === 'function') {
          try { const body = await ctx.json(); if (body?.error) { toast.error(body.error); setForgotLoading(false); return; } } catch {}
        }
        throw error;
      }
      if (data?.error) { toast.error(data.error); setForgotLoading(false); return; }
      toast.success('Password berhasil diubah! Silakan login.');
      setShowForgot(false);
    } catch (err: any) {
      toast.error(err.message || 'Gagal reset password');
    }
    setForgotLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src={loginBg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40" />
      </div>
      <div className="w-full max-w-md animate-fade-in relative z-10">
        <div className="text-center mb-8">
          <div className="w-72 h-72 mx-auto mb-4">
            <img src={logoBpn} alt="Logo BPN" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-white">Login Aplikasi</h1>
          <p className="text-white/80 mt-1">Aplikasi Alih Media - Kantor Pertanahan Kab. Bogor II</p>
        </div>

        <div className="glass-card rounded-2xl p-8 shadow-xl">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="Masukkan email" value={email} onChange={e => setEmail(e.target.value)} className="pl-10" required maxLength={255} autoComplete="email" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="password" type="password" placeholder="Masukkan password" value={password} onChange={e => setPassword(e.target.value)} className="pl-10" required maxLength={128} autoComplete="current-password" />
              </div>
            </div>

            <div className="text-right">
              <button type="button" onClick={openForgot} className="text-sm text-primary hover:underline">
                Lupa Password?
              </button>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" variant="secondary" className="flex-1 gap-2 bg-muted-foreground text-white hover:bg-muted-foreground/80" disabled={loading}>
                <LogIn className="w-4 h-4" />
                {loading ? 'Memproses...' : 'Login'}
              </Button>
              <Button type="button" variant="outline" className="flex-1 gap-2" onClick={() => { resetRegForm(); setShowRegister(true); }}>
                <UserPlus className="w-4 h-4" />
                Registrasi
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Registration Dialog */}
      <Dialog open={showRegister} onOpenChange={setShowRegister}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrasi Akun Baru</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reg-name">Nama Pemohon</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="reg-name" placeholder="Masukkan nama pemohon" value={regName} onChange={e => setRegName(e.target.value)} className="pl-10" required maxLength={100} autoComplete="name" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-phone">No. HP</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="reg-phone" type="tel" placeholder="Masukkan nomor HP" value={regNoTelepon} onChange={e => setRegNoTelepon(e.target.value)} className="pl-10" required maxLength={20} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="reg-email" type="email" placeholder="Masukkan email" value={regEmail} onChange={e => setRegEmail(e.target.value)} className="pl-10" required maxLength={255} autoComplete="email" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Pengguna</Label>
              <Select value={regPengguna} onValueChange={v => { setRegPengguna(v); if (!needsInstansi(v)) setRegNamaInstansi(''); }}>
                <SelectTrigger><SelectValue placeholder="Pilih jenis pengguna" /></SelectTrigger>
                <SelectContent>
                  {penggunaOptions.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {needsInstansi(regPengguna) && (
              <div className="space-y-2">
                <Label htmlFor="reg-instansi">
                  {regPengguna === 'Bank' ? 'Nama Bank' : regPengguna === 'PT/Badan Hukum' ? 'Nama PT/Badan Hukum' : 'Nama Notaris/PPAT'}
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="reg-instansi" placeholder="Masukkan nama instansi" value={regNamaInstansi} onChange={e => setRegNamaInstansi(e.target.value)} className="pl-10" required maxLength={200} />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reg-password">Password (min. 6 karakter)</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="reg-password" type="password" placeholder="Masukkan password" value={regPassword} onChange={e => setRegPassword(e.target.value)} className="pl-10" required minLength={6} maxLength={128} autoComplete="new-password" />
              </div>
            </div>

            <Button type="submit" className="w-full gap-2" disabled={loading}>
              <UserPlus className="w-4 h-4" />
              {loading ? 'Memproses...' : 'Daftar'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgot} onOpenChange={setShowForgot}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5" />
              Lupa Password
            </DialogTitle>
          </DialogHeader>

          {/* Step: Choose method */}
          {forgotStep === 'choose' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Masukkan email akun Anda, lalu pilih metode verifikasi untuk reset password.
              </p>
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="email" placeholder="Masukkan email akun" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} className="pl-10" maxLength={255} />
                </div>
              </div>
              <div className="grid gap-3">
                <Button onClick={handleEmailReset} disabled={forgotLoading} variant="outline" className="w-full gap-2 justify-start h-auto py-3">
                  <Mail className="w-5 h-5 text-primary shrink-0" />
                  <div className="text-left">
                    <div className="font-medium">Reset via Email</div>
                    <div className="text-xs text-muted-foreground">Link reset dikirim ke email Anda</div>
                  </div>
                </Button>
                <Button onClick={handleSendOtp} disabled={forgotLoading} variant="outline" className="w-full gap-2 justify-start h-auto py-3">
                  <MessageCircle className="w-5 h-5 text-green-600 shrink-0" />
                  <div className="text-left">
                    <div className="font-medium">Reset via WhatsApp OTP</div>
                    <div className="text-xs text-muted-foreground">Kode OTP dikirim ke nomor terdaftar</div>
                  </div>
                </Button>
              </div>
              {forgotLoading && <p className="text-sm text-center text-muted-foreground">Memproses...</p>}
            </div>
          )}

          {/* Step: Email sent */}
          {forgotStep === 'email-sent' && (
            <div className="space-y-4 text-center py-4">
              <Mail className="w-12 h-12 mx-auto text-primary" />
              <div>
                <p className="font-medium">Link Reset Terkirim!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Silakan cek email <strong>{forgotEmail}</strong> untuk link reset password.
                </p>
              </div>
              <Button onClick={() => setShowForgot(false)} className="w-full">Kembali ke Login</Button>
            </div>
          )}

          {/* Step: OTP verify */}
          {forgotStep === 'otp-verify' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Kode OTP 6 digit telah dikirim ke WhatsApp <strong>{maskedPhone}</strong>. Kode berlaku 5 menit.
              </p>
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otpValue} onChange={setOtpValue}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button onClick={handleVerifyOtp} disabled={forgotLoading || otpValue.length !== 6} className="w-full">
                {forgotLoading ? 'Memverifikasi...' : 'Verifikasi OTP'}
              </Button>
              <div className="flex items-center justify-between">
                <button type="button" onClick={() => setForgotStep('choose')} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" /> Kembali
                </button>
                <button type="button" onClick={handleSendOtp} className="text-sm text-primary hover:underline" disabled={forgotLoading}>
                  Kirim Ulang OTP
                </button>
              </div>
            </div>
          )}

          {/* Step: Set new password */}
          {forgotStep === 'reset-password' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Masukkan password baru Anda.</p>
              <div className="space-y-2">
                <Label>Password Baru (min. 6 karakter)</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="password" placeholder="Masukkan password baru" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="pl-10" minLength={6} maxLength={128} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Konfirmasi Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="password" placeholder="Ulangi password baru" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="pl-10" maxLength={128} />
                </div>
              </div>
              <Button onClick={handleResetPassword} disabled={forgotLoading} className="w-full">
                {forgotLoading ? 'Memproses...' : 'Ubah Password'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
