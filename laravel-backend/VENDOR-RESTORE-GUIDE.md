# Restore folder vendor Laravel

Folder `vendor/` **tidak bisa dibuat manual dengan aman** karena isinya harus dihasilkan oleh Composer dari `composer.json` beserta dependensi turunannya.

## Langkah restore paling aman

Jalankan dari folder `laravel-backend/` di komputer lokal Anda:

```bash
composer install --no-dev --optimize-autoloader
```

Jika server Anda juga butuh dependency development untuk sementara, gunakan:

```bash
composer install
```

## Setelah selesai

Pastikan file/folder berikut ikut di-upload ke server:

- `laravel-backend/vendor/`
- `laravel-backend/composer.json`
- `laravel-backend/artisan`
- `laravel-backend/bootstrap/`
- `laravel-backend/app/`
- `laravel-backend/config/`
- `laravel-backend/routes/`
- `laravel-backend/public/`
- `laravel-backend/storage/`

## Verifikasi minimum

Setelah upload:

1. buka endpoint health API
2. coba login lagi
3. coba upload sertifikat dan KTP
4. cek bahwa folder berikut writable di server:
   - `storage/`
   - `storage/app/public/`
   - `storage/framework/`
   - `bootstrap/cache/`

## Catatan penting

- Tanpa `vendor/autoload.php`, semua endpoint API Laravel dapat mengembalikan error HTML / respons tidak valid.
- Kalau Anda punya backup lama folder `vendor/` dari server/PC lain dengan isi project yang sama, itu bisa langsung di-upload sebagai pemulihan cepat.
- Jika tersedia `composer.lock`, upload juga file itu agar versi dependency konsisten.
