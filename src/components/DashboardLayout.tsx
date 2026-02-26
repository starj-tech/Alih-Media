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
        className="flex-1 p-8 animate-fade-in relative"
        style={{
          backgroundImage: `url(${bgFlag})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        {/* Horizontal dark gradient overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'linear-gradient(to right, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.1) 100%)',
        }} />
        <div className="relative z-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
