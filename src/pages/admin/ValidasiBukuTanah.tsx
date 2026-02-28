import { useState, useEffect } from 'react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import FileDownloadCell from '@/components/FileDownloadCell';
import { getAllBerkas, updateBerkasStatus, deleteBerkas, isDueDateOverdue, Berkas } from '@/lib/data';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Send, XCircle, Trash2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import * as XLSX from 'xlsx';

export default function ValidasiBukuTanah() {
  const { user } = useAuth();
  const [berkas, setBerkas] = useState<Berkas[]>([]);
  const [tolakId, setTolakId] = useState<string | null>(null);
  const [catatan, setCatatan] = useState('');
  const [exportFrom, setExportFrom] = useState('');
  const [exportTo, setExportTo] = useState('');

  const loadData = async () => {
    const all = await getAllBerkas();
    setBerkas(all.filter(b => b.status === 'Validasi BT'));
  };

  useEffect(() => { loadData(); }, []);

  const handleKirim = async (id: string) => {
    await updateBerkasStatus(id, 'Selesai', undefined, user?.id);
    toast.success('Berkas selesai divalidasi');
    loadData();
  };

  const handleTolak = async () => {
    if (!tolakId) return;
    if (!catatan.trim()) { toast.error('Masukkan catatan penolakan'); return; }
    await updateBerkasStatus(tolakId, 'Ditolak', catatan.trim(), user?.id);
    toast.success('Berkas ditolak');
    setTolakId(null);
    setCatatan('');
    loadData();
  };

  const handleHapus = async (id: string) => {
    await deleteBerkas(id);
    toast.success('Berkas dihapus');
    loadData();
  };

  const parseDate = (dateStr: string) => {
    const parts = dateStr.split('/');
    return new Date(+parts[2], +parts[1] - 1, +parts[0]);
  };

  const handleExport = () => {
    let dataToExport = berkas;
    if (exportFrom || exportTo) {
      dataToExport = berkas.filter(b => {
        const d = parseDate(b.tanggalPengajuan);
        if (exportFrom && d < new Date(exportFrom)) return false;
        if (exportTo && d > new Date(exportTo + 'T23:59:59')) return false;
        return true;
      });
    }
    if (dataToExport.length === 0) { toast.error('Tidak ada data untuk diexport'); return; }
    const ws = XLSX.utils.json_to_sheet(dataToExport.map((b, i) => ({
      'No': i + 1, 'Tgl Pengajuan': b.tanggalPengajuan, 'Nama Pemegang Hak': b.namaPemegangHak,
      'No.SU/Tahun': b.noSuTahun, 'No Hak': b.noHak, 'Jenis Hak': b.jenisHak,
      'Desa': b.desa, 'Kecamatan': b.kecamatan, 'Status': b.status, 'Catatan Penolakan': b.catatanPenolakan || '-',
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Validasi BT');
    XLSX.writeFile(wb, `validasi-buku-tanah-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('File Excel berhasil diexport');
  };

  const tolakBerkas = tolakId ? berkas.find(b => b.id === tolakId) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Validasi Buku Tanah</h1>
        <p className="text-muted-foreground">Validasi berkas buku tanah yang masuk</p>
      </div>

      <DataTable<Berkas>
        title="Daftar Berkas Validasi Buku Tanah"
        searchKeys={['noHak', 'desa']}
        headerActions={
          <div className="flex items-center gap-2 flex-wrap">
            <Input type="date" value={exportFrom} onChange={e => setExportFrom(e.target.value)} className="h-8 text-xs w-36" />
            <Input type="date" value={exportTo} onChange={e => setExportTo(e.target.value)} className="h-8 text-xs w-36" />
            <Button size="sm" variant="outline" className="gap-1 h-8" onClick={handleExport}>
              <Download className="w-3.5 h-3.5" /> Export Excel
            </Button>
          </div>
        }
        columns={[
          { header: 'No', accessor: (_, i) => (i ?? 0) + 1 } as any,
          { header: 'Tgl Pengajuan', accessor: (row) => (
            <span className={isDueDateOverdue(row.tanggalPengajuan) ? 'text-destructive font-semibold' : ''}>{row.tanggalPengajuan}</span>
          )},
          { header: 'Nama', accessor: 'namaPemegangHak' },
          { header: 'No.SU/Tahun', accessor: 'noSuTahun' },
          { header: 'No Hak', accessor: 'noHak', searchKey: 'noHak' },
          { header: 'Jenis Hak', accessor: 'jenisHak' },
          { header: 'Desa', accessor: 'desa', searchKey: 'desa' },
          { header: 'Kecamatan', accessor: 'kecamatan' },
          { header: 'Sertifikat', accessor: (row) => <FileDownloadCell url={row.fileSertifikatUrl} label="Sertifikat" /> },
          { header: 'KTP', accessor: (row) => <FileDownloadCell url={row.fileKtpUrl} label="KTP" /> },
          { header: 'Status', accessor: (row) => <StatusBadge status={row.status} /> },
          { header: 'Catatan', accessor: (row) => <span className="text-xs text-muted-foreground">{row.catatanPenolakan || '-'}</span> },
          { header: 'Aksi', accessor: (row) => (
            <div className="flex gap-1">
              <Button size="sm" className="gap-1" onClick={() => handleKirim(row.id)}><Send className="w-3 h-3" /> Kirim</Button>
              <Button size="sm" variant="destructive" className="gap-1" onClick={() => { setTolakId(row.id); setCatatan(row.catatanPenolakan || ''); }}><XCircle className="w-3 h-3" /> Tolak</Button>
              <Button size="sm" variant="outline" className="gap-1 text-destructive hover:text-destructive" onClick={() => handleHapus(row.id)}><Trash2 className="w-3 h-3" /></Button>
            </div>
          )},
        ]}
        data={berkas}
      />

      <Dialog open={!!tolakId} onOpenChange={(open) => { if (!open) setTolakId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Catatan Penolakan</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {tolakBerkas?.catatanPenolakan && (
              <div className="p-3 rounded bg-destructive/10 border border-destructive/20">
                <p className="text-xs font-semibold text-destructive mb-1">Catatan sebelumnya:</p>
                <p className="text-sm text-destructive">{tolakBerkas.catatanPenolakan}</p>
              </div>
            )}
            <Label>Alasan penolakan</Label>
            <Textarea value={catatan} onChange={e => setCatatan(e.target.value)} placeholder="Masukkan alasan penolakan berkas..." rows={4} />
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
