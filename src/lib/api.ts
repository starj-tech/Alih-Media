// Custom REST API client for https://api.alihmedia.kantahkabbogor.id
const BASE_URL = 'https://api.alihmedia.kantahkabbogor.id';

const TOKEN_KEY = 'auth_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<{ data: T | null; error: string | null }> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { data: null, error: body.message || body.error || `Request failed (${res.status})` };
    }

    const data = await res.json().catch(() => null);
    return { data: data as T, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Network error' };
  }
}

export const api = {
  get: <T = any>(path: string) => request<T>(path, { method: 'GET' }),

  post: <T = any>(path: string, body?: any) =>
    request<T>(path, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  put: <T = any>(path: string, body?: any) =>
    request<T>(path, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  delete: <T = any>(path: string) => request<T>(path, { method: 'DELETE' }),
};
