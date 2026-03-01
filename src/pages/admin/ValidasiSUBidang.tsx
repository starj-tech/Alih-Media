import { useState, useEffect, useRef } from 'react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import FileDownloadCell from '@/components/FileDownloadCell';
import ExternalLinkCell from '@/components/ExternalLinkCell';
import ExportExcelButton from '@/components/ExportExcelButton';
import { getAllBerkas, updateBerkasStatus, uploadFile, isDueDateOverdue, Berkas } from '@/lib/data';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Send, XCircle, Undo2, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';

export default function ValidasiSUBidang() {
  const { user } = useAuth();
  const [berkas, setBerkas] = useState<Berkas[]>([]);
  const [tolakId, setTolakId] = useState<string | null>(null);
  const [catatan, setCatatan] = useState('');
  const [kembalikanId, setKembalikanId] = useState<string | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [fileFoto, setFileFoto] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fotoRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    const all = await getAllBerkas();
    setBerkas(all.filter(b => b.status === 'Validasi SU & Bidang'));
  };

  useEffect(() => { loadData(); }, []);

  const handleKirim = async (id: string) => {
    await updateBerkasStatus(id, 'Validasi BT', undefined, user?.id);
    toast.success('Berkas diteruskan ke Validasi Buku Tanah');
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

  const handleKembalikan = async () => {
    if (!kembalikanId) return;
    await updateBerkasStatus(kembalikanId, 'Proses', undefined, user?.id);
    toast.success('Berkas dikembalikan ke Arsip Verifikasi');
    setKembalikanId(null);
    loadData();
  };

  const validateFileImage = (file: File): boolean => {
    if (!['image/jpeg', 'image/jpg'].includes(file.type)) { toast.error('File harus berformat JPG/JPEG'); return false; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Ukuran file maksimal 5MB'); return false; }
    return true;
  };

  const handleUploadFoto = async () => {
    if (!uploadId || !fileFoto || !user) return;
    setUploading(true);
    try {
      const url = await uploadFile(fileFoto, user.id, 'foto-bangunan' as any);
      if (!url) { toast.error('Gagal mengupload foto'); return; }
      await supabase.from('berkas').update({ file_foto_bangunan_url: url }).eq('id', uploadId);
      toast.success('Foto bangunan berhasil diupload');
      setUploadId(null);
      setFileFoto(null);
      if (fotoRef.current) fotoRef.current.value = '';
      loadData();
    } finally {
      setUploading(false);
    }
  };

  const tolakBerkas = tolakId ? berkas.find(b => b.id === tolakId) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Validasi SU & Bidang</h1>
        <p className="text-muted-foreground">Validasi Surat Ukur dan Bidang</p>
      </div>

      <DataTable<Berkas>
        title="Daftar Berkas Validasi SU & Bidang"
        searchKeys={['noSuTahun', 'desa']}
        headerActions={<ExportExcelButton data={berkas} fileName="validasi-su-bidang" sheetName="Validasi SU" />}
        columns={[
          { header: 'No', accessor: (_, i) => (i ?? 0) + 1 } as any,
          { header: 'Tgl Pengajuan', accessor: (row) => (
            <span className={isDueDateOverdue(row.tanggalPengajuan) ? 'text-destructive font-semibold' : ''}>{row.tanggalPengajuan}</span>
          )},
          { header: 'Nama', accessor: 'namaPemegangHak' },
          { header: 'No.SU/Tahun', accessor: 'noSuTahun', searchKey: 'noSuTahun' },
          { header: 'No Hak', accessor: 'noHak' },
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
              <Button size="sm" className="gap-1" onClick={() => handleKirim(row.id)}><Send className="w-3 h-3" /> Kirim</Button>
              <Button size="sm" variant="destructive" className="gap-1" onClick={() => { setTolakId(row.id); setCatatan(row.catatanPenolakan || ''); }}><XCircle className="w-3 h-3" /> Tolak</Button>
              <Button size="sm" variant="outline" className="gap-1" onClick={() => setUploadId(row.id)}><ImagePlus className="w-3 h-3" /></Button>
              <Button size="sm" variant="outline" className="gap-1" onClick={() => setKembalikanId(row.id)}><Undo2 className="w-3 h-3" /></Button>
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

      <Dialog open={!!kembalikanId} onOpenChange={(open) => { if (!open) setKembalikanId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Kembalikan Berkas</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Apakah Anda yakin ingin mengembalikan Data ini ke Petugas Sebelumnya?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKembalikanId(null)}>Batal</Button>
            <Button onClick={handleKembalikan}>Ya, Kembalikan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Foto Bangunan Dialog */}
      <Dialog open={!!uploadId} onOpenChange={(open) => { if (!open) { setUploadId(null); setFileFoto(null); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Photo Bangunan / Lokasi Tanah dengan Geotag</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label className="text-xs">Upload photo Bangunan / Lokasi Tanah dengan Geotag (JPG, maks 5MB) <span className="text-destructive">*</span></Label>
            <Input
              ref={fotoRef}
              type="file"
              accept=".jpg,.jpeg"
              className="h-8 text-sm"
              onChange={e => {
                const file = e.target.files?.[0] || null;
                if (file && !validateFileImage(file)) { e.target.value = ''; return; }
                setFileFoto(file);
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setUploadId(null); setFileFoto(null); }}>Batal</Button>
            <Button onClick={handleUploadFoto} disabled={uploading || !fileFoto}>
              {uploading ? 'Mengupload...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
