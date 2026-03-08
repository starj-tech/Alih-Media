<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Profile;
use App\Models\UserRole;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * POST /api/auth/login
     * Login dan mendapatkan token Sanctum
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email|max:255',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        // Revoke old tokens (single device login)
        $user->tokens()->delete();

        $token = $user->createToken('auth-token')->plainTextToken;
        $profile = $user->profile;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'name' => $profile?->name ?? $user->name,
                'role' => $user->getRole(),
            ],
        ]);
    }

    /**
     * POST /api/auth/register
     * Registrasi user baru
     */
    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|min:2|max:100',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:6|max:128',
            'no_telepon' => 'nullable|string|max:20',
            'pengguna' => 'nullable|in:' . implode(',', Profile::PENGGUNA_TYPES),
            'nama_instansi' => 'nullable|string|max:200',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => $request->password, // auto-hashed via cast
            'email_verified_at' => now(), // auto-verify for simplicity
        ]);

        // Create profile
        Profile::create([
            'user_id' => $user->id,
            'name' => $request->name,
            'email' => $request->email,
            'no_telepon' => $request->no_telepon ?? '',
            'pengguna' => $request->pengguna ?? 'Perorangan',
            'nama_instansi' => $request->nama_instansi,
        ]);

        // Assign default role
        UserRole::create([
            'user_id' => $user->id,
            'role' => 'user',
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'name' => $request->name,
                'role' => 'user',
            ],
        ], 201);
    }

    /**
     * GET /api/auth/me
     * Ambil profil user yang sedang login
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->load('profile');

        return response()->json([
            'id' => $user->id,
            'email' => $user->email,
            'name' => $user->profile?->name ?? $user->name,
            'role' => $user->getRole(),
        ]);
    }

    /**
     * POST /api/auth/logout
     * Hapus token saat ini
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out']);
    }

    /**
     * POST /api/auth/change-password
     * Ganti password
     */
    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|max:128',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Password saat ini salah.'],
            ]);
        }

        $user->update(['password' => $request->new_password]);

        return response()->json(['message' => 'Password berhasil diubah']);
    }

    /**
     * POST /api/auth/reset-password
     * Reset password via email (simplified - kirim link reset)
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email|max:255',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            // Return success anyway to prevent email enumeration
            return response()->json(['message' => 'Jika email terdaftar, link reset telah dikirim']);
        }

        // Generate token for password reset
        $token = bin2hex(random_bytes(32));
        
        \DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $request->email],
            ['token' => Hash::make($token), 'created_at' => now()]
        );

        // TODO: Send email with reset link
        // Mail::to($user->email)->send(new PasswordResetMail($token));

        return response()->json([
            'message' => 'Link reset password telah dikirim ke email',
            // Remove this in production:
            'debug_token' => $token, 
        ]);
    }

    /**
     * POST /api/auth/reset-password/confirm
     * Konfirmasi reset password dengan token
     */
    public function confirmResetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => 'required|string|min:6|max:128',
        ]);

        $record = \DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (!$record || !Hash::check($request->token, $record->token)) {
            return response()->json(['error' => 'Token tidak valid'], 400);
        }

        // Check if token is expired (60 minutes)
        if (now()->diffInMinutes($record->created_at) > 60) {
            return response()->json(['error' => 'Token sudah kedaluwarsa'], 400);
        }

        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json(['error' => 'User tidak ditemukan'], 404);
        }

        $user->update(['password' => $request->password]);

        // Delete used token
        \DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return response()->json(['message' => 'Password berhasil direset']);
    }
}
