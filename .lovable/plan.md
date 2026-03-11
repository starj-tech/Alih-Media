
Masalah login paling mungkin belum selesai karena ada konflik di level server/backend, bukan lagi di form login frontend.

Yang saya temukan dari kode saat ini:
1. Frontend login sudah mengarah ke endpoint yang benar: `POST /api/auth/login`
2. Pembacaan profil `/auth/me` juga sudah disesuaikan
3. Tetapi backend sekarang memasang CORS di 3 tempat sekaligus:
   - `Fruitcake\Cors\HandleCors` di `Kernel.php`
   - `App\Http\Middleware\CorsMiddleware` di grup `api`
   - header CORS lagi di `public/.htaccess`

Kondisi ini sangat berisiko menghasilkan header CORS ganda/bertabrakan, dan browser bisa tetap menolak request walaupun domain sudah di-whitelist.

Rencana perbaikan yang benar:

1. Jadikan CORS hanya punya satu sumber utama
   Pilihan paling aman untuk hosting kantor:
   - pertahankan CORS di Apache `.htaccess`
   - nonaktifkan CORS custom di Laravel agar tidak dobel

2. Bersihkan middleware CORS di backend Laravel
   Di `laravel-backend/app/Http/Kernel.php`:
   - hapus `\Fruitcake\Cors\HandleCors::class` dari middleware global
   - hapus `\App\Http\Middleware\CorsMiddleware::class` dari grup `api`

   Tujuan:
   - response hanya punya satu `Access-Control-Allow-Origin`
   - preflight `OPTIONS` tidak “berantem” antara Apache dan Laravel

3. Rapikan aturan preflight di `.htaccess`
   Pastikan `.htaccess` tetap menangani:
   - `OPTIONS`
   - `Access-Control-Allow-Origin`
   - `Access-Control-Allow-Methods`
   - `Access-Control-Allow-Headers`
   - `Access-Control-Allow-Credentials`

   Fokusnya bukan menambah domain lagi, tetapi memastikan hanya Apache yang mengeluarkan header CORS.

4. Verifikasi header Authorization benar-benar diteruskan
   Login awal tidak butuh bearer token, tetapi setelah login frontend langsung memanggil `GET /auth/me`.
   Jika header `Authorization: Bearer ...` tidak diteruskan ke PHP, maka:
   - login bisa berhasil
   - tetapi `/auth/me` gagal
   - UI tetap terlihat seperti “gagal login”

   Jadi setelah CORS dibersihkan, cek lagi `.htaccess` agar forwarding header Authorization tetap aktif.

5. Uji backend secara berurutan
   Setelah upload file backend:
   - uji `OPTIONS /api/auth/login`
   - uji `POST /api/auth/login`
   - ambil token dari response
   - uji `GET /api/auth/me` dengan header `Authorization: Bearer <token>`

   Hasil yang diharapkan:
   - `OPTIONS` balas 200/204 dan ada header CORS
   - `POST /auth/login` balas JSON berisi `token`
   - `GET /auth/me` balas JSON user, bukan 401/redirect/error HTML

6. Jika `/auth/login` sukses tapi `/auth/me` gagal
   Maka akar masalahnya bukan CORS login lagi, melainkan:
   - header Authorization tidak terbaca di Laravel
   - atau guard Sanctum/token tidak aktif benar di server

   Pada kondisi ini fokus berikutnya adalah jalur bearer token, bukan form login.

Langkah implementasi yang saya sarankan:
1. Update `laravel-backend/app/Http/Kernel.php`
2. Upload ulang backend Laravel
3. Jangan tambah layer CORS baru lagi
4. Test ulang urutan `OPTIONS -> login -> me`
5. Jika masih gagal, ambil hasil mentah dari ketiga request itu untuk menentukan titik gagal pastinya

Checklist teknis siap-kirim ke admin server:
- Upload `app/Http/Kernel.php` yang sudah dibersihkan dari middleware CORS ganda
- Pastikan `public/.htaccess` tetap versi terbaru
- Pastikan tidak ada config cache lama:
  - `php artisan config:clear`
  - `php artisan cache:clear`
  - jika tidak ada akses shell, minta admin hapus cache konfigurasi aplikasi
- Cek bahwa response `OPTIONS /api/auth/login` hanya punya satu header `Access-Control-Allow-Origin`
- Cek bahwa `GET /api/auth/me` menerima bearer token dengan benar

Bagian teknis:
```text
Frontend
  -> OPTIONS /api/auth/login
  -> POST /api/auth/login  => token
  -> GET /api/auth/me      => profile

Yang kemungkinan rusak sekarang:
- CORS dobel di Apache + Laravel
atau
- Authorization header tidak sampai ke Laravel saat /auth/me
```

File yang perlu disentuh pada implementasi:
- `laravel-backend/app/Http/Kernel.php`
- `laravel-backend/public/.htaccess` (dipertahankan sebagai sumber CORS utama)

File yang tidak perlu jadi fokus utama lagi:
- `src/lib/auth.ts` sudah sesuai
- `src/lib/api-client.ts` sudah mengarah ke API yang benar
- `config/cors.php` boleh tetap ada, tetapi tidak boleh aktif bersamaan dengan dua layer CORS lain

Setelah Anda setuju, implementasi yang paling tepat adalah membersihkan CORS ganda dulu, lalu baru uji lagi alur login end-to-end.