import { useState, useEffect, useRef } from 'react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import ExternalLinkCell from '@/components/ExternalLinkCell';
import FileDownloadCell from '@/components/FileDownloadCell';
import ExportExcelButton from '@/components/ExportExcelButton';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import { getBerkasByUser, uploadFile, deleteBerkas, Berkas, BerkasStatus } from '@/lib/data';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
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
  const [berkas, setBerkas] = useState<Berkas[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ noSuTahun: '', noHak: '', linkShareloc: '' });
  const [fileSertifikat, setFileSertifikat] = useState<File | null>(null);
  const [fileKtp, setFileKtp] = useState<File | null>(null);
  const [fileFotoBangunan, setFileFotoBangunan] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const sertifikatRef = useRef<HTMLInputElement>(null);
  const ktpRef = useRef<HTMLInputElement>(null);
  const fotoBangunanRef = useRef<HTMLInputElement>(null);

  const loadData = () => {
    if (user) getBerkasByUser(user.id).then(setBerkas);
  };

  useEffect(() => { loadData(); }, [user]);

  const filteredBerkas = statusFilter === 'all' ? berkas : berkas.filter(b => b.status === statusFilter);

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
    if (!['image/jpeg', 'image/jpg'].includes(file.type)) { toast.error('File harus berformat JPG/JPEG'); return false; }
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
        no_su_tahun: editForm.noSuTahun,
        no_hak: editForm.noHak,
        link_shareloc: editForm.linkShareloc || null,
      };

      // If currently Ditolak, restore to the stage that rejected it
      const currentBerkas = berkas.find(b => b.id === editId);
      if (currentBerkas?.status === 'Ditolak') {
        // Fetch the rejected_from_status from DB
        const { data: berkasRow } = await supabase.from('berkas').select('rejected_from_status').eq('id', editId).single();
        const restoreStatus = berkasRow?.rejected_from_status || 'Proses';
        updates.status = restoreStatus as BerkasStatus;
        updates.catatan_penolakan = null;
        updates.rejected_from_status = null;
      }

      if (fileSertifikat) {
        const url = await uploadFile(fileSertifikat, user.id, 'sertifikat');
        if (url) updates.file_sertifikat_url = url;
      }
      if (fileKtp) {
        const url = await uploadFile(fileKtp, user.id, 'ktp');
        if (url) updates.file_ktp_url = url;
      }
      if (fileFotoBangunan) {
        const url = await uploadFile(fileFotoBangunan, user.id, 'foto-bangunan');
        if (url) updates.file_foto_bangunan_url = url;
      }

      const { error } = await supabase.from('berkas').update(updates).eq('id', editId);
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

  const editBerkas = editId ? berkas.find(b => b.id === editId) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Informasi Alihmedia</h1>
        <p className="text-muted-foreground">Monitoring berkas alihmedia anda</p>
      </div>

      <DataTable<Berkas>
        title="Monitoring Berkas Alihmedia"
        searchKeys={['noHak', 'desa']}
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
            <ExportExcelButton data={filteredBerkas} fileName="informasi-user" sheetName="Informasi" />
          </div>
        }
        columns={[
          { header: 'No', accessor: (_, i) => (i ?? 0) + 1 } as any,
          { header: 'Tgl Pengajuan', accessor: 'tanggalPengajuan' },
          { header: 'Nama Pemohon', accessor: 'namaPemegangHak' },
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
              <Button size="sm" variant="outline" className="gap-1" onClick={() => handleEdit(row)}>
                <Edit className="w-3 h-3" /> Edit
              </Button>
              <Button size="sm" variant="outline" className="gap-1 text-destructive hover:text-destructive" onClick={() => setDeleteId(row.id)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          )},
        ]}
        data={filteredBerkas}
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
              <Label className="text-xs">Upload KTP Pemegang Sertifikat (JPG, maks 5MB) - opsional</Label>
              <Input
                ref={ktpRef}
                type="file"
                accept=".jpg,.jpeg"
                className="mt-1 h-8 text-sm"
                onChange={e => {
                  const file = e.target.files?.[0] || null;
                  if (file && !validateFileImage(file)) { e.target.value = ''; return; }
                  setFileKtp(file);
                }}
              />
            </div>
            <div>
              <Label className="text-xs">Upload Photo Bangunan / Lokasi Tanah dengan Geotag (JPG, maks 5MB) - opsional</Label>
              <Input
                ref={fotoBangunanRef}
                type="file"
                accept=".jpg,.jpeg"
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
