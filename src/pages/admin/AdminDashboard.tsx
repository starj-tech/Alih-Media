import { useState, useEffect } from 'react';
import { FileStack, CheckCircle, XCircle } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { getStats, getAllBerkas, Berkas } from '@/lib/data';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, selesai: 0, ditolak: 0 });
  const [berkas, setBerkas] = useState<Berkas[]>([]);

  useEffect(() => {
    getStats().then(setStats);
    getAllBerkas().then(setBerkas);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Selamat datang di panel administrasi</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard title="Total Pengajuan" value={stats.total} icon={FileStack} variant="primary" />
        <StatsCard title="Total Selesai" value={stats.selesai} icon={CheckCircle} variant="success" />
        <StatsCard title="Total Ditolak" value={stats.ditolak} icon={XCircle} variant="danger" />
      </div>

      <DataTable<Berkas>
        title="Monitoring Berkas Alihmedia"
        searchKeys={['namaPemegangHak', 'desa']}
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
        data={berkas}
      />
    </div>
  );
}
