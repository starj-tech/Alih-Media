# Backend Laravel - Aplikasi Alih Media BPN

## Persyaratan
- PHP 8.2+
- Composer
- PostgreSQL 15+ (atau MySQL 8+)
- Node.js 18+ (untuk frontend)

## Instalasi

```bash
# 1. Buat project Laravel baru
composer create-project laravel/laravel alihmedia-backend
cd alihmedia-backend

# 2. Copy semua file dari folder ini ke project Laravel

# 3. Install dependencies
composer require laravel/sanctum
php artisan install:api

# 4. Konfigurasi .env
# DB_CONNECTION=pgsql
# DB_HOST=127.0.0.1
# DB_PORT=5432
# DB_DATABASE=alihmedia
# DB_USERNAME=postgres
# DB_PASSWORD=your_password

# 5. Jalankan migration
php artisan migrate

# 6. Seed admin pertama (opsional)
php artisan db:seed --class=AdminSeeder

# 7. Jalankan server
php artisan serve
```

## Struktur File
```
app/
├── Http/
│   ├── Controllers/
│   │   ├── AuthController.php
│   │   ├── BerkasController.php
│   │   ├── FileController.php
│   │   ├── UserController.php
│   │   └── ValidationLogController.php
│   ├── Middleware/
│   │   ├── AdminMiddleware.php
│   │   └── RoleMiddleware.php
│   └── Requests/
│       ├── BerkasRequest.php
│       └── RegisterRequest.php
├── Models/
│   ├── Berkas.php
│   ├── Profile.php
│   ├── UserRole.php
│   └── ValidationLog.php
database/
├── migrations/
│   ├── 0001_create_profiles_table.php
│   ├── 0002_create_user_roles_table.php
│   ├── 0003_create_berkas_table.php
│   └── 0004_create_validation_logs_table.php
├── seeders/
│   └── AdminSeeder.php
routes/
└── api.php
```
