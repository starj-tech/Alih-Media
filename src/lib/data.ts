// Data layer using Laravel REST API
import { apiFetch, apiUpload, apiUploadBase64, apiUploadBinary, apiUploadChunked, LARAVEL_API_URL, getToken } from '@/lib/api-client';

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
  ipAddress?: string;
  deviceIpAddress?: string;
  profileNoTelepon?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
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
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

/**
 * Normalize stored file path: strip absolute URLs, /storage/, public/ prefixes.
 * Returns clean relative path like "uuid/sertifikat/file.pdf"
 */
function normalizeStoredFilePath(filePath?: string | null): string {
  const raw = String(filePath || '').trim();
  if (!raw) return '';

  let normalized = raw;

  // Strip full URL to pathname
  if (/^https?:\/\//i.test(normalized)) {
    try {
      normalized = decodeURIComponent(new URL(normalized).pathname);
    } catch {
      normalized = raw;
    }
  }

  // Remove query/hash
  normalized = normalized.split('?')[0]?.split('#')[0] || normalized;

  // Strip /storage/ prefix
  const idx = normalized.toLowerCase().indexOf('/storage/');
  if (idx >= 0) {
    normalized = normalized.slice(idx + '/storage/'.length);
  }

  return normalized
    .replace(/^\/+/, '')
    .replace(/^storage\//i, '')
    .replace(/^public\//i, '')
    .trim();
}

function mapBerkasRow(row: any): Berkas {
  return {
    id: row.id,
    tanggalPengajuan: formatDate(row.tanggal_pengajuan || row.tanggalPengajuan),
    namaPemegangHak: row.nama_pemegang_hak || row.namaPemegangHak,
    noTelepon: row.no_telepon || row.noTelepon || '',
    noSuTahun: row.no_su_tahun || row.noSuTahun,
    jenisHak: row.jenis_hak || row.jenisHak,
    noHak: row.no_hak || row.noHak,
    desa: row.desa,
    kecamatan: row.kecamatan,
    status: row.status,
    userId: row.user_id || row.userId,
    linkShareloc: row.link_shareloc || row.linkShareloc || undefined,
    catatanPenolakan: row.catatan_penolakan || row.catatanPenolakan || undefined,
    fileSertifikatUrl: normalizeStoredFilePath(row.file_sertifikat_url || row.fileSertifikatUrl) || undefined,
    fileKtpUrl: normalizeStoredFilePath(row.file_ktp_url || row.fileKtpUrl) || undefined,
    fileFotoBangunanUrl: normalizeStoredFilePath(row.file_foto_bangunan_url || row.fileFotoBangunanUrl) || undefined,
    validatedBy: row.validated_by || row.validatedBy || undefined,
    validatedAt: row.validated_at || row.validatedAt || undefined,
    namaPemilikSertifikat: row.nama_pemilik_sertifikat || row.namaPemilikSertifikat || undefined,
    noWaPemohon: row.no_wa_pemohon || row.noWaPemohon || undefined,
    rejectedFromStatus: row.rejected_from_status || row.rejectedFromStatus || undefined,
    ipAddress: row.ip_address || row.ipAddress || undefined,
    deviceIpAddress: row.device_ip_address || row.deviceIpAddress || undefined,
    profileNoTelepon: row.profile_no_telepon || row.profileNoTelepon || undefined,
  };
}

function extractRows(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (data?.data && Array.isArray(data.data)) return data.data;
  return [];
}

export async function fetchBerkasPaginated(options?: {
  status?: string;
  page?: number;
  perPage?: number;
  search?: string;
}): Promise<PaginatedResponse<Berkas>> {
  const params = new URLSearchParams();
  if (options?.status && options.status !== 'all') params.set('status', options.status);
  if (options?.search) params.set('search', options.search);
  params.set('per_page', String(options?.perPage ?? 10));
  params.set('page', String(options?.page ?? 1));

  try {
    const data = await apiFetch<any>(`/berkas?${params.toString()}`);
    const rows = extractRows(data);
    return {
      data: rows.map(mapBerkasRow),
      current_page: data.current_page || 1,
      last_page: data.last_page || 1,
      per_page: data.per_page || 10,
      total: data.total || rows.length,
    };
  } catch {
    return { data: [], current_page: 1, last_page: 1, per_page: 10, total: 0 };
  }
}

export async function fetchBerkas(options?: {
  status?: string;
  page?: number;
  perPage?: number;
}): Promise<Berkas[]> {
  const result = await fetchBerkasPaginated(options);
  return result.data;
}

/** @deprecated Use fetchBerkasPaginated() */
export async function getAllBerkas(): Promise<Berkas[]> {
  return fetchBerkas();
}

/** @deprecated Use fetchBerkasPaginated() */
export async function getBerkasByUser(userId: string): Promise<Berkas[]> {
  return fetchBerkas();
}

export async function getBerkasByStatusPaginated(
  status: string | string[],
  page = 1,
  perPage = 10,
  search?: string,
): Promise<PaginatedResponse<Berkas>> {
  const statusStr = Array.isArray(status) ? status.join(',') : status;
  return fetchBerkasPaginated({ status: statusStr, page, perPage, search });
}

export async function getBerkasByStatus(status: string | string[]): Promise<Berkas[]> {
  const statusStr = Array.isArray(status) ? status.join(',') : status;
  return fetchBerkas({ status: statusStr });
}

// ==========================================
// FILE UPLOAD
// ==========================================

function getUploadResultPath(data: any, fallback: string): string {
  const result = normalizeStoredFilePath(data?.path || data?.url);
  if (!result) throw new Error(fallback);
  return result;
}

/**
 * Upload a file.
 * Strategy order is important for restrictive production hosting:
 * 1. Standard multipart/form-data (most compatible with PHP/Laravel)
 * 2. Chunked upload (fallback when normal multipart is filtered or unstable)
 * 3. Base64 upload (last resort)
 */
export async function uploadFile(
  file: File,
  _userId: string,
  type: 'sertifikat' | 'ktp' | 'foto-bangunan',
  onProgress?: (percent: number) => void,
): Promise<string> {
  const errors: string[] = [];

  // Strategy 1: Base64 urlencoded/json (primary - currently accepted on production server)
  try {
    const data = await apiUploadBase64('/files/upload', file, type, onProgress);
    return getUploadResultPath(data, 'Server tidak mengembalikan path file dari upload base64');
  } catch (error: any) {
    errors.push(`base64: ${error?.message || 'gagal'}`);
    console.warn('[Upload] Base64 failed:', error?.message, '→ trying chunked-url-encoded');
  }

  // Strategy 2: Chunked upload via urlencoded/plain/json fallback
  try {
    const data = await apiUploadChunked('/files/upload-chunk', file, type, onProgress);
    return getUploadResultPath(data, 'Server tidak mengembalikan path file dari upload chunked');
  } catch (error: any) {
    errors.push(`chunked: ${error?.message || 'gagal'}`);
    console.warn('[Upload] Chunked failed:', error?.message, '→ trying binary');
  }

  // Strategy 3: raw binary stream fallback
  try {
    const data = await apiUploadBinary('/files/upload', file, type, onProgress);
    return getUploadResultPath(data, 'Server tidak mengembalikan path file dari upload biner');
  } catch (error: any) {
    errors.push(`binary: ${error?.message || 'gagal'}`);
    console.warn('[Upload] Binary failed:', error?.message, '→ trying multipart');
  }

  // Strategy 4: Standard multipart (fallback)
  try {
    const formData = new FormData();
    formData.append('type', type);
    formData.append('file', file, file.name);
    const data = await apiUpload(`/files/upload?type=${encodeURIComponent(type)}&file_name=${encodeURIComponent(file.name)}`, formData, onProgress);
    return getUploadResultPath(data, 'Server tidak mengembalikan path file dari upload multipart');
  } catch (error: any) {
    errors.push(`multipart: ${error?.message || 'gagal'}`);
  }

  throw new Error(`Semua metode upload gagal. ${errors.join(' | ')}`);
}

export async function deleteUploadedFileByPath(filePath: string): Promise<boolean> {
  const normalized = normalizeStoredFilePath(filePath);
  if (!normalized) return true;
  try {
    await apiFetch(`/files/${encodeURIComponent(normalized)}`, { method: 'DELETE' });
    return true;
  } catch {
    return false;
  }
}

// ==========================================
// FILE DOWNLOAD
// ==========================================

function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return token
    ? { Accept: '*/*', Authorization: `Bearer ${token}`, 'X-Access-Token': token }
    : { Accept: '*/*' };
}

function normalizePublicFileUrl(url?: string | null): string {
  const raw = String(url || '').trim();
  if (!raw) return '';

  const fixedProtocol = raw.replace(/^(https?):(https?:\/\/)/i, '$2');

  try {
    return new URL(fixedProtocol).toString();
  } catch {
    try {
      const apiOrigin = new URL(LARAVEL_API_URL).origin;
      if (fixedProtocol.startsWith('/')) return new URL(fixedProtocol, apiOrigin).toString();
      return new URL(`/${fixedProtocol.replace(/^\/+/, '')}`, apiOrigin).toString();
    } catch {
      return fixedProtocol;
    }
  }
}

function buildDirectStorageUrl(filePath: string): string | null {
  const normalized = normalizeStoredFilePath(filePath);
  if (!normalized) return null;

  try {
    const apiOrigin = new URL(LARAVEL_API_URL).origin;
    const encodedPath = normalized
      .split('/')
      .filter(Boolean)
      .map(segment => encodeURIComponent(segment))
      .join('/');

    return `${apiOrigin}/storage/${encodedPath}`;
  } catch {
    return null;
  }
}

/**
 * Get a viewable URL for a stored file.
 * Uses /storage/ path with auth token as query parameter for middleware protection.
 */
export async function getSignedFileUrl(filePath: string): Promise<string | null> {
  if (!filePath) return null;
  const normalized = normalizeStoredFilePath(filePath);
  if (!normalized) return null;

  const directUrl = buildDirectStorageUrl(normalized);
  if (!directUrl) return null;

  // Append auth token as query parameter for middleware verification
  const token = getToken();
  if (token) {
    const separator = directUrl.includes('?') ? '&' : '?';
    return `${directUrl}${separator}token=${encodeURIComponent(token)}`;
  }

  return directUrl;
}

// ==========================================
// BERKAS CRUD
// ==========================================

function parseDateDDMMYYYY(dateStr: string): string {
  const parts = dateStr.split('/');
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return dateStr;
}

export async function addBerkas(berkas: Omit<Berkas, 'id' | 'status'>): Promise<Berkas> {
  const payload = {
    tanggal_pengajuan: parseDateDDMMYYYY(berkas.tanggalPengajuan),
    nama_pemegang_hak: berkas.namaPemegangHak,
    no_telepon: berkas.noTelepon,
    no_su_tahun: berkas.noSuTahun,
    jenis_hak: berkas.jenisHak,
    no_hak: berkas.noHak,
    desa: berkas.desa,
    kecamatan: berkas.kecamatan,
    link_shareloc: berkas.linkShareloc || null,
    file_sertifikat_url: berkas.fileSertifikatUrl || null,
    file_ktp_url: berkas.fileKtpUrl || null,
    file_foto_bangunan_url: berkas.fileFotoBangunanUrl || null,
    nama_pemilik_sertifikat: berkas.namaPemilikSertifikat || null,
    no_wa_pemohon: berkas.noWaPemohon || null,
  };

  const data = await apiFetch('/berkas', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return mapBerkasRow(data.data || data);
}

export async function updateBerkasStatus(
  id: string,
  status: BerkasStatus,
  catatan?: string,
  validatorId?: string,
  currentStatus?: BerkasStatus,
) {
  try {
    await apiFetch(`/berkas/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({
        status,
        catatan_penolakan: catatan || undefined,
        current_status: currentStatus || undefined,
      }),
    });
  } catch (err) {
    console.error('updateBerkasStatus error:', err);
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
  try {
    const data = await apiFetch<any[]>(`/berkas/${berkasId}/timeline`);
    const entries = Array.isArray(data) ? data : (data as any)?.data || [];
    return entries.map((entry: any) => ({
      action: entry.action,
      adminName: entry.admin_name || entry.adminName || 'Unknown',
      adminEmail: entry.admin_email || entry.adminEmail || '',
      timestamp: entry.created_at || entry.timestamp,
      ipAddress: entry.ip_address || entry.ipAddress || '',
    }));
  } catch {
    return [];
  }
}

export async function deleteUploadedFiles(berkasId: string): Promise<boolean> {
  try {
    await apiFetch(`/berkas/${berkasId}/files`, { method: 'DELETE' });
    return true;
  } catch {
    return false;
  }
}

export async function deleteBerkas(id: string) {
  await apiFetch(`/berkas/${id}`, { method: 'DELETE' });
}

export async function getStats() {
  try {
    const data = await apiFetch<any>('/berkas/stats');
    return {
      total: data.total || 0,
      selesai: data.selesai || 0,
      ditolak: data.ditolak || 0,
    };
  } catch {
    return { total: 0, selesai: 0, ditolak: 0 };
  }
}

export async function getAdminStats() {
  try {
    const data = await apiFetch<any>('/berkas/stats');
    return {
      total: data.total || 0,
      proses: data.proses || 0,
      validasiSu: data.validasi_su || data.validasiSu || 0,
      validasiBt: data.validasi_bt || data.validasiBt || 0,
      selesai: data.selesai || 0,
      ditolak: data.ditolak || 0,
      adminCounts: data.admin_counts || data.adminCounts || {},
    };
  } catch {
    return { total: 0, proses: 0, validasiSu: 0, validasiBt: 0, selesai: 0, ditolak: 0, adminCounts: {} };
  }
}

export async function getTodaySubmissionCount(userId: string): Promise<number> {
  try {
    const data = await apiFetch<{ count: number }>('/berkas/today-count');
    return data.count || 0;
  } catch {
    return 0;
  }
}

export async function getUsers(): Promise<ManagedUser[]> {
  try {
    const data = await apiFetch<any[]>('/users');
    const users = Array.isArray(data) ? data : (data as any)?.data || [];
    return users.map((u: any) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      noTelepon: u.no_telepon || u.noTelepon || '',
      pengguna: u.pengguna || 'Perorangan',
      namaInstansi: u.nama_instansi || u.namaInstansi || null,
      role: u.role || 'user',
    }));
  } catch {
    return [];
  }
}

export async function manageUser(action: string, body: Record<string, any>): Promise<{ success?: boolean; error?: string; id?: string }> {
  try {
    switch (action) {
      case 'create':
        const createRes = await apiFetch('/users', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        return { success: true, id: createRes.id || createRes.data?.id };
      case 'update':
        await apiFetch(`/users/${body.userId}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
        return { success: true };
      case 'delete':
        await apiFetch(`/users/${body.userId}`, { method: 'DELETE' });
        return { success: true };
      default:
        return { error: `Unknown action: ${action}` };
    }
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function getMyValidationCount(userId: string): Promise<number> {
  try {
    const data = await apiFetch<{ count: number }>('/validation-logs/my-count');
    return data.count || 0;
  } catch {
    return 0;
  }
}

export function isDueDateOverdue(dateStr: string): boolean {
  const parts = dateStr.split('/');
  const date = new Date(+parts[2], +parts[1] - 1, +parts[0]);
  const diffDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > 3;
}

export async function updateBerkas(id: string, updates: Record<string, any>): Promise<{ error?: string }> {
  try {
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

    await apiFetch(`/berkas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dbUpdates),
    });
    return {};
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function getBerkasById(id: string): Promise<any | null> {
  try {
    const data = await apiFetch(`/berkas/${id}`);
    const row = (data as any)?.data || data;
    return {
      ...row,
      rejectedFromStatus: row.rejected_from_status,
      rejected_from_status: row.rejected_from_status,
    };
  } catch {
    return null;
  }
}
