import { useState, useEffect, useCallback } from 'react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import FileDownloadCell from '@/components/FileDownloadCell';
import ExternalLinkCell from '@/components/ExternalLinkCell';
import ExportExcelButton from '@/components/ExportExcelButton';
import { getBerkasByStatusPaginated, updateBerkasStatus, isDueDateOverdue, Berkas, getUsers, ManagedUser, PaginatedResponse } from '@/lib/data';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Send, XCircle, Undo2 } from 'lucide-react';
import { toast } from 'sonner';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function ValidasiBukuTanah() {
  const { user } = useAuth();
  const [paginated, setPaginated] = useState<PaginatedResponse<Berkas>>({ data: [], current_page: 1, last_page: 1, per_page: 10, total: 0 });
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [tolakId, setTolakId] = useState<string | null>(null);
  const [catatan, setCatatan] = useState('');
  const [kembalikanId, setKembalikanId] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [confirmKirimId, setConfirmKirimId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [result, allUsers] = await Promise.all([
        getBerkasByStatusPaginated('Validasi BT', page, perPage),
        getUsers(),
      ]);
      setPaginated(result);
      setUsers(allUsers);
    } finally {
      setLoading(false);
    }
  }, [page, perPage]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleKirim = async (id: string) => {
    if (processing) return;
    setProcessing(id);
    try {
    const item = paginated.data.find(b => b.id === id);
    await updateBerkasStatus(id, 'Selesai', undefined, user?.id);
    toast.success('Berkas selesai divalidasi');

    // Determine WhatsApp number and name
    let waNumber = '';
    let namaPenerima = '';
    
    if (item?.noWaPemohon) {
      waNumber = item.noWaPemohon;
      namaPenerima = item.namaPemilikSertifikat || item.namaPemegangHak;
    } else if (item) {
      const submitter = users.find(u => u.id === item.userId);
      waNumber = submitter?.noTelepon || '';
      namaPenerima = item.namaPemegangHak;
    }

    if (waNumber) {
      const noHak = item?.noHak || '';
      const jenisHak = item?.jenisHak || '';
      const desa = item?.desa || '';
      const kecamatan = item?.kecamatan || '';
      const message = `Yth Bapak/Ibu ${namaPenerima.toUpperCase()},\n\nBerkas Pengajuan Validasi Alihmedia dengan nomor hak ${noHak} jenis hak ${jenisHak} desa ${desa} kecamatan ${kecamatan} sudah selesai, silahkan untuk melakukan pendaftaran Pelayanan di Kantor Pertanahan Kabupaten Bogor II,\n\nPertanyaan, saran dan keluhan dapat menghubungi Kantor Pertanahan Kabupaten Bogor II\n\nAlamat : Jl. Alternatif Cibubur no. 6 Cileungsi, Kecamatan Cileungsi, Kabupaten Bogor , Jawa Barat 16820\n\nTerima Kasih`;

      let cleaned = waNumber.replace(/\D/g, '');
      if (cleaned.startsWith('0')) cleaned = '62' + cleaned.slice(1);
      if (!cleaned.startsWith('62')) cleaned = '62' + cleaned;

      const waUrl = `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank');
    }

    loadData();
    } finally {
      setProcessing(null);
    }
  };

  const handleTolak = async () => {
    if (!tolakId) return;
    if (!catatan.trim()) { toast.error('Masukkan catatan penolakan'); return; }
    const currentStatus = paginated.data.find(b => b.id === tolakId)?.status;
    await updateBerkasStatus(tolakId, 'Ditolak', catatan.trim(), user?.id, currentStatus);
    toast.success('Berkas ditolak');
    setTolakId(null);
    setCatatan('');
    loadData();
  };

  const handleKembalikan = async () => {
    if (!kembalikanId) return;
    await updateBerkasStatus(kembalikanId, 'Validasi SU & Bidang', undefined, user?.id);
    toast.success('Berkas dikembalikan ke Validasi SU & Bidang');
    setKembalikanId(null);
    loadData();
  };

  const tolakBerkas = tolakId ? paginated.data.find(b => b.id === tolakId) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Validasi Buku Tanah</h1>
        <p className="text-muted-foreground">Validasi berkas buku tanah yang masuk</p>
      </div>

      <DataTable<Berkas>
        title="Daftar Berkas Validasi Buku Tanah"
        searchKeys={['noHak', 'desa']}
        serverPagination={{
          currentPage: paginated.current_page,
          totalPages: paginated.last_page,
          total: paginated.total,
          perPage,
          onPageChange: setPage,
          onPerPageChange: (n) => { setPerPage(n); setPage(1); },
          loading,
        }}
        headerActions={<ExportExcelButton data={paginated.data} fileName="validasi-buku-tanah" sheetName="Validasi BT" />}
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
          { header: 'Foto Bangunan', accessor: (row) => <FileDownloadCell url={row.fileFotoBangunanUrl} label="Foto Bangunan" /> },
          { header: 'Link', accessor: (row) => <ExternalLinkCell url={row.linkShareloc} /> },
          { header: 'Status', accessor: (row) => <StatusBadge status={row.status} /> },
          { header: 'Catatan', accessor: (row) => <span className="text-xs text-muted-foreground">{row.catatanPenolakan || '-'}</span> },
          { header: 'Aksi', accessor: (row) => (
            <div className="flex gap-1">
              <Button size="sm" className="gap-1" disabled={processing === row.id} onClick={() => setConfirmKirimId(row.id)}><Send className="w-3 h-3" /> Kirim</Button>
              <Button size="sm" variant="destructive" className="gap-1" onClick={() => { setTolakId(row.id); setCatatan(row.catatanPenolakan || ''); }}><XCircle className="w-3 h-3" /> Tolak</Button>
              <Button size="sm" variant="outline" className="gap-1" onClick={() => setKembalikanId(row.id)}><Undo2 className="w-3 h-3" /></Button>
            </div>
          )},
        ]}
        data={paginated.data}
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
