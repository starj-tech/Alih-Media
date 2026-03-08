# Panduan Migrasi ke Supabase Mandiri

## Info Project Baru
- **Project Ref**: `zickawmielbmqwgphels`
- **URL**: `https://zickawmielbmqwgphels.supabase.co`

---

## Langkah 1: Jalankan SQL Migration

1. Buka [Supabase Dashboard](https://supabase.com/dashboard/project/zickawmielbmqwgphels)
2. Klik **SQL Editor** di sidebar kiri
3. Klik **New query**
4. Copy-paste **seluruh isi** file `MIGRATION-GUIDE.sql`
5. Klik **Run** (atau tekan Ctrl+Enter)
6. Pastikan tidak ada error

> ⚠️ Jalankan SQL ini **sekali saja**. Jika sudah pernah dijalankan dan ingin mengulang, hapus dulu semua tabel, enum, dan function yang sudah dibuat.

---

## Langkah 2: Buat Akun Admin Pertama

Setelah SQL migration berhasil, buat user admin pertama:

1. Buka **Authentication** > **Users** di dashboard Supabase
2. Klik **Add user** > **Create new user**
3. Masukkan email dan password untuk Super Admin
4. Centang **Auto Confirm User**
5. Klik **Create user**
6. Catat `user_id` yang muncul

Kemudian update role user tersebut menjadi `super_admin`:

1. Buka **SQL Editor**
2. Jalankan:
```sql
UPDATE public.user_roles 
SET role = 'super_admin' 
WHERE user_id = '<user_id_dari_langkah_sebelumnya>';
```

---

## Langkah 3: Deploy Edge Functions

### Install Supabase CLI

```bash
# Menggunakan npm
npm install -g supabase

# Atau menggunakan Homebrew (macOS)
brew install supabase/tap/supabase
```

### Login & Link Project

```bash
supabase login
supabase link --project-ref zickawmielbmqwgphels
```

### Set Secrets

```bash
# Token FONNTE untuk notifikasi WhatsApp (jika digunakan)
supabase secrets set FONNTE_TOKEN=<nilai_token_fonnte_anda>
```

### Deploy Functions

```bash
# Deploy semua edge functions
supabase functions deploy manage-users
supabase functions deploy password-reset-otp
supabase functions deploy send-whatsapp
```

---

## Langkah 4: Konfigurasi Authentication

1. Buka **Authentication** > **Providers** di dashboard Supabase
2. Pastikan **Email** provider aktif
3. Di **Authentication** > **URL Configuration**:
   - Set **Site URL** ke URL frontend Anda (misalnya `https://alih-media.lovable.app`)
   - Tambahkan URL redirect yang diizinkan

---

## Langkah 5: Deploy Frontend

Saat deploy ke Vercel/Netlify, set environment variables:

```
VITE_SUPABASE_URL=https://zickawmielbmqwgphels.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppY2thd21pZWxibXF3Z3BoZWxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNDIyOTEsImV4cCI6MjA4MzgxODI5MX0.CY_dKH27js9XdrVUmnz1cIG3UY9YhYPcOTWrVtWLwmc
VITE_SUPABASE_PROJECT_ID=zickawmielbmqwgphels
```

---

## Langkah 6: Invite Team Members

1. Buka **Settings** > **Team** di dashboard Supabase
2. Klik **Invite**
3. Masukkan email orang yang ingin Anda beri akses
4. Pilih role: **Owner**, **Admin**, atau **Developer**

---

## Struktur Database

### Tabel
| Tabel | Deskripsi |
|-------|-----------|
| `profiles` | Data profil pengguna |
| `user_roles` | Role setiap pengguna |
| `berkas` | Data pengajuan alih media |
| `validation_logs` | Log validasi oleh admin |
| `password_reset_otps` | OTP untuk reset password |

### Enum Types
| Enum | Nilai |
|------|-------|
| `app_role` | admin, user, super_admin, super_user, admin_arsip, admin_validasi_su, admin_validasi_bt |
| `berkas_status` | Proses, Validasi SU & Bidang, Validasi BT, Selesai, Ditolak |
| `jenis_hak` | HM, HGB, HP, HGU, HMSRS, HPL, HW |
| `pengguna_type` | Perorangan, Staf PPAT, Notaris/PPAT, Bank, PT/Badan Hukum |

### Functions
| Function | Deskripsi |
|----------|-----------|
| `has_role(user_id, role)` | Cek apakah user memiliki role tertentu |
| `is_admin(user_id)` | Cek apakah user adalah admin |
| `get_user_role(user_id)` | Ambil role user |
| `handle_new_user()` | Trigger: auto-create profile & role saat signup |
| `get_today_submission_count(user_id)` | Hitung pengajuan hari ini |
| `update_updated_at_column()` | Trigger: auto-update timestamp |
| `cleanup_expired_otps()` | Trigger: hapus OTP expired |

### Edge Functions
| Function | Deskripsi |
|----------|-----------|
| `manage-users` | CRUD user oleh admin (create, update, delete) |
| `password-reset-otp` | Kirim OTP reset password via WhatsApp |
| `send-whatsapp` | Kirim notifikasi WhatsApp via FONNTE |

---

## Troubleshooting

### Error "relation already exists"
SQL migration sudah pernah dijalankan. Drop semua objek terlebih dahulu atau skip bagian yang sudah ada.

### Error saat deploy edge functions
Pastikan sudah `supabase link` ke project yang benar dan sudah login.

### User tidak bisa login
Pastikan trigger `on_auth_user_created` sudah terbuat agar profile otomatis dibuat saat signup.
