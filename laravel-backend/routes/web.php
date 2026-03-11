<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'app' => 'Alihmedia BPN API',
        'version' => '1.0.0',
        'status' => 'running',
    ]);
});

// Named route 'login' — diperlukan oleh middleware auth bawaan Laravel.
// Karena ini API murni (SPA + Bearer token), route ini mengembalikan JSON 401.
Route::get('/login', function () {
    return response()->json(['message' => 'Unauthenticated.'], 401);
})->name('login');
