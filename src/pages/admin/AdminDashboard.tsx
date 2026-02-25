import { FileStack, CheckCircle, XCircle } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { getStats, getAllBerkas, Berkas } from '@/lib/data';

export default function AdminDashboard() {
  const stats = getStats();
  const berkas = getAllBerkas();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Selamat datang di panel administrasi</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard title="Total Pengajuan" value={stats.total} icon={FileStack} variant="primary" />
        <StatsCard title="Total Selesai" value={stats.selesai} icon={CheckCircle} variant="success" />
        <StatsCard title="Total Ditolak" value={stats.ditolak} icon={XCircle} variant="danger" />
      </div>

      <DataTable<Berkas>
        title="Monitoring Berkas Alihmedia"
        searchKeys={['namaPemegangHak', 'noBerkas', 'desa']}
        columns={[
          { header: 'No', accessor: (_, i) => i !== undefined ? i + 1 : '' } as any,
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
