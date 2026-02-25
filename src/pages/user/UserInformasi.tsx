import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { getBerkasByUser, Berkas } from '@/lib/data';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function UserInformasi() {
  const { user } = useAuth();
  const navigate = useNavigate();
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
          { header: 'Aksi', accessor: (row) => row.status === 'Selesai' ? (
            <Button size="sm" variant="outline" className="gap-1" onClick={() => navigate(`/cetak/${row.id}`)}>
              <Printer className="w-3 h-3" /> Cetak
            </Button>
          ) : null },
        ]}
        data={berkas}
      />
    </div>
  );
}
