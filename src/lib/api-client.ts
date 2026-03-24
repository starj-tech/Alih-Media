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
    'validation.uploaded': 'Upload gagal di server.',
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
    const htmlBody = await res.text().catch(() => '');
    const lowerHtml = htmlBody.toLowerCase();
    console.error('[API] HTML response from:', endpoint, 'Status:', res.status);

    if (res.status === 401) {
      notifyAuthInvalid('Sesi tidak valid. Silakan login kembali.');
      throw new Error('Sesi tidak valid. Silakan login kembali.');
    }
    if (res.status === 403) throw new Error('Akses ditolak.');

    if (lowerHtml.includes('vendor/autoload.php')) {
      throw new Error('Backend belum lengkap: folder vendor belum ter-upload. Hubungi admin server.');
    }
    if (lowerHtml.includes('500') || lowerHtml.includes('internal server error')) {
      throw new Error('Server error (500). Buka clear-all-cache.php di server, lalu coba lagi.');
    }
    if (lowerHtml.includes('syntax error') || lowerHtml.includes('parse error')) {
      throw new Error('Server error: kesalahan sintaks kode backend. Hubungi admin.');
    }

    throw new Error('Server mengembalikan respons tidak valid. Buka clear-all-cache.php di server.');
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

// ==========================================
// UPLOAD: Chunked (primary method)
// ==========================================

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    binary += String.fromCharCode(...bytes.subarray(i, i + step));
  }
  return btoa(binary);
}

/** Non-retryable error codes from backend */
const FATAL_ERROR_CODES = new Set([
  'auth_missing', 'invalid_file_type', 'file_too_large', 'invalid_type',
]);

function isFatalUploadError(data: any): boolean {
  return data?.code && FATAL_ERROR_CODES.has(data.code);
}

async function parseUploadResponse(res: Response, context: string): Promise<any> {
  const ct = (res.headers.get('content-type') || '').toLowerCase();

  if (ct.includes('text/html')) {
    if (res.status === 401) {
      notifyAuthInvalid();
      throw new Error('Sesi tidak valid. Silakan login kembali.');
    }
    const html = await res.text().catch(() => '');
    if (html.toLowerCase().includes('vendor/autoload.php')) {
      throw new Error('Backend belum lengkap: folder vendor hilang di server.');
    }
    throw new Error(`${context}: server error HTML (${res.status}).`);
  }

  const data = await res.json().catch(() => ({ error: res.statusText || context }));

  if (!res.ok) {
    const msg = extractApiError(data, `${context} (HTTP ${res.status})`);
    if (res.status === 401) notifyAuthInvalid(msg);

    const err = new Error(msg) as any;
    err.backendCode = data?.code;
    err.fatal = isFatalUploadError(data);
    throw err;
  }

  return data;
}

export async function apiUploadChunked(
  endpoint: string,
  file: File,
  type: 'sertifikat' | 'ktp' | 'foto-bangunan',
  onProgress?: (percent: number) => void,
): Promise<any> {
  const token = getToken();
  const chunkSize = 128 * 1024;
  const totalChunks = Math.max(1, Math.ceil(file.size / chunkSize));
  const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const errors: string[] = [];

  // Strategies: raw binary (primary), JSON base64, urlencoded base64
  const strategies = ['binary', 'json', 'urlencoded'] as const;

  for (const strategy of strategies) {
    const sid = `${uploadId}-${strategy}`;
    try {
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(file.size, start + chunkSize);
        const chunk = file.slice(start, end);
        const buffer = await chunk.arrayBuffer();
        const b64 = uint8ArrayToBase64(new Uint8Array(buffer));

        const qs = new URLSearchParams({
          type,
          upload_id: sid,
          chunk_index: String(i),
          total_chunks: String(totalChunks),
          file_name: file.name,
        });

        const url = `${LARAVEL_API_URL}${endpoint}?${qs.toString()}`;
        const headers: Record<string, string> = {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...authTokenHeaders(token),
        };

        let res: Response;
        if (strategy === 'binary') {
          res = await fetch(url, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/octet-stream' },
            body: buffer,
          });
        } else if (strategy === 'json') {
          res = await fetch(url, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ chunk_base64: b64 }),
          });
        } else {
          res = await fetch(url, {
            method: 'POST',
            headers,
            body: new URLSearchParams({ chunk_base64: b64 }),
          });
        }

        const data = await parseUploadResponse(res, `Upload chunk ${i + 1}/${totalChunks}`);
        onProgress?.(Math.round(((i + 1) / totalChunks) * 100));

        if (i === totalChunks - 1) return data;
      }
    } catch (err: any) {
      errors.push(`${strategy}: ${err?.message || 'gagal'}`);
      // If it's a fatal error (wrong file type, auth), don't try next strategy
      if (err?.fatal) throw err;
      // If it's the last strategy, throw
      if (strategy === strategies[strategies.length - 1]) throw err;
      console.warn(`[Upload] Strategy "${strategy}" failed: ${err?.message}. Trying next...`);
    }
  }

  throw new Error(`Upload gagal pada semua metode chunked. ${errors.join(' | ')}`.trim());
}

export async function apiUploadBase64(
  endpoint: string,
  file: File,
  type: 'sertifikat' | 'ktp' | 'foto-bangunan',
  onProgress?: (percent: number) => void,
): Promise<any> {
  const token = getToken();
  onProgress?.(10);

  const buffer = await file.arrayBuffer();
  const fileBase64 = uint8ArrayToBase64(new Uint8Array(buffer));
  onProgress?.(45);

  const strategies = ['json', 'urlencoded'] as const;
  const errors: string[] = [];

  for (const strategy of strategies) {
    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...authTokenHeaders(token),
      };

      let res: Response;
      if (strategy === 'json') {
        res = await fetch(`${LARAVEL_API_URL}${endpoint}`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type,
            file_name: file.name,
            file_base64: fileBase64,
          }),
        });
      } else {
        res = await fetch(`${LARAVEL_API_URL}${endpoint}`, {
          method: 'POST',
          headers,
          body: new URLSearchParams({
            type,
            file_name: file.name,
            file_base64: fileBase64,
          }),
        });
      }

      onProgress?.(80);
      const data = await parseUploadResponse(res, 'Upload base64');
      onProgress?.(100);
      return data;
    } catch (err: any) {
      errors.push(`${strategy}: ${err?.message || 'gagal'}`);
      if (err?.fatal) throw err;
      if (strategy === strategies[strategies.length - 1]) throw err;
      console.warn(`[Upload] Base64 strategy "${strategy}" failed: ${err?.message}. Trying next...`);
    }
  }

  throw new Error(`Upload base64 gagal pada semua metode. ${errors.join(' | ')}`.trim());
}

// ==========================================
// UPLOAD: Standard multipart (fallback)
// ==========================================

export async function apiUpload(
  endpoint: string,
  formData: FormData,
  onProgress?: (percent: number) => void,
): Promise<any> {
  const token = getToken();
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
    throw new Error('Tidak dapat terhubung ke server untuk upload.');
  }

  onProgress?.(80);
  const data = await parseUploadResponse(res, 'Upload standard');
  onProgress?.(100);
  return data;
}
