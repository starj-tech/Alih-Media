<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BerkasController;
use App\Http\Controllers\FileController;
use App\Http\Controllers\PasswordResetOtpController;
use App\Http\Controllers\RegistrationOtpController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ValidationLogController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - Aplikasi Alih Media BPN
|--------------------------------------------------------------------------
|
| Base URL: /api
| Auth: Bearer token (Laravel Sanctum)
|
*/

// ==========================================
// PUBLIC ROUTES (tanpa autentikasi)
// ==========================================

// Health check endpoint
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'message' => 'API Alihmedia BPN berjalan normal',
        'timestamp' => now()->toIso8601String(),
    ]);
});

Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
    Route::post('/reset-password/confirm', [AuthController::class, 'confirmResetPassword']);

    // OTP-based password reset (via WhatsApp)
    Route::post('/otp/request', [PasswordResetOtpController::class, 'request']);
    Route::post('/otp/verify', [PasswordResetOtpController::class, 'verify']);
    Route::post('/otp/reset', [PasswordResetOtpController::class, 'reset']);

    // Registration OTP
    Route::post('/register/request-otp', [RegistrationOtpController::class, 'request']);
    Route::post('/register/verify-otp', [RegistrationOtpController::class, 'verify']);
    Route::post('/register/resend-otp', [RegistrationOtpController::class, 'resend']);
});

// ==========================================
// PROTECTED ROUTES (perlu token Bearer)
// ==========================================

Route::middleware('auth:sanctum')->group(function () {

    // --- Auth ---
    Route::prefix('auth')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
    });

    // --- Berkas ---
    Route::prefix('berkas')->group(function () {
        Route::get('/', [BerkasController::class, 'index']);
        Route::get('/stats', [BerkasController::class, 'stats']);
        Route::get('/today-count', [BerkasController::class, 'todayCount']);
        Route::post('/', [BerkasController::class, 'store']);
        Route::get('/{id}', [BerkasController::class, 'show']);
        Route::put('/{id}', [BerkasController::class, 'update']);
        Route::put('/{id}/status', [BerkasController::class, 'updateStatus']);
        Route::delete('/{id}', [BerkasController::class, 'destroy']);
        Route::get('/{id}/timeline', [BerkasController::class, 'timeline']);
        Route::delete('/{id}/files', [BerkasController::class, 'deleteFiles']);
    });

    // --- Files ---
    Route::prefix('files')->group(function () {
        Route::post('/upload', [FileController::class, 'upload']);
        Route::post('/upload-chunk', [FileController::class, 'uploadChunk']);
        Route::get('/download/{path}', [FileController::class, 'download'])->where('path', '.*');
        Route::get('/url/{path}', [FileController::class, 'getUrl'])->where('path', '.*');
        Route::delete('/{path}', [FileController::class, 'destroy'])->where('path', '.*');
    });

    // --- User Management (Admin only) ---
    Route::prefix('users')->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::post('/', [UserController::class, 'store']);
        Route::get('/{id}', [UserController::class, 'show']);
        Route::put('/{id}', [UserController::class, 'update']);
        Route::delete('/{id}', [UserController::class, 'destroy']);
    });

    // --- Validation Logs (Admin only) ---
    Route::prefix('validation-logs')->group(function () {
        Route::get('/', [ValidationLogController::class, 'index']);
        Route::get('/my-count', [ValidationLogController::class, 'myCount']);
        Route::get('/admin-counts', [ValidationLogController::class, 'adminCounts']);
        Route::get('/berkas/{berkasId}', [ValidationLogController::class, 'byBerkas']);
    });
});
