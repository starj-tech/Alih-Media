

## Panduan Upload Laravel untuk Admin Server

Karena Anda perlu meminta bantuan admin server, berikut **instruksi lengkap yang bisa Anda berikan ke admin** untuk men-deploy backend Laravel di `api-alihmedia.kantahkabbogor.id`.

---

### Instruksi untuk Admin Server

**Server**: 156.67.221.195  
**Domain**: api-alihmedia.kantahkabbogor.id  
**PHP**: 7.4.10 (sudah terinstall)  
**Database**: MariaDB 5.5.65, database `admin_alihmedia` (sudah di-import)

#### Langkah 1: Upload File Laravel

Upload seluruh isi folder `laravel-backend/` ke server. Misalnya ke `/var/www/api-alihmedia/` atau lokasi yang sudah ditentukan. Struktur folder setelah upload:

```text
/var/www/api-alihmedia/         ← root Laravel
├── app/
├── bootstrap/
├── config/
├── database/
├── public/                     ← document root domain
│   ├── index.php
│   └── .htaccess
├── routes/
├── storage/
├── artisan
├── composer.json
└── .env                        ← buat manual (lihat langkah 3)
```

#### Langkah 2: Arahkan Document Root Domain

Konfigurasi web server (Nginx/Apache) agar domain `api-alihmedia.kantahkabbogor.id` mengarah ke folder **`public/`** di dalam folder Laravel.

**Jika Apache** (tambahkan VirtualHost):
```
<VirtualHost *:80>
    ServerName api-alihmedia.kantahkabbogor.id
    DocumentRoot /var/www/api-alihmedia/public
    <Directory /var/www/api-alihmedia/public>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

**Jika Nginx**:
```
server {
    listen 80;
    server_name api-alihmedia.kantahkabbogor.id;
    root /var/www/api-alihmedia/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

#### Langkah 3: Buat File `.env`

Buat file `.env` di root folder Laravel (`/var/www/api-alihmedia/.env`):

```
APP_NAME="Alihmedia BPN"
APP_ENV=production
APP_KEY=
APP_DEBUG=true
APP_URL=https://api-alihmedia.kantahkabbogor.id

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=admin_alihmedia
DB_USERNAME=admin_alihmedia
DB_PASSWORD=[password_database]

FRONTEND_URL=https://alih-media.lovable.app
SANCTUM_STATEFUL_DOMAINS=alih-media.lovable.app,alihmedia.kantahkabbogor.id
```

#### Langkah 4: Jalankan Perintah Setup

```bash
cd /var/www/api-alihmedia
composer install --optimize-autoloader --no-dev
php artisan key:generate
php artisan storage:link
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

#### Langkah 5: Test

Akses `https://api-alihmedia.kantahkabbogor.id/api/health` di browser. Jika berhasil, akan muncul response JSON.

---

### Yang Akan Saya Lakukan Setelah API Aktif

Setelah admin server selesai dan API bisa diakses, saya akan:
1. Test koneksi dari frontend ke API
2. Pastikan login dan CRUD berkas berfungsi
3. Set `APP_DEBUG=false` untuk production

### Yang Perlu Anda Lakukan

**Kirimkan instruksi di atas ke admin server Anda.** Anda bisa copy-paste seluruh instruksi ini. Setelah admin selesai setup, beri tahu saya dan saya akan test koneksinya.

