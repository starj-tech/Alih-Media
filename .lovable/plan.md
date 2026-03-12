
Tujuan: menghentikan loop gagal login dengan perbaikan yang langsung menyasar akar masalah di frontend + backend (FTP-only), bukan patch parsial lagi.

1) Hasil analisa ulang (berdasarkan kode + endpoint live)
- Endpoint live `GET /api/auth/me` masih memunculkan `Route [login] not defined` (HTML), jadi handling unauthenticated di server masih belum konsisten ter-load.
- Arsitektur auth frontend saat ini bermasalah: `useAuth()` dipanggil di banyak komponen (`AppRoutes`, `LoginPage`, `AppSidebar`) tanpa Context/Provider, sehingga state login terpecah per-komponen (bukan global).
  - Dampak: login bisa “berhasil” di komponen LoginPage, tetapi guard route tetap anggap user belum login.
- Ada ketidaksesuaian kredensial seed: di `laravel-backend/database.sql` hash default admin adalah hash bawaan “password”, tetapi komentar menyebut `admin123`. Ini berpotensi jadi sumber 422 berulang.
- Fitur lupa password di UI salah endpoint: frontend panggil `/auth/forgot-password`, backend hanya punya `/auth/reset-password`.

2) Rencana perbaikan (implementasi)
A. Stabilkan auth state (prioritas tertinggi)
- Refactor auth ke pola global Context:
  - Tambah `AuthProvider` + `useAuthContext`.
  - Provider dipasang sekali di root app.
  - Semua komponen (AppRoutes/LoginPage/AppSidebar) konsumsi context yang sama.
- Tujuan: setelah login sukses, seluruh app langsung sinkron tanpa refresh.

B. Benahi alur login agar tidak bergantung endpoint yang bermasalah
- Pertahankan strategi hotfix: setelah `POST /auth/login`, set token + user dari response login.
- Saat bootstrap session, jika ada `auth_user` di localStorage, pakai itu dulu; validasi `/auth/me` tetap non-blocking.
- Jangan ada instance hook lain yang bisa menghapus token secara tidak sengaja.

C. Sinkronkan endpoint auth frontend-backend
- Ubah request lupa password dari `/auth/forgot-password` -> `/auth/reset-password`.
- Rapikan pesan error 401/422 agar pengguna tahu apakah masalah kredensial atau sesi.

D. Hotfix backend kredensial (FTP-only, tanpa SSH)
- Tambah utilitas one-time reset password admin via browser (terproteksi token/secret sederhana), untuk memastikan akun admin bisa dipakai saat ini.
- Setelah dipakai: wajib hapus file utilitas.
- Sekaligus update `database.sql` agar hash default benar-benar sesuai kredensial yang didokumentasikan, supaya deployment berikutnya tidak mengulang masalah.

E. Pastikan cache server benar-benar bersih
- Gunakan `clear-all-cache.php` untuk:
  - clear route/config/cache/view
  - reset OPcache
- Tambahkan output diagnostik kecil (mis. status route named `login`) agar bisa konfirmasi apakah cache stale sudah hilang.

3) File yang akan disentuh
Frontend:
- `src/hooks/useAuth.ts` (refactor ke provider/context-backed logic)
- `src/App.tsx` (pasang AuthProvider, konsumsi context tunggal)
- `src/pages/LoginPage.tsx` (pakai auth context + endpoint reset password yang benar)
- `src/components/AppSidebar.tsx` (hilangkan pemanggilan useAuth terpisah; ambil user dari context/props)

Backend:
- `laravel-backend/public/clear-all-cache.php` (diagnostik cache-route tambahan)
- `laravel-backend/public/reset-admin-password.php` (one-time recovery, lalu dihapus)
- `laravel-backend/database.sql` (sinkronisasi hash default sesuai kredensial dokumentasi)

4) Kriteria sukses (acceptance checks)
- UI login membawa user ke dashboard sesuai role tanpa refresh manual.
- Reload halaman tetap mempertahankan sesi.
- `GET /api/auth/me` tanpa token tidak lagi mematahkan app (401 tertangani aman di frontend).
- Admin bisa login dengan kredensial recovery yang sudah direset.
- Lupa password dari UI tidak lagi 404 endpoint mismatch.

5) Detail teknis singkat
```text
Before:
LoginPage(useAuth A) -> setUser A
AppRoutes(useAuth B) -> user tetap null -> tetap di halaman login

After:
AuthProvider(single store)
LoginPage/AppRoutes/AppSidebar -> baca/tulis store yang sama
=> login state konsisten di seluruh aplikasi
```

Urutan eksekusi yang saya sarankan:
1) Refactor auth context frontend
2) Fix endpoint lupa password
3) Tambah utilitas reset password admin + update hash seed
4) Jalankan clear cache via browser
5) Verifikasi end-to-end login
