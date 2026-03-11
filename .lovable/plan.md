

## Analisa Masalah Login Gagal

### Masalah 1: CORS memblokir request dari HTTPS
Frontend di `https://dev-alihmedia.kantahkabbogor.id` diblokir oleh CORS karena hanya `http://dev-alihmedia.kantahkabbogor.id` (tanpa HTTPS) yang terdaftar di allowed origins.

**File yang perlu diubah:**
- `laravel-backend/app/Http/Middleware/CorsMiddleware.php` -- tambah `https://dev-alihmedia.kantahkabbogor.id`
- `laravel-backend/config/cors.php` -- tambah `https://dev-alihmedia.kantahkabbogor.id`

### Masalah 2: Format response `/auth/me` tidak cocok
- Backend `AuthController::me()` mengembalikan: `{ id, email, name, role }`
- Frontend `getUserProfile()` mengharapkan: `{ user: { id, email, name, role } }`
- Akibatnya `data.user` selalu `undefined`, login selalu gagal dengan "Profil tidak ditemukan"

**File yang perlu diubah:**
- `src/lib/auth.ts` -- sesuaikan `getUserProfile()` agar membaca response langsung tanpa wrapper `user`

### Perubahan Detail

**1. `laravel-backend/app/Http/Middleware/CorsMiddleware.php`**
Tambah `https://dev-alihmedia.kantahkabbogor.id` ke array `$allowed`

**2. `laravel-backend/config/cors.php`**
Tambah `https://dev-alihmedia.kantahkabbogor.id` ke `allowed_origins`

**3. `src/lib/auth.ts`**
Ubah `getUserProfile()` dari:
```typescript
const data = await apiFetch<{ user: any }>('/auth/me');
if (!data?.user) return null;
return { id: data.user.id, ... };
```
Menjadi:
```typescript
const data = await apiFetch<any>('/auth/me');
if (!data?.id) return null;
return { id: data.id, email: data.email, name: data.name, role: data.role };
```

### Langkah setelah implementasi
1. Upload file CORS yang diupdate ke FTP backend
2. Test login di `https://dev-alihmedia.kantahkabbogor.id`

