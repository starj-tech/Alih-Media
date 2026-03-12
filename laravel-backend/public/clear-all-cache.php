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

// 4. Artisan clear + diagnostik
echo "\n--- Menjalankan Artisan ---\n";
try {
    require $baseDir . '/vendor/autoload.php';
    $app = require_once $baseDir . '/bootstrap/app.php';
    $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
    $kernel->bootstrap();
    
    foreach (['optimize:clear', 'route:clear', 'config:clear', 'cache:clear', 'view:clear'] as $cmd) {
        Illuminate\Support\Facades\Artisan::call($cmd);
        echo "✅ {$cmd} berhasil\n";
    }
    
    // Diagnostik: cek route 'login'
    echo "\n--- Diagnostik Route ---\n";
    $router = app('router');
    $routes = $router->getRoutes();
    $loginRoute = $routes->getByName('login');
    echo $loginRoute 
        ? "✅ Route 'login' terdaftar: " . $loginRoute->uri() . " [" . implode(',', $loginRoute->methods()) . "]\n"
        : "❌ Route 'login' TIDAK terdaftar — periksa routes/web.php!\n";
    
    echo "\n--- API Auth Routes ---\n";
    foreach ($routes as $route) {
        $uri = $route->uri();
        if (strpos($uri, 'api/auth') === 0) {
            echo "  " . implode('|', $route->methods()) . " /{$uri}" . ($route->getName() ? " [{$route->getName()}]" : "") . "\n";
        }
    }
    
} catch (Exception $e) {
    echo "⚠️  Artisan error: " . $e->getMessage() . "\n";
} catch (Error $e) {
    echo "⚠️  Fatal: " . $e->getMessage() . "\n";
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
