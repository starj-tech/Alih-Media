import { useState, useEffect } from 'react';
import { FileSearch, Clock, CheckCircle, XCircle, UserCheck } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import ExportExcelButton from '@/components/ExportExcelButton';
import FileDownloadCell from '@/components/FileDownloadCell';
import { getAllBerkas, getMyValidationCount, Berkas } from '@/lib/data';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardValidasiSU() {
  const { user } = useAuth();
  const [allBerkas, setAllBerkas] = useState<Berkas[]>([]);
  const [myCount, setMyCount] = useState(0);

  useEffect(() => {
    getAllBerkas().then(setAllBerkas);
    if (user?.id) getMyValidationCount(user.id).then(setMyCount);
  }, [user?.id]);

  const menunggu = allBerkas.filter(b => b.status === 'Validasi SU & Bidang');
  const sudahValidasi = allBerkas.filter(b => b.status === 'Validasi BT' || b.status === 'Selesai');
  const ditolak = allBerkas.filter(b => b.status === 'Ditolak');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-foreground">Dashboard Validasi SU & Bidang</h1>
        <p className="text-sm text-muted-foreground">Monitoring progres tahap validasi SU & Bidang</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="Menunggu Validasi SU" value={menunggu.length} icon={Clock} variant="primary" />
        <StatsCard title="Sudah Divalidasi" value={sudahValidasi.length} icon={CheckCircle} variant="success" />
        <StatsCard title="Ditolak" value={ditolak.length} icon={XCircle} variant="danger" />
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
