

## Analisis

Database server menggunakan **MySQL/MariaDB**, bukan PostgreSQL. Perlu dilakukan:

1. **Ubah default DB_CONNECTION** dari `pgsql` ke `mysql` di `.env.example` dan `config/database.php`
2. **Buatkan file SQL mentah** (`database.sql`) berisi semua CREATE TABLE + INSERT seed data yang bisa langsung di-copy-paste ke phpMyAdmin atau MySQL client
3. **Panduan akses database** dari hosting

## Rencana Implementasi

### 1. Update konfigurasi default ke MySQL
- `config/database.php`: ubah default dari `pgsql` ke `mysql`
- `.env.example`: set `DB_CONNECTION=mysql`, port `3306`, dan kredensial contoh sesuai server

### 2. Buat file `laravel-backend/database.sql`
File SQL lengkap yang kompatibel MySQL/MariaDB berisi:
- CREATE TABLE `users`, `password_resets`, `sessions`, `personal_access_tokens`
- CREATE TABLE `profiles`, `user_roles`, `berkas`, `validation_logs`, `password_reset_otps`
- INSERT seed Super Admin + profile + role
- UUID menggunakan `UUID()` function MySQL

### 3. Panduan akses database
Karena SSH tidak tersedia, opsi yang tersedia:
- **phpMyAdmin** via panel hosting (biasanya di `https://domain/phpmyadmin` atau via cPanel)
- **Remote MySQL** jika hosting mengizinkan koneksi dari luar (perlu whitelist IP di panel hosting)
- **HeidiSQL / DBeaver** dari komputer lokal jika port 3306 terbuka

### 4. Update migration files
Pastikan semua migration kompatibel MySQL (sudah kompatibel, karena Laravel Schema Builder abstrak). Hanya perlu memastikan UUID column menggunakan `CHAR(36)` yang sudah otomatis dari `$table->uuid()`.

### File yang akan diubah:
- `laravel-backend/config/database.php` -- default connection ke mysql
- `laravel-backend/.env.example` -- kredensial MySQL
- `laravel-backend/database.sql` -- **file baru**, SQL mentah untuk import langsung

