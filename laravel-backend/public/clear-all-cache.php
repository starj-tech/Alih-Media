<?php
/**
 * ⚠️ HAPUS FILE INI SETELAH SELESAI DIGUNAKAN!
 * 
 * Cache Cleaner via Browser — untuk server tanpa akses SSH.
 * Akses: https://api-alihmedia.kantahkabbogor.id/clear-all-cache.php
 */

echo "<pre>\n";
echo "=== Laravel Cache Cleaner ===\n\n";

$baseDir = dirname(__DIR__);

// 1. Hapus route cache files
$cacheFiles = [
    $baseDir . '/bootstrap/cache/routes-v7.php',
    $baseDir . '/bootstrap/cache/routes.php',
    $baseDir . '/bootstrap/cache/config.php',
    $baseDir . '/bootstrap/cache/services.php',
    $baseDir . '/bootstrap/cache/packages.php',
];

echo "--- Menghapus file cache ---\n";
foreach ($cacheFiles as $file) {
    $relative = str_replace($baseDir . '/', '', $file);
    if (file_exists($file)) {
        if (@unlink($file)) {
            echo "✅ Dihapus: {$relative}\n";
        } else {
            echo "❌ Gagal hapus: {$relative}\n";
        }
    } else {
        echo "⏭️  Tidak ada: {$relative}\n";
    }
}

// 2. Hapus compiled views
echo "\n--- Menghapus compiled views ---\n";
$viewsDir = $baseDir . '/storage/framework/views';
if (is_dir($viewsDir)) {
    $count = 0;
    foreach (glob($viewsDir . '/*.php') as $viewFile) {
        @unlink($viewFile);
        $count++;
    }
    echo "✅ Dihapus {$count} compiled view(s)\n";
} else {
    echo "⏭️  Direktori views tidak ada\n";
}

// 3. Hapus file cache data
echo "\n--- Menghapus data cache ---\n";
$cacheDataDir = $baseDir . '/storage/framework/cache/data';
if (is_dir($cacheDataDir)) {
    $cleared = clearDirectory($cacheDataDir);
    echo "✅ Dihapus {$cleared} cache file(s)\n";
} else {
    echo "⏭️  Direktori cache data tidak ada\n";
}

// 4. Coba jalankan Artisan optimize:clear
echo "\n--- Menjalankan Artisan optimize:clear ---\n";
try {
    require $baseDir . '/vendor/autoload.php';
    $app = require_once $baseDir . '/bootstrap/app.php';
    $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
    $kernel->bootstrap();
    
    Illuminate\Support\Facades\Artisan::call('optimize:clear');
    echo "✅ Artisan optimize:clear berhasil\n";
    echo Illuminate\Support\Facades\Artisan::output();
    
    // Also try route:clear and config:clear explicitly
    Illuminate\Support\Facades\Artisan::call('route:clear');
    echo "✅ route:clear berhasil\n";
    
    Illuminate\Support\Facades\Artisan::call('config:clear');
    echo "✅ config:clear berhasil\n";
    
    Illuminate\Support\Facades\Artisan::call('cache:clear');
    echo "✅ cache:clear berhasil\n";
    
    Illuminate\Support\Facades\Artisan::call('view:clear');
    echo "✅ view:clear berhasil\n";
    
} catch (Exception $e) {
    echo "⚠️  Artisan gagal (manual cleanup sudah dilakukan di atas): " . $e->getMessage() . "\n";
} catch (Error $e) {
    echo "⚠️  Artisan error: " . $e->getMessage() . "\n";
}

// 5. Reset OPcache jika aktif
echo "\n--- OPcache ---\n";
if (function_exists('opcache_reset')) {
    if (opcache_reset()) {
        echo "✅ OPcache di-reset\n";
    } else {
        echo "⚠️  OPcache reset gagal\n";
    }
} else {
    echo "⏭️  OPcache tidak aktif\n";
}

echo "\n=== Selesai! ===\n";
echo "⚠️ HAPUS FILE clear-all-cache.php SETELAH SELESAI!\n";
echo "</pre>";

// Helper: recursively clear directory contents
function clearDirectory($dir) {
    $count = 0;
    $items = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($dir, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::CHILD_FIRST
    );
    foreach ($items as $item) {
        if ($item->isFile() && $item->getFilename() !== '.gitkeep') {
            @unlink($item->getRealPath());
            $count++;
        }
    }
    return $count;
}
