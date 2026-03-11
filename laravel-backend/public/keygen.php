<?php
/**
 * ⚠️ HAPUS FILE INI SETELAH SELESAI DIGUNAKAN!
 * 
 * Akses via browser: https://api-alihmedia.kantahkabbogor.id/keygen.php
 * Fungsi: Generate APP_KEY dan buat storage link tanpa akses SSH
 */

// Pre-create directories BEFORE Laravel bootstrap
$baseDir = dirname(__DIR__);
$directories = [
    $baseDir . '/bootstrap/cache',
    $baseDir . '/storage/framework/cache/data',
    $baseDir . '/storage/framework/sessions',
    $baseDir . '/storage/framework/views',
    $baseDir . '/storage/logs',
    $baseDir . '/storage/app/public',
];

echo "<pre>\n";
echo "=== Setup Alihmedia Backend ===\n\n";

// Step 0: Ensure all directories exist before bootstrap
foreach ($directories as $dir) {
    if (!is_dir($dir)) {
        @mkdir($dir, 0775, true);
        echo "📁 Created: " . basename(dirname($dir)) . '/' . basename($dir) . "\n";
    }
}
echo "\n";

// Now bootstrap Laravel
try {
    require $baseDir . '/vendor/autoload.php';
    $app = require_once $baseDir . '/bootstrap/app.php';
    $app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

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
} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n\n";
    echo "=== Coba jalankan fix-cache.php terlebih dahulu ===\n";
}

echo "⚠️ HAPUS FILE keygen.php INI SEKARANG!\n";
echo "</pre>";
