# Panduan Upload via FTP

## ⚠️ PENTING: Jangan pakai Git untuk deploy, upload langsung via FTP!

Git tidak meng-include folder `vendor/` dan `.env`, sehingga `composer install` selalu gagal di server. Solusinya: **upload semua file langsung via FTP**.

---

## A. Upload Backend ke FTP

**FTP Backend:**
- Host: `156.67.221.195`
- User: `admin_api-alihmedia`
- Domain: `api-alihmedia.kantahkabbogor.id`

### Langkah-langkah:

#### 1. Install dependencies di komputer lokal dulu
```bash
cd laravel-backend
composer install
```

#### 2. Pastikan folder `bootstrap/cache/` ada
```bash
mkdir -p bootstrap/cache
```

#### 3. Upload SEMUA isi folder `laravel-backend/` ke `public_html/` via FTP

Upload menggunakan FileZilla atau WinSCP. Pastikan file/folder berikut **IKUT** diupload:

```
public_html/                    ← root FTP backend
├── app/                        ✅
├── bootstrap/
│   ├── app.php                 ✅
│   └── cache/                  ✅ (HARUS ADA, boleh kosong)
├── config/                     ✅
├── database/                   ✅
├── public/                     ✅
│   ├── index.php
│   └── .htaccess
├── routes/                     ✅
├── storage/                    ✅
│   ├── app/public/
│   ├── framework/
│   │   ├── cache/data/
│   │   ├── sessions/
│   │   └── views/
│   └── logs/
├── vendor/                     ✅ WAJIB! (hasil composer install)
├── .env                        ✅ WAJIB! (sudah dikonfigurasi)
├── .env.example                ✅
├── artisan                     ✅
├── composer.json               ✅
└── composer.lock               ✅ (jika ada)
```

**Yang TIDAK perlu diupload:**
- `node_modules/` (tidak ada)
- `.git/` (tidak perlu)

#### 4. Setelah upload selesai, jalankan via SSH (jika ada akses):
```bash
cd /path/to/public_html
php artisan key:generate
php artisan storage:link
chmod -R 775 storage bootstrap/cache
```

**Jika TIDAK ada akses SSH**, buat file `keygen.php` di `public/`:
```php
<?php
// Akses via browser: https://api-alihmedia.kantahkabbogor.id/keygen.php
// HAPUS FILE INI SETELAH SELESAI!
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
\Illuminate\Support\Facades\Artisan::call('key:generate', ['--force' => true]);
\Illuminate\Support\Facades\Artisan::call('storage:link');
echo "✅ Key generated & storage linked!\n";
echo "APP_KEY: " . config('app.key') . "\n";
echo "⚠️ HAPUS FILE keygen.php INI SEKARANG!";
```

#### 5. Test
Buka browser: `https://api-alihmedia.kantahkabbogor.id/api/health`
Harus muncul: `{"status":"ok"}`

---

## B. Upload Frontend ke FTP

**FTP Frontend:**
- Host: `156.67.221.195`
- User: `admin_dev-alihmedia`
- Domain: `dev-alihmedia.kantahkabbogor.id`

### Langkah-langkah:

#### 1. Build frontend di komputer lokal
```bash
npm run build
```

#### 2. Upload SEMUA isi folder `dist/` ke `public_html/` via FTP

```
public_html/                    ← root FTP frontend
├── assets/                     ✅ (JS, CSS, images)
├── index.html                  ✅
├── _redirects                  ✅ (jika ada)
└── ... file lainnya dari dist/ ✅
```

**PENTING:** Upload isi DALAM folder `dist/`, bukan folder `dist/` itu sendiri.

#### 3. Konfigurasi .htaccess untuk SPA routing

Buat file `.htaccess` di `public_html/` frontend:
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

#### 4. Test
Buka browser: `http://dev-alihmedia.kantahkabbogor.id`

---

## C. Troubleshooting

### Error: "bootstrap/cache directory must be present and writable"
- Buat folder `bootstrap/cache/` secara manual via FTP
- Set permission 775

### Error: "No application encryption key has been specified"
- Jalankan `php artisan key:generate` via SSH
- Atau gunakan file `keygen.php` di atas

### Error: 500 Internal Server Error
- Cek `storage/logs/laravel.log`
- Pastikan permission `storage/` dan `bootstrap/cache/` adalah 775
- Pastikan `.env` ada dan `APP_KEY` terisi

### CORS Error di browser
- Pastikan domain frontend sudah ada di `config/cors.php`
- Sudah dikonfigurasi untuk `dev-alihmedia.kantahkabbogor.id`
