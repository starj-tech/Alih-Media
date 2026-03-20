

## Masalah

Endpoint `/api/health/storage` dilindungi middleware `auth:sanctum` (baris 36 di `routes/api.php`), sehingga saat Anda membukanya langsung di browser tanpa token Bearer, hasilnya `{"message":"Unauthenticated."}`.

## Solusi

Dua perubahan kecil:

### 1. Pindahkan route `/api/health/storage` ke luar middleware auth

Di `laravel-backend/routes/api.php`, pindahkan baris 36 ke area public routes (di bawah `/health`), tanpa middleware `auth:sanctum`. Endpoint ini hanya menampilkan status folder dan tidak mengandung data sensitif user.

### 2. Buat juga versi helper browser: `public/storage-health.php`

Sebagai cadangan (sama seperti `fix-storage.php` dan `clear-all-cache.php`), buat file PHP sederhana di `public/` yang langsung menjalankan logika diagnostik storage tanpa melalui routing Laravel. Ini menjamin Anda selalu bisa mengaksesnya meskipun ada masalah cache/routing.

### File yang diubah
- `laravel-backend/routes/api.php` — pindahkan route ke public
- `laravel-backend/public/storage-health.php` — buat helper browser baru

