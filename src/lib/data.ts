// Data layer using Supabase SDK
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
  fileFotoBangunanUrl?: string;
  validatedBy?: string;
  validatedAt?: string;
  namaPemilikSertifikat?: string;
  noWaPemohon?: string;
  rejectedFromStatus?: string;
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

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  // If already in DD/MM/YYYY format
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function mapBerkasRow(row: any): Berkas {
  return {
    id: row.id,
    tanggalPengajuan: formatDate(row.tanggal_pengajuan),
    namaPemegangHak: row.nama_pemegang_hak,
    noTelepon: row.no_telepon,
    noSuTahun: row.no_su_tahun,
    jenisHak: row.jenis_hak,
    noHak: row.no_hak,
    desa: row.desa,
    kecamatan: row.kecamatan,
    status: row.status,
    userId: row.user_id,
    linkShareloc: row.link_shareloc || undefined,
    catatanPenolakan: row.catatan_penolakan || undefined,
    fileSertifikatUrl: row.file_sertifikat_url || undefined,
    fileKtpUrl: row.file_ktp_url || undefined,
    fileFotoBangunanUrl: row.file_foto_bangunan_url || undefined,
    validatedBy: row.validated_by || undefined,
    validatedAt: row.validated_at || undefined,
    namaPemilikSertifikat: row.nama_pemilik_sertifikat || undefined,
    noWaPemohon: row.no_wa_pemohon || undefined,
    rejectedFromStatus: row.rejected_from_status || undefined,
  };
}

export async function getAllBerkas(): Promise<Berkas[]> {
  const { data, error } = await supabase
    .from('berkas')
    .select('*')
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map(mapBerkasRow);
}

export async function getBerkasByUser(userId: string): Promise<Berkas[]> {
  const { data, error } = await supabase
    .from('berkas')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map(mapBerkasRow);
}

export async function uploadFile(file: File, userId: string, type: 'sertifikat' | 'ktp' | 'foto-bangunan'): Promise<string | null> {
  const timestamp = Date.now();
  const ext = file.name.split('.').pop();
  const filePath = `${userId}/${type}/${timestamp}.${ext}`;

  const { error } = await supabase.storage
    .from('berkas-files')
    .upload(filePath, file);

  if (error) {
    console.error('Upload error:', error);
    return null;
  }

  return filePath;
}

export async function getSignedFileUrl(filePath: string): Promise<string | null> {
  if (!filePath) return null;
  const { data, error } = await supabase.storage
    .from('berkas-files')
    .createSignedUrl(filePath, 3600); // 1 hour
  if (error || !data) return null;
  return data.signedUrl;
}

