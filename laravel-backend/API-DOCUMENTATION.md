# Dokumentasi API - Aplikasi Alih Media BPN

## Base URL
```
Production: https://api.yourdomain.go.id/api
Development: http://localhost:8000/api
```

## Autentikasi
Semua endpoint (kecuali login & register) memerlukan header:
```
Authorization: Bearer {token}
```

Token didapat dari response login/register.

---

## 1. AUTH ENDPOINTS

### POST `/auth/login`
Login dan mendapatkan token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "token": "1|abc123...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "Nama User",
    "role": "user"
  }
}
```

**Error (422):**
```json
{
  "message": "The given data was invalid.",
  "errors": { "email": ["Email atau password salah."] }
}
```

---

### POST `/auth/register`
Registrasi user baru.

**Request:**
```json
{
  "name": "Nama Lengkap",
  "email": "user@example.com",
  "password": "password123",
  "no_telepon": "08123456789",
  "pengguna": "Perorangan",
  "nama_instansi": null
}
```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| name | string | ✅ | min:2, max:100 |
| email | string | ✅ | unique email |
| password | string | ✅ | min:6 |
| no_telepon | string | ❌ | - |
| pengguna | enum | ❌ | Perorangan, Staf PPAT, Notaris/PPAT, Bank, PT/Badan Hukum |
| nama_instansi | string | ❌ | - |

**Response (201):**
```json
{
  "token": "1|abc123...",
  "user": {
    "id": 2,
    "email": "user@example.com",
    "name": "Nama Lengkap",
    "role": "user"
  }
}
```

---

### GET `/auth/me`
Ambil profil user yang sedang login.

**Response (200):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "Nama User",
  "role": "admin"
}
```

---

### POST `/auth/logout`
Logout (hapus token).

**Response (200):**
```json
{ "message": "Logged out" }
```

---

### POST `/auth/change-password`
Ganti password.

**Request:**
```json
{
  "current_password": "old_password",
  "new_password": "new_password"
}
```

---

## 2. BERKAS ENDPOINTS

### GET `/berkas`
Ambil semua berkas. Admin melihat semua, user hanya milik sendiri.

**Response (200):**
```json
[
  {
    "id": "uuid-1",
    "user_id": 1,
    "tanggal_pengajuan": "2026-03-08",
    "nama_pemegang_hak": "Budi Santoso",
    "nama_pemilik_sertifikat": null,
    "no_hak": "00455",
    "no_su_tahun": "03360/2026",
    "jenis_hak": "HM",
    "kecamatan": "Cibinong",
    "desa": "Pakansari",
    "no_telepon": "08123456789",
    "no_wa_pemohon": null,
    "link_shareloc": null,
    "status": "Proses",
    "file_sertifikat_url": "1/sertifikat/1709900000.pdf",
    "file_ktp_url": "1/ktp/1709900000.jpg",
    "file_foto_bangunan_url": null,
    "validated_by": null,
    "validated_at": null,
    "catatan_penolakan": null,
    "rejected_from_status": null,
    "created_at": "2026-03-08T10:00:00.000Z",
    "updated_at": "2026-03-08T10:00:00.000Z"
  }
]
```

---

### GET `/berkas/{id}`
Ambil satu berkas berdasarkan ID.

---

### POST `/berkas`
Buat berkas baru. Batas: 5 per hari (kecuali super_user).

