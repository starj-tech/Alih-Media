import { useState, useEffect } from 'react';
import DataTable from '@/components/DataTable';
import { getUsers, ManagedUser } from '@/lib/data';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function KelolaUser() {
  const [users, setUsers] = useState<ManagedUser[]>([]);

  const loadUsers = async () => {
    const data = await getUsers();
    setUsers(data);
  };

  useEffect(() => { loadUsers(); }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Kelola User</h1>
        <p className="text-muted-foreground">Manajemen pengguna aplikasi</p>
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
        ]}
        data={users}
      />
    </div>
  );
}
