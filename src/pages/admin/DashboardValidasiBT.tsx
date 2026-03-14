import { useState, useEffect } from 'react';
import { CheckSquare, Clock, CheckCircle, XCircle, UserCheck } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import ExportExcelButton from '@/components/ExportExcelButton';
import FileDownloadCell from '@/components/FileDownloadCell';
import { getAdminStats, getMyValidationCount, getBerkasByStatus, Berkas } from '@/lib/data';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardValidasiBT() {
  const { user } = useAuth();
  const [menunggu, setMenunggu] = useState<Berkas[]>([]);
  const [stats, setStats] = useState({ validasiBt: 0, selesai: 0, ditolak: 0 });
  const [myCount, setMyCount] = useState(0);

  useEffect(() => {
    getBerkasByStatus('Validasi BT').then(setMenunggu);
    getAdminStats().then(s => {
      setStats({ validasiBt: s.validasiBt, selesai: s.selesai, ditolak: s.ditolak });
    });
    if (user?.id) getMyValidationCount(user.id).then(setMyCount);
  }, [user?.id]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-foreground">Dashboard Validasi Buku Tanah</h1>
        <p className="text-sm text-muted-foreground">Monitoring progres tahap validasi buku tanah</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="Menunggu Validasi BT" value={stats.validasiBt} icon={Clock} variant="primary" />
        <StatsCard title="Selesai" value={stats.selesai} icon={CheckCircle} variant="success" />
        <StatsCard title="Ditolak" value={stats.ditolak} icon={XCircle} variant="danger" />
        <StatsCard title="Kinerja Saya" value={myCount} icon={UserCheck} variant="primary" />
      </div>

      <DataTable<Berkas>
        title="Berkas Tahap Validasi Buku Tanah"
        searchKeys={['noHak', 'desa']}
        headerActions={<ExportExcelButton data={menunggu} fileName="dashboard-validasi-bt" sheetName="Validasi BT" />}
        columns={[
          { header: 'No', accessor: (_, i) => (i ?? 0) + 1 } as any,
          { header: 'Tgl Pengajuan', accessor: 'tanggalPengajuan' },
          { header: 'Nama', accessor: 'namaPemegangHak' },
          { header: 'No.SU/Tahun', accessor: 'noSuTahun' },
          { header: 'No Hak', accessor: 'noHak', searchKey: 'noHak' },
          { header: 'Jenis Hak', accessor: 'jenisHak' },
          { header: 'Desa', accessor: 'desa', searchKey: 'desa' },
          { header: 'Kecamatan', accessor: 'kecamatan' },
          { header: 'Sertifikat', accessor: (row) => <FileDownloadCell url={row.fileSertifikatUrl} label="Sertifikat" /> },
          { header: 'KTP', accessor: (row) => <FileDownloadCell url={row.fileKtpUrl} label="KTP" /> },
          { header: 'Status', accessor: (row) => <StatusBadge status={row.status} /> },
        ]}
        data={menunggu}
      />
    </div>
  );
}