**Request:**
```json
{
  "nama_pemegang_hak": "Budi Santoso",
  "no_hak": "00455",
  "no_su_tahun": "03360/2026",
  "jenis_hak": "HM",
  "kecamatan": "Cibinong",
  "desa": "Pakansari",
  "no_telepon": "08123456789",
  "nama_pemilik_sertifikat": null,
  "no_wa_pemohon": null,
  "link_shareloc": null,
  "file_sertifikat_url": "path/to/file",
  "file_ktp_url": "path/to/file",
  "file_foto_bangunan_url": null
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| nama_pemegang_hak | string | ✅ | - |
| no_hak | string | ✅ | min:5 |
| no_su_tahun | string | ✅ | - |
| jenis_hak | enum | ✅ | HM, HGB, HP, HGU, HMSRS, HPL, HW |
| kecamatan | string | ✅ | - |
| desa | string | ✅ | - |
| no_telepon | string | ❌ | - |

**Response (201):** Object berkas yang baru dibuat.

**Error (429):**
```json
{ "error": "Kuota harian sudah habis (maks 5)" }
```

---

### PUT `/berkas/{id}`
Update data berkas.

**Request (partial update):**
```json
{
  "no_hak": "00456",
  "link_shareloc": "https://maps.google.com/..."
}
```

---

### PUT `/berkas/{id}/status`
Update status berkas (admin only). Otomatis mencatat validation log.

**Request:**
```json
{
  "status": "Validasi SU & Bidang",
  "catatan_penolakan": null
}
```

| Status Values |
|---------------|
| Proses |
| Validasi SU & Bidang |
| Validasi BT |
| Selesai |
| Ditolak |

Jika status = "Ditolak", field `rejected_from_status` otomatis diisi status sebelumnya.

---

### DELETE `/berkas/{id}`
Hapus berkas beserta file terkait di storage.

---

### GET `/berkas/stats`
Statistik berkas.

**Response (200):**
```json
{
  "total": 150,
  "proses": 30,
  "validasi_su": 25,
  "validasi_bt": 20,
  "selesai": 60,
  "ditolak": 15
}
```

---

### GET `/berkas/today-count`
Jumlah berkas yang disubmit hari ini oleh user yang login.

**Response:**
```json
{ "count": 3 }
```

---

### GET `/berkas/{id}/timeline`
Timeline validasi untuk satu berkas.

**Response:**
```json
[
  {
    "action": "Validasi SU & Bidang",
    "admin_name": "Admin SU",
    "admin_email": "admin.su@bpn.go.id",
    "timestamp": "2026-03-08T10:00:00.000Z",
    "ip_address": "192.168.1.1"
  }
]
```

---

## 3. FILE ENDPOINTS

### POST `/files/upload`
Upload file. Gunakan `multipart/form-data`.

**Request (form-data):**
| Field | Type | Required | Values |
|-------|------|----------|--------|
| file | File | ✅ | max 5MB |
| type | string | ✅ | sertifikat, ktp, foto-bangunan |

- `sertifikat`: harus PDF
- `ktp` / `foto-bangunan`: harus JPG/JPEG

**Response (200):**
```json
{ "path": "1/sertifikat/1709900000.pdf" }
```

---

### GET `/files/url/{path}`
Dapatkan URL download file.

**Response:**
```json
{ "url": "http://server.kantor.go.id/storage/1/sertifikat/1709900000.pdf" }
```

---

### GET `/files/download/{path}`
Download file langsung (binary response).

---

### DELETE `/files/{path}`
Hapus file dari storage.

---

## 4. USER MANAGEMENT (Admin Only)

### GET `/users`
List semua user dengan profil dan role.

**Response:**
```json
[
  {
    "id": 1,
    "email": "user@example.com",
    "name": "Nama User",
    "no_telepon": "08123456789",
    "pengguna": "Perorangan",
    "nama_instansi": null,
    "role": "user"
  }
]
```

---

### POST `/users`
Buat user baru (oleh admin).

**Request:**
```json
{
  "name": "User Baru",
  "email": "new@example.com",
  "password": "password123",
  "role": "admin_arsip",
  "no_telepon": "08123456789",
  "pengguna": "Staf PPAT",
  "nama_instansi": "PPAT Bogor"
}
```

---

### PUT `/users/{id}`
Update user (profil, role, password).

**Request (partial):**
```json
{
  "name": "Nama Baru",
  "role": "admin_validasi_su",
  "password": "new_password"
}
```

---

### DELETE `/users/{id}`
Hapus user (cascade delete profile, role, berkas).

---

## 5. VALIDATION LOGS (Admin Only)

### GET `/validation-logs`
Semua log validasi.

**Response:**
```json
[
  {
    "id": "uuid",
    "berkas_id": "uuid",
    "admin_id": 1,
    "admin_name": "Admin SU",
    "action": "Validasi SU & Bidang",
    "ip_address": "192.168.1.1",
    "created_at": "2026-03-08T10:00:00.000Z"
  }
]
```

---

### GET `/validation-logs/my-count`
Jumlah validasi yang dilakukan oleh admin yang login.

**Response:**
```json
{ "count": 45 }
```

---

### GET `/validation-logs/admin-counts`
Jumlah validasi per admin.

**Response:**
```json
{
  "1": 45,
  "2": 30,
  "3": 22
}
```

---

## Role Enum Values
| Value | Label | Access |
|-------|-------|--------|
| super_admin | Super Admin | Semua fitur + kelola user |
| admin | Admin | Semua fitur + kelola user |
| admin_arsip | Admin Arsip BT/SU | Arsip verifikasi |
| admin_validasi_su | Admin Validasi SU | Validasi SU & Bidang |
| admin_validasi_bt | Admin Validasi BT | Validasi Buku Tanah |
| super_user | Super User | Input tanpa batas |
| user | User | Input berkas (maks 5/hari) |

## HTTP Status Codes
| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 401 | Unauthorized (token tidak valid) |
| 403 | Forbidden (role tidak sesuai) |
| 404 | Not Found |
| 422 | Validation Error |
| 429 | Rate Limited (kuota harian) |
| 500 | Server Error |
