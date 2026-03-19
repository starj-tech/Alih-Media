<?php

use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

/*
|--------------------------------------------------------------------------
| Check If The Application Is Under Maintenance
|--------------------------------------------------------------------------
*/

if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

$autoloadPath = __DIR__.'/../vendor/autoload.php';

if (!file_exists($autoloadPath)) {
    $requestUri = isset($_SERVER['REQUEST_URI']) ? (string) $_SERVER['REQUEST_URI'] : '';
    $acceptHeader = isset($_SERVER['HTTP_ACCEPT']) ? (string) $_SERVER['HTTP_ACCEPT'] : '';
    $isApiRequest = strpos($requestUri, '/api/') !== false || strpos($acceptHeader, 'application/json') !== false;

    http_response_code(500);

    if ($isApiRequest) {
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode([
            'error' => 'Backend Laravel belum lengkap: folder vendor/autoload.php tidak ditemukan di server. Jalankan composer install di folder laravel-backend, lalu upload kembali folder vendor dan file composer.lock jika ada.',
            'code' => 'missing_vendor_autoload',
        ]);
        exit;
    }

    header('Content-Type: text/plain; charset=UTF-8');
    echo "Backend Laravel belum lengkap: file vendor/autoload.php tidak ditemukan.\n";
    echo "Jalankan composer install di folder laravel-backend, lalu upload kembali folder vendor ke server.\n";
    exit;
}

/*
|--------------------------------------------------------------------------
| Register The Auto Loader
|--------------------------------------------------------------------------
*/

require $autoloadPath;

/*
|--------------------------------------------------------------------------
| Run The Application
|--------------------------------------------------------------------------
*/

$app = require_once __DIR__.'/../bootstrap/app.php';

$kernel = $app->make(Kernel::class);

$response = $kernel->handle(
    $request = Request::capture()
);

$response->send();

$kernel->terminate($request, $response);
