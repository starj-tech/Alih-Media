import { ReactNode } from 'react';
import AppSidebar from './AppSidebar';
import { UserRole } from '@/lib/auth';
import bgFlag from '@/assets/bg-flag.jpeg';

interface DashboardLayoutProps {
  role: UserRole;
  children: ReactNode;
  onLogout: () => void;
}

export default function DashboardLayout({ role, children, onLogout }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar role={role} onLogout={onLogout} />
      <main
        className="flex-1 p-8 animate-fade-in"
        style={{
          backgroundImage: `url(${bgFlag})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        {children}
      </main>
    </div>
  );
}
