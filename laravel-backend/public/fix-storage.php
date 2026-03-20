<?php
/**
 * Fix storage permissions, symlink, and chunk directories
 * Run once: https://api-alihmedia.kantahkabbogor.id/fix-storage.php
 * DELETE THIS FILE AFTER USE
 */

echo "<h2>Storage Fix Script</h2><pre>\n";

// 1. Create required directories
$dirs = [
    __DIR__ . '/../storage/app',
    __DIR__ . '/../storage/app/public',
    __DIR__ . '/../storage/app/public/sertifikat',
    __DIR__ . '/../storage/app/public/ktp',
    __DIR__ . '/../storage/app/public/foto-bangunan',
    __DIR__ . '/../storage/app/chunks',
    __DIR__ . '/../storage/framework/cache',
    __DIR__ . '/../storage/framework/sessions',
    __DIR__ . '/../storage/framework/views',
    __DIR__ . '/../storage/logs',
    __DIR__ . '/../bootstrap/cache',
];

foreach ($dirs as $dir) {
    if (!is_dir($dir)) {
        mkdir($dir, 0775, true);
        echo "✅ Created: $dir\n";
    } else {
        echo "✓ Exists: $dir\n";
    }
}

// 2. Fix permissions recursively
$storagePath = realpath(__DIR__ . '/../storage');
if ($storagePath) {
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($storagePath, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );
    foreach ($iterator as $item) {
        if ($item->isDir()) {
            @chmod($item->getPathname(), 0775);
        } else {
            @chmod($item->getPathname(), 0664);
        }
    }
    @chmod($storagePath, 0775);
    echo "✅ Permissions fixed on storage/\n";
}

$bootstrapCache = realpath(__DIR__ . '/../bootstrap/cache');
if ($bootstrapCache) {
    @chmod($bootstrapCache, 0775);
    echo "✅ Permissions fixed on bootstrap/cache/\n";
}

// 3. Symlink public/storage -> storage/app/public
$link = __DIR__ . '/storage';
$target = realpath(__DIR__ . '/../storage/app/public');

if (is_link($link)) {
    echo "✓ Symlink exists: $link -> " . readlink($link) . "\n";
} elseif (is_dir($link)) {
    echo "⚠️ public/storage is a real directory (not symlink). Files should still work.\n";
} else {
    if ($target && @symlink($target, $link)) {
        echo "✅ Symlink created: $link -> $target\n";
    } else {
        echo "⚠️ Could not create symlink. Trying to create directory instead...\n";
        if (!is_dir($link)) {
            @mkdir($link, 0775, true);
            echo "✅ Created fallback directory: $link\n";
        }
    }
}

// 4. Write tests
echo "\n--- Write Tests ---\n";

// Test storage/app/public
$testFile = __DIR__ . '/../storage/app/public/test-write-' . time() . '.txt';
if (@file_put_contents($testFile, 'test')) {
    @unlink($testFile);
    echo "✅ storage/app/public: WRITABLE\n";
} else {
    echo "❌ storage/app/public: NOT WRITABLE\n";
}

// Test storage/app/chunks
$testChunkDir = __DIR__ . '/../storage/app/chunks/test-' . time();
@mkdir($testChunkDir, 0775, true);
$testChunkFile = $testChunkDir . '/test.tmp';
if (@file_put_contents($testChunkFile, 'test')) {
    @unlink($testChunkFile);
    @rmdir($testChunkDir);
    echo "✅ storage/app/chunks: WRITABLE\n";
} else {
    @rmdir($testChunkDir);
    echo "❌ storage/app/chunks: NOT WRITABLE\n";
}

// 5. Environment info
echo "\n--- Environment ---\n";
$envPath = __DIR__ . '/../.env';
if (file_exists($envPath)) {
    $env = file_get_contents($envPath);
    if (preg_match('/^APP_URL=(.*)$/m', $env, $m)) {
        echo "APP_URL = " . trim($m[1]) . "\n";
    } else {
        echo "⚠️ APP_URL not set\n";
    }
    if (preg_match('/^FILESYSTEM_DISK=(.*)$/m', $env, $m)) {
        echo "FILESYSTEM_DISK = " . trim($m[1]) . "\n";
    } else {
        echo "FILESYSTEM_DISK = not set (defaults to 'local')\n";
    }
} else {
    echo "⚠️ .env not found\n";
}

// 6. Sample files in storage
echo "\n--- Sample Files in storage/app/public ---\n";
$publicDir = realpath(__DIR__ . '/../storage/app/public');
if ($publicDir && is_dir($publicDir)) {
    $count = 0;
    $iter = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($publicDir, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::LEAVES_ONLY
    );
    foreach ($iter as $f) {
        if ($count >= 10) { echo "... (more files)\n"; break; }
        $rel = str_replace($publicDir . '/', '', $f->getPathname());
        echo "  {$rel} (" . number_format($f->getSize()) . " bytes)\n";
        $count++;
    }
    if ($count === 0) echo "  (empty)\n";
} else {
    echo "  (directory not found)\n";
}

echo "\n</pre><p><strong>Done!</strong> Delete this file after use.</p>";
