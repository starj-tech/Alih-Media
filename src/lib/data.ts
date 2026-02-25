export type BerkasStatus = 'Proses' | 'Validasi BT' | 'Validasi SU & Bidang' | 'Selesai' | 'Ditolak';
export type JenisHak = 'SHM' | 'SHGB' | 'HGB' | 'HP' | 'HGU';

export interface Berkas {
  id: string;
  noBerkas: string;
  tanggalPengajuan: string;
  namaPemegangHak: string;
  jenisHak: JenisHak;
  noHak: string;
  desa: string;
  kecamatan: string;
  status: BerkasStatus;
  userId: string;
  fileKtp?: string;
}

export interface ManagedUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

// Mock data store
let berkasList: Berkas[] = [
  { id: '1', noBerkas: '03360/2026', tanggalPengajuan: '24/02/2026', namaPemegangHak: 'Abdurrohman Muthi', jenisHak: 'SHM', noHak: '4640', desa: 'Cikeasudik', kecamatan: 'Gunung Putri', status: 'Proses', userId: '2' },
  { id: '2', noBerkas: '1/2026', tanggalPengajuan: '20/02/2026', namaPemegangHak: 'Ahmad Fauzi', jenisHak: 'SHGB', noHak: '3101', desa: 'Cileungsi', kecamatan: 'Cileungsi', status: 'Validasi BT', userId: '2' },
  { id: '3', noBerkas: '38/2026', tanggalPengajuan: '24/02/2026', namaPemegangHak: 'Siti Nurhaliza', jenisHak: 'HP', noHak: '3654', desa: 'Cileungsi', kecamatan: 'Cileungsi', status: 'Validasi SU & Bidang', userId: '2' },
  { id: '4', noBerkas: '9/2026', tanggalPengajuan: '22/02/2026', namaPemegangHak: 'Budi Santoso', jenisHak: 'HGU', noHak: '3657', desa: 'Cileungsi', kecamatan: 'Cileungsi', status: 'Ditolak', userId: '2' },
  { id: '5', noBerkas: '12/2026', tanggalPengajuan: '23/02/2026', namaPemegangHak: 'Dewi Lestari', jenisHak: 'HGB', noHak: '3221', desa: 'Cileungsi', kecamatan: 'Cileungsi', status: 'Selesai', userId: '2' },
];

let managedUsers: ManagedUser[] = [
  { id: '1', email: 'admin@bpn.go.id', name: 'Administrator', role: 'admin' },
  { id: '2', email: 'user@bpn.go.id', name: 'Abdurrohman Muthi', role: 'user' },
];

export function getAllBerkas(): Berkas[] { return [...berkasList]; }
export function getBerkasByUser(userId: string): Berkas[] { return berkasList.filter(b => b.userId === userId); }
export function getBerkasByStatus(status: BerkasStatus): Berkas[] { return berkasList.filter(b => b.status === status); }
export function getBerkasById(id: string): Berkas | undefined { return berkasList.find(b => b.id === id); }

export function addBerkas(berkas: Omit<Berkas, 'id' | 'noBerkas' | 'status'>): Berkas {
  const newBerkas: Berkas = {
    ...berkas,
    id: String(Date.now()),
    noBerkas: `${berkasList.length + 1}/2026`,
    status: 'Proses',
  };
  berkasList = [...berkasList, newBerkas];
  return newBerkas;
}

export function updateBerkasStatus(id: string, status: BerkasStatus) {
  berkasList = berkasList.map(b => b.id === id ? { ...b, status } : b);
}

export function getStats() {
  return {
    total: berkasList.length,
    selesai: berkasList.filter(b => b.status === 'Selesai').length,
    ditolak: berkasList.filter(b => b.status === 'Ditolak').length,
  };
}

export function getUsers(): ManagedUser[] { return [...managedUsers]; }
export function addUser(user: Omit<ManagedUser, 'id'>) {
  managedUsers = [...managedUsers, { ...user, id: String(Date.now()) }];
}
export function deleteUser(id: string) {
  managedUsers = managedUsers.filter(u => u.id !== id);
}

export function isDueDateOverdue(dateStr: string): boolean {
  const parts = dateStr.split('/');
  const date = new Date(+parts[2], +parts[1] - 1, +parts[0]);
  const diffDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > 3;
}
