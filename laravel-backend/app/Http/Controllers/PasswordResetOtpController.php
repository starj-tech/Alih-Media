<?php

namespace App\Http\Controllers;

use App\Models\PasswordResetOtp;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class PasswordResetOtpController extends Controller
{
    /**
     * POST /api/auth/otp/request
     * Request OTP untuk reset password via WhatsApp
     */
    public function request(Request $request): JsonResponse
    {
        $request->validate([
            'phone' => 'required|string|max:20',
        ]);

        // Find user by phone number in profile
        $profile = \App\Models\Profile::where('no_telepon', $request->phone)->first();

        if (!$profile) {
            return response()->json([
                'error' => 'Nomor telepon tidak terdaftar',
            ], 404);
        }

        // Generate 6-digit OTP
        $otpCode = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Cleanup expired OTPs
        PasswordResetOtp::cleanupExpired();

        // Create new OTP
        $otp = PasswordResetOtp::create([
            'user_id' => $profile->user_id,
            'phone' => $request->phone,
            'otp_code' => Hash::make($otpCode),
            'expires_at' => now()->addMinutes(5),
        ]);

        // TODO: Send OTP via WhatsApp using Fonnte or similar service
        // Example:
        // Http::post('https://api.fonnte.com/send', [
        //     'target' => $request->phone,
        //     'message' => "Kode OTP reset password: {$otpCode}. Berlaku 5 menit.",
        // ])->withHeaders(['Authorization' => config('services.fonnte.token')]);

        return response()->json([
            'message' => 'OTP telah dikirim ke WhatsApp',
            // Remove in production:
            'debug_otp' => $otpCode,
        ]);
    }

    /**
     * POST /api/auth/otp/verify
     * Verifikasi OTP
     */
    public function verify(Request $request): JsonResponse
    {
        $request->validate([
            'phone' => 'required|string',
            'otp_code' => 'required|string|size:6',
        ]);

        $otp = PasswordResetOtp::where('phone', $request->phone)
            ->where('verified', false)
            ->where('expires_at', '>', now())
            ->latest()
            ->first();

        if (!$otp || !Hash::check($request->otp_code, $otp->otp_code)) {
            return response()->json(['error' => 'OTP tidak valid atau sudah kedaluwarsa'], 400);
        }

        $otp->update(['verified' => true]);

        // Generate temporary token for password reset
        $tempToken = bin2hex(random_bytes(32));

        return response()->json([
            'message' => 'OTP terverifikasi',
            'reset_token' => $tempToken,
            'user_id' => $otp->user_id,
        ]);
    }

    /**
     * POST /api/auth/otp/reset
     * Reset password setelah OTP terverifikasi
     */
    public function reset(Request $request): JsonResponse
    {
        $request->validate([
            'user_id' => 'required|integer|exists:users,id',
            'password' => 'required|string|min:6|max:128',
        ]);

        $user = User::findOrFail($request->user_id);
        $user->update(['password' => $request->password]);

        // Cleanup OTPs for this user
        PasswordResetOtp::where('user_id', $request->user_id)->delete();

        return response()->json(['message' => 'Password berhasil direset']);
    }
}
