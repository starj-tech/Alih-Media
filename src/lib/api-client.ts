// Laravel API Client - Core HTTP utilities
// Configure LARAVEL_API_URL to point to your Laravel server

export const LARAVEL_API_URL = 'https://api-alihmedia.kantahkabbogor.id/api';

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

function authHeaders(): Record<string, string> {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const VALIDATION_MAP: Record<string, Record<string, string>> = {
  email: { 'validation.unique': 'Email sudah terdaftar. Silakan gunakan email lain atau login.', 'validation.email': 'Format email tidak valid', 'validation.required': 'Email harus diisi' },
  password: { 'validation.required': 'Password harus diisi', 'validation.min': 'Password minimal 6 karakter' },
  name: { 'validation.required': 'Nama harus diisi', 'validation.min': 'Nama minimal 2 karakter' },
  no_telepon: { 'validation.required': 'Nomor telepon harus diisi', 'validation.min': 'Nomor telepon minimal 10 digit' },
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
    if (res.status === 401 || res.status === 403) {
      throw new Error('Sesi tidak valid. Silakan login kembali.');
    }
    throw new Error('Server mengembalikan respons tidak valid. Hubungi admin untuk membersihkan cache server.');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    const msg = extractApiError(err, `Request failed (${res.status})`);
    console.error('[API] Error:', endpoint, res.status, msg);
    throw new Error(msg);
  }

  if (res.status === 204) return {} as T;

  return res.json();
}

export async function apiUpload(
  endpoint: string,
  formData: FormData,
  onProgress?: (percent: number) => void,
): Promise<any> {
  const token = getToken();

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${LARAVEL_API_URL}${endpoint}`);
    xhr.timeout = 60000;
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

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
      if (contentType.includes('text/html')) {
        console.error('[API] Upload received HTML instead of JSON from:', endpoint, 'Status:', xhr.status);
        reject(new Error(xhr.status === 401 || xhr.status === 403 ? 'Sesi tidak valid. Silakan login kembali.' : 'Server upload mengembalikan respons tidak valid.'));
        return;
      }

      let data: any = null;
      try {
        data = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        data = { error: xhr.statusText };
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve(data);
        return;
      }

      reject(new Error(extractApiError(data, `Upload gagal (${xhr.status})`)));
    };

    xhr.onerror = () => {
      reject(new Error('Tidak dapat terhubung ke server saat upload.'));
    };

    xhr.ontimeout = () => {
      reject(new Error('Upload melebihi batas waktu. Silakan coba lagi.'));
    };

    xhr.send(formData);
  });
}
