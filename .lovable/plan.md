

## Masalah

Error **SQL 1071: "Specified key was too long; max key length is 767 bytes"** terjadi karena server Anda menggunakan **MariaDB 5.5.65** yang memiliki batasan index key maksimal 767 bytes. Dengan charset `utf8mb4` (4 bytes per karakter), kolom `VARCHAR(255)` menghasilkan index sebesar 255 × 4 = **1020 bytes**, melebihi batas 767.

Kolom-kolom yang bermasalah (yang memiliki UNIQUE KEY atau INDEX):
- `users.email` — VARCHAR(255) UNIQUE → 1020 bytes (melebihi 767)
- `sessions.id` — VARCHAR(255) PRIMARY KEY → 1020 bytes
- `personal_access_tokens.tokenable_type` — VARCHAR(255) dalam composite index → 1020 bytes
- `password_resets.email` — VARCHAR(255) INDEX → 1020 bytes

## Solusi

Perkecil ukuran kolom yang di-index dari `VARCHAR(255)` menjadi `VARCHAR(191)` (191 × 4 = 764 bytes, di bawah batas 767). Kolom yang **tidak** di-index tetap bisa `VARCHAR(255)`.

## Perubahan pada `database.sql`

Kolom yang perlu diubah ke `VARCHAR(191)`:
- `users.email` (UNIQUE KEY)
- `sessions.id` (PRIMARY KEY)
- `personal_access_tokens.tokenable_type` (composite INDEX)
- `personal_access_tokens.token` (UNIQUE KEY, sudah VARCHAR(64) — aman)
- `password_resets.email` (INDEX)
- `profiles.id` — CHAR(36), aman
- `user_roles.id` — CHAR(36), aman

Tidak ada perubahan logika atau struktur data, hanya pengurangan panjang kolom yang ter-index agar kompatibel dengan MariaDB 5.5.

