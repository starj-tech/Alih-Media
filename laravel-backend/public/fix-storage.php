<?php
/**
 * Fix storage permissions and symlink for file uploads
 * Run once: https://api-alihmedia.kantahkabbogor.id/fix-storage.php
 * DELETE THIS FILE AFTER USE
 */

echo "<h2>Storage Fix Script</h2><pre>\n";

// 1. Check and create storage directories
$dirs = [
    __DIR__ . '/../storage/app/public',
    __DIR__ . '/../storage/app/public/sertifikat',
    __DIR__ . '/../storage/app/public/ktp',
    __DIR__ . '/../storage/app/public/foto-bangunan',
    __DIR__ . '/../storage/framework/cache',
    __DIR__ . '/../storage/framework/sessions',
    __DIR__ . '/../storage/framework/views',
    __DIR__ . '/../storage/logs',
];

foreach ($dirs as $dir) {
    if (!is_dir($dir)) {
        mkdir($dir, 0775, true);
        echo "✅ Created: $dir\n";
    } else {
        echo "✓ Exists: $dir\n";
    }
}

// 2. Fix permissions on storage
$storagePath = realpath(__DIR__ . '/../storage');
if ($storagePath) {
    // Recursive chmod
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($storagePath, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );
    
    foreach ($iterator as $item) {
        if ($item->isDir()) {
            chmod($item->getPathname(), 0775);
        } else {
            chmod($item->getPathname(), 0664);
        }
    }
    chmod($storagePath, 0775);
    echo "✅ Permissions fixed on storage/\n";
}

// 3. Create symlink public/storage -> storage/app/public
$link = __DIR__ . '/storage';
$target = realpath(__DIR__ . '/../storage/app/public');

if (is_link($link)) {
    echo "✓ Symlink already exists: $link -> " . readlink($link) . "\n";
} elseif (is_dir($link)) {
    echo "⚠️ 'public/storage' is a real directory, not a symlink. Consider removing it.\n";
} else {
    if ($target && symlink($target, $link)) {
        echo "✅ Symlink created: $link -> $target\n";
    } else {
        echo "❌ Failed to create symlink. Try manually or use: php artisan storage:link\n";
        
        // Alternative: copy approach - create actual directory
        if (!is_dir($link)) {
            mkdir($link, 0775, true);
            echo "✅ Created fallback directory: $link (uploads will work but URLs may need adjustment)\n";
        }
    }
}

// 4. Test write permission
$testFile = __DIR__ . '/../storage/app/public/test-write-' . time() . '.txt';
if (file_put_contents($testFile, 'test')) {
    unlink($testFile);
    echo "✅ Write test PASSED - storage is writable\n";
} else {
    echo "❌ Write test FAILED - storage is NOT writable. Fix permissions!\n";
}

// 5. Check APP_URL in .env
$envPath = __DIR__ . '/../.env';
if (file_exists($envPath)) {
    $env = file_get_contents($envPath);
    if (preg_match('/^APP_URL=(.*)$/m', $env, $m)) {
        echo "✓ APP_URL = " . trim($m[1]) . "\n";
    } else {
        echo "⚠️ APP_URL not set in .env\n";
    }
} else {
    echo "⚠️ .env file not found\n";
}

echo "\n</pre><p><strong>Done!</strong> Delete this file after use.</p>";
