import { ReactNode, useEffect, useState } from 'react';
import { PanelLeft } from 'lucide-react';
import AppSidebar from './AppSidebar';
import { UserRole } from '@/lib/auth';
import { useIsMobile } from '@/hooks/use-mobile';

interface DashboardLayoutProps {
  role: UserRole;
  children: ReactNode;
  onLogout: () => void;
}

const SIDEBAR_STORAGE_KEY = 'ui_sidebar_collapsed';

export default function DashboardLayout({ role, children, onLogout }: DashboardLayoutProps) {
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    try {
      setSidebarCollapsed(window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true');
    } catch {
      setSidebarCollapsed(false);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarCollapsed));
    } catch {
      // ignore
    }
  }, [sidebarCollapsed]);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [isMobile]);

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        role={role}
        onLogout={onLogout}
        collapsed={sidebarCollapsed}
        isMobile={isMobile}
        mobileOpen={mobileSidebarOpen}
        onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-2 sm:px-4 md:px-6">
            <button
              type="button"
              onClick={() => (isMobile ? setMobileSidebarOpen(true) : setSidebarCollapsed(prev => !prev))}
              className="rounded-md border border-border bg-background p-2 text-foreground transition-colors hover:bg-muted"
              aria-label="Buka atau tutup menu"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Aplikasi Alih Media</p>
              <p className="text-xs text-muted-foreground">Tampilan sudah dioptimalkan untuk desktop dan handphone</p>
            </div>
          </div>
        </header>

        <main className="flex-1 px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6">
          <div className="mx-auto max-w-7xl min-w-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
