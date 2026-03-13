<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'app' => 'Alihmedia BPN API',
        'version' => '1.0.0',
        'status' => 'running',
    ]);
});

// Named route 'login' — diperlukan oleh middleware auth bawaan Laravel.
// Karena ini API murni (SPA + Bearer token), route ini mengembalikan JSON 401.
Route::get('/login', function () {
    return response()->json(['message' => 'Unauthenticated.'], 401);
})->name('login');

// ============================================
// Route Diagnostik SMTP (HAPUS SETELAH TESTING!)
// Akses: https://api-alihmedia.kantahkabbogor.id/test-smtp?email=test@example.com
// ============================================
Route::get('/test-smtp', function (\Illuminate\Http\Request $request) {
    $resolution = \App\Support\SmtpConfigResolver::apply();

    $config = [
        'MAIL_MAILER' => config('mail.default'),
        'MAIL_HOST' => config('mail.mailers.smtp.host'),
        'MAIL_PORT' => config('mail.mailers.smtp.port'),
        'MAIL_USERNAME' => config('mail.mailers.smtp.username') ? '***SET***' : '(kosong)',
        'MAIL_PASSWORD' => config('mail.mailers.smtp.password') ? '***SET***' : '(kosong)',
        'MAIL_ENCRYPTION' => config('mail.mailers.smtp.encryption'),
        'MAIL_FROM_ADDRESS' => config('mail.from.address'),
        'MAIL_FROM_NAME' => config('mail.from.name'),
        'SMTP_SOURCE' => $resolution['source'],
    ];

    if (!empty($resolution['missing'])) {
        return response()->json([
            'status' => 'error',
            'message' => 'Konfigurasi SMTP belum lengkap.',
            'missing' => $resolution['missing'],
            'smtp_config' => $config,
            'hint' => [
                'Isi MAIL_HOST, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD, MAIL_FROM_ADDRESS di file .env server',
                'Jika .env tidak bisa dibaca server, pastikan permission file benar',
                'Jalankan clear-all-cache.php setelah update .env',
            ],
        ], 500);
    }

    $testEmail = $request->query('email');

    if (!$testEmail) {
        return response()->json([
            'status' => 'info',
            'message' => 'Tambahkan ?email=alamat@email.com untuk mengirim email test',
            'smtp_config' => $config,
            'php_version' => PHP_VERSION,
        ]);
    }

    try {
        \Illuminate\Support\Facades\Mail::mailer('smtp')->raw(
            "Ini adalah email test dari server Alihmedia BPN.\nWaktu: " . now()->toDateTimeString(),
            function ($message) use ($testEmail) {
                $message->from(config('mail.from.address'), config('mail.from.name', 'Alihmedia BPN'));
                $message->to($testEmail);
                $message->subject('Test SMTP - Alihmedia BPN');
            }
        );

        return response()->json([
            'status' => 'success',
            'message' => "Email test berhasil dikirim ke {$testEmail}. Cek inbox & folder spam.",
            'smtp_config' => $config,
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'status' => 'error',
            'message' => 'Gagal mengirim email',
            'error' => $e->getMessage(),
            'error_class' => get_class($e),
            'smtp_config' => $config,
            'hint' => [
                'Pastikan file .env sudah berisi kredensial SMTP yang benar',
                'Jika pakai Gmail, gunakan App Password (bukan password biasa)',
                'Jalankan clear-all-cache.php untuk membersihkan cache',
                'Cek apakah port 587 tidak diblokir oleh firewall server',
            ],
        ], 500);
    }
});
