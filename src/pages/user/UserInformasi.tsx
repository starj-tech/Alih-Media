import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { getBerkasByUser, Berkas } from '@/lib/data';
import { useAuth } from '@/hooks/useAuth';

export default function UserInformasi() {
  const { user } = useAuth();
  const berkas = user ? getBerkasByUser(user.id) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Informasi Alihmedia</h1>
        <p className="text-muted-foreground">Monitoring berkas alihmedia anda</p>
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
          { header: 'Catatan', accessor: (row) => (
            <span className="text-xs text-muted-foreground">{row.catatanPenolakan || '-'}</span>
          )},
        ]}
        data={berkas}
      />
    </div>
  );
}
