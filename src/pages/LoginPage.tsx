import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Mail, Lock, LogIn, UserPlus, User, Phone, Building2, KeyRound, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
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
  const [showRegister, setShowRegister] = useState(false);
  const [regName, setRegName] = useState('');
  const [regNoTelepon, setRegNoTelepon] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPengguna, setRegPengguna] = useState('');
  const [regNamaInstansi, setRegNamaInstansi] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

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

    setRegLoading(true);
    const result = await register(regName, regEmail, regPassword, {
      no_telepon: regNoTelepon,
      pengguna: regPengguna,
      nama_instansi: needsInstansi(regPengguna) ? regNamaInstansi : undefined,
    });
    setRegLoading(false);

    if (typeof result === 'string') {
      if (result.includes('berhasil')) {
        setRegSuccess(true);
      } else {
        toast.error(result);
      }
    } else {
      setRegSuccess(true);
    }
  };

  const resetRegForm = () => {
    setRegName(''); setRegNoTelepon(''); setRegEmail('');
    setRegPengguna(''); setRegNamaInstansi(''); setRegPassword('');
    setRegSuccess(false);
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
      await apiFetch('/auth/forgot-password', {
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
      <Dialog open={showRegister} onOpenChange={(open) => { if (!open) { setShowRegister(false); setRegSuccess(false); } else setShowRegister(true); }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrasi Akun Baru</DialogTitle>
          </DialogHeader>

          {regSuccess ? (
            <div className="space-y-4 text-center py-4">
              <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
              <div>
                <p className="font-medium text-lg">Registrasi Berhasil!</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Akun Anda telah berhasil didaftarkan. Silakan login dengan email <strong>{regEmail}</strong>.
                </p>
              </div>
              <Button onClick={() => { setShowRegister(false); setRegSuccess(false); }} className="w-full">
                Kembali ke Login
              </Button>
            </div>
          ) : (
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

              <Button type="submit" className="w-full gap-2" disabled={regLoading}>
                <UserPlus className="w-4 h-4" />
                {regLoading ? 'Mendaftarkan...' : 'Daftar'}
              </Button>
            </form>
          )}
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
