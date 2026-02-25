import { useState } from 'react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { getAllBerkas, updateBerkasStatus, isDueDateOverdue, Berkas } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { toast } from 'sonner';

export default function ValidasiBukuTanah() {
  const [, setRefresh] = useState(0);
  
  const berkas = getAllBerkas().filter(b => b.status === 'Proses' || b.status === 'Validasi BT');

  const handleKirim = (id: string) => {
    updateBerkasStatus(id, 'Validasi SU & Bidang');
    toast.success('Berkas diteruskan ke Validasi SU & Bidang');
    setRefresh(v => v + 1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Validasi Buku Tanah</h1>
        <p className="text-muted-foreground">Validasi berkas buku tanah yang masuk</p>
      </div>

      <DataTable<Berkas>
        title="Daftar Berkas Validasi Buku Tanah"
        searchKeys={['namaPemegangHak', 'noBerkas']}
        columns={[
          { header: 'No', accessor: (_, i) => (i ?? 0) + 1 } as any,
          { header: 'No Berkas', accessor: 'noBerkas' },
          { header: 'Tgl Pengajuan', accessor: (row) => (
            <span className={isDueDateOverdue(row.tanggalPengajuan) ? 'text-destructive font-semibold' : ''}>
              {row.tanggalPengajuan}
            </span>
          )},
          { header: 'Nama', accessor: 'namaPemegangHak' },
          { header: 'Jenis Hak', accessor: 'jenisHak' },
          { header: 'No Hak', accessor: 'noHak' },
          { header: 'Desa', accessor: 'desa' },
          { header: 'Kecamatan', accessor: 'kecamatan' },
          { header: 'Status', accessor: (row) => <StatusBadge status={row.status} /> },
          { header: 'Progres', accessor: (row) => (
            <Button size="sm" className="gap-1" onClick={() => handleKirim(row.id)}>
              <Send className="w-3 h-3" /> Kirim
            </Button>
          )},
        ]}
        data={berkas}
      />
    </div>
  );
}
