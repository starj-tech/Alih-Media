# Restore folder vendor Laravel

Folder `vendor/` **tidak bisa dibuat manual dengan aman** karena isinya harus dihasilkan oleh Composer dari `composer.json` beserta dependensi turunannya.

## Masalah yang sedang terjadi

Output seperti berikut:

```text
Composer detected issues in your platform. Your Composer dependencies require a PHP version ">= 8.2.0".
```

artinya folder `vendor/` yang ter-upload **dibangun dengan versi dependency yang tidak kompatibel** dengan PHP server produksi Anda.

## Langkah restore yang benar

Jalankan dari folder `laravel-backend/` di komputer lokal Anda:

```bash
# 1. hapus hasil build dependency yang salah
rm -rf vendor composer.lock

# 2. install ulang dependency mengikuti platform PHP server
composer install --no-dev --optimize-autoloader
```

Jika Anda memakai Windows dan tidak punya `rm`, hapus manual folder `vendor/` dan file `composer.lock`, lalu jalankan:

```bash
composer install --no-dev --optimize-autoloader
```

> Project ini sekarang dikunci ke platform PHP `7.4.10`, jadi Composer di komputer lokal akan memilih versi paket yang aman untuk server produksi.

## File yang wajib ikut di-upload

Pastikan file/folder berikut ikut di-upload ke server:

- `laravel-backend/vendor/`
- `laravel-backend/composer.json`
- `laravel-backend/composer.lock`
- `laravel-backend/artisan`
- `laravel-backend/bootstrap/`
- `laravel-backend/app/`
- `laravel-backend/config/`
- `laravel-backend/routes/`
- `laravel-backend/public/`
- `laravel-backend/storage/`
- `laravel-backend/.env` (atau pastikan file env di server tetap ada dan benar)

## Verifikasi minimum setelah upload

1. buka endpoint health API: `/api/health`
2. coba login kembali
3. coba upload sertifikat dan KTP
4. cek bahwa folder berikut writable di server:
   - `storage/`
   - `storage/app/public/`
   - `storage/framework/`
   - `bootstrap/cache/`

## Catatan penting

- Tanpa `vendor/autoload.php`, semua endpoint API Laravel dapat mengembalikan error HTML / respons tidak valid.
- Jika `vendor/` dibangun dari mesin dengan dependency yang terlalu baru, server bisa gagal sejak endpoint `/api/health`.
- **Jangan upload `vendor/` lama yang sebelumnya memunculkan error PHP >= 8.2.0.**
- Setelah upload ulang, buka `clear-all-cache.php` sekali agar cache lama server ikut dibersihkan, lalu hapus file helper tersebut bila sudah selesai dipakai.