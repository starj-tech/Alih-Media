import { useState, useEffect, useCallback } from 'react';
import { FileSearch, Clock, CheckCircle, XCircle, UserCheck } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import ExportExcelButton from '@/components/ExportExcelButton';
import FileDownloadCell from '@/components/FileDownloadCell';
import { getAdminStats, getMyValidationCount, getBerkasByStatusPaginated, Berkas, PaginatedResponse } from '@/lib/data';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardValidasiSU() {
  const { user } = useAuth();
  const [paginated, setPaginated] = useState<PaginatedResponse<Berkas>>({ data: [], current_page: 1, last_page: 1, per_page: 10, total: 0 });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ validasiSu: 0, sudahValidasi: 0, ditolak: 0 });
  const [myCount, setMyCount] = useState(0);

  const loadBerkas = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getBerkasByStatusPaginated('Validasi SU & Bidang', page, perPage);
      setPaginated(result);
    } finally {
      setLoading(false);
    }
  }, [page, perPage]);

  useEffect(() => { loadBerkas(); }, [loadBerkas]);

  useEffect(() => {
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
        serverPagination={{
          currentPage: paginated.current_page,
          totalPages: paginated.last_page,
          total: paginated.total,
          perPage,
          onPageChange: setPage,
          onPerPageChange: (n) => { setPerPage(n); setPage(1); },
          loading,
        }}
        headerActions={<ExportExcelButton data={paginated.data} fileName="dashboard-validasi-su" sheetName="Validasi SU" />}
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
        data={paginated.data}
      />
    </div>
  );
}
