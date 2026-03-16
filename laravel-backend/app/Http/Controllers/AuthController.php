<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Profile;
use App\Models\UserRole;
use App\Support\OtpTableManager;
use App\Support\SmtpConfigResolver;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * POST /api/auth/login
     */
    public function login(Request $request)
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

        // Revoke old tokens
        $user->tokens()->delete();

        $token = $user->createToken('auth-token')->plainTextToken;
        $profile = $user->profile;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'name' => $profile ? $profile->name : $user->name,
                'role' => $user->getRole(),
            ],
        ]);
    }

    /**
     * POST /api/auth/register
     */
    public function register(Request $request)
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
            'password' => $request->password, // auto-hashed via mutator
            'email_verified_at' => now(),
        ]);

        Profile::create([
            'user_id' => $user->id,
            'name' => $request->name,
            'email' => $request->email,
            'no_telepon' => $request->no_telepon ? $request->no_telepon : '',
            'pengguna' => $request->pengguna ? $request->pengguna : 'Perorangan',
            'nama_instansi' => $request->nama_instansi,
        ]);

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
     */
    public function me(Request $request)
    {
        $user = $request->user();
        $user->load('profile');

        return response()->json([
            'id' => $user->id,
            'email' => $user->email,
            'name' => $user->profile ? $user->profile->name : $user->name,
            'role' => $user->getRole(),
        ]);
    }

    /**
     * POST /api/auth/logout
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out']);
    }

    /**
     * POST /api/auth/change-password
     */
    public function changePassword(Request $request)
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
     * Kirim link reset password via email SMTP
     */
    public function resetPassword(Request $request)
    {
        OtpTableManager::ensurePasswordResetsTable();

        $request->validate([
            'email' => 'required|email|max:255',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            // Tetap kembalikan sukses untuk mencegah email enumeration
            return response()->json(['message' => 'Jika email terdaftar, link reset telah dikirim']);
        }

        $token = bin2hex(random_bytes(32));

        DB::table('password_resets')->updateOrInsert(
            ['email' => $request->email],
            ['token' => Hash::make($token), 'created_at' => now()]
        );

        // Kirim email reset password via SMTP
        $frontendUrl = 'https://alihmedia.kantahkabbogor.id';
        $resetLink = $frontendUrl . '/#/reset-password?token=' . $token . '&email=' . urlencode($request->email);

        try {
            $resolution = SmtpConfigResolver::apply();

            if (!empty($resolution['missing'])) {
                Log::error('SMTP config incomplete for password reset', ['missing' => $resolution['missing']]);
                return response()->json(['message' => 'Jika email terdaftar, link reset telah dikirim']);
            }

            $fromAddr = config('mail.from.address');

            Mail::mailer('smtp')->raw(
                "Anda menerima email ini karena ada permintaan reset password untuk akun Anda.\n\n"
                . "Klik link berikut untuk mereset password:\n"
                . $resetLink . "\n\n"
                . "Link ini berlaku selama 60 menit.\n"
                . "Jika Anda tidak meminta reset password, abaikan email ini.\n\n"
                . "- Aplikasi Alih Media BPN Kab. Bogor II",
                function ($message) use ($request, $fromAddr) {
                    $message->from($fromAddr, config('mail.from.name', 'Alihmedia BPN'));
                    $message->to($request->email);
                    $message->subject('Reset Password - Alih Media BPN');
                }
            );

            Log::info('Password reset email sent', ['email' => $request->email]);
        } catch (\Throwable $e) {
            Log::error('Failed to send reset password email', [
                'email' => $request->email,
                'error' => $e->getMessage(),
            ]);
            // Tetap kembalikan sukses agar tidak bocorkan info
        }

        return response()->json([
            'message' => 'Jika email terdaftar, link reset telah dikirim',
        ]);
    }

    /**
     * POST /api/auth/reset-password/confirm
     */
    public function confirmResetPassword(Request $request)
    {
        OtpTableManager::ensurePasswordResetsTable();

        $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => 'required|string|min:6|max:128',
        ]);

        $record = DB::table('password_resets')
            ->where('email', $request->email)
            ->first();

        if (!$record || !Hash::check($request->token, $record->token)) {
            return response()->json(['error' => 'Token tidak valid'], 400);
        }

        if (now()->diffInMinutes($record->created_at) > 60) {
            return response()->json(['error' => 'Token sudah kedaluwarsa'], 400);
        }

        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json(['error' => 'User tidak ditemukan'], 404);
        }

        $user->update(['password' => $request->password]);

        DB::table('password_resets')->where('email', $request->email)->delete();

        return response()->json(['message' => 'Password berhasil direset']);
    }
}
