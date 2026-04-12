import { useState, useEffect, useCallback } from 'react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import FileDownloadCell from '@/components/FileDownloadCell';
import ExternalLinkCell from '@/components/ExternalLinkCell';
import ExportExcelButton from '@/components/ExportExcelButton';
import TolakBerkasDialog from '@/components/TolakBerkasDialog';
import { getBerkasByStatusPaginated, updateBerkasStatus, isDueDateOverdue, Berkas, getUsers, ManagedUser, PaginatedResponse, BerkasStatus } from '@/lib/data';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Send, XCircle, Undo2, CheckSquare, Square, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'Semua Status', value: 'all' },
  { label: 'Proses', value: 'Proses' },
  { label: 'Validasi SU & Bidang', value: 'Validasi SU & Bidang' },
  { label: 'Validasi BT', value: 'Validasi BT' },
  { label: 'Selesai Belum Diinfokan', value: 'Selesai Belum Diinfokan' },
  { label: 'Selesai', value: 'Selesai' },
  { label: 'Ditolak', value: 'Ditolak' },
];

export default function ValidasiBukuTanah() {
  const { user } = useAuth();
  const [paginated, setPaginated] = useState<PaginatedResponse<Berkas>>({ data: [], current_page: 1, last_page: 1, per_page: 10, total: 0 });
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Validasi BT');
  const [loading, setLoading] = useState(false);
  const [tolakId, setTolakId] = useState<string | null>(null);
  const [kembalikanId, setKembalikanId] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [confirmKirimId, setConfirmKirimId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('validasi_bt_selected');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  useEffect(() => {
    localStorage.setItem('validasi_bt_selected', JSON.stringify([...selectedIds]));
  }, [selectedIds]);
  const [confirmBulkSelesai, setConfirmBulkSelesai] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const statusParam = statusFilter === 'all' ? undefined : statusFilter;
      const [result, allUsers] = await Promise.all([
        getBerkasByStatusPaginated(statusParam || 'Validasi BT', page, perPage, search || undefined),
        getUsers(),
      ]);
      setPaginated(result);
      setUsers(allUsers);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, statusFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  // Clear selections when data/filter changes
  useEffect(() => { setSelectedIds(new Set()); localStorage.removeItem('validasi_bt_selected'); }, [statusFilter]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.data.map(b => b.id)));
    }
  };

  const handleKirim = async (id: string) => {
    if (processing) return;
    setProcessing(id);
    try {
      const item = paginated.data.find(b => b.id === id);
      await updateBerkasStatus(id, 'Selesai Belum Diinfokan', undefined, user?.id);
      toast.success('Berkas selesai divalidasi, status: Selesai Belum Diinfokan');
      loadData();
    } finally {
      setProcessing(null);
    }
  };

  const handleSelesaikanDanInfokan = async (id: string) => {
    const item = paginated.data.find(b => b.id === id);
    await updateBerkasStatus(id, 'Selesai', undefined, user?.id);

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
      const message = `Yth Bapak/Ibu ${namaPenerima.toUpperCase()},\n\nBerkas Pengajuan Validasi Alihmedia dengan nomor hak ${item?.noHak || ''} jenis hak ${item?.jenisHak || ''} desa ${item?.desa || ''} kecamatan ${item?.kecamatan || ''} sudah selesai, silahkan untuk melakukan pendaftaran Pelayanan di Kantor Pertanahan Kabupaten Bogor II,\n\nPertanyaan, saran dan keluhan dapat menghubungi Kantor Pertanahan Kabupaten Bogor II\n\nAlamat : Jl. Alternatif Cibubur no. 6 Cileungsi, Kecamatan Cileungsi, Kabupaten Bogor , Jawa Barat 16820\n\nTerima Kasih`;
      let cleaned = waNumber.replace(/\D/g, '');
      if (cleaned.startsWith('0')) cleaned = '62' + cleaned.slice(1);
      if (!cleaned.startsWith('62')) cleaned = '62' + cleaned;
      window.open(`https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const handleBulkSelesai = async () => {
    if (selectedIds.size === 0) return;
    setBulkProcessing(true);
    try {
      const idsToProcess = [...selectedIds];
      for (const id of idsToProcess) {
        await handleSelesaikanDanInfokan(id);
      }
      toast.success(`${selectedIds.size} berkas telah diselesaikan dan diinfokan`);
      setSelectedIds(new Set());
      setConfirmBulkSelesai(false);
      loadData();
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleTolak = async (params: { jenisPenolakan: 'aplikasi' | 'whatsapp'; keteranganPenolakan: string; catatan: string }) => {
    if (!tolakId) return;
    if (!params.keteranganPenolakan) { toast.error('Pilih keterangan penolakan'); return; }

    const berkas = paginated.data.find(b => b.id === tolakId);
    const fullCatatan = params.catatan.trim()
      ? `${params.keteranganPenolakan} - ${params.catatan.trim()}`
      : params.keteranganPenolakan;

    if (params.jenisPenolakan === 'whatsapp' && berkas) {
      const namaPemilik = berkas.namaPemilikSertifikat || berkas.namaPemegangHak;
      const noWa = berkas.noWaPemohon || berkas.profileNoTelepon || berkas.noTelepon || '';
      const phone = noWa.replace(/\D/g, '').replace(/^0/, '62');
      const message = `Yth Bapak/Ibu ${namaPemilik},\n\nBerkas Pengajuan Validasi Alihmedia dengan nomor Hak ${berkas.noHak} Jenis Hak ${berkas.jenisHak} Desa ${berkas.desa} Kecamatan ${berkas.kecamatan} harus dilakukan ${params.keteranganPenolakan}${params.catatan.trim() ? `, dengan penjelasan : ${params.catatan.trim()}` : ''}\n\nSilahkan untuk melakukan pendaftaran ${params.keteranganPenolakan} di Kantor Pertanahan Kabupaten Bogor II,\n\nAlamat : Jl. Alternatif Cibubur no. 6 Cileungsi, Kecamatan Cileungsi, Kabupaten Bogor, Jawa Barat 16820\n\nTerima Kasih`;
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    }

    const currentStatus = berkas?.status;
    await updateBerkasStatus(tolakId, 'Ditolak', fullCatatan, user?.id, currentStatus);
    toast.success('Berkas ditolak');
    setTolakId(null);
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
  const isAllSelected = paginated.data.length > 0 && selectedIds.size === paginated.data.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Validasi Buku Tanah</h1>
        <p className="text-muted-foreground">Validasi berkas buku tanah yang masuk</p>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map(sf => (
              <SelectItem key={sf.value} value={sf.value}>{sf.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedIds.size > 0 && (
          <Button
            size="sm"
            className="gap-1"
            onClick={() => setConfirmBulkSelesai(true)}
            disabled={bulkProcessing}
          >
            <CheckCircle2 className="w-4 h-4" />
            Selesaikan & Infokan ({selectedIds.size})
          </Button>
        )}
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
          onSearchChange: (val) => { setSearch(val); setPage(1); },
          loading,
        }}
        headerActions={<ExportExcelButton data={paginated.data} fileName="validasi-buku-tanah" sheetName="Validasi BT" statusFilter={statusFilter} searchFilter={search} />}
        columns={[
          {
            header: '✓',
            accessor: (row) => (
              <Checkbox
                checked={selectedIds.has(row.id)}
                onCheckedChange={() => toggleSelect(row.id)}
              />
            ),
            className: 'w-10',
          } as any,
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
          { header: 'Aksi', accessor: (row) => {
            if (row.status === 'Selesai Belum Diinfokan') {
              return (
                <Button size="sm" className="gap-1" onClick={() => handleSelesaikanDanInfokan(row.id).then(() => loadData())}>
                  <Send className="w-3 h-3" /> Infokan
                </Button>
              );
            }
            if (row.status !== 'Validasi BT') return null;
            return (
              <div className="flex gap-1">
                <Button size="sm" className="gap-1" disabled={processing === row.id} onClick={() => setConfirmKirimId(row.id)}><Send className="w-3 h-3" /> Kirim</Button>
                <Button size="sm" variant="destructive" className="gap-1" onClick={() => setTolakId(row.id)}><XCircle className="w-3 h-3" /> Tolak</Button>
                <Button size="sm" variant="outline" className="gap-1" onClick={() => setKembalikanId(row.id)}><Undo2 className="w-3 h-3" /></Button>
              </div>
            );
          }},
        ]}
        data={paginated.data}
      />

      <TolakBerkasDialog
        open={!!tolakId}
        onOpenChange={(open) => { if (!open) setTolakId(null); }}
        berkas={tolakBerkas}
        onSubmit={handleTolak}
      />

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

      {/* Bulk Selesai Confirmation */}
      <Dialog open={confirmBulkSelesai} onOpenChange={setConfirmBulkSelesai}>
        <DialogContent>
          <DialogHeader><DialogTitle>Selesaikan & Infokan Berkas</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Anda akan menyelesaikan dan menginfokan <strong>{selectedIds.size}</strong> berkas sekaligus. Setiap berkas akan dikirim notifikasi WhatsApp. Lanjutkan?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmBulkSelesai(false)}>Batal</Button>
            <Button onClick={handleBulkSelesai} disabled={bulkProcessing}>
              {bulkProcessing ? 'Memproses...' : `Ya, Selesaikan (${selectedIds.size})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
