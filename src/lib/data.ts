// Data layer using Lovable Cloud database
import { supabase } from '@/integrations/supabase/client';

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
  validatedBy?: string;
  validatedAt?: string;
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

// Convert DB row to Berkas interface
function mapRow(row: any): Berkas {
  const d = new Date(row.tanggal_pengajuan);
  const tanggal = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  return {
    id: row.id,
    tanggalPengajuan: tanggal,
    namaPemegangHak: row.nama_pemegang_hak,
    noTelepon: row.no_telepon,
    noSuTahun: row.no_su_tahun,
    jenisHak: row.jenis_hak as JenisHak,
    noHak: row.no_hak,
    desa: row.desa,
    kecamatan: row.kecamatan,
    status: row.status as BerkasStatus,
    userId: row.user_id,
    linkShareloc: row.link_shareloc || undefined,
    catatanPenolakan: row.catatan_penolakan || undefined,
    fileSertifikatUrl: row.file_sertifikat_url || undefined,
    fileKtpUrl: row.file_ktp_url || undefined,
    validatedBy: row.validated_by || undefined,
    validatedAt: row.validated_at || undefined,
  };
}

export async function getAllBerkas(): Promise<Berkas[]> {
  const { data, error } = await supabase.from('berkas').select('*').order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map(mapRow);
}

export async function getBerkasByUser(userId: string): Promise<Berkas[]> {
  const { data, error } = await supabase.from('berkas').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map(mapRow);
}

export async function uploadFile(file: File, userId: string, type: 'sertifikat' | 'ktp'): Promise<string | null> {
  const ext = file.name.split('.').pop();
  const fileName = `${userId}/${type}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('berkas-files').upload(fileName, file);
  if (error) return null;
  const { data: urlData } = supabase.storage.from('berkas-files').getPublicUrl(fileName);
  return urlData.publicUrl;
}

export async function addBerkas(berkas: Omit<Berkas, 'id' | 'status'>): Promise<Berkas | null> {
  // Parse dd/mm/yyyy to yyyy-mm-dd
  const parts = berkas.tanggalPengajuan.split('/');
  const dbDate = `${parts[2]}-${parts[1]}-${parts[0]}`;

  const { data, error } = await supabase.from('berkas').insert({
    tanggal_pengajuan: dbDate,
    nama_pemegang_hak: berkas.namaPemegangHak,
    no_telepon: berkas.noTelepon,
    no_su_tahun: berkas.noSuTahun,
    jenis_hak: berkas.jenisHak,
    no_hak: berkas.noHak,
    desa: berkas.desa,
    kecamatan: berkas.kecamatan,
    user_id: berkas.userId,
    link_shareloc: berkas.linkShareloc || null,
    file_sertifikat_url: berkas.fileSertifikatUrl || null,
    file_ktp_url: berkas.fileKtpUrl || null,
  }).select().single();

  if (error || !data) return null;
  return mapRow(data);
}

export async function updateBerkasStatus(id: string, status: BerkasStatus, catatan?: string, validatorId?: string) {
  const updates: any = { status };
  if (catatan !== undefined) updates.catatan_penolakan = catatan;
  if (validatorId) {
    updates.validated_by = validatorId;
    updates.validated_at = new Date().toISOString();
    // Log validation action
    await supabase.from('validation_logs').insert({
      berkas_id: id,
      admin_id: validatorId,
      action: status,
    });
  }
  await supabase.from('berkas').update(updates).eq('id', id);
}

export async function deleteBerkas(id: string) {
  await supabase.from('berkas').delete().eq('id', id);
}

export async function getStats() {
  const { data } = await supabase.from('berkas').select('status');
  const all = data || [];
  return {
    total: all.length,
    selesai: all.filter((b: any) => b.status === 'Selesai').length,
    ditolak: all.filter((b: any) => b.status === 'Ditolak').length,
  };
}

export async function getAdminStats() {
  const [berkasRes, logsRes] = await Promise.all([
    supabase.from('berkas').select('status'),
    supabase.from('validation_logs').select('admin_id'),
  ]);
  const all = berkasRes.data || [];
  const logs = logsRes.data || [];
  
  // Count validations per admin from validation_logs
  const adminCounts: Record<string, number> = {};
  for (const log of logs) {
    const aid = (log as any).admin_id;
    adminCounts[aid] = (adminCounts[aid] || 0) + 1;
  }

  return {
    total: all.length,
    proses: all.filter((b: any) => b.status === 'Proses').length,
    validasiSu: all.filter((b: any) => b.status === 'Validasi SU & Bidang').length,
    validasiBt: all.filter((b: any) => b.status === 'Validasi BT').length,
    selesai: all.filter((b: any) => b.status === 'Selesai').length,
    ditolak: all.filter((b: any) => b.status === 'Ditolak').length,
    adminCounts,
  };
}

export async function getTodaySubmissionCount(userId: string): Promise<number> {
  const { data, error } = await supabase.rpc('get_today_submission_count', { _user_id: userId });
  if (error) return 0;
  return data || 0;
}

export async function getUsers(): Promise<ManagedUser[]> {
  // Batch load profiles and roles in parallel
  const [profilesRes, rolesRes] = await Promise.all([
    supabase.from('profiles').select('*'),
    supabase.from('user_roles').select('*'),
  ]);

  const profiles = profilesRes.data || [];
  const roles = rolesRes.data || [];

  const roleMap: Record<string, string> = {};
  for (const r of roles) {
    roleMap[r.user_id] = r.role;
  }

  return profiles.map(p => ({
    id: p.user_id,
    email: p.email,
    name: p.name,
    noTelepon: p.no_telepon || '',
    pengguna: p.pengguna || 'Perorangan',
    namaInstansi: p.nama_instansi || null,
    role: (roleMap[p.user_id] as ManagedUser['role']) || 'user',
  }));
}

export async function manageUser(action: string, data: Record<string, any>): Promise<{ success?: boolean; error?: string; id?: string }> {
  const { data: session } = await supabase.auth.getSession();
  const token = session?.session?.access_token;
  if (!token) return { error: 'Not authenticated' };

  const res = await supabase.functions.invoke('manage-users', {
    body: { action, ...data },
  });

  if (res.error) return { error: res.error.message };
  return res.data;
}

export function isDueDateOverdue(dateStr: string): boolean {
  const parts = dateStr.split('/');
  const date = new Date(+parts[2], +parts[1] - 1, +parts[0]);
  const diffDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > 3;
}
