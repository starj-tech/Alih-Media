

## Diagnosis

Server `api-alihmedia.kantahkabbogor.id` aktif (PHP 7.4.10) tapi semua endpoint `/api/*` mengembalikan **404 Not Found**. Ini berarti document root server belum mengarah ke folder `public/` Laravel dengan benar.

## Langkah yang Perlu Anda Lakukan di Control Panel

### 1. Pastikan struktur folder benar
Di file manager control panel, cari folder tempat domain `api-alihmedia.kantahkabbogor.id` mengarah (biasanya `public_html` atau subfolder). Pastikan **isi folder `public/`** Laravel (file `index.php`, `.htaccess`) berada di root document folder tersebut.

Struktur yang benar:
```text
public_html/              ← document root domain
├── index.php             ← dari laravel-backend/public/index.php
├── .htaccess             ← dari laravel-backend/public/.htaccess
├── robots.txt
└── storage/              ← symlink (nanti)

(satu level di atas public_html)
├── app/
├── bootstrap/
├── config/
├── database/
├── routes/
├── storage/
├── vendor/
├── artisan
├── composer.json
├── .env
```

**ATAU** jika tidak bisa mengubah document root, upload semua file Laravel ke `public_html/` dan edit `index.php` agar mengarah ke lokasi yang benar.

### 2. Alternatif: Upload semua di `public_html` (jika document root tidak bisa diubah)

Jika control panel Anda tidak mendukung mengubah document root:

1. Upload **seluruh isi `laravel-backend/`** ke folder root domain (mis. `public_html/api-alihmedia/`)
2. Pindahkan isi folder `public/` ke document root
3. Edit `public_html/index.php` — ubah path `__DIR__.'/../'` menjadi path yang sesuai ke folder Laravel

### 3. Konfigurasi `.env`
Buat file `.env` di folder root Laravel dengan isi:
```
APP_ENV=production
APP_DEBUG=true          ← sementara true untuk debug, nanti false
APP_URL=https://api-alihmedia.kantahkabbogor.id
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=admin_alihmedia
DB_USERNAME=admin_alihmedia
DB_PASSWORD=[password_anda]
FRONTEND_URL=https://alih-media.lovable.app
```

### 4. Install dependencies via SSH atau Terminal di control panel
```bash
cd /path/to/laravel
composer install --optimize-autoloader --no-dev
php artisan key:generate
php artisan storage:link
```

### 5. Perubahan kode yang akan saya buat

Setelah Anda konfirmasi Laravel sudah bisa diakses (endpoint `/` menampilkan JSON response), saya akan:
1. **Update `config/cors.php`** — tambahkan `https://alih-media.lovable.app` ke allowed origins
2. **Update `CorsMiddleware.php`** — tambahkan domain production
3. **Test koneksi ulang** dari frontend

## Yang Perlu Anda Lakukan Sekarang

Cek di control panel Anda: **di folder mana file Laravel Anda upload?** Dan **apa document root** untuk domain `api-alihmedia.kantahkabbogor.id`? Kirimkan screenshot file manager-nya agar saya bisa bantu lebih spesifik.

