<?php

/*
|--------------------------------------------------------------------------
| Create The Application (Laravel 8.x)
|--------------------------------------------------------------------------
*/

$basePath = $_ENV['APP_BASE_PATH'] ?? dirname(__DIR__);

$requiredDirectories = [
    $basePath . '/bootstrap/cache',
    $basePath . '/storage/framework/cache/data',
    $basePath . '/storage/framework/sessions',
    $basePath . '/storage/framework/views',
    $basePath . '/storage/logs',
    $basePath . '/storage/app/public',
];

foreach ($requiredDirectories as $directory) {
    if (!is_dir($directory)) {
        @mkdir($directory, 0775, true);
    }

    if (is_dir($directory) && !is_writable($directory)) {
        @chmod($directory, 0775);
    }
}

$app = new Illuminate\Foundation\Application($basePath);

/*
|--------------------------------------------------------------------------
| Bind Important Interfaces
|--------------------------------------------------------------------------
*/

$app->singleton(
    Illuminate\Contracts\Http\Kernel::class,
    App\Http\Kernel::class
);

$app->singleton(
    Illuminate\Contracts\Console\Kernel::class,
    App\Console\Kernel::class
);

$app->singleton(
    Illuminate\Contracts\Debug\ExceptionHandler::class,
    App\Exceptions\Handler::class
);

return $app;

