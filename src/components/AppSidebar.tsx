import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Info, Users, LogOut, Send, FileSearch } from 'lucide-react';
import { UserRole } from '@/lib/auth';
import pancasilaImg from '@/assets/pancasila.png';
import sidebarBg from '@/assets/sidebar-bg.jpg';

interface AppSidebarProps {
  role: UserRole;
  onLogout: () => void;
}

const adminMenu = [
{ label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
{ label: 'Validasi Buku Tanah', path: '/admin/validasi-bt', icon: CheckSquare },
{ label: 'Validasi SU & Bidang', path: '/admin/validasi-su', icon: FileSearch },
{ label: 'Informasi Alihmedia', path: '/admin/informasi', icon: Info },
{ label: 'Kelola User', path: '/admin/users', icon: Users }];


const userMenu = [
{ label: 'Dashboard', path: '/user/dashboard', icon: LayoutDashboard },
{ label: 'Pengajuan Alihmedia', path: '/user/pengajuan', icon: Send },
{ label: 'Informasi Alihmedia', path: '/user/informasi', icon: Info }];


export default function AppSidebar({ role, onLogout }: AppSidebarProps) {
  const location = useLocation();
  const menu = role === 'admin' ? adminMenu : userMenu;

  return (
    <aside
      className="w-64 min-h-screen flex flex-col shadow-xl print:hidden relative overflow-hidden"
      style={{
        backgroundImage: `url(${sidebarBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/40 z-0" />
      {/* Right edge gradient border */}
      <div className="absolute top-0 right-0 w-8 h-full z-[1] pointer-events-none" style={{
        background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.7))'
      }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        <div className="p-6 text-center border-b border-white/15">
          <div className="w-20 h-20 mx-auto mb-3 flex items-center justify-center">
            <img
              src={pancasilaImg}
              alt="Garuda Pancasila"
              className="w-full h-full object-contain drop-shadow-lg"
              style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }} />

          </div>
          <h2 className="text-lg font-light tracking-[0.25em] text-white/95 uppercase">Alih Media</h2>
          <p className="font-semibold text-white/85 leading-tight mt-1.5 tracking-wide my-px text-base">Kantor Pertanahan<br />Kabupaten Bogor II</p>
        </div>

        <nav className="flex-1 py-4">
          {menu.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-6 py-3 mx-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive ?
                'bg-white/20 text-white shadow-md backdrop-blur-sm' :
                'text-white/75 hover:bg-white/10 hover:text-white'}`
                }>

                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>);

          })}
        </nav>

        <div className="p-4 border-t border-white/15">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-6 py-3 w-full rounded-lg text-sm font-medium text-white/75 hover:bg-red-500/30 hover:text-white transition-all duration-200">

            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>
    </aside>);

}