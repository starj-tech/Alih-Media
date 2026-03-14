import { useState, useEffect } from 'react';
import { FileSearch, Clock, CheckCircle, XCircle, UserCheck } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import ExportExcelButton from '@/components/ExportExcelButton';
import FileDownloadCell from '@/components/FileDownloadCell';
import { getAdminStats, getMyValidationCount, getBerkasByStatus, Berkas } from '@/lib/data';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardValidasiSU() {
  const { user } = useAuth();
  const [menunggu, setMenunggu] = useState<Berkas[]>([]);
  const [stats, setStats] = useState({ validasiSu: 0, sudahValidasi: 0, ditolak: 0 });
  const [myCount, setMyCount] = useState(0);

  useEffect(() => {
    getBerkasByStatus('Validasi SU & Bidang').then(setMenunggu);
    getAdminStats().then(s => {
      setStats({
        validasiSu: s.validasiSu,
        sudahValidasi: s.validasiBt + s.selesai,
        ditolak: s.ditolak,
      });
    });
    if (user?.id) getMyValidationCount(user.id).then(setMyCount);
  }, [user?.id]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-foreground">Dashboard Validasi SU & Bidang</h1>
        <p className="text-sm text-muted-foreground">Monitoring progres tahap validasi SU & Bidang</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="Menunggu Validasi SU" value={stats.validasiSu} icon={Clock} variant="primary" />
        <StatsCard title="Sudah Divalidasi" value={stats.sudahValidasi} icon={CheckCircle} variant="success" />
        <StatsCard title="Ditolak" value={stats.ditolak} icon={XCircle} variant="danger" />
        <StatsCard title="Kinerja Saya" value={myCount} icon={UserCheck} variant="primary" />
      </div>

      <DataTable<Berkas>
        title="Berkas Tahap Validasi SU & Bidang"
        searchKeys={['noSuTahun', 'desa']}
        headerActions={<ExportExcelButton data={menunggu} fileName="dashboard-validasi-su" sheetName="Validasi SU" />}
        columns={[
          { header: 'No', accessor: (_, i) => (i ?? 0) + 1 } as any,
          { header: 'Tgl Pengajuan', accessor: 'tanggalPengajuan' },
          { header: 'Nama', accessor: 'namaPemegangHak' },
          { header: 'No.SU/Tahun', accessor: 'noSuTahun', searchKey: 'noSuTahun' },
          { header: 'No Hak', accessor: 'noHak' },
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
