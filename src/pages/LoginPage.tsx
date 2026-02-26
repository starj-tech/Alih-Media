import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, LogIn, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import garudaImg from '@/assets/garuda-login.png';
import loginBg from '@/assets/login-bg.jpeg';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = login(email, password);
    if (user) {
      toast.success('Login berhasil!');
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard');
    } else {
      toast.error('Email atau password salah');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src={loginBg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40" />
      </div>
      <div className="w-full max-w-md animate-fade-in relative z-10">
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4">
            <img src={garudaImg} alt="Garuda Pancasila" className="w-full h-full object-contain" />
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
                <Input
                  id="email"
                  type="email"
                  placeholder="Masukkan email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1 gap-2">
                <LogIn className="w-4 h-4" />
                Login
              </Button>
              <Button type="button" variant="outline" className="flex-1 gap-2" onClick={() => toast.info('Fitur registrasi akan segera tersedia')}>
                <UserPlus className="w-4 h-4" />
                Registrasi
              </Button>
            </div>
          </form>

          <div className="mt-6 p-4 rounded-lg bg-muted/50 text-xs text-muted-foreground">
            <p className="font-semibold mb-1">Demo Akun:</p>
            <p>Admin: admin@bpn.go.id / admin123</p>
            <p>User: user@bpn.go.id / user123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
