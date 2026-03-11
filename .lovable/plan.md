

## Analisa Masalah

Error: `InvalidArgumentException: Please provide a valid cache path.` dari `Illuminate\View\Compilers\Compiler`.

**Penyebab:** File `config/view.php` tidak ada di project Laravel. File ini mendefinisikan path untuk compiled views (`storage/framework/views`). Tanpa file ini, Laravel tidak tahu di mana menyimpan compiled view cache, sehingga `keygen.php` gagal saat bootstrap karena View Compiler tidak mendapat path yang valid.

## Solusi

### 1. Buat file `laravel-backend/config/view.php`
File konfigurasi standar Laravel untuk view engine:
- `paths`: lokasi template Blade (`resources/views`)
- `compiled`: lokasi compiled views (`storage/framework/views`)

### 2. Update `laravel-backend/public/keygen.php`
Tambahkan pembuatan direktori `storage/framework/views` secara manual **sebelum** bootstrap Laravel, agar tidak tergantung pada `bootstrap/app.php` saja. Ini mencegah race condition di mana view compiler diinisialisasi sebelum direktori tersedia.

### Langkah setelah implementasi:
1. Upload `config/view.php` ke `public_html/config/` di FTP backend
2. Upload `public/keygen.php` yang sudah diupdate ke `public_html/public/` (atau `public_html/` tergantung struktur)
3. Buka `https://api-alihmedia.kantahkabbogor.id/keygen.php`
4. Hapus `keygen.php` dan `fix-cache.php` setelah selesai
5. Test `https://api-alihmedia.kantahkabbogor.id/api/health`

