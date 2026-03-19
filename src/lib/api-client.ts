// Laravel API Client - Core HTTP utilities
// Configure LARAVEL_API_URL to point to your Laravel server

export const LARAVEL_API_URL = 'https://api-alihmedia.kantahkabbogor.id/api';
export const AUTH_INVALID_EVENT = 'app:auth-invalid';

function getBrowserStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return getBrowserStorage()?.getItem('auth_token') ?? null;
}

export function setToken(token: string) {
  getBrowserStorage()?.setItem('auth_token', token);
}

export function removeToken() {
  getBrowserStorage()?.removeItem('auth_token');
}

export function notifyAuthInvalid(message = 'Sesi Anda telah berakhir. Silakan login kembali.') {
  removeToken();
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(AUTH_INVALID_EVENT, { detail: { message } }));
}

function authTokenHeaders(token: string | null): Record<string, string> {
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`,
    'X-Access-Token': token,
  };
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...authTokenHeaders(token),
  };
}

const VALIDATION_MAP: Record<string, Record<string, string>> = {
  email: { 'validation.unique': 'Email sudah terdaftar. Silakan gunakan email lain atau login.', 'validation.email': 'Format email tidak valid', 'validation.required': 'Email harus diisi' },
  password: { 'validation.required': 'Password harus diisi', 'validation.min': 'Password minimal 6 karakter' },
  name: { 'validation.required': 'Nama harus diisi', 'validation.min': 'Nama minimal 2 karakter' },
  no_telepon: { 'validation.required': 'Nomor telepon harus diisi', 'validation.min': 'Nomor telepon minimal 10 digit' },
  file: {
    'validation.uploaded': 'Upload gagal di server. Sistem akan mencoba mode upload bertahap.',
    'validation.max': 'Ukuran file melebihi batas server.',
    'validation.required': 'File wajib diunggah',
    'validation.mimes': 'Format file tidak sesuai',
    'validation.mimetypes': 'Tipe file tidak didukung',
  },
};

function translateValidationMessage(msg: string, field: string): string {
  if (msg.startsWith('validation.')) {
    const fieldMap = VALIDATION_MAP[field];
    if (fieldMap?.[msg]) return fieldMap[msg];
    const rule = msg.replace('validation.', '');
    return `${field}: ${rule}`;
  }
  return msg;
}

function extractApiError(errorPayload: any, fallback: string) {
  let message = '';

  if (errorPayload?.errors && typeof errorPayload.errors === 'object') {
    const firstKey = Object.keys(errorPayload.errors)[0];
    if (firstKey && Array.isArray(errorPayload.errors[firstKey]) && errorPayload.errors[firstKey].length > 0) {
      message = translateValidationMessage(String(errorPayload.errors[firstKey][0]), firstKey);
    }
  }

  if (!message) {
    message = errorPayload?.error || errorPayload?.message || fallback;
  }

  return message;
}

export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${LARAVEL_API_URL}${endpoint}`, {
      ...options,
      headers: { ...authHeaders(), ...(options.headers as Record<string, string> || {}) },
    });
  } catch (networkError) {
    console.error('[API] Network error:', endpoint, networkError);
    throw new Error('Tidak dapat terhubung ke server. Periksa koneksi internet atau hubungi admin.');
  }

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    console.error('[API] Received HTML instead of JSON from:', endpoint, 'Status:', res.status);
    if (res.status === 401) {
      notifyAuthInvalid('Sesi tidak valid. Silakan login kembali.');
      throw new Error('Sesi tidak valid. Silakan login kembali.');
    }
    if (res.status === 403) {
      throw new Error('Akses ditolak.');
    }
    throw new Error('Server mengembalikan respons tidak valid. Hubungi admin untuk membersihkan cache server.');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    const msg = extractApiError(err, `Request failed (${res.status})`);
    console.error('[API] Error:', endpoint, res.status, msg);
    if (res.status === 401) {
      notifyAuthInvalid(msg || 'Sesi tidak valid. Silakan login kembali.');
    }
    throw new Error(msg);
  }

  if (res.status === 204) return {} as T;

  return res.json();
}

type RetryableUploadError = Error & { retryWithFetch?: boolean };

function createUploadError(message: string, retryWithFetch = false): RetryableUploadError {
  const error = new Error(message) as RetryableUploadError;
  if (retryWithFetch) error.retryWithFetch = true;
  return error;
}

function shouldRetryUploadWithFetch(error: unknown): boolean {
  const err = error as RetryableUploadError | null;
  const message = (err?.message || '').toLowerCase();

  return Boolean(
    err?.retryWithFetch ||
    message.includes('network') ||
    message.includes('koneksi terputus') ||
    message.includes('http 0') ||
    message.includes('status 0') ||
    message.includes('cors')
  );
}

export async function apiUpload(
  endpoint: string,
  formData: FormData,
  onProgress?: (percent: number) => void,
): Promise<any> {
  const token = getToken();

  try {
    return await apiUploadXHR(endpoint, formData, token, onProgress);
  } catch (xhrError: any) {
    if (shouldRetryUploadWithFetch(xhrError)) {
      console.warn('[API] XHR upload failed, trying fetch fallback:', xhrError?.message || xhrError);
      return apiUploadFetch(endpoint, formData, token, onProgress);
    }
    throw xhrError;
  }
}

