import { useState, useEffect } from 'react';
import { FileStack, CheckCircle, XCircle } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import ExportExcelButton from '@/components/ExportExcelButton';
import { fetchBerkas, Berkas } from '@/lib/data';
import { useAuth } from '@/hooks/useAuth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const statusOptions = [
  { value: 'all', label: 'Semua Status' },
  { value: 'Proses', label: 'Proses' },
  { value: 'Validasi SU & Bidang', label: 'Validasi SU & Bidang' },
  { value: 'Validasi BT', label: 'Validasi BT' },
  { value: 'Selesai', label: 'Selesai' },
  { value: 'Ditolak', label: 'Ditolak' },
];

export default function UserDashboard() {
  const { user } = useAuth();
  const [berkas, setBerkas] = useState<Berkas[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (user) fetchBerkas().then(setBerkas);
  }, [user]);

  const filteredBerkas = statusFilter === 'all' ? berkas : berkas.filter(b => b.status === statusFilter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Selamat datang, {user?.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard title="Total Pengajuan" value={berkas.length} icon={FileStack} variant="primary" />
        <StatsCard title="Total Selesai" value={berkas.filter(b => b.status === 'Selesai').length} icon={CheckCircle} variant="success" />
        <StatsCard title="Total Ditolak" value={berkas.filter(b => b.status === 'Ditolak').length} icon={XCircle} variant="danger" />
      </div>

      <DataTable<Berkas>
        title="Monitoring Berkas Alihmedia"
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
            <ExportExcelButton data={filteredBerkas} fileName="dashboard-user" sheetName="Dashboard" />
          </div>
        }
        columns={[
          { header: 'No', accessor: (_, i) => (i ?? 0) + 1 } as any,
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
