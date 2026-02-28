import { useState, useEffect } from 'react';
import { CheckSquare, Clock, CheckCircle, XCircle } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import ExportExcelButton from '@/components/ExportExcelButton';
import FileDownloadCell from '@/components/FileDownloadCell';
import { getAllBerkas, Berkas } from '@/lib/data';

export default function DashboardValidasiBT() {
  const [allBerkas, setAllBerkas] = useState<Berkas[]>([]);

  useEffect(() => { getAllBerkas().then(setAllBerkas); }, []);

  const menunggu = allBerkas.filter(b => b.status === 'Validasi BT');
  const selesai = allBerkas.filter(b => b.status === 'Selesai');
  const ditolak = allBerkas.filter(b => b.status === 'Ditolak');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-foreground">Dashboard Validasi Buku Tanah</h1>
        <p className="text-sm text-muted-foreground">Monitoring progres tahap validasi buku tanah</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard title="Menunggu Validasi BT" value={menunggu.length} icon={Clock} variant="primary" />
        <StatsCard title="Selesai" value={selesai.length} icon={CheckCircle} variant="success" />
        <StatsCard title="Ditolak" value={ditolak.length} icon={XCircle} variant="danger" />
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
