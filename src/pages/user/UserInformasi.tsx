import { useState, useEffect, useRef, useCallback } from 'react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import ExternalLinkCell from '@/components/ExternalLinkCell';
import FileDownloadCell from '@/components/FileDownloadCell';
import ExportExcelButton from '@/components/ExportExcelButton';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import BerkasTimelineDialog from '@/components/BerkasTimelineDialog';
import { fetchBerkasPaginated, uploadFile, deleteBerkas, updateBerkas, getBerkasById, Berkas, BerkasStatus, PaginatedResponse } from '@/lib/data';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const statusOptions: { value: string; label: string }[] = [
  { value: 'all', label: 'Semua Status' },
  { value: 'Proses', label: 'Proses' },
  { value: 'Validasi SU & Bidang', label: 'Validasi SU & Bidang' },
  { value: 'Validasi BT', label: 'Validasi BT' },
  { value: 'Selesai', label: 'Selesai' },
  { value: 'Ditolak', label: 'Ditolak' },
];

export default function UserInformasi() {
  const { user } = useAuth();
  const isSuperUser = user?.role === 'super_user';
  const [paginated, setPaginated] = useState<PaginatedResponse<Berkas>>({ data: [], current_page: 1, last_page: 1, per_page: 10, total: 0 });
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ noSuTahun: '', noHak: '', linkShareloc: '' });
  const [fileSertifikat, setFileSertifikat] = useState<File | null>(null);
  const [fileKtp, setFileKtp] = useState<File | null>(null);
  const [fileFotoBangunan, setFileFotoBangunan] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [timelineBerkas, setTimelineBerkas] = useState<Berkas | null>(null);
  const sertifikatRef = useRef<HTMLInputElement>(null);
  const ktpRef = useRef<HTMLInputElement>(null);
  const fotoBangunanRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await fetchBerkasPaginated({ status: statusFilter === 'all' ? undefined : statusFilter, page, perPage, search: search || undefined });
      setPaginated(result);
    } finally {
      setLoading(false);
    }
  }, [user, statusFilter, page, perPage, search]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleStatusChange = (val: string) => { setStatusFilter(val); setPage(1); };

  const handleEdit = (row: Berkas) => {
    setEditId(row.id);
    setEditForm({ noSuTahun: row.noSuTahun, noHak: row.noHak, linkShareloc: row.linkShareloc || '' });
    setFileSertifikat(null);
    setFileKtp(null);
    setFileFotoBangunan(null);
  };

  const validateFilePdf = (file: File): boolean => {
    if (file.type !== 'application/pdf') { toast.error('File harus berformat PDF'); return false; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Ukuran file maksimal 5MB'); return false; }
    return true;
  };

  const validateFileImage = (file: File): boolean => {
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) { toast.error('File harus berformat JPG/JPEG/PNG'); return false; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Ukuran file maksimal 5MB'); return false; }
    return true;
  };

  const handleSubmitEdit = async () => {
    if (!editId || !user) return;
    setSubmitting(true);
    try {
      const noSuNumber = editForm.noSuTahun.split('/')[0]?.replace(/\D/g, '') || '';
      if (noSuNumber.length < 5) {
        toast.error('No SU harus minimal 5 digit');
        return;
      }

      if (editForm.noHak.length < 5) {
        toast.error('No Hak harus minimal 5 digit');
        return;
      }

      const updates: Record<string, unknown> = {
        noSuTahun: editForm.noSuTahun,
        noHak: editForm.noHak,
        linkShareloc: editForm.linkShareloc || null,
      };

      // If currently Ditolak, restore to the stage that rejected it
      const currentBerkas = paginated.data.find(b => b.id === editId);
      if (currentBerkas?.status === 'Ditolak') {
        const berkasRow = await getBerkasById(editId);
        const restoreStatus = berkasRow?.rejectedFromStatus || berkasRow?.rejected_from_status || 'Proses';
        updates.status = restoreStatus as BerkasStatus;
        updates.catatanPenolakan = null;
        updates.rejectedFromStatus = null;
      }

      if (fileSertifikat) {
        const url = await uploadFile(fileSertifikat, user.id, 'sertifikat');
        if (url) updates.fileSertifikatUrl = url;
      }
      if (fileKtp) {
        const url = await uploadFile(fileKtp, user.id, 'ktp');
        if (url) updates.fileKtpUrl = url;
      }
      if (fileFotoBangunan) {
        const url = await uploadFile(fileFotoBangunan, user.id, 'foto-bangunan');
        if (url) updates.fileFotoBangunanUrl = url;
      }

      const { error } = await updateBerkas(editId, updates);
      if (error) { toast.error('Gagal mengupdate berkas'); return; }
      toast.success(currentBerkas?.status === 'Ditolak' ? 'Berkas diajukan kembali' : 'Berkas berhasil diupdate');
      setEditId(null);
      loadData();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteBerkas(deleteId);
      toast.success('Berkas berhasil dihapus');
      setDeleteId(null);
      loadData();
    } finally {
      setDeleting(false);
    }
  };

  const editBerkas = editId ? paginated.data.find(b => b.id === editId) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Informasi Berkas</h1>
        <p className="text-muted-foreground">Monitoring berkas VISA anda</p>
      </div>

      <DataTable<Berkas>
        title="Monitoring Berkas VISA"
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
        headerActions={
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="h-8 text-xs w-48">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ExportExcelButton data={paginated.data} fileName="informasi-user" sheetName="Informasi" />
          </div>
        }
        columns={[
          { header: 'No', accessor: (_, i) => (i ?? 0) + 1 } as any,
          { header: 'Tgl Pengajuan', accessor: 'tanggalPengajuan' },
          { header: 'Nama Pemohon', accessor: 'namaPemegangHak' },
          { header: 'Pengguna', accessor: (row) => <span className="text-xs">{row.profilePengguna || '-'}</span> },
          { header: 'No.SU/Tahun', accessor: 'noSuTahun' },
          { header: 'No Hak', accessor: 'noHak' },
          { header: 'Jenis Hak', accessor: 'jenisHak' },
          { header: 'Desa', accessor: 'desa' },
          { header: 'Kecamatan', accessor: 'kecamatan' },
          { header: 'Sertifikat', accessor: (row) => <FileDownloadCell url={row.fileSertifikatUrl} label="Sertifikat" /> },
          { header: 'KTP', accessor: (row) => <FileDownloadCell url={row.fileKtpUrl} label="KTP" /> },
          { header: 'Foto Bangunan', accessor: (row) => <FileDownloadCell url={row.fileFotoBangunanUrl} label="Foto Bangunan" /> },
          { header: 'Link', accessor: (row) => <ExternalLinkCell url={row.linkShareloc} /> },
          { header: 'Status', accessor: (row) => <StatusBadge status={row.status} /> },
          { header: 'Catatan', accessor: (row) => <span className="text-xs text-muted-foreground">{row.catatanPenolakan || '-'}</span> },
          { header: 'Aksi', accessor: (row) => (
            <div className="flex gap-1">
              {isSuperUser && (
                <Button size="sm" variant="outline" className="gap-1" onClick={() => setTimelineBerkas(row)}>
                  <Eye className="w-3 h-3" /> Detail
                </Button>
              )}
              <Button size="sm" variant="outline" className="gap-1" onClick={() => handleEdit(row)}>
                <Edit className="w-3 h-3" /> Edit
              </Button>
              <Button size="sm" variant="outline" className="gap-1 text-destructive hover:text-destructive" onClick={() => setDeleteId(row.id)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          )},
        ]}
        data={paginated.data}
      />

      {/* Edit Dialog */}
      <Dialog open={!!editId} onOpenChange={(open) => { if (!open) setEditId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editBerkas?.status === 'Ditolak' ? 'Edit & Ajukan Kembali' : 'Edit Berkas'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {editBerkas?.catatanPenolakan && (
              <div className="p-3 rounded bg-destructive/10 border border-destructive/20">
                <p className="text-xs font-semibold text-destructive mb-1">Alasan penolakan:</p>
                <p className="text-sm text-destructive">{editBerkas.catatanPenolakan}</p>
              </div>
            )}
            <div>
              <Label className="text-xs">No.SU/Tahun</Label>
              <Input value={editForm.noSuTahun} onChange={e => setEditForm(f => ({ ...f, noSuTahun: e.target.value }))} className="mt-1 h-8 text-sm" minLength={5} maxLength={50} />
              {(editForm.noSuTahun.split('/')[0]?.replace(/\D/g, '') || '').length > 0 && (editForm.noSuTahun.split('/')[0]?.replace(/\D/g, '') || '').length < 5 && (
                <p className="text-xs text-destructive mt-1">No SU harus minimal 5 digit</p>
              )}
            </div>
            <div>
              <Label className="text-xs">No Hak</Label>
              <Input value={editForm.noHak} onChange={e => setEditForm(f => ({ ...f, noHak: e.target.value }))} className="mt-1 h-8 text-sm" minLength={5} maxLength={50} />
              {editForm.noHak.length > 0 && editForm.noHak.length < 5 && (
                <p className="text-xs text-destructive mt-1">No Hak harus minimal 5 digit</p>
              )}
            </div>
            <div>
              <Label className="text-xs">Link Shareloc (opsional)</Label>
              <Input value={editForm.linkShareloc} onChange={e => setEditForm(f => ({ ...f, linkShareloc: e.target.value }))} className="mt-1 h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Upload Sertifikat Baru (PDF, maks 5MB) - opsional</Label>
              <Input
                ref={sertifikatRef}
                type="file"
                accept=".pdf"
                className="mt-1 h-8 text-sm"
                onChange={e => {
                  const file = e.target.files?.[0] || null;
                  if (file && !validateFilePdf(file)) { e.target.value = ''; return; }
                  setFileSertifikat(file);
                }}
              />
            </div>
            <div>
              <Label className="text-xs">Upload KTP Pemegang Sertifikat (JPG/PNG, maks 5MB) - opsional</Label>
              <Input
                ref={ktpRef}
                type="file"
                accept=".jpg,.jpeg,.png"
                className="mt-1 h-8 text-sm"
                onChange={e => {
                  const file = e.target.files?.[0] || null;
                  if (file && !validateFileImage(file)) { e.target.value = ''; return; }
                  setFileKtp(file);
                }}
              />
            </div>
            <div>
              <Label className="text-xs">Upload Photo Bangunan / Lokasi Tanah dengan Geotag (JPG/PNG, maks 5MB) - opsional</Label>
              <Input
                ref={fotoBangunanRef}
                type="file"
                accept=".jpg,.jpeg,.png"
                className="mt-1 h-8 text-sm"
                onChange={e => {
                  const file = e.target.files?.[0] || null;
                  if (file && !validateFileImage(file)) { e.target.value = ''; return; }
                  setFileFotoBangunan(file);
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditId(null)}>Batal</Button>
            <Button onClick={handleSubmitEdit} disabled={submitting}>
              {submitting ? 'Mengirim...' : editBerkas?.status === 'Ditolak' ? 'Kirim Ulang' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Timeline Dialog for Super User */}
      <BerkasTimelineDialog berkas={timelineBerkas} open={!!timelineBerkas} onOpenChange={(open) => { if (!open) setTimelineBerkas(null); }} />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
