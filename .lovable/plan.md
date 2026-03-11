

## Analisa Masalah

Error yang muncul:
```
The /home/admin/web/api-alihmedia.kantahkabbogor.id/public_html/bootstrap/cache directory must be present and writable.
```

Folder `bootstrap/cache/` tidak ada atau tidak memiliki izin tulis di server. Error ini terjadi **sebelum** Laravel bisa memuat aplikasi, sehingga `keygen.php` yang ada juga tidak bisa dijalankan karena membutuhkan bootstrap Laravel.

## Solusi

Buat file PHP sederhana yang **tidak memerlukan Laravel** untuk membuat folder dan mengatur permission, lalu jalankan via browser.

### Perubahan yang dilakukan:

1. **Buat file `laravel-backend/public/fix-cache.php`** — Script mandiri yang:
   - Membuat folder `bootstrap/cache/` jika belum ada
   - Membuat folder `storage/framework/cache/data/`, `storage/framework/sessions/`, `storage/framework/views/`, `storage/logs/` jika belum ada
   - Mengatur permission 775 pada semua folder tersebut
   - Script ini tidak memerlukan Laravel bootstrap, jadi pasti bisa dijalankan meskipun Laravel error

### Langkah setelah implementasi:

1. Upload file `fix-cache.php` ke `public_html/public/` di FTP backend (atau `public_html/` jika struktur server langsung mengarah ke folder `public/`)
2. Buka browser: `https://api-alihmedia.kantahkabbogor.id/fix-cache.php`
3. Setelah berhasil, buka: `https://api-alihmedia.kantahkabbogor.id/keygen.php` untuk generate APP_KEY
4. **Hapus kedua file** (`fix-cache.php` dan `keygen.php`) via FTP setelah selesai
5. Test: `https://api-alihmedia.kantahkabbogor.id/api/health`

