import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Mail, Lock, LogIn, UserPlus, User, Phone, Building2, KeyRound, CheckCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { UserRole } from '@/lib/auth';
import { setToken } from '@/lib/api-client';
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

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthContext();
  const navigate = useNavigate();

  // Registration state
  const [showRegister, setShowRegister] = useState(false);

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

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

  const openForgot = () => {
    setForgotEmail('');
    setForgotSent(false);
    setShowForgot(true);
  };

  const handleEmailReset = async () => {
    if (!forgotEmail.trim()) { toast.error('Email harus diisi'); return; }
    setForgotLoading(true);
    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email: forgotEmail }),
      });
      setForgotSent(true);
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengirim link reset');
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
          <h1 className="text-2xl font-bold text-white">VISA</h1>
          <p className="text-white/80 mt-1">Validasi Instrumen Sertipikat Analog</p>
          <p className="text-white/60 text-sm mt-0.5">Kantor Pertanahan Kab. Bogor II</p>
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
              <Button type="button" variant="outline" className="flex-1 gap-2" onClick={() => setShowRegister(true)}>
                <UserPlus className="w-4 h-4" />
                Registrasi
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Registration Dialog with OTP */}
      <RegistrationDialog open={showRegister} onOpenChange={setShowRegister} />

      {/* Forgot Password Dialog */}
      <Dialog open={showForgot} onOpenChange={setShowForgot}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5" />
              Lupa Password
            </DialogTitle>
          </DialogHeader>

          {forgotSent ? (
            <div className="space-y-4 text-center py-4">
              <Mail className="w-12 h-12 mx-auto text-primary" />
              <div>
                <p className="font-medium">Link Reset Terkirim!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Silakan cek email <strong>{forgotEmail}</strong> untuk link reset password.
                  Periksa juga folder spam jika tidak ditemukan di inbox.
                </p>
              </div>
              <Button onClick={() => setShowForgot(false)} className="w-full">Kembali ke Login</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Masukkan email akun Anda. Link reset password akan dikirim ke email tersebut.
              </p>
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="email" placeholder="Masukkan email akun" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} className="pl-10" maxLength={255} />
                </div>
              </div>
              <Button onClick={handleEmailReset} disabled={forgotLoading} className="w-full gap-2">
                <Mail className="w-4 h-4" />
                {forgotLoading ? 'Mengirim...' : 'Kirim Link Reset'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==========================================
// Registration Dialog Component with OTP
// ==========================================

type RegStep = 'form' | 'otp' | 'success';

function RegistrationDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [step, setStep] = useState<RegStep>('form');
  const [regName, setRegName] = useState('');
  const [regNoTelepon, setRegNoTelepon] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPengguna, setRegPengguna] = useState('');
  const [regNamaInstansi, setRegNamaInstansi] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  // OTP state
  const [otpValue, setOtpValue] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const resetForm = () => {
    setStep('form');
    setRegName(''); setRegNoTelepon(''); setRegEmail('');
    setRegPengguna(''); setRegNamaInstansi(''); setRegPassword('');
    setOtpValue(''); setCountdown(0);
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
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

    setRegLoading(true);
    try {
      const res = await apiFetch<{ message: string; email: string }>('/auth/register/request-otp', {
        method: 'POST',
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          no_telepon: regNoTelepon,
          pengguna: regPengguna,
          nama_instansi: needsInstansi(regPengguna) ? regNamaInstansi : null,
        }),
      });
      toast.success('Kode OTP telah dikirim ke email Anda');
      setStep('otp');
      setCountdown(300); // 5 minutes
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengirim OTP');
    }
    setRegLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (otpValue.length !== 6) {
      toast.error('Masukkan 6 digit kode OTP');
      return;
    }
    setOtpLoading(true);
    try {
      const res = await apiFetch<{ token: string; user: any; message: string }>('/auth/register/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email: regEmail, otp_code: otpValue }),
      });
      if (res.token) {
        setToken(res.token);
      }
      setStep('success');
      toast.success('Registrasi berhasil!');
    } catch (err: any) {
      toast.error(err.message || 'OTP tidak valid');
    }
    setOtpLoading(false);
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    try {
      await apiFetch('/auth/register/resend-otp', {
        method: 'POST',
        body: JSON.stringify({ email: regEmail }),
      });
      setCountdown(300);
      setOtpValue('');
      toast.success('OTP baru telah dikirim');
    } catch (err: any) {
      toast.error(err.message || 'Gagal kirim ulang OTP');
    }
    setResendLoading(false);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'form' && 'Registrasi Akun Baru'}
            {step === 'otp' && 'Verifikasi OTP'}
            {step === 'success' && 'Registrasi Berhasil'}
          </DialogTitle>
        </DialogHeader>

        {step === 'success' && (
          <div className="space-y-4 text-center py-4">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
            <div>
              <p className="font-medium text-lg">Registrasi Berhasil!</p>
              <p className="text-sm text-muted-foreground mt-2">
                Akun Anda telah berhasil didaftarkan. Silakan login dengan email <strong>{regEmail}</strong>.
              </p>
            </div>
            <Button onClick={() => { onOpenChange(false); resetForm(); }} className="w-full">
              Kembali ke Login
            </Button>
          </div>
        )}

        {step === 'otp' && (
          <div className="space-y-6 py-2">
            <div className="text-center space-y-2">
              <Mail className="w-12 h-12 mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">
                Kode OTP 6 digit telah dikirim ke email <strong>{regEmail}</strong>.
                Periksa inbox dan folder spam, lalu masukkan kode tersebut untuk menyelesaikan registrasi.
              </p>
            </div>

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

            {countdown > 0 && (
              <p className="text-center text-sm text-muted-foreground">
                Kode berlaku selama <strong>{formatTime(countdown)}</strong>
              </p>
            )}

            <Button onClick={handleVerifyOtp} disabled={otpLoading || otpValue.length !== 6} className="w-full gap-2">
              <CheckCircle className="w-4 h-4" />
              {otpLoading ? 'Memverifikasi...' : 'Verifikasi & Daftar'}
            </Button>

            <div className="flex items-center justify-between">
              <button type="button" onClick={() => { setStep('form'); setOtpValue(''); }} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Kembali
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendLoading || countdown > 240}
                className="text-sm text-primary hover:underline flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-3 h-3 ${resendLoading ? 'animate-spin' : ''}`} />
                Kirim Ulang OTP
              </button>
            </div>
          </div>
        )}

        {step === 'form' && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
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

            <Button type="submit" className="w-full gap-2" disabled={regLoading}>
              <UserPlus className="w-4 h-4" />
              {regLoading ? 'Mengirim OTP...' : 'Kirim OTP & Daftar'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
