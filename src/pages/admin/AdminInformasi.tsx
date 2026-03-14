import { useState, useEffect } from 'react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import ExternalLinkCell from '@/components/ExternalLinkCell';
import FileDownloadCell from '@/components/FileDownloadCell';
import ExportExcelButton from '@/components/ExportExcelButton';
import BerkasTimelineDialog from '@/components/BerkasTimelineDialog';
import { fetchBerkas, deleteUploadedFiles, updateBerkasStatus, Berkas, BerkasStatus } from '@/lib/data';
import { useAuth } from '@/hooks/useAuth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eye, Trash2, Undo2 } from 'lucide-react';
import { toast } from 'sonner';

const statusOptions: { value: string; label: string }[] = [
  { value: 'all', label: 'Semua Status' },
  { value: 'Proses', label: 'Proses' },
  { value: 'Validasi SU & Bidang', label: 'Validasi SU & Bidang' },
  { value: 'Validasi BT', label: 'Validasi BT' },
  { value: 'Selesai', label: 'Selesai' },
  { value: 'Ditolak', label: 'Ditolak' },
];

const kembalikanOptions: { value: BerkasStatus; label: string }[] = [
  { value: 'Proses', label: 'Arsip Verifikasi' },
  { value: 'Validasi SU & Bidang', label: 'Validasi SU/Bidang' },
  { value: 'Validasi BT', label: 'Validasi BT' },
];

export default function AdminInformasi() {
  const { user } = useAuth();
  const [berkas, setBerkas] = useState<Berkas[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [timelineBerkas, setTimelineBerkas] = useState<Berkas | null>(null);
  const [kembalikanBerkas, setKembalikanBerkas] = useState<Berkas | null>(null);
  const [kembalikanLoading, setKembalikanLoading] = useState(false);

  const isSuperAdmin = user?.role === 'super_admin';

  const loadData = () => { fetchBerkas().then(setBerkas); };
  useEffect(() => { loadData(); }, []);

  const filteredBerkas = statusFilter === 'all' ? berkas : berkas.filter(b => b.status === statusFilter);

  const handleDeleteFiles = async (row: Berkas) => {
    if (!row.fileSertifikatUrl && !row.fileKtpUrl && !row.fileFotoBangunanUrl) { toast.info('Tidak ada file untuk dihapus'); return; }
    const ok = await deleteUploadedFiles(row.id);
    if (ok) { toast.success('File berhasil dihapus'); loadData(); }
    else toast.error('Gagal menghapus file');
  };

  const handleKembalikan = async (targetStatus: BerkasStatus) => {
    if (!kembalikanBerkas || !user) return;
    setKembalikanLoading(true);
    try {
      await updateBerkasStatus(kembalikanBerkas.id, targetStatus, undefined, user.id);
      toast.success(`Berkas dikembalikan ke ${kembalikanOptions.find(o => o.value === targetStatus)?.label}`);
      setKembalikanBerkas(null);
      loadData();
    } catch {
      toast.error('Gagal mengembalikan berkas');
    } finally {
      setKembalikanLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Informasi Alihmedia</h1>
        <p className="text-muted-foreground">Monitoring seluruh berkas alihmedia</p>
      </div>

      <DataTable<Berkas>
        title="Verifikasi Arsip"
        searchKeys={['noHak', 'noSuTahun', 'desa']}
        headerActions={
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 text-xs w-48">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ExportExcelButton data={filteredBerkas} fileName="informasi-alihmedia" sheetName="Informasi" />
          </div>
        }
        columns={[
          { header: 'No', accessor: (_, i) => (i ?? 0) + 1 } as any,
          { header: 'Tgl Pengajuan', accessor: 'tanggalPengajuan' },
          { header: 'Nama', accessor: 'namaPemegangHak' },
          { header: 'No.SU/Tahun', accessor: 'noSuTahun', searchKey: 'noSuTahun' },
          { header: 'No Hak', accessor: 'noHak', searchKey: 'noHak' },
          { header: 'Jenis Hak', accessor: 'jenisHak' },
          { header: 'Desa', accessor: 'desa', searchKey: 'desa' },
          { header: 'Kecamatan', accessor: 'kecamatan' },
          { header: 'Sertifikat', accessor: (row) => <FileDownloadCell url={row.fileSertifikatUrl} label="Sertifikat" /> },
          { header: 'KTP', accessor: (row) => <FileDownloadCell url={row.fileKtpUrl} label="KTP" /> },
          { header: 'Foto Bangunan', accessor: (row) => <FileDownloadCell url={row.fileFotoBangunanUrl} label="Foto Bangunan" /> },
          { header: 'Link', accessor: (row) => <ExternalLinkCell url={row.linkShareloc} /> },
          { header: 'Status', accessor: (row) => <StatusBadge status={row.status} /> },
          { header: 'Catatan', accessor: (row) => <span className="text-xs text-muted-foreground">{row.catatanPenolakan || '-'}</span> },
          { header: 'Aksi', accessor: (row) => (
            <div className="flex gap-1">
              <Button size="sm" variant="outline" className="gap-1" onClick={() => setTimelineBerkas(row)}>
                <Eye className="w-3 h-3" /> Detail
              </Button>
              {isSuperAdmin && (
                <Button size="sm" variant="outline" className="gap-1" onClick={() => setKembalikanBerkas(row)}>
                  <Undo2 className="w-3 h-3" /> Kembali
                </Button>
              )}
              {isSuperAdmin && row.status === 'Selesai' && (row.fileSertifikatUrl || row.fileKtpUrl || row.fileFotoBangunanUrl) && (
                <Button size="sm" variant="outline" className="gap-1 text-destructive hover:text-destructive" onClick={() => handleDeleteFiles(row)}>
                  <Trash2 className="w-3 h-3" /> Hapus File
                </Button>
              )}
            </div>
          )},
        ]}
        data={filteredBerkas}
      />

      <BerkasTimelineDialog berkas={timelineBerkas} open={!!timelineBerkas} onOpenChange={(open) => { if (!open) setTimelineBerkas(null); }} />

      {/* Kembalikan Dialog */}
      <Dialog open={!!kembalikanBerkas} onOpenChange={(open) => { if (!open) setKembalikanBerkas(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kembalikan Berkas</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Silahkan Pilih Bagian Yang Akan Dituju</p>
          <div className="flex flex-col gap-2 mt-2">
            {kembalikanOptions.map(opt => (
              <Button
                key={opt.value}
                variant="outline"
                className="justify-start"
                disabled={kembalikanLoading || kembalikanBerkas?.status === opt.value}
                onClick={() => handleKembalikan(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKembalikanBerkas(null)} disabled={kembalikanLoading}>Batal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}