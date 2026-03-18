import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Archive,
  BarChart3,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileSearch,
  HelpCircle,
  Info,
  LayoutDashboard,
  LogOut,
  Send,
  Users,
  X,
} from 'lucide-react';
import { UserRole, getRoleLabel } from '@/lib/auth';
import logoBpn from '@/assets/logo-bpn.png';
import { useAuthContext } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface MenuItem {
  label: string;
  path?: string;
  icon: any;
  children?: MenuItem[];
}

interface AppSidebarProps {
  role: UserRole;
  onLogout: () => void;
  collapsed: boolean;
  isMobile: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
}

function getMenu(role: UserRole): MenuItem[] {
  switch (role) {
    case 'super_admin':
      return [
        { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        {
          label: 'Dashboard Kinerja', icon: BarChart3,
          children: [
            { label: 'Dashboard Arsip', path: '/admin/dashboard-arsip', icon: Archive },
            { label: 'Dashboard Validasi SU', path: '/admin/dashboard-validasi-su', icon: FileSearch },
            { label: 'Dashboard Validasi BT', path: '/admin/dashboard-validasi-bt', icon: CheckSquare },
          ],
        },
        { label: 'Rekap Kinerja Admin', path: '/admin/rekap-kinerja', icon: BarChart3 },
        { label: 'Arsip Verifikasi BT/SU', path: '/admin/arsip-verifikasi', icon: Archive },
        { label: 'Validasi SU & Bidang', path: '/admin/validasi-su', icon: FileSearch },
        { label: 'Validasi Buku Tanah', path: '/admin/validasi-bt', icon: CheckSquare },
        { label: 'Informasi Alihmedia', path: '/admin/informasi', icon: Info },
        { label: 'Kelola User', path: '/admin/users', icon: Users },
        { label: 'Bantuan', path: '/admin/bantuan', icon: HelpCircle },
      ];
    case 'admin':
      return [
        { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Arsip Verifikasi BT/SU', path: '/admin/arsip-verifikasi', icon: Archive },
        { label: 'Validasi SU & Bidang', path: '/admin/validasi-su', icon: FileSearch },
        { label: 'Validasi Buku Tanah', path: '/admin/validasi-bt', icon: CheckSquare },
        { label: 'Informasi Alihmedia', path: '/admin/informasi', icon: Info },
        { label: 'Kelola User', path: '/admin/users', icon: Users },
        { label: 'Bantuan', path: '/admin/bantuan', icon: HelpCircle },
      ];
    case 'admin_arsip':
      return [
        { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Arsip Verifikasi BT/SU', path: '/admin/arsip-verifikasi', icon: Archive },
        { label: 'Informasi Alihmedia', path: '/admin/informasi', icon: Info },
        { label: 'Bantuan', path: '/admin/bantuan', icon: HelpCircle },
      ];
    case 'admin_validasi_su':
      return [
        { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Validasi SU & Bidang', path: '/admin/validasi-su', icon: FileSearch },
        { label: 'Informasi Alihmedia', path: '/admin/informasi', icon: Info },
        { label: 'Bantuan', path: '/admin/bantuan', icon: HelpCircle },
      ];
    case 'admin_validasi_bt':
      return [
        { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Validasi Buku Tanah', path: '/admin/validasi-bt', icon: CheckSquare },
        { label: 'Informasi Alihmedia', path: '/admin/informasi', icon: Info },
        { label: 'Bantuan', path: '/admin/bantuan', icon: HelpCircle },
      ];
    case 'user':
    case 'super_user':
    default:
      return [
        { label: 'Dashboard', path: '/user/dashboard', icon: LayoutDashboard },
        { label: 'Pengajuan Alihmedia', path: '/user/pengajuan', icon: Send },
        { label: 'Informasi Alihmedia', path: '/user/informasi', icon: Info },
        { label: 'Bantuan', path: '/user/bantuan', icon: HelpCircle },
      ];
  }
}

export default function AppSidebar({
  role,
  onLogout,
  collapsed,
  isMobile,
  mobileOpen,
  onToggleCollapse,
  onCloseMobile,
}: AppSidebarProps) {
  const location = useLocation();
  const { user } = useAuthContext();
  const menu = useMemo(() => getMenu(role), [role]);
  const [openSubs, setOpenSubs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setOpenSubs(prev => {
      const next = { ...prev };
      menu.forEach(item => {
        if (item.children?.some(child => child.path === location.pathname)) {
          next[item.label] = true;
        }
      });
      return next;
    });
  }, [location.pathname, menu]);

  const toggleSub = (label: string) => setOpenSubs(prev => ({ ...prev, [label]: !prev[label] }));
  const closeIfMobile = () => {
    if (isMobile) onCloseMobile();
  };

  const renderLink = (item: MenuItem, nested = false) => {
    if (!item.path) return null;
    const isActive = location.pathname === item.path;
    const hideText = collapsed && !isMobile;

    return (
      <Link
        key={item.path}
        to={item.path}
        title={hideText ? item.label : undefined}
        onClick={closeIfMobile}
        className={cn(
          'mb-1 flex items-center rounded-md text-[13px] transition-all',
          nested ? 'py-2 pl-11 pr-3' : 'px-3 py-[10px]',
          hideText && !nested ? 'justify-center px-2' : 'gap-3',
          isActive
            ? 'bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-primary-foreground))] ring-1 ring-[hsl(var(--sidebar-primary))]/40'
            : 'text-[hsl(var(--sidebar-foreground))] opacity-85 hover:bg-[hsl(var(--sidebar-accent))] hover:opacity-100'
        )}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        {!hideText && <span className="truncate">{item.label}</span>}
      </Link>
    );
  };

  return (
    <>
      {isMobile && mobileOpen && (
        <button
          type="button"
          aria-label="Tutup menu"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-[hsl(var(--foreground))]/35 backdrop-blur-[1px]"
        />
      )}

      <aside
        className={cn(
          'print:hidden flex min-h-screen flex-col bg-[hsl(var(--sidebar-background))] border-r border-[hsl(var(--sidebar-border))] transition-transform duration-200 ease-out',
          isMobile
            ? cn('fixed inset-y-0 left-0 z-50 w-[272px]', mobileOpen ? 'translate-x-0' : '-translate-x-full')
            : cn('sticky top-0 shrink-0', collapsed ? 'w-[76px]' : 'w-[230px]')
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[hsl(var(--sidebar-border))] p-4">
          <div className={cn('flex items-center gap-3 min-w-0', collapsed && !isMobile && 'justify-center w-full')}>
            <img src={logoBpn} alt="Logo BPN" className="h-10 w-10 shrink-0 object-contain" />
            {(!collapsed || isMobile) && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[hsl(var(--sidebar-primary-foreground))]">{user?.name || 'User'}</p>
                <p className="truncate text-[10px] text-[hsl(var(--sidebar-foreground))] opacity-70">{user?.email}</p>
                <span className="mt-1 inline-flex rounded bg-[hsl(var(--sidebar-primary))]/20 px-1.5 py-0.5 text-[9px] font-semibold text-[hsl(var(--sidebar-primary))]">
                  {getRoleLabel(role)}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={isMobile ? onCloseMobile : onToggleCollapse}
            className="rounded-md p-2 text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]"
            aria-label={isMobile ? 'Tutup menu' : collapsed ? 'Buka menu' : 'Collapse menu'}
          >
            {isMobile ? <X className="h-4 w-4" /> : collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </button>
        </div>

        {(!collapsed || isMobile) && (
          <div className="px-4 pb-2 pt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--sidebar-foreground))] opacity-45">
              Menu Utama
            </p>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-2 pb-3">
          {menu.map(item => {
            if (item.children) {
              const isOpen = !!openSubs[item.label];
              const hasActiveChild = item.children.some(child => child.path === location.pathname);
              const hideText = collapsed && !isMobile;

              return (
                <div key={item.label} className="mb-1">
                  <button
                    type="button"
                    onClick={() => toggleSub(item.label)}
                    title={hideText ? item.label : undefined}
                    className={cn(
                      'flex w-full items-center rounded-md text-[13px] transition-all',
                      hideText ? 'justify-center px-2 py-[10px]' : 'gap-3 px-3 py-[10px]',
                      hasActiveChild
                        ? 'bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-primary-foreground))]'
                        : 'text-[hsl(var(--sidebar-foreground))] opacity-85 hover:bg-[hsl(var(--sidebar-accent))] hover:opacity-100'
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!hideText && <span className="flex-1 text-left truncate">{item.label}</span>}
                    {!hideText && (isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />)}
                  </button>
                  {isOpen && (!collapsed || isMobile) && item.children.map(child => renderLink(child, true))}
                </div>
              );
            }

            return renderLink(item);
          })}
        </nav>

        {(!collapsed || isMobile) && (
          <div className="border-t border-[hsl(var(--sidebar-border))] px-4 py-3">
            <p className="text-center text-[10px] uppercase tracking-widest text-[hsl(var(--sidebar-foreground))] opacity-45">Alih Media</p>
            <p className="text-center text-[10px] text-[hsl(var(--sidebar-foreground))] opacity-45">Kantah Kab. Bogor II</p>
          </div>
        )}

        <div className="border-t border-[hsl(var(--sidebar-border))] p-2">
          <button
            onClick={onLogout}
            title={collapsed && !isMobile ? 'Logout' : undefined}
            className={cn(
              'flex w-full items-center rounded-md px-3 py-[10px] text-[13px] text-[hsl(var(--sidebar-foreground))] transition-colors hover:bg-destructive/20 hover:text-[hsl(var(--sidebar-primary-foreground))]',
              collapsed && !isMobile ? 'justify-center px-2' : 'gap-3'
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {(!collapsed || isMobile) && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
