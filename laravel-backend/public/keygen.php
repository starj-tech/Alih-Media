<?php
/**
 * ⚠️ HAPUS FILE INI SETELAH SELESAI DIGUNAKAN!
 * 
 * Akses via browser: https://api-alihmedia.kantahkabbogor.id/keygen.php
 * Fungsi: Generate APP_KEY dan buat storage link tanpa akses SSH
 */

require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "<pre>\n";
echo "=== Setup Alihmedia Backend ===\n\n";

// 1. Generate APP_KEY
\Illuminate\Support\Facades\Artisan::call('key:generate', ['--force' => true]);
echo "✅ APP_KEY generated: " . config('app.key') . "\n\n";

// 2. Storage link
try {
    \Illuminate\Support\Facades\Artisan::call('storage:link');
    echo "✅ Storage link created\n\n";
} catch (\Exception $e) {
    echo "⚠️ Storage link: " . $e->getMessage() . "\n\n";
}

echo "=== Setup Selesai ===\n";
echo "⚠️ HAPUS FILE keygen.php INI SEKARANG!\n";
echo "</pre>";
