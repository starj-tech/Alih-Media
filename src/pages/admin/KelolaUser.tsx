import { useState, useEffect } from 'react';
import DataTable from '@/components/DataTable';
import { getUsers, ManagedUser, manageUser } from '@/lib/data';
import { getRoleLabel, UserRole } from '@/lib/auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'admin_arsip', label: 'Admin Arsip BT/SU' },
  { value: 'admin_validasi_su', label: 'Admin Validasi SU & Bidang' },
  { value: 'admin_validasi_bt', label: 'Admin Validasi BT' },
  { value: 'super_user', label: 'Super User' },
  { value: 'user', label: 'User' },
];

export default function KelolaUser() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(false);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', role: 'user' as string });

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<ManagedUser | null>(null);
  const [editForm, setEditForm] = useState({ name: '', role: '' });

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState<ManagedUser | null>(null);

  const loadUsers = async () => {
    const data = await getUsers();
    setUsers(data);
  };

  useEffect(() => { loadUsers(); }, []);

  const handleCreate = async () => {
    if (!createForm.name || !createForm.email || !createForm.password) {
      toast({ title: 'Error', description: 'Semua field wajib diisi', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const res = await manageUser('create', createForm);
    setLoading(false);
    if (res.error) {
      toast({ title: 'Gagal', description: res.error, variant: 'destructive' });
    } else {
      toast({ title: 'Berhasil', description: 'User berhasil ditambahkan' });
      setCreateOpen(false);
      setCreateForm({ name: '', email: '', password: '', role: 'user' });
      loadUsers();
    }
  };

  const openEdit = (user: ManagedUser) => {
    setEditUser(user);
    setEditForm({ name: user.name, role: user.role });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editUser) return;
    setLoading(true);
    const res = await manageUser('update', { userId: editUser.id, ...editForm });
    setLoading(false);
    if (res.error) {
      toast({ title: 'Gagal', description: res.error, variant: 'destructive' });
    } else {
      toast({ title: 'Berhasil', description: 'User berhasil diperbarui' });
      setEditOpen(false);
      loadUsers();
    }
  };

  const openDelete = (user: ManagedUser) => {
    setDeleteUser(user);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    setLoading(true);
    const res = await manageUser('delete', { userId: deleteUser.id });
    setLoading(false);
    if (res.error) {
      toast({ title: 'Gagal', description: res.error, variant: 'destructive' });
    } else {
      toast({ title: 'Berhasil', description: 'User berhasil dihapus' });
      setDeleteOpen(false);
      loadUsers();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Kelola User</h1>
        <p className="text-muted-foreground">Manajemen pengguna aplikasi</p>
      </div>

      <DataTable<ManagedUser>
        title="Daftar User"
        searchKeys={['name', 'email']}
        headerActions={
          <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
            <Plus className="w-4 h-4" /> Tambah User
          </Button>
        }
        columns={[
          { header: 'No', accessor: (_, i) => (i ?? 0) + 1 } as any,
          { header: 'Nama', accessor: 'name' },
          { header: 'Email', accessor: 'email' },
          { header: 'Role', accessor: (row) => (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
              row.role === 'super_admin' ? 'bg-destructive/20 text-destructive' :
              row.role === 'super_user' ? 'bg-amber-500/20 text-amber-700' :
              row.role.startsWith('admin') ? 'bg-primary/20 text-primary' : 
              'bg-success/20 text-success'
            }`}>
              {getRoleLabel(row.role as UserRole)}
            </span>
          )},
          { header: 'Aksi', accessor: (row) => (
            <div className="flex items-center justify-center gap-1">
              <Button size="sm" variant="outline" onClick={() => openEdit(row)} className="h-7 w-7 p-0">
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => openDelete(row)} className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          )},
        ]}
        data={users}
      />

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah User Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nama</Label>
              <Input value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} placeholder="Nama lengkap" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} placeholder="Minimal 6 karakter" />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={createForm.role} onValueChange={v => setCreateForm(f => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={loading}>Batal</Button>
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input value={editUser?.email || ''} disabled className="bg-muted" />
            </div>
            <div>
              <Label>Nama</Label>
              <Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={editForm.role} onValueChange={v => setEditForm(f => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={loading}>Batal</Button>
            <Button onClick={handleEdit} disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        loading={loading}
      />
    </div>
  );
}
