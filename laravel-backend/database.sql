-- ==========================================
-- ALIHMEDIA BPN - Database SQL (MySQL/MariaDB)
-- Import via phpMyAdmin atau MySQL client
-- Database: admin_alihmedia
-- ==========================================

SET FOREIGN_KEY_CHECKS = 0;

-- ==========================================
-- 1. TABEL USERS
-- ==========================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `email_verified_at` TIMESTAMP NULL DEFAULT NULL,
  `password` VARCHAR(255) NOT NULL,
  `remember_token` VARCHAR(100) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 2. TABEL PASSWORD_RESETS
-- ==========================================
CREATE TABLE IF NOT EXISTS `password_resets` (
  `email` VARCHAR(255) NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  KEY `password_resets_email_index` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 3. TABEL SESSIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` VARCHAR(255) NOT NULL,
  `user_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `ip_address` VARCHAR(45) NULL DEFAULT NULL,
  `user_agent` TEXT NULL DEFAULT NULL,
  `payload` LONGTEXT NOT NULL,
  `last_activity` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 4. TABEL PERSONAL_ACCESS_TOKENS (Sanctum)
-- ==========================================
CREATE TABLE IF NOT EXISTS `personal_access_tokens` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tokenable_type` VARCHAR(255) NOT NULL,
  `tokenable_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `token` VARCHAR(64) NOT NULL,
  `abilities` TEXT NULL DEFAULT NULL,
  `last_used_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`, `tokenable_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 5. TABEL PROFILES
-- ==========================================
CREATE TABLE IF NOT EXISTS `profiles` (
  `id` CHAR(36) NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `no_telepon` VARCHAR(255) NOT NULL DEFAULT '',
  `pengguna` VARCHAR(255) NOT NULL DEFAULT 'Perorangan',
  `nama_instansi` VARCHAR(255) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `profiles_user_id_unique` (`user_id`),
  CONSTRAINT `profiles_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 6. TABEL USER_ROLES
-- ==========================================
CREATE TABLE IF NOT EXISTS `user_roles` (
  `id` CHAR(36) NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `role` VARCHAR(255) NOT NULL DEFAULT 'user',
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_roles_user_id_unique` (`user_id`),
  CONSTRAINT `user_roles_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 7. TABEL BERKAS
-- ==========================================
CREATE TABLE IF NOT EXISTS `berkas` (
  `id` CHAR(36) NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `tanggal_pengajuan` DATE NULL DEFAULT NULL,
  `nama_pemegang_hak` VARCHAR(255) NOT NULL,
  `nama_pemilik_sertifikat` VARCHAR(255) NULL DEFAULT NULL,
  `no_hak` VARCHAR(255) NOT NULL,
  `no_su_tahun` VARCHAR(255) NOT NULL,
  `jenis_hak` VARCHAR(255) NOT NULL,
  `kecamatan` VARCHAR(255) NOT NULL,
  `desa` VARCHAR(255) NOT NULL,
  `no_telepon` VARCHAR(255) NOT NULL DEFAULT '',
  `no_wa_pemohon` VARCHAR(255) NULL DEFAULT NULL,
  `link_shareloc` TEXT NULL DEFAULT NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'Proses',
  `file_sertifikat_url` VARCHAR(255) NULL DEFAULT NULL,
  `file_ktp_url` VARCHAR(255) NULL DEFAULT NULL,
  `file_foto_bangunan_url` VARCHAR(255) NULL DEFAULT NULL,
  `validated_by` BIGINT UNSIGNED NULL DEFAULT NULL,
  `validated_at` TIMESTAMP NULL DEFAULT NULL,
  `catatan_penolakan` TEXT NULL DEFAULT NULL,
  `rejected_from_status` VARCHAR(255) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `berkas_user_id_index` (`user_id`),
  KEY `berkas_validated_by_index` (`validated_by`),
  CONSTRAINT `berkas_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `berkas_validated_by_foreign` FOREIGN KEY (`validated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 8. TABEL VALIDATION_LOGS
-- ==========================================
CREATE TABLE IF NOT EXISTS `validation_logs` (
  `id` CHAR(36) NOT NULL,
  `berkas_id` CHAR(36) NOT NULL,
  `admin_id` BIGINT UNSIGNED NOT NULL,
  `action` VARCHAR(255) NOT NULL,
  `ip_address` VARCHAR(255) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `validation_logs_berkas_id_index` (`berkas_id`),
  KEY `validation_logs_admin_id_index` (`admin_id`),
  CONSTRAINT `validation_logs_berkas_id_foreign` FOREIGN KEY (`berkas_id`) REFERENCES `berkas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `validation_logs_admin_id_foreign` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 9. TABEL PASSWORD_RESET_OTPS
-- ==========================================
CREATE TABLE IF NOT EXISTS `password_reset_otps` (
  `id` CHAR(36) NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `phone` VARCHAR(255) NOT NULL,
  `otp_code` VARCHAR(255) NOT NULL,
  `verified` TINYINT(1) NOT NULL DEFAULT 0,
  `expires_at` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `password_reset_otps_user_id_index` (`user_id`),
  CONSTRAINT `password_reset_otps_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 10. TABEL MIGRATIONS (Laravel internal)
-- ==========================================
CREATE TABLE IF NOT EXISTS `migrations` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `migration` VARCHAR(255) NOT NULL,
  `batch` INT NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================
-- SEED DATA: Super Admin
-- ⚠️ GANTI PASSWORD SEGERA setelah login!
-- Password: admin123 (BCrypt hash)
-- ==========================================

INSERT INTO `users` (`id`, `name`, `email`, `email_verified_at`, `password`, `created_at`, `updated_at`)
VALUES (1, 'Super Admin', 'admin@bpn.go.id', NOW(), '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW());

INSERT INTO `profiles` (`id`, `user_id`, `name`, `email`, `no_telepon`, `pengguna`, `created_at`, `updated_at`)
VALUES (UUID(), 1, 'Super Admin', 'admin@bpn.go.id', '', 'Perorangan', NOW(), NOW());

INSERT INTO `user_roles` (`id`, `user_id`, `role`, `created_at`, `updated_at`)
VALUES (UUID(), 1, 'super_admin', NOW(), NOW());

-- Record migrations as done
INSERT INTO `migrations` (`migration`, `batch`) VALUES
('0000_create_users_table', 1),
('0000_create_personal_access_tokens_table', 1),
('0001_create_profiles_table', 1),
('0002_create_user_roles_table', 1),
('0003_create_berkas_table', 1),
('0004_create_validation_logs_table', 1),
('0005_create_password_reset_otps_table', 1);

-- ==========================================
-- SELESAI!
-- Login: admin@bpn.go.id / admin123
-- ==========================================
