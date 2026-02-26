import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Info, Users, LogOut, Send, FileSearch } from 'lucide-react';
import { UserRole } from '@/lib/auth';
import pancasilaImg from '@/assets/pancasila.png';

interface AppSidebarProps {
  role: UserRole;
  onLogout: () => void;
}

const adminMenu = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Validasi Buku Tanah', path: '/admin/validasi-bt', icon: CheckSquare },
  { label: 'Validasi SU & Bidang', path: '/admin/validasi-su', icon: FileSearch },
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
  const menu = role === 'admin' ? adminMenu : userMenu;

  return (
    <aside className="w-64 min-h-screen gradient-sidebar flex flex-col shadow-xl print:hidden">
      <div className="p-6 text-center border-b border-sidebar-border">
        <div className="w-20 h-20 mx-auto mb-3 flex items-center justify-center">
          <img src={pancasilaImg} alt="Garuda Pancasila" className="w-full h-full object-contain" style={{ mixBlendMode: 'multiply' }} />
        </div>
        <h2 className="text-lg font-bold text-sidebar-foreground">Alih Media</h2>
        <p className="text-sm font-semibold text-sidebar-foreground/90 leading-tight mt-1">Kantor Pertanahan<br />Kabupaten Bogor II</p>
      </div>

      <nav className="flex-1 py-4">
        {menu.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-6 py-3 mx-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-6 py-3 w-full rounded-lg text-sm font-medium text-sidebar-foreground/80 hover:bg-destructive hover:text-destructive-foreground transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
