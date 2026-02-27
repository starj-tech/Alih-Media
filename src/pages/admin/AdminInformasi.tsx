import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { getAllBerkas, Berkas } from '@/lib/data';

export default function AdminInformasi() {
  const berkas = getAllBerkas();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Informasi Alihmedia</h1>
        <p className="text-muted-foreground">Monitoring seluruh berkas alihmedia</p>
      </div>

      <DataTable<Berkas>
        title="Verifikasi Arsip"
        searchKeys={['noHak', 'noSuTahun', 'desa']}
        columns={[
          { header: 'No', accessor: (_, i) => (i ?? 0) + 1 } as any,
          { header: 'Tgl Pengajuan', accessor: 'tanggalPengajuan' },
          { header: 'Nama', accessor: 'namaPemegangHak' },
          { header: 'No.SU/Tahun', accessor: 'noSuTahun', searchKey: 'noSuTahun' },
          { header: 'No Hak', accessor: 'noHak', searchKey: 'noHak' },
          { header: 'Jenis Hak', accessor: 'jenisHak' },
          { header: 'Desa', accessor: 'desa', searchKey: 'desa' },
          { header: 'Kecamatan', accessor: 'kecamatan' },
          { header: 'Status', accessor: (row) => <StatusBadge status={row.status} /> },
          { header: 'Catatan', accessor: (row) => (
            <span className="text-xs text-muted-foreground">{row.catatanPenolakan || '-'}</span>
          )},
        ]}
        data={berkas}
      />
    </div>
  );
}
