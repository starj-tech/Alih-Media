import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuthContext } from "@/contexts/AuthContext";
import { isAdminRole } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import LoginPage from "@/pages/LoginPage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import SuperAdminDashboard from "@/pages/admin/SuperAdminDashboard";
import RekapKinerja from "@/pages/admin/RekapKinerja";
import DashboardArsip from "@/pages/admin/DashboardArsip";
import DashboardValidasiSU from "@/pages/admin/DashboardValidasiSU";
import DashboardValidasiBT from "@/pages/admin/DashboardValidasiBT";
import ValidasiBukuTanah from "@/pages/admin/ValidasiBukuTanah";
import ValidasiSUBidang from "@/pages/admin/ValidasiSUBidang";
import ArsipVerifikasi from "@/pages/admin/ArsipVerifikasi";
import AdminInformasi from "@/pages/admin/AdminInformasi";
import KelolaUser from "@/pages/admin/KelolaUser";
import UserDashboard from "@/pages/user/UserDashboard";
import PengajuanAlihmedia from "@/pages/user/PengajuanAlihmedia";
import UserInformasi from "@/pages/user/UserInformasi";
import ResetPassword from "./pages/ResetPassword";
import AppErrorBoundary from "@/components/AppErrorBoundary";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, loading, logout } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  const handleLogout = () => { logout(); };
  const role = user.role;
  const defaultRoute = isAdminRole(role) ? '/admin/dashboard' : '/user/dashboard';

  return (
    <Routes>
      <Route path="/" element={<Navigate to={defaultRoute} />} />
      
      {isAdminRole(role) && (
        <>
          <Route path="/admin/dashboard" element={
            <DashboardLayout role={role} onLogout={handleLogout}>
              {role === 'super_admin' ? <SuperAdminDashboard /> : <AdminDashboard />}
            </DashboardLayout>
          } />
          <Route path="/admin/arsip-verifikasi" element={<DashboardLayout role={role} onLogout={handleLogout}><ArsipVerifikasi /></DashboardLayout>} />
          {role === 'super_admin' && (
            <>
              <Route path="/admin/dashboard-arsip" element={<DashboardLayout role={role} onLogout={handleLogout}><DashboardArsip /></DashboardLayout>} />
              <Route path="/admin/dashboard-validasi-su" element={<DashboardLayout role={role} onLogout={handleLogout}><DashboardValidasiSU /></DashboardLayout>} />
              <Route path="/admin/dashboard-validasi-bt" element={<DashboardLayout role={role} onLogout={handleLogout}><DashboardValidasiBT /></DashboardLayout>} />
            </>
          )}
          <Route path="/admin/validasi-su" element={<DashboardLayout role={role} onLogout={handleLogout}><ValidasiSUBidang /></DashboardLayout>} />
          <Route path="/admin/validasi-bt" element={<DashboardLayout role={role} onLogout={handleLogout}><ValidasiBukuTanah /></DashboardLayout>} />
          <Route path="/admin/informasi" element={<DashboardLayout role={role} onLogout={handleLogout}><AdminInformasi /></DashboardLayout>} />
          {(role === 'super_admin' || role === 'admin') && (
            <>
              <Route path="/admin/users" element={<DashboardLayout role={role} onLogout={handleLogout}><KelolaUser /></DashboardLayout>} />
              <Route path="/admin/rekap-kinerja" element={<DashboardLayout role={role} onLogout={handleLogout}><RekapKinerja /></DashboardLayout>} />
            </>
          )}
        </>
      )}

      {!isAdminRole(role) && (
        <>
          <Route path="/user/dashboard" element={<DashboardLayout role={role} onLogout={handleLogout}><UserDashboard /></DashboardLayout>} />
          <Route path="/user/pengajuan" element={<DashboardLayout role={role} onLogout={handleLogout}><PengajuanAlihmedia /></DashboardLayout>} />
          <Route path="/user/informasi" element={<DashboardLayout role={role} onLogout={handleLogout}><UserInformasi /></DashboardLayout>} />
        </>
      )}

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <AuthProvider>
          <AppErrorBoundary>
            <AppRoutes />
          </AppErrorBoundary>
        </AuthProvider>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
