import { useState, useEffect } from 'react';
import DataTable from '@/components/DataTable';
import { getUsers, ManagedUser } from '@/lib/data';
import { getRoleLabel, UserRole } from '@/lib/auth';

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
              row.role === 'super_admin' ? 'bg-destructive/20 text-destructive' :
              row.role === 'super_user' ? 'bg-amber-500/20 text-amber-700' :
              row.role.startsWith('admin') ? 'bg-primary/20 text-primary' : 
              'bg-success/20 text-success'
            }`}>
              {getRoleLabel(row.role as UserRole)}
            </span>
          )},
        ]}
        data={users}
      />
    </div>
  );
}
