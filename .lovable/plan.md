
Masalah yang sebenarnya

- Upload pengajuan gagal bukan karena kolom wajib; validasi form di frontend dan backend sudah ada.
- Titik gagal paling mungkin ada di backend saat menerima/menyimpan file di server produksi, lalu error yang kembali ke frontend masih terlalu generik.
- File lama yang dulu bisa dibuka sekarang gagal karena resolver path saat download hanya mencoba kecocokan langsung, padahal data lama kemungkinan tersimpan dengan format path yang berbeda (absolute URL, `/storage/...`, `public/...`, folder lama, atau file fisiknya sudah berpindah).

Do I know what the issue is?

- Ya, cukup jelas untuk diselesaikan.
- Ada 2 sumber masalah utama:
  1. Upload belum deterministic di server produksi: request bisa lolos dari browser tapi gagal di lapisan storage/temp directory/permission/symlink/backend parsing.
  2. Buka file existing gagal di lapisan pencarian file: path yang tersimpan di database dan lokasi fisik file di server tidak selalu sama formatnya.

Yang saya temukan dari kode saat ini

- `src/lib/data.ts` dan `src/lib/api-client.ts` sudah punya banyak fallback upload, tetapi belum punya diagnosa server yang tegas untuk membedakan:
  - request tidak sampai,
  - auth hilang,
  - chunk dir tidak writable,
  - final storage tidak writable,
  - file tersimpan tapi path yang dikembalikan salah.
- `laravel-backend/app/Http/Controllers/FileController.php` masih mengandalkan exact path saat download/delete, jadi file legacy mudah dianggap “tidak ditemukan”.
- `BerkasController.php` menyimpan path apa adanya dari frontend; belum ada normalisasi path sebelum insert/update.
- Anda hanya punya akses buka helper URL dan edit `.env`, jadi solusi harus dibuat agar bisa diverifikasi dari browser tanpa FTP/SSH.

Rencana implementasi

1. Tambahkan endpoint diagnosa storage yang benar-benar menjawab akar masalah
- Buat endpoint JSON baru, mis. `/api/health/storage`, yang melaporkan:
  - auth terdeteksi atau tidak,
  - `APP_URL`,
  - disk default dan root disk public,
  - status writable untuk:
    - `storage/app`
    - `storage/app/public`
    - `storage/app/chunks`
    - `storage/logs`
    - `bootstrap/cache`
  - status symlink/folder `public/storage`,
  - hasil write test file sementara,
  - hasil lookup satu sample path.
- Tujuannya: kita tahu dalam 1 panggilan apakah masalah upload murni kode atau server.

2. Sederhanakan upload jadi 1 jalur utama yang paling tahan server restriktif
- Pertahankan upload bertahap sebagai jalur utama.
- Kurangi percobaan transport yang terlalu banyak dan fokus ke format yang paling aman di hosting restriktif:
  - metadata via query string,
  - isi chunk via `chunk_base64`,
  - ukuran chunk kecil dan konsisten.
- Standard multipart biasa dijadikan fallback terakhir saja, bukan andalan utama.
- Frontend akan menampilkan error yang spesifik dari backend, bukan pesan gabungan yang membingungkan.

3. Perkeras backend upload agar gagal dengan kode error yang jelas
File utama: `laravel-backend/app/Http/Controllers/FileController.php`
- Tambahkan pengecekan eksplisit sebelum simpan:
  - user auth ada,
  - direktori chunk bisa dibuat,
  - direktori final bisa dibuat,
  - disk public writable.
- Tambahkan kode error yang tegas, misalnya:
  - `chunk_dir_not_writable`
  - `public_disk_not_writable`
  - `chunk_missing`
  - `assembled_validation_failed`
  - `storage_write_failed`
- Kembalikan JSON yang konsisten agar frontend bisa menentukan tindak lanjut tanpa tebakan.

4. Normalisasi path saat simpan database agar pengajuan baru tidak rusak lagi
File utama: `BerkasController.php`
- Sebelum `store` dan `update`, normalisasi seluruh field file:
  - `file_sertifikat_url`
  - `file_ktp_url`
  - `file_foto_bangunan_url`
- Simpan hanya relative path yang bersih, misalnya:
```text
{user_id}/sertifikat/nama-file.pdf
{user_id}/ktp/nama-file.jpg
{user_id}/foto-bangunan/nama-file.png
```
- Ini mencegah database berisi campuran absolute URL, `/storage/...`, atau `public/...`.

