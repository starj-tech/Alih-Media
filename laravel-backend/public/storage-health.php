<?php
/**
 * Standalone storage diagnostics — no Laravel bootstrap needed.
 * URL: https://api-alihmedia.kantahkabbogor.id/storage-health.php
 * DELETE THIS FILE AFTER USE
 */

header('Content-Type: application/json; charset=UTF-8');

$base = dirname(__DIR__);

function check_dir($path) {
    if (!is_dir($path)) return ['exists' => false, 'writable' => false];
    $writable = false;
    $test = $path . '/.write-test-' . time();
    if (@file_put_contents($test, 'ok')) {
        @unlink($test);
        $writable = true;
    }
    return ['exists' => true, 'writable' => $writable];
}

$dirs = [
    'storage/app'            => $base . '/storage/app',
    'storage/app/public'     => $base . '/storage/app/public',
    'storage/app/chunks'     => $base . '/storage/app/chunks',
    'storage/logs'           => $base . '/storage/logs',
    'bootstrap/cache'        => $base . '/bootstrap/cache',
];

$results = [];
foreach ($dirs as $label => $path) {
    $results[$label] = check_dir($path);
}

// Symlink status
$link = __DIR__ . '/storage';
$symlink = 'missing';
if (is_link($link)) {
    $symlink = 'symlink -> ' . readlink($link);
} elseif (is_dir($link)) {
    $symlink = 'real_directory';
}

// .env values
$env = [];
$envPath = $base . '/.env';
if (file_exists($envPath)) {
    $content = file_get_contents($envPath);
    if (preg_match('/^APP_URL=(.*)$/m', $content, $m)) $env['APP_URL'] = trim($m[1]);
    if (preg_match('/^FILESYSTEM_DISK=(.*)$/m', $content, $m)) $env['FILESYSTEM_DISK'] = trim($m[1]);
}

echo json_encode([
    'status' => 'ok',
    'directories' => $results,
    'public_storage' => $symlink,
    'env' => $env ?: null,
    'php_version' => PHP_VERSION,
    'php_limits' => [
        'upload_max_filesize' => ini_get('upload_max_filesize'),
        'post_max_size' => ini_get('post_max_size'),
        'max_execution_time' => ini_get('max_execution_time'),
        'memory_limit' => ini_get('memory_limit'),
        'max_input_vars' => ini_get('max_input_vars'),
    ],
    'timestamp' => date('c'),
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
