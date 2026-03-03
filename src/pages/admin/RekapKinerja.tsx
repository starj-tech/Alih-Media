import { useState, useEffect } from 'react';
import { BarChart3 } from 'lucide-react';
import { getAdminStats, getUsers, ManagedUser } from '@/lib/data';
import { getRoleLabel, UserRole } from '@/lib/auth';

export default function RekapKinerja() {
  const [stats, setStats] = useState({ total: 0, proses: 0, validasiSu: 0, validasiBt: 0, selesai: 0, ditolak: 0, adminCounts: {} as Record<string, number> });
  const [users, setUsers] = useState<ManagedUser[]>([]);

  useEffect(() => {
    getAdminStats().then(setStats);
    getUsers().then(setUsers);
  }, []);

  const adminUsers = users.filter(u => ['super_admin', 'admin_arsip', 'admin_validasi_su', 'admin_validasi_bt', 'admin'].includes(u.role));
  const adminPerformance = adminUsers.map(admin => ({
    name: admin.name,
    email: admin.email,
    role: getRoleLabel(admin.role as UserRole),
    count: stats.adminCounts[admin.id] || 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-foreground">Rekap Kinerja Admin</h1>
        <p className="text-sm text-muted-foreground">Monitoring penyelesaian validasi oleh masing-masing admin</p>
      </div>

      <div className="gentelella-panel">
        <div className="gentelella-panel-heading">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Detail Kinerja Admin
          </h3>
        </div>
        <div className="gentelella-panel-body">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">No</th>
                  <th className="text-left py-2 px-3">Nama Admin</th>
                  <th className="text-left py-2 px-3">Email</th>
                  <th className="text-left py-2 px-3">Role</th>
                  <th className="text-left py-2 px-3">Penyelesaian Validasi</th>
                </tr>
              </thead>
              <tbody>
                {adminPerformance.map((admin, i) => (
                  <tr key={admin.email} className="border-b last:border-0">
                    <td className="py-2 px-3">{i + 1}</td>
                    <td className="py-2 px-3 font-medium">{admin.name}</td>
                    <td className="py-2 px-3 text-muted-foreground">{admin.email}</td>
                    <td className="py-2 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/20 text-primary">
                        {admin.role}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-bold text-primary">{admin.count}</td>
                  </tr>
                ))}
                {adminPerformance.length === 0 && (
                  <tr><td colSpan={5} className="py-4 text-center text-muted-foreground">Belum ada data admin</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
