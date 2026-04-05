import { useState, useEffect, useCallback } from 'react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import FileDownloadCell from '@/components/FileDownloadCell';
import ExternalLinkCell from '@/components/ExternalLinkCell';
import ExportExcelButton from '@/components/ExportExcelButton';
import TolakBerkasDialog from '@/components/TolakBerkasDialog';
import { getBerkasByStatusPaginated, updateBerkasStatus, isDueDateOverdue, Berkas, PaginatedResponse } from '@/lib/data';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Send, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function ArsipVerifikasi() {
  const { user } = useAuth();
  const [paginated, setPaginated] = useState<PaginatedResponse<Berkas>>({ data: [], current_page: 1, last_page: 1, per_page: 10, total: 0 });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [tolakId, setTolakId] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [confirmKirimId, setConfirmKirimId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getBerkasByStatusPaginated('Proses', page, perPage);
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
      await updateBerkasStatus(id, 'Validasi SU & Bidang', undefined, user?.id);
      toast.success('Berkas diteruskan ke Validasi SU & Bidang');
      loadData();
    } finally {
      setProcessing(null);
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
      const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank');
    }

    const currentStatus = berkas?.status;
    await updateBerkasStatus(tolakId, 'Ditolak', fullCatatan, user?.id, currentStatus);
    toast.success('Berkas ditolak');
    setTolakId(null);
    loadData();
  };

  const tolakBerkas = tolakId ? paginated.data.find(b => b.id === tolakId) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Arsip Verifikasi BT/SU</h1>
        <p className="text-muted-foreground">Verifikasi arsip berkas yang masuk</p>
      </div>

      <DataTable<Berkas>
        title="Daftar Berkas Arsip Verifikasi"
        searchKeys={['noSuTahun', 'noHak', 'desa']}
        serverPagination={{
          currentPage: paginated.current_page,
          totalPages: paginated.last_page,
          total: paginated.total,
          perPage,
          onPageChange: setPage,
          onPerPageChange: (n) => { setPerPage(n); setPage(1); },
          loading,
        }}
        headerActions={<ExportExcelButton data={paginated.data} fileName="arsip-verifikasi" sheetName="Arsip Verifikasi" />}
        columns={[
          { header: 'No', accessor: (_, i) => (i ?? 0) + 1 } as any,
          { header: 'Tgl Pengajuan', accessor: (row) => (
            <span className={isDueDateOverdue(row.tanggalPengajuan) ? 'text-destructive font-semibold' : ''}>{row.tanggalPengajuan}</span>
          )},
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
              <Button size="sm" className="gap-1" disabled={processing === row.id} onClick={() => setConfirmKirimId(row.id)}><Send className="w-3 h-3" /> Kirim</Button>
              <Button size="sm" variant="destructive" className="gap-1" onClick={() => setTolakId(row.id)}><XCircle className="w-3 h-3" /> Tolak</Button>
            </div>
          )},
        ]}
        data={paginated.data}
      />

      <TolakBerkasDialog
        open={!!tolakId}
        onOpenChange={(open) => { if (!open) setTolakId(null); }}
        berkas={tolakBerkas}
        onSubmit={handleTolak}
      />

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
