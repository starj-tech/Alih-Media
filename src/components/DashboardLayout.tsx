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
    <div className="flex min-h-screen bg-background">
      <AppSidebar role={role} onLogout={onLogout} />
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
