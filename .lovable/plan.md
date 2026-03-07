

## Rencana: Migrasi dari Supabase ke Custom REST API

Aplikasi akan sepenuhnya melepas ketergantungan pada Supabase SDK dan berkomunikasi dengan backend REST API di `https://api.alihmedia.kantahkabbogor.id`.

### Arsitektur Baru

```text
Frontend (React)  ──── fetch() ────►  https://api.alihmedia.kantahkabbogor.id
                                        ├── POST /auth/login
                                        ├── POST /auth/register
                                        ├── POST /auth/logout
                                        ├── POST /auth/reset-password
                                        ├── POST /auth/update-password
                                        ├── GET  /auth/profile
                                        ├── GET  /berkas
                                        ├── POST /berkas
                                        ├── PUT  /berkas/:id
                                        ├── DELETE /berkas/:id
                                        ├── PUT  /berkas/:id/status
                                        ├── GET  /berkas/:id/timeline
                                        ├── POST /upload/:type
                                        ├── GET  /files/:path (signed URL)
                                        ├── GET  /users
                                        ├── POST /users/manage
                                        ├── GET  /stats
                                        ├── GET  /admin/stats
                                        └── GET  /admin/my-validation-count
```

### File yang Dibuat/Diubah

#### 1. Buat `src/lib/api.ts` (BARU)
HTTP client wrapper dengan JWT token management:
- Base URL: `https://api.alihmedia.kantahkabbogor.id`
- Otomatis menyertakan `Authorization: Bearer <token>` dari localStorage
- Helper functions: `api.get()`, `api.post()`, `api.put()`, `api.delete()`
- Token storage di localStorage

#### 2. Rewrite `src/lib/auth.ts`
- Hapus semua import Supabase
- `getUserProfile()` → `GET /auth/profile`
- Fungsi helper (isAdminRole, getRoleLabel, dll) tetap sama (pure logic)

#### 3. Rewrite `src/hooks/useAuth.ts`
- Hapus Supabase auth listener
- Login → `POST /auth/login` → simpan JWT token ke localStorage
- Register → `POST /auth/register`
- Logout → hapus token dari localStorage
- Cek session → baca token dari localStorage, panggil `GET /auth/profile`

#### 4. Rewrite `src/lib/data.ts`
- Hapus semua import Supabase
- Semua fungsi CRUD berkas → REST API calls via `api.ts`
- Upload file → `POST /upload/:type` (FormData)
- `getSignedFileUrl()` → `GET /files/:path`
- `manageUser()` → `POST /users/manage`

#### 5. Update `src/pages/LoginPage.tsx`
- Hapus `import { supabase }` (baris 11)
- `handleEmailReset` → panggil `api.post('/auth/reset-password', { email })`

#### 6. Update `src/pages/ResetPassword.tsx`
- Hapus `import { supabase }` (baris 3)
- `handleReset` → panggil `api.post('/auth/update-password', { password })`
- Logout → panggil auth hook

#### 7. Update `src/pages/user/UserInformasi.tsx`
- Hapus `import { supabase }` (baris 16)
- Update berkas via `api.put()` alih-alih `supabase.from().update()`

#### 8. Update `src/App.tsx`
- Hapus `import { supabase }` (baris 33)
- Hapus logika recovery token Supabase (baris 39-60)

#### 9. Hapus Edge Functions
- `supabase/functions/log-validation/index.ts`
- `supabase/functions/manage-users/index.ts`
- `supabase/functions/password-reset-otp/index.ts`
- `supabase/functions/send-whatsapp/index.ts`

---

### Kontrak API yang Harus Diimplementasikan di Backend

Backend Anda di `api.alihmedia.kantahkabbogor.id` harus menyediakan endpoint berikut:

| Endpoint | Method | Auth | Deskripsi |
|----------|--------|------|-----------|
| `/auth/login` | POST | No | Body: `{email, password}` → Response: `{token, user}` |
| `/auth/register` | POST | No | Body: `{name, email, password, no_telepon, pengguna, nama_instansi?}` |
| `/auth/profile` | GET | Yes | Response: `{id, email, name, role}` |
| `/auth/reset-password` | POST | No | Body: `{email}` |
| `/auth/update-password` | POST | Yes | Body: `{password}` |
| `/berkas` | GET | Yes | Query: `?user_id=xxx` (opsional, admin lihat semua) |
| `/berkas` | POST | Yes | Buat berkas baru |
| `/berkas/:id` | PUT | Yes | Update berkas |
| `/berkas/:id` | DELETE | Yes | Hapus berkas |
| `/berkas/:id/status` | PUT | Yes | Update status + catatan |
| `/berkas/:id/timeline` | GET | Yes | Riwayat validasi |
| `/upload/:type` | POST | Yes | FormData, type: sertifikat/ktp/foto-bangunan |
| `/files/:path` | GET | Yes | Download/signed URL |
| `/users` | GET | Yes (admin) | Daftar semua user |
| `/users/manage` | POST | Yes (admin) | CRUD user (create/update/delete/reset-password) |
| `/stats` | GET | Yes | Statistik berkas |
| `/admin/stats` | GET | Yes (admin) | Statistik admin |
| `/admin/my-validation-count` | GET | Yes | Jumlah validasi admin |
| `/berkas/today-count` | GET | Yes | Jumlah pengajuan hari ini |

### Hasil Akhir
- **Tidak ada lagi** referensi ke `@supabase/supabase-js` dalam kode runtime
- Semua komunikasi backend melalui REST API standar dengan JWT
- Backend bisa dibangun dengan teknologi apapun (Express, Laravel, Django, dll)
- Package `@supabase/supabase-js` bisa dihapus dari dependencies

