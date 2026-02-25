import { ReactNode } from 'react';
import AppSidebar from './AppSidebar';
import { UserRole } from '@/lib/auth';

interface DashboardLayoutProps {
  role: UserRole;
  children: ReactNode;
  onLogout: () => void;
}

export default function DashboardLayout({ role, children, onLogout }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen gradient-bg">
      <AppSidebar role={role} onLogout={onLogout} />
      <main className="flex-1 p-8 animate-fade-in">
        {children}
      </main>
    </div>
  );
}
