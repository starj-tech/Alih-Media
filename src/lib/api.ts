// API Abstraction Layer
// Switch between Supabase and Laravel by changing the BACKEND_TYPE
// Set BACKEND_TYPE to 'laravel' and configure LARAVEL_API_URL when ready

type BackendType = 'supabase' | 'laravel';

const BACKEND_TYPE: BackendType = 'supabase'; // Ganti ke 'laravel' saat migrasi
const LARAVEL_API_URL = 'http://localhost:8000/api'; // Ganti ke URL server kantor

// ==========================================
// Token Management (untuk Laravel)
// ==========================================

function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

function setToken(token: string) {
  localStorage.setItem('auth_token', token);
}

function removeToken() {
  localStorage.removeItem('auth_token');
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function laravelFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const res = await fetch(`${LARAVEL_API_URL}${endpoint}`, {
    ...options,
    headers: { ...authHeaders(), ...options.headers },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || err.message || 'Request failed');
  }

  return res.json();
}

// ==========================================
// AUTH API
// ==========================================

export const authApi = {
  async login(email: string, password: string) {
    if (BACKEND_TYPE === 'supabase') {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      return data;
    }

    const data = await laravelFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    return data;
  },

  async register(name: string, email: string, password: string, extra?: {
    no_telepon?: string;
    pengguna?: string;
    nama_instansi?: string;
  }) {
    if (BACKEND_TYPE === 'supabase') {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, ...extra },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw new Error(error.message);
      return data;
    }

    const data = await laravelFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, ...extra }),
    });
    setToken(data.token);
    return data;
  },

  async me() {
    if (BACKEND_TYPE === 'supabase') {
      const { supabase } = await import('@/integrations/supabase/client');
      const { getUserProfile } = await import('@/lib/auth');
      return getUserProfile();
    }

    return laravelFetch('/auth/me');
  },

  async logout() {
    if (BACKEND_TYPE === 'supabase') {
      const { supabase } = await import('@/integrations/supabase/client');
      await supabase.auth.signOut();
      return;
    }

    await laravelFetch('/auth/logout', { method: 'POST' }).catch(() => {});
    removeToken();
  },
};

// ==========================================
// BERKAS API
// ==========================================

export const berkasApi = {
  async getAll() {
    if (BACKEND_TYPE === 'supabase') {
      const { getAllBerkas } = await import('@/lib/data');
      return getAllBerkas();
    }

    return laravelFetch('/berkas');
  },

  async getByUser(userId: string) {
    if (BACKEND_TYPE === 'supabase') {
      const { getBerkasByUser } = await import('@/lib/data');
      return getBerkasByUser(userId);
    }

    return laravelFetch('/berkas');
  },

  async getById(id: string) {
    if (BACKEND_TYPE === 'supabase') {
      const { getBerkasById } = await import('@/lib/data');
      return getBerkasById(id);
    }

    return laravelFetch(`/berkas/${id}`);
  },

  async create(data: Record<string, any>) {
    if (BACKEND_TYPE === 'supabase') {
      const { addBerkas } = await import('@/lib/data');
      return addBerkas(data as any);
    }

    return laravelFetch('/berkas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: Record<string, any>) {
    if (BACKEND_TYPE === 'supabase') {
      const { updateBerkas } = await import('@/lib/data');
      return updateBerkas(id, data);
    }

    return laravelFetch(`/berkas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async updateStatus(id: string, status: string, catatan?: string, validatorId?: string, currentStatus?: string) {
    if (BACKEND_TYPE === 'supabase') {
      const { updateBerkasStatus } = await import('@/lib/data');
      return updateBerkasStatus(id, status as any, catatan, validatorId, currentStatus as any);
    }

    return laravelFetch(`/berkas/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, catatan_penolakan: catatan }),
    });
  },

  async delete(id: string) {
    if (BACKEND_TYPE === 'supabase') {
      const { deleteBerkas } = await import('@/lib/data');
      return deleteBerkas(id);
    }

    return laravelFetch(`/berkas/${id}`, { method: 'DELETE' });
  },

  async getStats() {
    if (BACKEND_TYPE === 'supabase') {
      const { getAdminStats } = await import('@/lib/data');
      return getAdminStats();
    }

    return laravelFetch('/berkas/stats');
  },

  async getTodayCount() {
    if (BACKEND_TYPE === 'supabase') {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;
      const { getTodaySubmissionCount } = await import('@/lib/data');
      return getTodaySubmissionCount(user.id);
    }

    const data = await laravelFetch('/berkas/today-count');
    return data.count;
  },

  async getTimeline(berkasId: string) {
    if (BACKEND_TYPE === 'supabase') {
      const { getBerkasTimeline } = await import('@/lib/data');
      return getBerkasTimeline(berkasId);
    }

    return laravelFetch(`/berkas/${berkasId}/timeline`);
  },
};

// ==========================================
// FILE API
// ==========================================

export const fileApi = {
  async upload(file: File, userId: string, type: 'sertifikat' | 'ktp' | 'foto-bangunan') {
    if (BACKEND_TYPE === 'supabase') {
      const { uploadFile } = await import('@/lib/data');
      return uploadFile(file, userId, type);
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const token = getToken();
    const res = await fetch(`${LARAVEL_API_URL}/files/upload`, {
      method: 'POST',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData,
    });

    if (!res.ok) throw new Error('Upload gagal');
    const data = await res.json();
    return data.path;
  },

  async getSignedUrl(filePath: string) {
    if (BACKEND_TYPE === 'supabase') {
      const { getSignedFileUrl } = await import('@/lib/data');
      return getSignedFileUrl(filePath);
    }

    const data = await laravelFetch(`/files/url/${encodeURIComponent(filePath)}`);
    return data.url;
  },
};

// ==========================================
// USER MANAGEMENT API (Admin only)
// ==========================================

export const userApi = {
  async getAll() {
    if (BACKEND_TYPE === 'supabase') {
      const { getUsers } = await import('@/lib/data');
      return getUsers();
    }

    return laravelFetch('/users');
  },

  async create(data: Record<string, any>) {
    if (BACKEND_TYPE === 'supabase') {
      const { manageUser } = await import('@/lib/data');
      return manageUser('create', data);
    }

    return laravelFetch('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(userId: string, data: Record<string, any>) {
    if (BACKEND_TYPE === 'supabase') {
      const { manageUser } = await import('@/lib/data');
      return manageUser('update', { userId, ...data });
    }

    return laravelFetch(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(userId: string) {
    if (BACKEND_TYPE === 'supabase') {
      const { manageUser } = await import('@/lib/data');
      return manageUser('delete', { userId });
    }

    return laravelFetch(`/users/${userId}`, { method: 'DELETE' });
  },
};

// ==========================================
// VALIDATION LOGS API
// ==========================================

export const validationLogApi = {
  async getMyCount(userId: string) {
    if (BACKEND_TYPE === 'supabase') {
      const { getMyValidationCount } = await import('@/lib/data');
      return getMyValidationCount(userId);
    }

    const data = await laravelFetch('/validation-logs/my-count');
    return data.count;
  },

  async getAdminCounts() {
    if (BACKEND_TYPE === 'supabase') {
      const { getAdminStats } = await import('@/lib/data');
      const stats = await getAdminStats();
      return stats.adminCounts;
    }

    return laravelFetch('/validation-logs/admin-counts');
  },
};

export { BACKEND_TYPE, LARAVEL_API_URL };
