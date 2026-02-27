import { FileStack, CheckCircle, XCircle } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { getStats, getBerkasByUser, Berkas } from '@/lib/data';
import { useAuth } from '@/hooks/useAuth';

export default function UserDashboard() {
  const { user } = useAuth();
  const stats = getStats();
  const berkas = user ? getBerkasByUser(user.id) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Selamat datang, {user?.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard title="Total Pengajuan" value={berkas.length} icon={FileStack} variant="primary" />
        <StatsCard title="Total Selesai" value={berkas.filter((b) => b.status === 'Selesai').length} icon={CheckCircle} variant="success" />
        <StatsCard title="Total Ditolak" value={berkas.filter((b) => b.status === 'Ditolak').length} icon={XCircle} variant="danger" />
      </div>

      <DataTable<Berkas>
        title="Monitoring Berkas Alihmedia"
        searchKeys={['namaPemegangHak', 'noBerkas']}
        columns={[
          { header: 'No', accessor: (_, i) => (i ?? 0) + 1 } as any,
          { header: 'No Berkas', accessor: 'noBerkas' },
          { header: 'Nama', accessor: 'namaPemegangHak' },
          { header: 'Jenis Hak', accessor: 'jenisHak' },
          { header: 'No Hak', accessor: 'noHak' },
          { header: 'Desa', accessor: 'desa' },
          { header: 'Kecamatan', accessor: 'kecamatan' },
          { header: 'Status', accessor: (row) => <StatusBadge status={row.status} /> },
        ]}
        data={berkas}
      />
    </div>
  );
}
