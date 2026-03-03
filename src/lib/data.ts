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
    fileFotoBangunanUrl: row.file_foto_bangunan_url || undefined,
    validatedBy: row.validated_by || undefined,
    validatedAt: row.validated_at || undefined,
    namaPemilikSertifikat: row.nama_pemilik_sertifikat || undefined,
    noWaPemohon: row.no_wa_pemohon || undefined,
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

export async function uploadFile(file: File, userId: string, type: 'sertifikat' | 'ktp' | 'foto-bangunan'): Promise<string | null> {
  const ext = file.name.split('.').pop();
  const fileName = `${userId}/${type}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('berkas-files').upload(fileName, file);
  if (error) return null;
  // Store the file path only (bucket is private, we'll use signed URLs to access)
  return fileName;
}

export async function getSignedFileUrl(filePath: string): Promise<string | null> {
  if (!filePath) return null;
  // If it's already a full URL (legacy public URL), extract the path
  if (filePath.startsWith('http')) {
    const match = filePath.match(/berkas-files\/(.+)$/);
    if (match) filePath = match[1];
    else return null;
  }
  const { data, error } = await supabase.storage
    .from('berkas-files')
    .createSignedUrl(filePath, 3600); // 1 hour expiry
  if (error || !data) return null;
  return data.signedUrl;
}

export async function addBerkas(berkas: Omit<Berkas, 'id' | 'status'>): Promise<Berkas | null> {
  // Validate and parse dd/mm/yyyy to yyyy-mm-dd
  const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!dateRegex.test(berkas.tanggalPengajuan)) {
    throw new Error('Format tanggal tidak valid');
  }
  const parts = berkas.tanggalPengajuan.split('/');
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 2000 || year > 2100) {
    throw new Error('Tanggal tidak valid');
  }
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
    file_foto_bangunan_url: berkas.fileFotoBangunanUrl || null,
    nama_pemilik_sertifikat: (berkas as any).namaPemilikSertifikat || null,
    no_wa_pemohon: (berkas as any).noWaPemohon || null,
  }).select().single();

  if (error || !data) return null;
  return mapRow(data);
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

  // If rejecting, persist stage origin so user resubmission goes back to rejecting stage
  if (status === 'Ditolak') {
    let rejectedFrom: string | null = null;

    if (currentStatus && currentStatus !== 'Ditolak') {
      rejectedFrom = currentStatus;
    } else {
      const { data: current } = await supabase
        .from('berkas')
        .select('status, rejected_from_status')
        .eq('id', id)
        .single();

      if (current?.status && current.status !== 'Ditolak') {
        rejectedFrom = current.status;
      } else if (current?.rejected_from_status) {
        rejectedFrom = current.rejected_from_status;
      }
    }

    updates.rejected_from_status = rejectedFrom || 'Proses';
  }

  if (validatorId) {
    updates.validated_by = validatorId;
    updates.validated_at = new Date().toISOString();
    // Log validation server-side (IP detected by edge function)
    await supabase.functions.invoke('log-validation', {
      body: { berkas_id: id, action: status },
    });
  }

  await supabase.from('berkas').update(updates).eq('id', id);
}

export interface TimelineEntry {
  action: string;
  adminName: string;
  adminEmail: string;
  timestamp: string;
  ipAddress: string;
}

export async function getBerkasTimeline(berkasId: string): Promise<TimelineEntry[]> {
  const { data: logs } = await supabase
    .from('validation_logs')
    .select('*')
    .eq('berkas_id', berkasId)
    .order('created_at', { ascending: true });

  if (!logs || logs.length === 0) return [];

  const adminIds = [...new Set(logs.map((l: any) => l.admin_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, name, email')
    .in('user_id', adminIds);

  const profileMap: Record<string, { name: string; email: string }> = {};
  for (const p of profiles || []) {
    profileMap[p.user_id] = { name: p.name, email: p.email };
  }

  return logs.map((log: any) => ({
    action: log.action,
    adminName: profileMap[log.admin_id]?.name || '-',
    adminEmail: profileMap[log.admin_id]?.email || '-',
    timestamp: log.created_at,
    ipAddress: log.ip_address || '-',
  }));
}

export async function deleteUploadedFiles(berkasId: string): Promise<boolean> {
  const { data: row } = await supabase.from('berkas').select('file_sertifikat_url, file_ktp_url, file_foto_bangunan_url').eq('id', berkasId).single();
  if (!row) return false;

  const filesToDelete: string[] = [];
  if (row.file_sertifikat_url) filesToDelete.push(row.file_sertifikat_url);
  if (row.file_ktp_url) filesToDelete.push(row.file_ktp_url);
  if (row.file_foto_bangunan_url) filesToDelete.push(row.file_foto_bangunan_url);

  if (filesToDelete.length > 0) {
    // Extract paths if they are full URLs
    const paths = filesToDelete.map(f => {
      if (f.startsWith('http')) {
        const match = f.match(/berkas-files\/(.+)$/);
        return match ? match[1] : f;
      }
      return f;
    });
    await supabase.storage.from('berkas-files').remove(paths);
  }

  await supabase.from('berkas').update({ file_sertifikat_url: null, file_ktp_url: null, file_foto_bangunan_url: null }).eq('id', berkasId);
  return true;
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
