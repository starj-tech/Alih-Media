

## Solusi: Install Tools yang Dibutuhkan

### Masalah 1: Composer Belum Terinstall

**Download & Install Composer untuk Windows:**
1. Buka https://getcomposer.org/download/
2. Download **Composer-Setup.exe**
3. Jalankan installer — akan otomatis mendeteksi PHP di komputer Anda
4. Jika PHP juga belum ada, install **XAMPP** dulu dari https://www.apachefriends.org/ (sudah include PHP + Composer)
5. Setelah install, tutup Git Bash, buka ulang, lalu coba `composer --version`

### Masalah 2: Vite Not Found

Anda perlu jalankan `npm install` dulu sebelum `npm run build`:

```bash
cd ~/Alih-Media-main
npm install          # ← ini dulu, install semua dependencies
npm run build        # ← baru build
```

### Urutan Lengkap Setelah Semua Terinstall

```bash
# 1. Build frontend
cd ~/Alih-Media-main
npm install
npm run build

# 2. Install dependencies backend
cd laravel-backend
composer install
```

### Alternatif: Tanpa Install Composer

Jika install Composer terlalu rumit, ada opsi lain — saya bisa membuat agar folder `vendor/` ikut masuk ke Git repository, sehingga Anda tinggal upload langsung tanpa perlu menjalankan `composer install` sama sekali. Ukuran repo akan lebih besar, tapi proses deploy jadi lebih simpel.

### Perubahan yang akan dilakukan

1. **Update `.gitignore`** — Hapus `/vendor` dari daftar ignore agar folder vendor ikut ter-commit
2. **Tidak ada perubahan kode** — Hanya konfigurasi Git

Namun untuk `npm install` + `npm run build`, ini **harus** dijalankan di komputer lokal karena hasil build (`dist/`) bergantung pada OS dan environment. Jadi pastikan Node.js dan npm sudah terinstall.

