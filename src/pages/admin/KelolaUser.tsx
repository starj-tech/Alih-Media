import { useState } from 'react';
import DataTable from '@/components/DataTable';
import { getUsers, addUser, deleteUser, ManagedUser } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserPlus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function KelolaUser() {
  const [, setRefresh] = useState(0);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', role: 'user' as 'admin' | 'user' });

  const users = getUsers();

  const handleAdd = () => {
    if (!form.email || !form.name) { toast.error('Lengkapi semua field'); return; }
    addUser(form);
    setForm({ email: '', name: '', role: 'user' });
    setOpen(false);
    setRefresh(v => v + 1);
    toast.success('User berhasil ditambahkan');
  };

  const handleDelete = (id: string) => {
    deleteUser(id);
    setRefresh(v => v + 1);
    toast.success('User berhasil dihapus');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kelola User</h1>
          <p className="text-muted-foreground">Manajemen pengguna aplikasi</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><UserPlus className="w-4 h-4" /> Tambah User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah User Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nama</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAdd} className="w-full">Simpan</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable<ManagedUser>
        title="Daftar User"
        searchKeys={['name', 'email']}
        columns={[
          { header: 'No', accessor: (_, i) => (i ?? 0) + 1 } as any,
          { header: 'Nama', accessor: 'name' },
          { header: 'Email', accessor: 'email' },
          { header: 'Role', accessor: (row) => (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
              row.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-success/20 text-success'
            }`}>
              {row.role === 'admin' ? 'Admin' : 'User'}
            </span>
          )},
          { header: 'Aksi', accessor: (row) => (
            <Button size="sm" variant="destructive" className="gap-1" onClick={() => handleDelete(row.id)}>
              <Trash2 className="w-3 h-3" /> Hapus
            </Button>
          )},
        ]}
        data={users}
      />
    </div>
  );
}