5. Perbaiki pembukaan file existing dengan resolver path legacy
File utama: `FileController.php`, `src/lib/data.ts`
- Backend download/url/delete tidak hanya cek exact path.
- Tambahkan resolver file yang mencoba beberapa kandidat:
```text
exact path
tanpa /storage/
tanpa public/
basename di folder user/type
basename di folder lama type/
```
- Jika path lama tersimpan sebagai full URL, backend parse dan cari file fisiknya.
- Jika exact path gagal tapi basename ditemukan di lokasi legacy yang valid, file tetap bisa dibuka.
- Ini akan memulihkan banyak file lama tanpa harus edit data satu per satu.

6. Tambahkan logging backend yang memang berguna
- Log 1 baris untuk setiap tahap upload:
  - request masuk,
  - auth user,
  - chunk index,
  - strategi transport,
  - hasil simpan chunk,
  - hasil assemble,
  - path final,
  - error code.
- Log juga saat download:
  - path yang diminta,
  - path setelah normalisasi,
  - kandidat yang dicoba,
  - hasil akhir.
- Dengan ini, kalau ada satu kasus gagal lagi, kita langsung tahu titik patahnya.

7. Rapikan helper browser agar sesuai keterbatasan akses Anda
File utama: `public/fix-storage.php`
- Perlu ditingkatkan agar juga:
  - membuat `storage/app/chunks`,
  - menguji tulis ke `storage/app/chunks`,
  - menampilkan root disk public aktual,
  - menampilkan status `public/storage`,
  - menampilkan `APP_URL` dan `FILESYSTEM_DISK`.
- Karena Anda bisa buka helper URL dan edit `.env`, ini jalur verifikasi tercepat.

8. Penyesuaian frontend yang akan saya buat
- `src/lib/api-client.ts`
  - sederhanakan alur retry,
  - tampilkan kode error backend yang spesifik,
  - hentikan retry jika server jelas menyatakan permission/path issue.
- `src/lib/data.ts`
  - normalisasi path dipusatkan,
  - download menggunakan endpoint backend sebagai jalur utama,
  - direct URL hanya fallback terakhir.
- `src/components/FileDownloadCell.tsx`
  - tampilkan pesan yang membedakan:
    - file fisik tidak ada,
    - akses ditolak,
    - storage belum siap.
- `PengajuanAlihmedia.tsx`
  - progress tetap ada, tetapi error akhir dibuat singkat dan pasti.

Langkah server yang nanti perlu Anda lakukan setelah implementasi
Karena Anda bisa buka helper URL dan edit `.env`, saya akan siapkan agar Anda hanya perlu:
1. memastikan `.env` backend berisi:
   - `APP_URL=https://api-alihmedia.kantahkabbogor.id`
   - `FILESYSTEM_DISK=public`
2. buka `fix-storage.php`
3. buka `clear-all-cache.php`
4. buka `/api/health/storage`
5. uji kirim pengajuan lagi
6. uji buka file lama lagi dari Informasi Alihmedia

Hasil yang ditargetkan
- Pengajuan baru:
  - upload file berhasil,
  - data berkas tersimpan,
  - jika simpan data gagal, file sementara dibersihkan dengan benar,
  - error yang tersisa akan spesifik dan bisa langsung ditindak.
- File existing:
  - file lama yang masih ada fisiknya di server bisa dibuka lagi meskipun format path di database tidak seragam.
- Debugging:
  - tidak lagi “tebak-tebakan”; status storage bisa dibaca dari endpoint diagnosa.

File yang akan menjadi fokus implementasi
- `laravel-backend/app/Http/Controllers/FileController.php`
- `laravel-backend/app/Http/Controllers/BerkasController.php`
- `laravel-backend/routes/api.php`
- `laravel-backend/public/fix-storage.php`
- `src/lib/api-client.ts`
- `src/lib/data.ts`
- `src/components/FileDownloadCell.tsx`
- `src/pages/user/PengajuanAlihmedia.tsx`

Catatan penting
- Kalau file lama ternyata benar-benar sudah hilang secara fisik dari server, kode tidak bisa “menciptakan kembali” file itu; tetapi saya akan buat sistemnya bisa membedakan dengan jelas antara:
  - file memang hilang,
  - path salah,
  - storage salah konfigurasi.
- Untuk kasus Anda, prioritas pertama adalah membuat upload baru pasti berhasil dan membuat file lama yang masih ada fisiknya bisa terbuka lagi.
