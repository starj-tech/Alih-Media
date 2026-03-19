# Backend Laravel 8 - Aplikasi Alih Media BPN

## Persyaratan
- PHP server produksi: 7.4.10
- Composer 2.x
- PostgreSQL 12+ (atau MySQL 5.7+)

> Penting: jalankan `composer install` setelah menghapus `vendor/` dan `composer.lock` lama agar dependency yang terpasang tetap kompatibel dengan server produksi.

## ⚠️ Pisahkan Repo Backend

Backend ini **harus** dipisahkan ke repo Git tersendiri. Jangan gabungkan dengan frontend.

### Langkah Memisahkan Repo:

```bash
# 1. Copy folder laravel-backend ke lokasi baru
cp -r laravel-backend /path/to/alihmedia-backend
cd /path/to/alihmedia-backend

# 2. Inisialisasi repo Git baru
git init
git add .
git commit -m "Initial commit - Laravel 8 backend"

# 3. (Opsional) Push ke remote repository
git remote add origin https://github.com/username/alihmedia-backend.git
git push -u origin main
```

### Kenapa Dipisah?
- Frontend (React) dan backend (Laravel) punya lifecycle deploy yang berbeda
- Frontend di-build jadi static files, backend butuh PHP runtime
- Memudahkan versioning dan rollback masing-masing
- Tim bisa kerja paralel tanpa konflik

## Instalasi

```bash
# 1. Masuk ke folder project
cd alihmedia-backend

# 2. Install dependencies
composer install

# 3. Copy .env.example ke .env
cp .env.example .env

# 4. Generate app key
php artisan key:generate

# 5. Konfigurasi database di .env
# DB_CONNECTION=pgsql
# DB_HOST=127.0.0.1
# DB_PORT=5432
# DB_DATABASE=alihmedia
# DB_USERNAME=postgres
# DB_PASSWORD=your_password

# 6. Jalankan migration
php artisan migrate

# 7. Buat storage link
php artisan storage:link

# 8. Seed admin pertama
php artisan db:seed --class=AdminSeeder

# 9. Jalankan server
php artisan serve
```

## Struktur File
```
app/
├── Console/
│   └── Kernel.php
├── Http/
│   ├── Controllers/
│   │   ├── Controller.php
│   │   ├── AuthController.php
│   │   ├── BerkasController.php
│   │   ├── FileController.php
│   │   ├── PasswordResetOtpController.php
│   │   ├── UserController.php
│   │   └── ValidationLogController.php
│   ├── Kernel.php
│   └── Middleware/
│       ├── AdminMiddleware.php
│       ├── CorsMiddleware.php
│       └── RoleMiddleware.php
├── Models/
│   ├── Berkas.php
│   ├── PasswordResetOtp.php
│   ├── Profile.php
│   ├── User.php
│   ├── UserRole.php
│   └── ValidationLog.php
├── Providers/
│   ├── AppServiceProvider.php
│   ├── AuthServiceProvider.php
│   └── RouteServiceProvider.php
bootstrap/
│   └── app.php
config/
│   ├── app.php
│   ├── auth.php
│   ├── cors.php
│   ├── filesystems.php
│   └── sanctum.php
database/
├── migrations/
│   ├── 0000_create_users_table.php
│   ├── 0000_create_personal_access_tokens_table.php
│   ├── 0001_create_profiles_table.php
│   ├── 0002_create_user_roles_table.php
│   ├── 0003_create_berkas_table.php
│   ├── 0004_create_validation_logs_table.php
│   └── 0005_create_password_reset_otps_table.php
├── seeders/
│   ├── AdminSeeder.php
│   └── DatabaseSeeder.php
routes/
├── api.php
├── console.php
└── web.php
```

## Versi & Kompatibilitas
- **Laravel**: 8.x
- **PHP**: 7.3+ / 8.0+
- **Sanctum**: 2.x
- Tidak menggunakan fitur PHP 8.1+ (enum, named arguments, match expression, nullsafe operator)
