import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Info, Users, LogOut, Send, FileSearch, Archive } from 'lucide-react';
import { UserRole } from '@/lib/auth';
import logoBpn from '@/assets/logo-bpn.png';
import { useAuth } from '@/hooks/useAuth';

interface AppSidebarProps {
  role: UserRole;
  onLogout: () => void;
}

const adminMenu = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Arsip Verifikasi BT/SU', path: '/admin/arsip-verifikasi', icon: Archive },
  { label: 'Validasi SU & Bidang', path: '/admin/validasi-su', icon: FileSearch },
  { label: 'Validasi Buku Tanah', path: '/admin/validasi-bt', icon: CheckSquare },
  { label: 'Informasi Alihmedia', path: '/admin/informasi', icon: Info },
  { label: 'Kelola User', path: '/admin/users', icon: Users },
];

const userMenu = [
  { label: 'Dashboard', path: '/user/dashboard', icon: LayoutDashboard },
  { label: 'Pengajuan Alihmedia', path: '/user/pengajuan', icon: Send },
  { label: 'Informasi Alihmedia', path: '/user/informasi', icon: Info },
];

export default function AppSidebar({ role, onLogout }: AppSidebarProps) {
  const location = useLocation();
  const { user } = useAuth();
  const menu = role === 'admin' ? adminMenu : userMenu;

  return (
    <aside className="w-[230px] min-h-screen flex flex-col bg-[hsl(var(--sidebar-background))] print:hidden">
      {/* Profile section */}
      <div className="p-4 border-b border-[hsl(var(--sidebar-border))]">
        <div className="flex items-center gap-3">
          <img
            src={logoBpn}
            alt="Logo BPN"
            className="w-10 h-10 object-contain"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-[hsl(var(--sidebar-foreground))] opacity-60 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Menu header */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--sidebar-foreground))] opacity-40">
          Menu Utama
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2">
        {menu.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-[10px] rounded text-[13px] transition-colors mb-0.5 ${
                isActive
                  ? 'bg-[hsl(var(--sidebar-accent))] text-white border-r-[3px] border-[hsl(var(--sidebar-primary))]'
                  : 'text-[hsl(var(--sidebar-foreground))] opacity-80 hover:opacity-100 hover:bg-[hsl(var(--sidebar-accent))]'
              }`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* App title */}
      <div className="px-4 py-3 border-t border-[hsl(var(--sidebar-border))]">
        <p className="text-[10px] uppercase tracking-widest text-[hsl(var(--sidebar-foreground))] opacity-40 text-center">
          Alih Media
        </p>
        <p className="text-[10px] text-[hsl(var(--sidebar-foreground))] opacity-40 text-center">
          Kantah Kab. Bogor II
        </p>
      </div>

      {/* Logout */}
      <div className="p-2 border-t border-[hsl(var(--sidebar-border))]">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-[10px] w-full rounded text-[13px] text-[hsl(var(--sidebar-foreground))] opacity-70 hover:opacity-100 hover:bg-destructive/20 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
