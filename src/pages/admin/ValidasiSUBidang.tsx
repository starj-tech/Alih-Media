import { useState, useEffect, useCallback } from 'react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import FileDownloadCell from '@/components/FileDownloadCell';
import ExternalLinkCell from '@/components/ExternalLinkCell';
import ExportExcelButton from '@/components/ExportExcelButton';
import { getBerkasByStatusPaginated, updateBerkasStatus, isDueDateOverdue, Berkas, PaginatedResponse } from '@/lib/data';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Send, XCircle, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const KETERANGAN_PENOLAKAN = [
  'Pendaftaran Pelayanan',
  'Penataan Batas',
  'Pengukuran Ulang',
  'Perubahan Nama KTP',
  'Pemekaran Desa',
  'Pemekaran Kecamatan',
  'Revisi Double Nomor Hak',
];

export default function ValidasiSUBidang() {
  const { user } = useAuth();
  const [paginated, setPaginated] = useState<PaginatedResponse<Berkas>>({ data: [], current_page: 1, last_page: 1, per_page: 10, total: 0 });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [tolakId, setTolakId] = useState<string | null>(null);
  const [jenisPenolakan, setJenisPenolakan] = useState<'aplikasi' | 'whatsapp'>('aplikasi');
  const [keteranganPenolakan, setKeteranganPenolakan] = useState('');
  const [catatan, setCatatan] = useState('');
  const [kembalikanId, setKembalikanId] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [confirmKirimId, setConfirmKirimId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getBerkasByStatusPaginated('Validasi SU & Bidang', page, perPage);
      setPaginated(result);
    } finally {
      setLoading(false);
    }
  }, [page, perPage]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleKirim = async (id: string) => {
    if (processing) return;
    setProcessing(id);
    try {
      await updateBerkasStatus(id, 'Validasi BT', undefined, user?.id);
      toast.success('Berkas diteruskan ke Validasi Buku Tanah');
      loadData();
    } finally {
      setProcessing(null);
    }
  };

  const resetTolakForm = () => {
    setTolakId(null);
    setJenisPenolakan('aplikasi');
    setKeteranganPenolakan('');
    setCatatan('');
  };

  const handleTolak = async () => {
    if (!tolakId) return;
    if (!keteranganPenolakan) { toast.error('Pilih keterangan penolakan'); return; }

    const berkas = paginated.data.find(b => b.id === tolakId);
    const fullCatatan = catatan.trim()
      ? `${keteranganPenolakan} - ${catatan.trim()}`
      : keteranganPenolakan;

    if (jenisPenolakan === 'whatsapp' && berkas) {
      // Build WhatsApp message
      const namaPemilik = berkas.namaPemilikSertifikat || berkas.namaPemegangHak;
      const noWa = berkas.noWaPemohon || berkas.noTelepon || '';
      const phone = noWa.replace(/\D/g, '').replace(/^0/, '62');

      const message = `Yth Bapak/Ibu ${namaPemilik},\n\nBerkas Pengajuan Validasi Alihmedia dengan nomor Hak ${berkas.noHak} Jenis Hak ${berkas.jenisHak} Desa ${berkas.desa} Kecamatan ${berkas.kecamatan} harus dilakukan ${keteranganPenolakan}${catatan.trim() ? `, dengan penjelasan : ${catatan.trim()}` : ''}\n\nSilahkan untuk melakukan pendaftaran Pelayanan di Kantor Pertanahan Kabupaten Bogor II,\n\nAlamat : Jl. Alternatif Cibubur no. 6 Cileungsi, Kecamatan Cileungsi, Kabupaten Bogor, Jawa Barat 16820\n\nTerima Kasih`;

      const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank');
    }

    // Save rejection to backend regardless of type
    const currentStatus = berkas?.status;
    await updateBerkasStatus(tolakId, 'Ditolak', fullCatatan, user?.id, currentStatus);
    toast.success('Berkas ditolak');
    resetTolakForm();
    loadData();
  };

  const handleKembalikan = async () => {
    if (!kembalikanId) return;
    await updateBerkasStatus(kembalikanId, 'Proses', undefined, user?.id);
    toast.success('Berkas dikembalikan ke Arsip Verifikasi');
    setKembalikanId(null);
    loadData();
  };

  const tolakBerkas = tolakId ? paginated.data.find(b => b.id === tolakId) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Validasi SU & Bidang</h1>
        <p className="text-muted-foreground">Validasi Surat Ukur dan Bidang</p>
      </div>

      <DataTable<Berkas>
        title="Daftar Berkas Validasi SU & Bidang"
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
        headerActions={<ExportExcelButton data={paginated.data} fileName="validasi-su-bidang" sheetName="Validasi SU" />}
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
              <Button size="sm" className="gap-1" disabled={processing === row.id} onClick={() => setConfirmKirimId(row.id)}><Send className="w-3 h-3" /> Kirim</Button>
              <Button size="sm" variant="destructive" className="gap-1" onClick={() => { setTolakId(row.id); setJenisPenolakan('aplikasi'); setKeteranganPenolakan(''); setCatatan(''); }}><XCircle className="w-3 h-3" /> Tolak</Button>
              <Button size="sm" variant="outline" className="gap-1" onClick={() => setKembalikanId(row.id)}><Undo2 className="w-3 h-3" /></Button>
            </div>
          )},
        ]}
        data={paginated.data}
      />

      <Dialog open={!!tolakId} onOpenChange={(open) => { if (!open) resetTolakForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Penolakan Berkas</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {tolakBerkas?.catatanPenolakan && (
              <div className="p-3 rounded bg-destructive/10 border border-destructive/20">
                <p className="text-xs font-semibold text-destructive mb-1">Catatan sebelumnya:</p>
                <p className="text-sm text-destructive">{tolakBerkas.catatanPenolakan}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label className="font-semibold">1. Pilih Jenis Penolakan</Label>
              <RadioGroup value={jenisPenolakan} onValueChange={(v) => setJenisPenolakan(v as 'aplikasi' | 'whatsapp')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="aplikasi" id="tolak-app" />
                  <Label htmlFor="tolak-app" className="cursor-pointer">Tolak Melalui Aplikasi</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="whatsapp" id="tolak-wa" />
                  <Label htmlFor="tolak-wa" className="cursor-pointer">Tolak Melalui WhatsApp</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">2. Pilih Keterangan Penolakan</Label>
              <Select value={keteranganPenolakan} onValueChange={setKeteranganPenolakan}>
                <SelectTrigger>
                  <SelectValue placeholder="-- Pilih Keterangan --" />
                </SelectTrigger>
                <SelectContent>
                  {KETERANGAN_PENOLAKAN.map(k => (
                    <SelectItem key={k} value={k}>{k}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">3. Catatan Penolakan</Label>
              <Textarea value={catatan} onChange={e => setCatatan(e.target.value)} placeholder="Masukkan catatan penolakan berkas..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetTolakForm}>Batal</Button>
            <Button variant="destructive" onClick={handleTolak}>
              <Send className="w-3 h-3 mr-1" /> Kirim
            </Button>
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

      <Dialog open={!!confirmKirimId} onOpenChange={(open) => { if (!open) setConfirmKirimId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Konfirmasi Kirim</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Apakah Data Yang Akan di kirim sudah sesuai?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmKirimId(null)}>Batal</Button>
            <Button onClick={() => { if (confirmKirimId) { handleKirim(confirmKirimId); setConfirmKirimId(null); } }}>Ya, Kirim</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
