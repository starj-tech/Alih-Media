

## Langkah-langkah Upload ke FTP (Backend + Frontend)

### A. Persiapan di Komputer Lokal

#### 1. Install dependencies backend
```bash
cd laravel-backend
composer install
```
Ini akan membuat folder `vendor/` yang berisi semua dependensi PHP.

#### 2. Build frontend
```bash
# kembali ke root project
cd ..
npm run build
```
Ini akan membuat folder `dist/` yang berisi file HTML, JS, CSS siap deploy.

---

### B. Upload Backend ke FTP

**Koneksi FTP (FileZilla/WinSCP):**
- Host: `156.67.221.195`
- User: `admin_api-alihmedia`
- Pass: `sirkuitsentul`
- Port: `21`

**Yang diupload:** Semua isi folder `laravel-backend/` ke `public_html/`

```text
Komputer lokal                    Server (public_html/)
laravel-backend/                  
├── app/            ──────►       public_html/app/
├── bootstrap/      ──────►       public_html/bootstrap/
├── config/         ──────►       public_html/config/
├── database/       ──────►       public_html/database/
├── public/         ──────►       public_html/public/
├── routes/         ──────►       public_html/routes/
├── storage/        ──────►       public_html/storage/
├── vendor/         ──────►       public_html/vendor/        ← WAJIB
├── .env            ──────►       public_html/.env           ← WAJIB
├── artisan         ──────►       public_html/artisan
├── composer.json   ──────►       public_html/composer.json
└── composer.lock   ──────►       public_html/composer.lock
```

**Penting:** Upload isi DALAM `laravel-backend/`, bukan folder `laravel-backend/` itu sendiri.

**Setelah upload, minta admin server jalankan:**
```bash
cd public_html
php artisan key:generate
php artisan storage:link
chmod -R 775 storage bootstrap/cache
```

**Jika tidak ada akses SSH**, akses via browser: `https://api-alihmedia.kantahkabbogor.id/keygen.php` (file ini sudah ada di `public/keygen.php` dari panduan sebelumnya — perlu dibuat dulu).

**Test:** Buka `https://api-alihmedia.kantahkabbogor.id/api/health`

---

### C. Upload Frontend ke FTP

**Koneksi FTP (FileZilla/WinSCP):**
- Host: `156.67.221.195`
- User: `admin_dev-alihmedia`
- Pass: `pakansari`
- Port: `21`

**Yang diupload:** Semua isi folder `dist/` ke `public_html/`

```text
Komputer lokal                    Server (public_html/)
dist/
├── assets/         ──────►       public_html/assets/
├── index.html      ──────►       public_html/index.html
├── _redirects      ──────►       public_html/_redirects
└── ...lainnya      ──────►       public_html/...
```

**Penting:** Upload isi DALAM `dist/`, bukan folder `dist/` itu sendiri.

**Tambahan:** Buat file `.htaccess` di `public_html/` frontend agar SPA routing berfungsi:
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>
```

**Test:** Buka `http://dev-alihmedia.kantahkabbogor.id`

---

### D. Urutan Ringkas

1. `cd laravel-backend && composer install` — install dependensi PHP
2. `cd .. && npm run build` — build frontend
3. Buka FileZilla, connect ke FTP backend, upload isi `laravel-backend/` ke `public_html/`
4. Minta admin jalankan `php artisan key:generate && php artisan storage:link`
5. Buka FileZilla, connect ke FTP frontend, upload isi `dist/` + file `.htaccess` ke `public_html/`
6. Test kedua URL

### Catatan Implementasi

Saya perlu membuat file `keygen.php` di `laravel-backend/public/` sebagai alternatif jika tidak ada akses SSH untuk menjalankan artisan commands. Selain itu perlu memastikan konfigurasi API URL di frontend sudah mengarah ke `https://api-alihmedia.kantahkabbogor.id/api` sebelum build.

