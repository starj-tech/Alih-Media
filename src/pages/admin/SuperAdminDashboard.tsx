import { useState, useEffect } from 'react';
import { FileStack, CheckCircle, XCircle, Clock, FileSearch, CheckSquare, BarChart3 } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import ExportExcelButton from '@/components/ExportExcelButton';
import { getAdminStats, getAllBerkas, getUsers, Berkas, ManagedUser } from '@/lib/data';
import { getRoleLabel, UserRole } from '@/lib/auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const statusOptions = [
  { value: 'all', label: 'Semua Status' },
  { value: 'Proses', label: 'Proses' },
  { value: 'Validasi SU & Bidang', label: 'Validasi SU & Bidang' },
  { value: 'Validasi BT', label: 'Validasi BT' },
  { value: 'Selesai', label: 'Selesai' },
  { value: 'Ditolak', label: 'Ditolak' },
];

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({ total: 0, proses: 0, validasiSu: 0, validasiBt: 0, selesai: 0, ditolak: 0, adminCounts: {} as Record<string, number> });
  const [berkas, setBerkas] = useState<Berkas[]>([]);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    getAdminStats().then(setStats);
    getAllBerkas().then(setBerkas);
    getUsers().then(setUsers);
  }, []);

  const filteredBerkas = statusFilter === 'all' ? berkas : berkas.filter(b => b.status === statusFilter);

  const adminUsers = users.filter(u => ['admin_arsip', 'admin_validasi_su', 'admin_validasi_bt', 'admin'].includes(u.role));
  const adminPerformance = adminUsers.map(admin => ({
    name: admin.name,
    email: admin.email,
    role: getRoleLabel(admin.role as UserRole),
    count: stats.adminCounts[admin.id] || 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-foreground">Dashboard Super Admin</h1>
        <p className="text-sm text-muted-foreground">Monitoring seluruh kinerja dan berkas</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatsCard title="Total Pengajuan" value={stats.total} icon={FileStack} variant="primary" />
        <StatsCard title="Proses" value={stats.proses} icon={Clock} variant="primary" />
        <StatsCard title="Validasi SU" value={stats.validasiSu} icon={FileSearch} variant="primary" />
        <StatsCard title="Validasi BT" value={stats.validasiBt} icon={CheckSquare} variant="primary" />
        <StatsCard title="Selesai" value={stats.selesai} icon={CheckCircle} variant="success" />
        <StatsCard title="Ditolak" value={stats.ditolak} icon={XCircle} variant="danger" />
      </div>

      {/* Admin Performance Table */}
      <div className="gentelella-panel">
        <div className="gentelella-panel-heading">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Rekap Kinerja Admin
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

      <DataTable<Berkas>
        title="Monitoring Seluruh Berkas"
        searchKeys={['namaPemegangHak', 'desa']}
        headerActions={
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 text-xs w-48">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ExportExcelButton data={filteredBerkas} fileName="super-admin-dashboard" sheetName="Dashboard" />
          </div>
        }
        columns={[
          { header: 'No', accessor: (_, i) => i !== undefined ? i + 1 : '' } as any,
          { header: 'Tgl Pengajuan', accessor: 'tanggalPengajuan' },
          { header: 'Nama', accessor: 'namaPemegangHak' },
          { header: 'No.SU/Tahun', accessor: 'noSuTahun' },
          { header: 'No Hak', accessor: 'noHak' },
          { header: 'Jenis Hak', accessor: 'jenisHak' },
          { header: 'Desa', accessor: 'desa' },
          { header: 'Kecamatan', accessor: 'kecamatan' },
          { header: 'Status', accessor: (row) => <StatusBadge status={row.status} /> },
        ]}
        data={filteredBerkas}
      />
    </div>
  );
}
