<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BerkasController;
use App\Http\Controllers\FileController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ValidationLogController;
use Illuminate\Support\Facades\Route;

// ==========================================
// PUBLIC ROUTES (tanpa autentikasi)
// ==========================================
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);

// ==========================================
// PROTECTED ROUTES (perlu token Bearer)
// ==========================================
Route::middleware('auth:sanctum')->group(function () {

    // --- Auth ---
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);

    // --- Berkas ---
    Route::get('/berkas', [BerkasController::class, 'index']);
    Route::get('/berkas/stats', [BerkasController::class, 'stats']);
    Route::get('/berkas/today-count', [BerkasController::class, 'todayCount']);
    Route::post('/berkas', [BerkasController::class, 'store']);
    Route::get('/berkas/{id}', [BerkasController::class, 'show']);
    Route::put('/berkas/{id}', [BerkasController::class, 'update']);
    Route::put('/berkas/{id}/status', [BerkasController::class, 'updateStatus']);
    Route::delete('/berkas/{id}', [BerkasController::class, 'destroy']);
    Route::get('/berkas/{id}/timeline', [BerkasController::class, 'timeline']);

    // --- Files ---
    Route::post('/files/upload', [FileController::class, 'upload']);
    Route::get('/files/download/{path}', [FileController::class, 'download'])->where('path', '.*');
    Route::get('/files/url/{path}', [FileController::class, 'getUrl'])->where('path', '.*');
    Route::delete('/files/{path}', [FileController::class, 'destroy'])->where('path', '.*');

    // --- Users (Admin only) ---
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);

    // --- Validation Logs (Admin only) ---
    Route::get('/validation-logs', [ValidationLogController::class, 'index']);
    Route::get('/validation-logs/my-count', [ValidationLogController::class, 'myCount']);
    Route::get('/validation-logs/admin-counts', [ValidationLogController::class, 'adminCounts']);
});
