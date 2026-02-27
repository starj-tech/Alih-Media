import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import LoginPage from "@/pages/LoginPage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import ValidasiBukuTanah from "@/pages/admin/ValidasiBukuTanah";
import ValidasiSUBidang from "@/pages/admin/ValidasiSUBidang";
import AdminInformasi from "@/pages/admin/AdminInformasi";
import KelolaUser from "@/pages/admin/KelolaUser";
import UserDashboard from "@/pages/user/UserDashboard";
import PengajuanAlihmedia from "@/pages/user/PengajuanAlihmedia";
import UserInformasi from "@/pages/user/UserInformasi";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  const handleLogout = () => {
    logout();
  };

  return (
    <Routes>
      <Route path="/" element={<Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard'} />} />
      
      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={<DashboardLayout role="admin" onLogout={handleLogout}><AdminDashboard /></DashboardLayout>} />
      <Route path="/admin/validasi-bt" element={<DashboardLayout role="admin" onLogout={handleLogout}><ValidasiBukuTanah /></DashboardLayout>} />
      <Route path="/admin/validasi-su" element={<DashboardLayout role="admin" onLogout={handleLogout}><ValidasiSUBidang /></DashboardLayout>} />
      <Route path="/admin/informasi" element={<DashboardLayout role="admin" onLogout={handleLogout}><AdminInformasi /></DashboardLayout>} />
      <Route path="/admin/users" element={<DashboardLayout role="admin" onLogout={handleLogout}><KelolaUser /></DashboardLayout>} />

      {/* User Routes */}
      <Route path="/user/dashboard" element={<DashboardLayout role="user" onLogout={handleLogout}><UserDashboard /></DashboardLayout>} />
      <Route path="/user/pengajuan" element={<DashboardLayout role="user" onLogout={handleLogout}><PengajuanAlihmedia /></DashboardLayout>} />
      <Route path="/user/informasi" element={<DashboardLayout role="user" onLogout={handleLogout}><UserInformasi /></DashboardLayout>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
