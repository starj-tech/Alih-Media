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

// Map raw Laravel validation keys to Indonesian messages
const VALIDATION_MAP: Record<string, Record<string, string>> = {
  email: { 'validation.unique': 'Email sudah terdaftar. Silakan gunakan email lain atau login.', 'validation.email': 'Format email tidak valid', 'validation.required': 'Email harus diisi' },
  password: { 'validation.required': 'Password harus diisi', 'validation.min': 'Password minimal 6 karakter' },
  name: { 'validation.required': 'Nama harus diisi', 'validation.min': 'Nama minimal 2 karakter' },
  no_telepon: { 'validation.required': 'Nomor telepon harus diisi', 'validation.min': 'Nomor telepon minimal 10 digit' },
};

function translateValidationMessage(msg: string, field: string): string {
  // If it looks like a raw validation key (e.g. "validation.unique"), translate it
  if (msg.startsWith('validation.')) {
    const fieldMap = VALIDATION_MAP[field];
    if (fieldMap?.[msg]) return fieldMap[msg];
    // Generic fallback
    const rule = msg.replace('validation.', '');
    return `${field}: ${rule}`;
  }
  return msg;
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

  // Detect HTML responses (e.g. Ignition error pages, redirect pages)
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
    // Prioritize detailed validation errors over generic "The given data was invalid"
    let msg = '';
    if (err.errors && typeof err.errors === 'object') {
      const firstKey = Object.keys(err.errors)[0];
      if (firstKey && Array.isArray(err.errors[firstKey]) && err.errors[firstKey].length > 0) {
        msg = translateValidationMessage(err.errors[firstKey][0], firstKey);
      }
    }
    if (!msg) {
      msg = err.error || err.message || `Request failed (${res.status})`;
    }
    console.error('[API] Error:', endpoint, res.status, msg);
    throw new Error(msg);
  }

  // Handle 204 No Content
  if (res.status === 204) return {} as T;

  return res.json();
}

export async function apiUpload(endpoint: string, formData: FormData): Promise<any> {
  const token = getToken();
  const res = await fetch(`${LARAVEL_API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  // Detect HTML responses on upload too
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    console.error('[API] Upload received HTML instead of JSON from:', endpoint);
    throw new Error('Server mengembalikan respons tidak valid. Hubungi admin.');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || err.message || 'Upload gagal');
  }

  return res.json();
}