export async function apiUploadChunked(
  endpoint: string,
  file: File,
  type: 'sertifikat' | 'ktp' | 'foto-bangunan',
  onProgress?: (percent: number) => void,
): Promise<any> {
  const token = getToken();
  const chunkSize = 512 * 1024;
  const totalChunks = Math.max(1, Math.ceil(file.size / chunkSize));
  const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * chunkSize;
    const end = Math.min(file.size, start + chunkSize);
    const chunk = file.slice(start, end, 'application/octet-stream');
    const query = new URLSearchParams({
      type,
      upload_id: uploadId,
      chunk_index: String(chunkIndex),
      total_chunks: String(totalChunks),
      file_name: file.name,
    });

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/octet-stream',
      ...authTokenHeaders(token),
    };

    let res: Response;
    try {
      res = await fetch(`${LARAVEL_API_URL}${endpoint}?${query.toString()}`, {
        method: 'POST',
        headers,
        body: chunk,
      });
    } catch {
      throw createUploadError('Tidak dapat terhubung ke server saat upload bertahap. Periksa koneksi internet.');
    }

    const data = await res.json().catch(() => ({ error: res.statusText }));

    if (!res.ok) {
      const msg = extractApiError(data, `Upload bertahap gagal (HTTP ${res.status})`);
      if (res.status === 401) {
        notifyAuthInvalid(msg || 'Sesi tidak valid. Silakan login kembali.');
      }
      throw createUploadError(msg);
    }

    onProgress?.(Math.round(((chunkIndex + 1) / totalChunks) * 100));

    if (chunkIndex === totalChunks - 1) {
      return data;
    }
  }

  throw createUploadError('Upload bertahap gagal diselesaikan.');
}

async function apiUploadFetch(
  endpoint: string,
  formData: FormData,
  token: string | null,
  onProgress?: (percent: number) => void,
): Promise<any> {
  onProgress?.(10);

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...authTokenHeaders(token),
  };

  let res: Response;
  try {
    res = await fetch(`${LARAVEL_API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });
  } catch {
    throw createUploadError('Tidak dapat terhubung ke server untuk upload. Periksa koneksi internet.');
  }

  onProgress?.(80);

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    const htmlText = await res.text().catch(() => '');
    console.error('[API] Upload fetch got HTML:', res.status, htmlText.substring(0, 200));
    if (res.status === 401) {
      notifyAuthInvalid('Sesi tidak valid. Silakan login kembali.');
      throw createUploadError('Sesi tidak valid. Silakan login kembali.');
    }
    if (res.status === 403) {
      throw createUploadError('Akses ditolak.');
    }
    throw createUploadError(`Upload gagal: server error (${res.status}). Hubungi admin.`);
  }

  const data = await res.json().catch(() => ({ error: res.statusText }));

  if (!res.ok) {
    const msg = extractApiError(data, `Upload gagal (HTTP ${res.status})`);
    if (res.status === 401) {
      notifyAuthInvalid(msg || 'Sesi tidak valid. Silakan login kembali.');
    }
    throw createUploadError(msg);
  }

  onProgress?.(100);
  return data;
}

function apiUploadXHR(
  endpoint: string,
  formData: FormData,
  token: string | null,
  onProgress?: (percent: number) => void,
): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${LARAVEL_API_URL}${endpoint}`);
    xhr.timeout = 120000;
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('X-Access-Token', token);
    }

    onProgress?.(0);

    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });
    }

    xhr.onload = () => {
      const contentType = xhr.getResponseHeader('content-type') || '';
      let data: any = null;

      if (xhr.status === 0) {
        reject(createUploadError('Upload gagal (HTTP 0): koneksi terputus atau diblokir browser.', true));
        return;
      }

      try {
        data = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        if (contentType.includes('text/html')) {
          console.error('[API] Upload HTML response:', endpoint, xhr.status, xhr.responseText?.substring(0, 300));
          if (xhr.status === 401) {
            notifyAuthInvalid('Sesi tidak valid. Silakan login kembali.');
            reject(createUploadError('Sesi tidak valid. Silakan login kembali.'));
            return;
          }
          if (xhr.status === 403) {
            reject(createUploadError('Akses ditolak.'));
            return;
          }
          reject(createUploadError(`Server error (${xhr.status}). Hubungi admin server.`, xhr.status === 0));
          return;
        }
        data = { error: xhr.statusText || 'Respons server tidak dapat dibaca' };
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve(data);
        return;
      }

      const errorMsg = extractApiError(data, `Upload gagal (HTTP ${xhr.status})`);
      console.error('[API] Upload error:', endpoint, xhr.status, errorMsg, data);
      if (xhr.status === 401) {
        notifyAuthInvalid(errorMsg || 'Sesi tidak valid. Silakan login kembali.');
      }
      reject(createUploadError(errorMsg, xhr.status === 0));
    };

    xhr.onerror = () => {
      console.error('[API] Upload XHR network error:', endpoint);
      reject(createUploadError('Koneksi terputus saat upload. Periksa koneksi internet Anda.', true));
    };

    xhr.ontimeout = () => {
      console.error('[API] Upload timeout:', endpoint);
      reject(createUploadError('Upload terlalu lama (>2 menit). Coba file yang lebih kecil atau periksa koneksi.'));
    };

    xhr.send(formData);
  });
}
