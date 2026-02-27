import { useState } from 'react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { getAllBerkas, updateBerkasStatus, deleteBerkas, isDueDateOverdue, Berkas } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Send, XCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function ValidasiSUBidang() {
  const [, setRefresh] = useState(0);
  const [tolakId, setTolakId] = useState<string | null>(null);
  const [catatan, setCatatan] = useState('');
  
  const berkas = getAllBerkas().filter(b => b.status === 'Proses' || b.status === 'Validasi SU & Bidang');

  const handleKirim = (id: string) => {
    updateBerkasStatus(id, 'Validasi BT');
    toast.success('Berkas diteruskan ke Validasi Buku Tanah');
    setRefresh(v => v + 1);
  };

  const handleTolak = () => {
    if (!tolakId) return;
    if (!catatan.trim()) {
      toast.error('Masukkan catatan penolakan');
      return;
    }
    updateBerkasStatus(tolakId, 'Ditolak', catatan.trim());
    toast.success('Berkas ditolak');
    setTolakId(null);
    setCatatan('');
    setRefresh(v => v + 1);
  };

  const handleHapus = (id: string) => {
    deleteBerkas(id);
    toast.success('Berkas dihapus');
    setRefresh(v => v + 1);
  };

  const tolakBerkas = tolakId ? getAllBerkas().find(b => b.id === tolakId) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Validasi SU & Bidang</h1>
        <p className="text-muted-foreground">Validasi Surat Ukur dan Bidang</p>
      </div>

      <DataTable<Berkas>
        title="Daftar Berkas Validasi SU & Bidang"
        searchKeys={['noSuTahun', 'desa']}
        columns={[
          { header: 'No', accessor: (_, i) => (i ?? 0) + 1 } as any,
          { header: 'Tgl Pengajuan', accessor: (row) => (
            <span className={isDueDateOverdue(row.tanggalPengajuan) ? 'text-destructive font-semibold' : ''}>
              {row.tanggalPengajuan}
            </span>
          )},
          { header: 'Nama', accessor: 'namaPemegangHak' },
          { header: 'No.SU/Tahun', accessor: 'noSuTahun', searchKey: 'noSuTahun' },
          { header: 'No Hak', accessor: 'noHak' },
          { header: 'Jenis Hak', accessor: 'jenisHak' },
          { header: 'Desa', accessor: 'desa', searchKey: 'desa' },
          { header: 'Kecamatan', accessor: 'kecamatan' },
          { header: 'Status', accessor: (row) => <StatusBadge status={row.status} /> },
          { header: 'Catatan', accessor: (row) => (
            <span className="text-xs text-muted-foreground">{row.catatanPenolakan || '-'}</span>
          )},
          { header: 'Aksi', accessor: (row) => (
            <div className="flex gap-1">
              <Button size="sm" className="gap-1" onClick={() => handleKirim(row.id)}>
                <Send className="w-3 h-3" /> Kirim
              </Button>
              <Button size="sm" variant="destructive" className="gap-1" onClick={() => { setTolakId(row.id); setCatatan(row.catatanPenolakan || ''); }}>
                <XCircle className="w-3 h-3" /> Tolak
              </Button>
              <Button size="sm" variant="outline" className="gap-1 text-destructive hover:text-destructive" onClick={() => handleHapus(row.id)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          )},
        ]}
        data={berkas}
      />

      <Dialog open={!!tolakId} onOpenChange={(open) => { if (!open) setTolakId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Catatan Penolakan</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {tolakBerkas?.catatanPenolakan && (
              <div className="p-3 rounded bg-destructive/10 border border-destructive/20">
                <p className="text-xs font-semibold text-destructive mb-1">Catatan sebelumnya:</p>
                <p className="text-sm text-destructive">{tolakBerkas.catatanPenolakan}</p>
              </div>
            )}
            <Label>Alasan penolakan</Label>
            <Textarea
              value={catatan}
              onChange={e => setCatatan(e.target.value)}
              placeholder="Masukkan alasan penolakan berkas..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTolakId(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleTolak}>Tolak Berkas</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
