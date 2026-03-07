// Data layer using Custom REST API
import { api } from '@/lib/api';

export type BerkasStatus = 'Proses' | 'Validasi SU & Bidang' | 'Validasi BT' | 'Selesai' | 'Ditolak';
export type JenisHak = 'HM' | 'HGB' | 'HP' | 'HGU' | 'HMSRS' | 'HPL' | 'HW';

export interface Berkas {
  id: string;
  tanggalPengajuan: string;
  namaPemegangHak: string;
  noTelepon: string;
  noSuTahun: string;
  jenisHak: JenisHak;
  noHak: string;
  desa: string;
  kecamatan: string;
  status: BerkasStatus;
  userId: string;
  linkShareloc?: string;
  catatanPenolakan?: string;
  fileSertifikatUrl?: string;
  fileKtpUrl?: string;
  fileFotoBangunanUrl?: string;
  validatedBy?: string;
  validatedAt?: string;
  namaPemilikSertifikat?: string;
  noWaPemohon?: string;
}

export interface ManagedUser {
  id: string;
  email: string;
  name: string;
  noTelepon: string;
  pengguna: string;
  namaInstansi: string | null;
  role: 'admin' | 'user' | 'super_admin' | 'super_user' | 'admin_arsip' | 'admin_validasi_su' | 'admin_validasi_bt';
}

export async function getAllBerkas(): Promise<Berkas[]> {
  const { data } = await api.get<Berkas[]>('/berkas');
  return data || [];
}

export async function getBerkasByUser(userId: string): Promise<Berkas[]> {
  const { data } = await api.get<Berkas[]>(`/berkas?user_id=${userId}`);
  return data || [];
}

export async function uploadFile(file: File, userId: string, type: 'sertifikat' | 'ktp' | 'foto-bangunan'): Promise<string | null> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('user_id', userId);
  const { data } = await api.post<{ url: string }>(`/upload/${type}`, formData);
  return data?.url || null;
}

export async function getSignedFileUrl(filePath: string): Promise<string | null> {
  if (!filePath) return null;
  const { data } = await api.get<{ url: string }>(`/files/${encodeURIComponent(filePath)}`);
  return data?.url || null;
}

export async function addBerkas(berkas: Omit<Berkas, 'id' | 'status'>): Promise<Berkas | null> {
  const { data } = await api.post<Berkas>('/berkas', berkas);
  return data || null;
}

export async function updateBerkasStatus(
  id: string,
  status: BerkasStatus,
  catatan?: string,
  validatorId?: string,
  currentStatus?: BerkasStatus,
) {
  await api.put(`/berkas/${id}/status`, {
    status,
    catatan,
    validatorId,
    currentStatus,
  });
}

export interface TimelineEntry {
  action: string;
  adminName: string;
  adminEmail: string;
  timestamp: string;
  ipAddress: string;
}

export async function getBerkasTimeline(berkasId: string): Promise<TimelineEntry[]> {
  const { data } = await api.get<TimelineEntry[]>(`/berkas/${berkasId}/timeline`);
  return data || [];
}

export async function deleteUploadedFiles(berkasId: string): Promise<boolean> {
  const { data } = await api.delete<{ success: boolean }>(`/berkas/${berkasId}/files`);
  return data?.success || false;
}

export async function deleteBerkas(id: string) {
  await api.delete(`/berkas/${id}`);
}

export async function getStats() {
  const { data } = await api.get<{ total: number; selesai: number; ditolak: number }>('/stats');
  return data || { total: 0, selesai: 0, ditolak: 0 };
}

export async function getAdminStats() {
  const { data } = await api.get<{
    total: number;
    proses: number;
    validasiSu: number;
    validasiBt: number;
    selesai: number;
    ditolak: number;
    adminCounts: Record<string, number>;
  }>('/admin/stats');
  return data || { total: 0, proses: 0, validasiSu: 0, validasiBt: 0, selesai: 0, ditolak: 0, adminCounts: {} };
}

export async function getTodaySubmissionCount(userId: string): Promise<number> {
  const { data } = await api.get<{ count: number }>(`/berkas/today-count?user_id=${userId}`);
  return data?.count || 0;
}

export async function getUsers(): Promise<ManagedUser[]> {
  const { data } = await api.get<ManagedUser[]>('/users');
  return data || [];
}

export async function manageUser(action: string, body: Record<string, any>): Promise<{ success?: boolean; error?: string; id?: string }> {
  const { data, error } = await api.post<{ success?: boolean; error?: string; id?: string }>('/users/manage', { action, ...body });
  if (error) return { error };
  return data || { error: 'Unknown error' };
}

export async function getMyValidationCount(userId: string): Promise<number> {
  const { data } = await api.get<{ count: number }>('/admin/my-validation-count');
  return data?.count || 0;
}

export function isDueDateOverdue(dateStr: string): boolean {
  const parts = dateStr.split('/');
  const date = new Date(+parts[2], +parts[1] - 1, +parts[0]);
  const diffDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > 3;
}

export async function updateBerkas(id: string, updates: Record<string, any>): Promise<{ error?: string }> {
  const { error } = await api.put(`/berkas/${id}`, updates);
  return { error: error || undefined };
}

export async function getBerkasById(id: string): Promise<any | null> {
  const { data } = await api.get(`/berkas/${id}`);
  return data || null;
}
