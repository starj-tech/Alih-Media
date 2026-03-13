<?php
/**
 * Script Diagnostik SMTP
 * Akses via browser: https://api-alihmedia.kantahkabbogor.id/test-smtp.php?email=test@example.com
 * 
 * HAPUS FILE INI SETELAH SELESAI TESTING!
 */

// Boot Laravel
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle($request = Illuminate\Http\Request::capture());

header('Content-Type: application/json; charset=utf-8');

// 1. Cek konfigurasi
$config = [
    'MAIL_MAILER' => config('mail.default'),
    'MAIL_HOST' => config('mail.mailers.smtp.host'),
    'MAIL_PORT' => config('mail.mailers.smtp.port'),
    'MAIL_USERNAME' => config('mail.mailers.smtp.username'),
    'MAIL_PASSWORD' => config('mail.mailers.smtp.password') ? '***SET***' : '(kosong)',
    'MAIL_ENCRYPTION' => config('mail.mailers.smtp.encryption'),
    'MAIL_FROM_ADDRESS' => config('mail.from.address'),
    'MAIL_FROM_NAME' => config('mail.from.name'),
];

$testEmail = $_GET['email'] ?? null;

if (!$testEmail) {
    echo json_encode([
        'status' => 'info',
        'message' => 'Tambahkan ?email=alamat@email.com untuk mengirim email test',
        'smtp_config' => $config,
        'php_version' => PHP_VERSION,
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}

// 2. Coba kirim email
try {
    \Illuminate\Support\Facades\Mail::mailer('smtp')->raw(
        "Ini adalah email test dari server Alihmedia BPN.\nWaktu: " . now()->toDateTimeString(),
        function ($message) use ($testEmail) {
            $message->from(config('mail.from.address'), config('mail.from.name', 'Alihmedia BPN'));
            $message->to($testEmail);
            $message->subject('Test SMTP - Alihmedia BPN');
        }
    );

    echo json_encode([
        'status' => 'success',
        'message' => "Email test berhasil dikirim ke {$testEmail}. Cek inbox & folder spam.",
        'smtp_config' => $config,
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
} catch (\Throwable $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Gagal mengirim email',
        'error' => $e->getMessage(),
        'error_class' => get_class($e),
        'smtp_config' => $config,
        'hint' => [
            'Pastikan file .env (BUKAN .env.example) sudah berisi kredensial SMTP yang benar',
            'Jika pakai Gmail, gunakan App Password (bukan password biasa)',
            'Jalankan: php artisan config:clear && php artisan cache:clear',
            'Cek apakah port 587 tidak diblokir oleh firewall server',
        ],
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
}
