

## Rencana Migrasi ke Supabase Mandiri (`zickawmielbmqwgphels`)

### Yang Akan Saya Lakukan

#### 1. Buat `MIGRATION-GUIDE.sql`
File SQL lengkap yang Anda paste ke **SQL Editor** di dashboard Supabase (`zickawmielbmqwgphels`). Berisi:

- **4 Enum types**: `app_role`, `berkas_status`, `jenis_hak`, `pengguna_type`
- **5 Tabel**: `profiles`, `user_roles`, `berkas`, `validation_logs`, `password_reset_otps` (dengan semua kolom, default, dan constraints)
- **7 Functions**: `has_role`, `is_admin`, `get_user_role`, `handle_new_user`, `get_today_submission_count`, `update_updated_at_column`, `cleanup_expired_otps`
- **Trigger**: `on_auth_user_created` agar profile + role otomatis dibuat saat user signup
- **RLS Policies**: Semua 14 policy untuk keamanan data per tabel
- **Storage Bucket**: `berkas-files` dengan policy upload/download

#### 2. Buat `MIGRATION-README.md`
Panduan langkah demi langkah:
1. Buka SQL Editor di dashboard Supabase baru
2. Paste dan jalankan `MIGRATION-GUIDE.sql`
3. Install Supabase CLI & deploy edge functions
4. Set secrets (`FONNTE_TOKEN`)
5. Cara invite orang lain via Settings > Team

#### 3. Update Frontend ke Supabase Baru
Buat file `src/lib/supabase-config.ts` yang meng-override koneksi ke project baru:
- URL: `https://zickawmielbmqwgphels.supabase.co`
- Anon Key: key yang Anda berikan

Update `src/integrations/supabase/client.ts` tidak bisa (auto-generated), jadi saya akan membuat mekanisme agar kode membaca dari konfigurasi yang bisa di-override.

**Catatan**: Karena `client.ts` dan `.env` auto-generated oleh Lovable Cloud, pendekatan terbaik adalah langsung mengubah nilai `.env` saat deploy ke hosting sendiri (Vercel/Netlify), atau saya buat wrapper client yang mengarah ke project baru.

### Langkah Manual yang Harus Anda Lakukan
1. Buka dashboard Supabase project `zickawmielbmqwgphels`
2. Buka **SQL Editor** → paste isi `MIGRATION-GUIDE.sql` → klik **Run**
3. Deploy edge functions via Supabase CLI:
```text
npm install -g supabase
supabase login
supabase link --project-ref zickawmielbmqwgphels
supabase secrets set FONNTE_TOKEN=<nilai_token_anda>
supabase functions deploy manage-users
```
4. Invite orang lain via **Settings > Team** di dashboard Supabase

### Hasil Akhir
- Database identik di project Supabase Anda sendiri
- Frontend mengarah ke project Supabase baru
- Orang yang Anda undang bisa mengelola database + edge functions langsung di dashboard Supabase

