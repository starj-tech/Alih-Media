<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * Middleware untuk melindungi akses file /storage/.
 * Memverifikasi bahwa pengguna sudah login (Bearer token) sebelum
 * mengizinkan akses ke file yang disimpan di storage publik.
 */
class StorageAuth
{
    public function handle(Request $request, Closure $next)
    {
        // Coba autentikasi via Bearer token
        $token = null;

        // Cek header Authorization
        $authHeader = $request->header('Authorization');
        if ($authHeader && strpos($authHeader, 'Bearer ') === 0) {
            $token = substr($authHeader, 7);
        }

        // Fallback: X-Access-Token header
        if (!$token) {
            $token = $request->header('X-Access-Token');
        }

        // Fallback: query parameter
        if (!$token) {
            $token = $request->query('token');
        }

        if (!$token) {
            return response()->json(['error' => 'Unauthorized - Login diperlukan untuk mengakses file'], 401);
        }

        // Validasi token via Sanctum
        $accessToken = PersonalAccessToken::findToken($token);
        if (!$accessToken) {
            return response()->json(['error' => 'Token tidak valid'], 401);
        }

        // Set authenticated user
        $user = $accessToken->tokenable;
        if (!$user) {
            return response()->json(['error' => 'User tidak ditemukan'], 401);
        }

        Auth::setUser($user);

        return $next($request);
    }
}
