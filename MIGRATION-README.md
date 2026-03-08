# Panduan Migrasi Lengkap ke Supabase Mandiri

## Info Project Baru
- **Project Ref**: `zickawmielbmqwgphels`
- **URL**: `https://zickawmielbmqwgphels.supabase.co`

---

## ⚠️ PENTING: Baca Dulu Sebelum Mulai

Migrasi ini memindahkan **struktur database** dari Lovable Cloud ke project Supabase milik Anda sendiri.
**Data pengguna dan berkas TIDAK otomatis berpindah** — hanya skema (tabel, fungsi, policy) yang dibuat ulang.

Proses ini terdiri dari **4 Langkah Utama** yang harus dilakukan **berurutan**:

```
Langkah 1: Jalankan SQL → Langkah 2: Buat Admin → Langkah 3: Deploy Edge Function → Langkah 4: Deploy Frontend
```

---

## Langkah 1: Jalankan SQL Migration (di Browser)

**Tujuan**: Membuat semua tabel, fungsi, trigger, dan kebijakan keamanan di database baru.

1. Buka browser, masuk ke [Supabase Dashboard](https://supabase.com/dashboard/project/zickawmielbmqwgphels)
2. Di sidebar kiri, klik **SQL Editor**
3. Klik tombol **New query** (kanan atas)
4. Buka file `MIGRATION-GUIDE.sql` dari project ini
5. **Copy SELURUH isinya** (Ctrl+A lalu Ctrl+C)
6. **Paste** ke SQL Editor (Ctrl+V)
7. Klik tombol **Run** (atau tekan Ctrl+Enter)
8. Tunggu sampai muncul **"Success. No rows returned"** — ini artinya berhasil
9. Jika ada error, baca pesan errornya:
   - `"already exists"` → SQL sudah pernah dijalankan, tidak perlu diulang
   - Error lain → screenshot dan tanyakan

**Apa yang dibuat:**
| Objek | Jumlah | Detail |
|-------|--------|--------|
| Enum Types | 4 | `app_role`, `berkas_status`, `jenis_hak`, `pengguna_type` |
| Tabel | 5 | `profiles`, `user_roles`, `berkas`, `validation_logs`, `password_reset_otps` |
| Functions | 7 | `has_role`, `is_admin`, `get_user_role`, `handle_new_user`, dll |
| Triggers | 4 | Auto-create profile, auto-update timestamp, dll |
| RLS Policies | 14 | Keamanan akses data per tabel |
| Storage Bucket | 1 | `berkas-files` untuk upload file |

---

## Langkah 2: Buat Akun Super Admin Pertama (di Browser)

**Tujuan**: Membuat akun admin yang bisa mengelola sistem.

### 2a. Buat User Baru
1. Di dashboard Supabase, klik **Authentication** di sidebar kiri
2. Klik tab **Users**
3. Klik tombol **Add user** → pilih **Create new user**
4. Isi:
   - **Email**: email admin Anda (contoh: `abdurrohmanmuthi@gmail.com`)
   - **Password**: password yang kuat (contoh: `27oktober`)
5. ✅ Centang **Auto Confirm User** (agar tidak perlu verifikasi email)
6. Klik **Create user**
7. 📋 **CATAT** `User UID` yang muncul di tabel (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### 2b. Update Role ke Super Admin
1. Klik **SQL Editor** di sidebar kiri
2. Klik **New query**
3. Paste SQL berikut (ganti `<USER_UID>` dengan UID yang Anda catat):

```sql
UPDATE public.user_roles 
SET role = 'super_admin' 
WHERE user_id = '<USER_UID>';
```

4. Klik **Run**
5. Harus muncul **"Success. 1 row affected"**

> **Contoh nyata:**
> ```sql
> UPDATE public.user_roles 
> SET role = 'super_admin' 
> WHERE user_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
> ```

### 2c. Verifikasi (Opsional)
Jalankan query ini untuk memastikan:
```sql
SELECT p.name, p.email, r.role 
FROM profiles p 
JOIN user_roles r ON p.user_id = r.user_id;
```
Harus menampilkan nama, email, dan role `super_admin`.

---

## Langkah 3: Deploy Edge Function (di Terminal/Command Prompt)

**Tujuan**: Mengaktifkan fitur kelola user (CRUD) yang dijalankan di server.

### 3a. Install Supabase CLI

Buka Terminal (Mac/Linux) atau Command Prompt/PowerShell (Windows):

```bash
# Pilih SALAH SATU cara install:

# Cara 1: Via npm (semua OS)
npm install -g supabase

# Cara 2: Via Homebrew (Mac only)
brew install supabase/tap/supabase
```

Verifikasi instalasi:
```bash
supabase --version
```

### 3b. Login ke Supabase

```bash
supabase login
```
- Browser akan terbuka otomatis
- Login dengan akun Supabase Anda
- Klik **Authorize** untuk memberikan akses CLI

### 3c. Masuk ke Folder Project

```bash
# Navigasi ke folder project Anda
cd /path/ke/folder/project-alih-media
```

> **Penting**: Pastikan Anda berada di folder yang berisi folder `supabase/` 
> Cek dengan: `ls supabase/functions/` — harus terlihat folder `manage-users`

### 3d. Link ke Project Supabase

```bash
supabase link --project-ref zickawmielbmqwgphels
```
- Akan diminta **Database Password** — masukkan password database project Supabase Anda
- Jika belum set password, buka dashboard Supabase → Settings → Database → Reset Database Password

### 3e. Set Secret (Token WhatsApp)

```bash
# Jika Anda menggunakan notifikasi WhatsApp via FONNTE:
supabase secrets set FONNTE_TOKEN=<nilai_token_fonnte_anda>

# Jika TIDAK menggunakan WhatsApp, lewati langkah ini
```

### 3f. Deploy Edge Function

```bash
supabase functions deploy manage-users
```

Tunggu sampai muncul:
```
Edge Function 'manage-users' deployed successfully
```

### 3g. Verifikasi Deployment (Opsional)
1. Buka dashboard Supabase → **Edge Functions** di sidebar
2. Harus terlihat function `manage-users` dengan status **Active**

---

## Langkah 4: Deploy Frontend ke Hosting (Vercel)

**Tujuan**: Menjalankan aplikasi web yang mengarah ke database Supabase baru.

### 4a. Push Code ke GitHub
Pastikan semua perubahan sudah di-push ke repository GitHub Anda.

### 4b. Buat Project di Vercel
1. Buka [vercel.com](https://vercel.com) dan login
2. Klik **Add New** → **Project**
3. Import repository GitHub Anda
4. Di bagian **Environment Variables**, tambahkan:

| Variable Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://zickawmielbmqwgphels.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppY2thd21pZWxibXF3Z3BoZWxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNDIyOTEsImV4cCI6MjA4MzgxODI5MX0.CY_dKH27js9XdrVUmnz1cIG3UY9YhYPcOTWrVtWLwmc` |
| `VITE_SUPABASE_PROJECT_ID` | `zickawmielbmqwgphels` |

5. Klik **Deploy**

### 4c. Konfigurasi Auth URL
1. Buka dashboard Supabase → **Authentication** → **URL Configuration**
2. Set **Site URL** ke URL Vercel Anda (contoh: `https://alih-media.vercel.app`)
3. Tambahkan di **Redirect URLs**:
   - `https://alih-media.vercel.app`
   - `https://alih-media.vercel.app/**`

---

## Langkah 5: Invite Tim (Opsional)

Untuk memberikan akses dashboard Supabase ke rekan kerja:

1. Buka dashboard Supabase → **Settings** → **Team**
2. Klik **Invite**
3. Masukkan email orang yang ingin diberi akses
4. Pilih role:
   - **Owner** — akses penuh termasuk billing
   - **Admin** — akses penuh tanpa billing  
   - **Developer** — akses database & functions saja

---

## Troubleshooting

### ❌ Error "relation already exists" saat jalankan SQL
**Penyebab**: SQL sudah pernah dijalankan sebelumnya.
**Solusi**: Tidak perlu dijalankan lagi, lanjut ke langkah berikutnya.

### ❌ Error saat `supabase functions deploy`
**Penyebab**: Belum link ke project atau belum login.
**Solusi**: Jalankan ulang `supabase login` lalu `supabase link --project-ref zickawmielbmqwgphels`.

### ❌ User tidak bisa login setelah deploy
**Penyebab**: 
1. Trigger `on_auth_user_created` belum terbuat → jalankan ulang MIGRATION-GUIDE.sql
2. Site URL belum dikonfigurasi → cek Authentication → URL Configuration
3. Environment variables salah → cek di Vercel dashboard

### ❌ Fitur Kelola User tidak berfungsi
**Penyebab**: Edge function `manage-users` belum di-deploy.
**Solusi**: Jalankan `supabase functions deploy manage-users`.

---

## Ringkasan Arsitektur

```
┌─────────────────┐     ┌──────────────────────────────────┐
│   Frontend      │     │   Supabase (zickawmielbmqwgphels)│
│   (Vercel)      │────▶│                                  │
│                 │     │   ├── Auth (login/signup)         │
│   React + Vite  │     │   ├── Database (PostgreSQL)       │
│   HashRouter    │     │   │   ├── profiles                │
│                 │     │   │   ├── user_roles              │
│                 │     │   │   ├── berkas                  │
│                 │     │   │   ├── validation_logs         │
│                 │     │   │   └── password_reset_otps     │
│                 │     │   ├── Storage (berkas-files)      │
│                 │     │   └── Edge Functions              │
│                 │     │       └── manage-users            │
└─────────────────┘     └──────────────────────────────────┘
```
