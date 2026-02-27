import { useState, useEffect } from 'react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import ExternalLinkCell from '@/components/ExternalLinkCell';
import { getBerkasByUser, updateBerkasStatus, Berkas, BerkasStatus } from '@/lib/data';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
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

  const loadData = () => {
    if (user) getBerkasByUser(user.id).then(setBerkas);
  };

  useEffect(() => { loadData(); }, [user]);

  const filteredBerkas = statusFilter === 'all' ? berkas : berkas.filter(b => b.status === statusFilter);

  const handleEdit = (row: Berkas) => {
    setEditId(row.id);
    setEditForm({ noSuTahun: row.noSuTahun, noHak: row.noHak, linkShareloc: row.linkShareloc || '' });
  };

  const handleSubmitEdit = async () => {
    if (!editId) return;
    const { error } = await supabase.from('berkas').update({
      no_su_tahun: editForm.noSuTahun,
      no_hak: editForm.noHak,
      link_shareloc: editForm.linkShareloc || null,
      status: 'Proses' as BerkasStatus,
      catatan_penolakan: null,
    }).eq('id', editId);
    if (error) { toast.error('Gagal mengupdate berkas'); return; }
    toast.success('Berkas diajukan kembali');
    setEditId(null);
    loadData();
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
        searchKeys={['namaPemegangHak', 'desa']}
        headerActions={
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
        }
        columns={[
          { header: 'No', accessor: (_, i) => (i ?? 0) + 1 } as any,
          { header: 'Tgl Pengajuan', accessor: 'tanggalPengajuan' },
          { header: 'Nama', accessor: 'namaPemegangHak' },
          { header: 'No.SU/Tahun', accessor: 'noSuTahun' },
          { header: 'No Hak', accessor: 'noHak' },
          { header: 'Jenis Hak', accessor: 'jenisHak' },
          { header: 'Desa', accessor: 'desa' },
          { header: 'Kecamatan', accessor: 'kecamatan' },
          { header: 'Link', accessor: (row) => <ExternalLinkCell url={row.linkShareloc} /> },
          { header: 'Status', accessor: (row) => <StatusBadge status={row.status} /> },
          { header: 'Catatan', accessor: (row) => <span className="text-xs text-muted-foreground">{row.catatanPenolakan || '-'}</span> },
          { header: 'Aksi', accessor: (row) => row.status === 'Ditolak' ? (
            <Button size="sm" variant="outline" className="gap-1" onClick={() => handleEdit(row)}>
              <Edit className="w-3 h-3" /> Edit
            </Button>
          ) : null },
        ]}
        data={filteredBerkas}
      />

      <Dialog open={!!editId} onOpenChange={(open) => { if (!open) setEditId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit & Ajukan Kembali</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {editBerkas?.catatanPenolakan && (
              <div className="p-3 rounded bg-destructive/10 border border-destructive/20">
                <p className="text-xs font-semibold text-destructive mb-1">Alasan penolakan:</p>
                <p className="text-sm text-destructive">{editBerkas.catatanPenolakan}</p>
              </div>
            )}
            <div>
              <Label className="text-xs">No.SU/Tahun</Label>
              <Input value={editForm.noSuTahun} onChange={e => setEditForm(f => ({ ...f, noSuTahun: e.target.value }))} className="mt-1 h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">No Hak</Label>
              <Input value={editForm.noHak} onChange={e => setEditForm(f => ({ ...f, noHak: e.target.value }))} className="mt-1 h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Link Shareloc</Label>
              <Input value={editForm.linkShareloc} onChange={e => setEditForm(f => ({ ...f, linkShareloc: e.target.value }))} className="mt-1 h-8 text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditId(null)}>Batal</Button>
            <Button onClick={handleSubmitEdit}>Kirim Ulang</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
