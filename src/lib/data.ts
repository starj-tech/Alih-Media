export type BerkasStatus = 'Proses' | 'Validasi SU & Bidang' | 'Validasi BT' | 'Selesai' | 'Ditolak';
export type JenisHak = 'HM' | 'HGB' | 'HP' | 'HGU' | 'HMSRS' | 'HPL' | 'HW';

export interface Berkas {
  id: string;
  noBerkas: string;
  tanggalPengajuan: string;
  namaPemegangHak: string;
  noTelepon: string;
  jenisHak: JenisHak;
  noHak: string;
  desa: string;
  kecamatan: string;
  status: BerkasStatus;
  userId: string;
  fileKtp?: string;
  catatanPenolakan?: string;
}

export interface ManagedUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

// Mock data store
let berkasList: Berkas[] = [
  { id: '1', noBerkas: '03360/2026', tanggalPengajuan: '24/02/2026', namaPemegangHak: 'Abdurrohman Muthi', noTelepon: '081234567890', jenisHak: 'HM', noHak: '4640', desa: 'Cikeasudik', kecamatan: 'Gunung Putri', status: 'Proses', userId: '2' },
  { id: '2', noBerkas: '1/2026', tanggalPengajuan: '20/02/2026', namaPemegangHak: 'Ahmad Fauzi', noTelepon: '081298765432', jenisHak: 'HGB', noHak: '3101', desa: 'Cileungsi', kecamatan: 'Cileungsi', status: 'Validasi BT', userId: '2' },
  { id: '3', noBerkas: '38/2026', tanggalPengajuan: '24/02/2026', namaPemegangHak: 'Siti Nurhaliza', noTelepon: '081355566677', jenisHak: 'HP', noHak: '3654', desa: 'Cileungsi', kecamatan: 'Cileungsi', status: 'Validasi SU & Bidang', userId: '2' },
  { id: '4', noBerkas: '9/2026', tanggalPengajuan: '22/02/2026', namaPemegangHak: 'Budi Santoso', noTelepon: '081244455566', jenisHak: 'HGU', noHak: '3657', desa: 'Cileungsi', kecamatan: 'Cileungsi', status: 'Ditolak', userId: '2', catatanPenolakan: 'Data tidak sesuai arsip' },
  { id: '5', noBerkas: '12/2026', tanggalPengajuan: '23/02/2026', namaPemegangHak: 'Dewi Lestari', noTelepon: '081377788899', jenisHak: 'HGB', noHak: '3221', desa: 'Cileungsi', kecamatan: 'Cileungsi', status: 'Selesai', userId: '2' },
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

export function updateBerkasStatus(id: string, status: BerkasStatus, catatan?: string) {
  berkasList = berkasList.map(b => b.id === id ? { ...b, status, ...(catatan ? { catatanPenolakan: catatan } : {}) } : b);
}

export function deleteBerkas(id: string) {
  berkasList = berkasList.filter(b => b.id !== id);
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
