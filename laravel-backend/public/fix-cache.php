<?php
/**
 * ⚠️ HAPUS FILE INI SETELAH SELESAI DIGUNAKAN!
 * 
 * Script mandiri untuk membuat direktori yang dibutuhkan Laravel.
 * Tidak memerlukan Laravel bootstrap.
 */

echo "<pre>\n";
echo "=== Fix Laravel Directory Permissions ===\n\n";

$baseDir = dirname(__DIR__);

$directories = [
    $baseDir . '/bootstrap/cache',
    $baseDir . '/storage/framework/cache/data',
    $baseDir . '/storage/framework/sessions',
    $baseDir . '/storage/framework/views',
    $baseDir . '/storage/logs',
    $baseDir . '/storage/app/public',
];

foreach ($directories as $dir) {
    $relative = str_replace($baseDir . '/', '', $dir);
    if (!is_dir($dir)) {
        if (mkdir($dir, 0775, true)) {
            echo "✅ Created: {$relative}\n";
        } else {
            echo "❌ Failed to create: {$relative}\n";
        }
    } else {
        chmod($dir, 0775);
        echo "✅ Already exists (permissions updated): {$relative}\n";
    }
}

echo "\n=== Selesai ===\n";
echo "Selanjutnya buka: keygen.php\n";
echo "⚠️ HAPUS FILE fix-cache.php DAN keygen.php SETELAH SELESAI!\n";
echo "</pre>";
