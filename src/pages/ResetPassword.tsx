import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, KeyRound, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import logoBpn from '@/assets/logo-bpn.png';
import loginBg from '@/assets/login-bg.jpeg';

interface ResetPasswordProps {
  onComplete?: () => void;
}

export default function ResetPassword({ onComplete }: ResetPasswordProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery event from URL hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    if (type === 'recovery') {
      setIsRecovery(true);
    }

    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { toast.error('Password minimal 6 karakter'); return; }
    if (newPassword !== confirmPassword) { toast.error('Konfirmasi password tidak cocok'); return; }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      setSuccess(true);
      toast.success('Password berhasil diubah!');
      await supabase.auth.signOut();
      setTimeout(() => {
        onComplete?.();
        navigate('/');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src={loginBg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40" />
      </div>
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-6">
          <div className="w-32 h-32 mx-auto mb-4">
            <img src={logoBpn} alt="Logo BPN" className="w-full h-full object-contain" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-8 shadow-xl">
          {success ? (
            <div className="text-center space-y-4 py-4">
              <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
              <h2 className="text-xl font-bold text-foreground">Password Berhasil Diubah!</h2>
              <p className="text-sm text-muted-foreground">Anda akan dialihkan ke halaman login...</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <KeyRound className="w-10 h-10 mx-auto text-primary mb-2" />
                <h2 className="text-xl font-bold text-foreground">Reset Password</h2>
                <p className="text-sm text-muted-foreground mt-1">Masukkan password baru untuk akun Anda</p>
              </div>
              <form onSubmit={handleReset} className="space-y-4">
                <div className="space-y-2">
                  <Label>Password Baru (min. 6 karakter)</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input type="password" placeholder="Masukkan password baru" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="pl-10" required minLength={6} maxLength={128} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Konfirmasi Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input type="password" placeholder="Ulangi password baru" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="pl-10" required maxLength={128} />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Memproses...' : 'Ubah Password'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
