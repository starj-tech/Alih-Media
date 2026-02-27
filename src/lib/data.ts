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
}

export interface ManagedUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
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

export async function updateBerkasStatus(id: string, status: BerkasStatus, catatan?: string) {
  const updates: any = { status };
  if (catatan !== undefined) updates.catatan_penolakan = catatan;
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

export async function getUsers(): Promise<ManagedUser[]> {
  const { data: profiles } = await supabase.from('profiles').select('*');
  if (!profiles) return [];

  const result: ManagedUser[] = [];
  for (const p of profiles) {
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', p.user_id).single();
    result.push({
      id: p.user_id,
      email: p.email,
      name: p.name,
      role: (roleData?.role as 'admin' | 'user') || 'user',
    });
  }
  return result;
}

export function isDueDateOverdue(dateStr: string): boolean {
  const parts = dateStr.split('/');
  const date = new Date(+parts[2], +parts[1] - 1, +parts[0]);
  const diffDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > 3;
}