function parseDateDDMMYYYY(dateStr: string): string {
  // Convert DD/MM/YYYY to YYYY-MM-DD for DB
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

export async function addBerkas(berkas: Omit<Berkas, 'id' | 'status'>): Promise<Berkas | null> {
  const { data, error } = await supabase
    .from('berkas')
    .insert({
      tanggal_pengajuan: parseDateDDMMYYYY(berkas.tanggalPengajuan),
      nama_pemegang_hak: berkas.namaPemegangHak,
      no_telepon: berkas.noTelepon,
      no_su_tahun: berkas.noSuTahun,
      jenis_hak: berkas.jenisHak as any,
      no_hak: berkas.noHak,
      desa: berkas.desa,
      kecamatan: berkas.kecamatan,
      user_id: berkas.userId,
      link_shareloc: berkas.linkShareloc || null,
      file_sertifikat_url: berkas.fileSertifikatUrl || null,
      file_ktp_url: berkas.fileKtpUrl || null,
      file_foto_bangunan_url: berkas.fileFotoBangunanUrl || null,
      nama_pemilik_sertifikat: berkas.namaPemilikSertifikat || null,
      no_wa_pemohon: berkas.noWaPemohon || null,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('addBerkas error:', error);
    return null;
  }
  return mapBerkasRow(data);
}

export async function updateBerkasStatus(
  id: string,
  status: BerkasStatus,
  catatan?: string,
  validatorId?: string,
  currentStatus?: BerkasStatus,
) {
  const updates: Record<string, any> = { status };
  if (catatan !== undefined) updates.catatan_penolakan = catatan;
  if (validatorId) {
    updates.validated_by = validatorId;
    updates.validated_at = new Date().toISOString();
  }
  if (status === 'Ditolak' && currentStatus) {
    updates.rejected_from_status = currentStatus;
  }

  const { error } = await supabase
    .from('berkas')
    .update(updates)
    .eq('id', id);

  if (error) console.error('updateBerkasStatus error:', error);

  // Log the validation action
  if (validatorId) {
    await supabase.from('validation_logs').insert({
      berkas_id: id,
      admin_id: validatorId,
      action: status,
      ip_address: null,
    });
  }
}

export interface TimelineEntry {
  action: string;
  adminName: string;
  adminEmail: string;
  timestamp: string;
  ipAddress: string;
}

export async function getBerkasTimeline(berkasId: string): Promise<TimelineEntry[]> {
  const { data, error } = await supabase
    .from('validation_logs')
    .select('action, admin_id, created_at, ip_address')
    .eq('berkas_id', berkasId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  // Get admin profiles
  const adminIds = [...new Set(data.map(d => d.admin_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, name, email')
    .in('user_id', adminIds);

  const profileMap: Record<string, { name: string; email: string }> = {};
  profiles?.forEach(p => {
    profileMap[p.user_id] = { name: p.name, email: p.email };
  });

  return data.map(entry => ({
    action: entry.action,
    adminName: profileMap[entry.admin_id]?.name || 'Unknown',
    adminEmail: profileMap[entry.admin_id]?.email || '',
    timestamp: entry.created_at,
    ipAddress: entry.ip_address || '',
  }));
}

export async function deleteUploadedFiles(berkasId: string): Promise<boolean> {
  // Get the berkas to find file paths
  const { data: berkas } = await supabase
    .from('berkas')
    .select('file_sertifikat_url, file_ktp_url, file_foto_bangunan_url')
    .eq('id', berkasId)
    .single();

  if (!berkas) return false;

  const filePaths = [
    berkas.file_sertifikat_url,
    berkas.file_ktp_url,
    berkas.file_foto_bangunan_url,
  ].filter(Boolean) as string[];

  if (filePaths.length > 0) {
    await supabase.storage.from('berkas-files').remove(filePaths);
  }

  // Clear file URLs in the berkas record
  await supabase.from('berkas').update({
    file_sertifikat_url: null,
    file_ktp_url: null,
    file_foto_bangunan_url: null,
  }).eq('id', berkasId);

  return true;
}

export async function deleteBerkas(id: string) {
  await supabase.from('berkas').delete().eq('id', id);
}

export async function getStats() {
  const { data } = await supabase.from('berkas').select('status');
  if (!data) return { total: 0, selesai: 0, ditolak: 0 };
  return {
    total: data.length,
    selesai: data.filter(b => b.status === 'Selesai').length,
    ditolak: data.filter(b => b.status === 'Ditolak').length,
  };
}

export async function getAdminStats() {
  const { data: berkasData } = await supabase.from('berkas').select('status');
  const { data: logsData } = await supabase.from('validation_logs').select('admin_id');

  const all = berkasData || [];
  const adminCounts: Record<string, number> = {};
  logsData?.forEach(log => {
    adminCounts[log.admin_id] = (adminCounts[log.admin_id] || 0) + 1;
  });

  return {
    total: all.length,
    proses: all.filter(b => b.status === 'Proses').length,
    validasiSu: all.filter(b => b.status === 'Validasi SU & Bidang').length,
    validasiBt: all.filter(b => b.status === 'Validasi BT').length,
    selesai: all.filter(b => b.status === 'Selesai').length,
    ditolak: all.filter(b => b.status === 'Ditolak').length,
    adminCounts,
  };
}

export async function getTodaySubmissionCount(userId: string): Promise<number> {
  const { data, error } = await supabase.rpc('get_today_submission_count', { _user_id: userId });
  if (error) return 0;
  return data || 0;
}

export async function getUsers(): Promise<ManagedUser[]> {
  const { data: profiles } = await supabase.from('profiles').select('*');
  const { data: roles } = await supabase.from('user_roles').select('user_id, role');

  if (!profiles) return [];

  const roleMap: Record<string, string> = {};
  roles?.forEach(r => { roleMap[r.user_id] = r.role; });

  return profiles.map(p => ({
    id: p.user_id,
    email: p.email,
    name: p.name,
    noTelepon: p.no_telepon,
    pengguna: p.pengguna,
    namaInstansi: p.nama_instansi,
    role: (roleMap[p.user_id] || 'user') as ManagedUser['role'],
  }));
}

export async function manageUser(action: string, body: Record<string, any>): Promise<{ success?: boolean; error?: string; id?: string }> {
  const { data, error } = await supabase.functions.invoke('manage-users', {
    body: { action, ...body },
  });
  if (error) return { error: error.message };
  return data || { error: 'Unknown error' };
}

export async function getMyValidationCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('validation_logs')
    .select('*', { count: 'exact', head: true })
    .eq('admin_id', userId);
  if (error) return 0;
  return count || 0;
}

export function isDueDateOverdue(dateStr: string): boolean {
  const parts = dateStr.split('/');
  const date = new Date(+parts[2], +parts[1] - 1, +parts[0]);
  const diffDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > 3;
}

export async function updateBerkas(id: string, updates: Record<string, any>): Promise<{ error?: string }> {
  // Map camelCase to snake_case
  const dbUpdates: Record<string, any> = {};
  const keyMap: Record<string, string> = {
    noSuTahun: 'no_su_tahun',
    noHak: 'no_hak',
    linkShareloc: 'link_shareloc',
    status: 'status',
    catatanPenolakan: 'catatan_penolakan',
    rejectedFromStatus: 'rejected_from_status',
    fileSertifikatUrl: 'file_sertifikat_url',
    fileKtpUrl: 'file_ktp_url',
    fileFotoBangunanUrl: 'file_foto_bangunan_url',
  };

  for (const [key, value] of Object.entries(updates)) {
    const dbKey = keyMap[key] || key;
    dbUpdates[dbKey] = value;
  }

  const { error } = await supabase.from('berkas').update(dbUpdates).eq('id', id);
  return { error: error?.message };
}

export async function getBerkasById(id: string): Promise<any | null> {
  const { data } = await supabase.from('berkas').select('*').eq('id', id).single();
  if (!data) return null;
  return {
    ...data,
    rejectedFromStatus: data.rejected_from_status,
    rejected_from_status: data.rejected_from_status,
  };
}
