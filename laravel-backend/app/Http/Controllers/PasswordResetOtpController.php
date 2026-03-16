<?php

namespace App\Http\Controllers;

use App\Models\PasswordResetOtp;
use App\Models\User;
use App\Support\OtpTableManager;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class PasswordResetOtpController extends Controller
{
    public function request(Request $request)
    {
        OtpTableManager::ensurePasswordResetOtpsTable();

        $request->validate([
            'phone' => 'required|string|max:20',
        ]);

        $profile = \App\Models\Profile::where('no_telepon', $request->phone)->first();

        if (!$profile) {
            return response()->json([
                'error' => 'Nomor telepon tidak terdaftar',
            ], 404);
        }

        $otpCode = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        PasswordResetOtp::cleanupExpired();
        PasswordResetOtp::where('user_id', $profile->user_id)->delete();

        PasswordResetOtp::create([
            'user_id' => $profile->user_id,
            'phone' => $request->phone,
            'otp_code' => Hash::make($otpCode),
            'reset_token' => null,
            'expires_at' => now()->addMinutes(5),
        ]);

        return response()->json([
            'message' => 'OTP telah dikirim ke WhatsApp',
            'debug_otp' => $otpCode,
        ]);
    }

    public function verify(Request $request)
    {
        OtpTableManager::ensurePasswordResetOtpsTable();

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

        $tempToken = bin2hex(random_bytes(32));

        $otp->update([
            'verified' => true,
            'reset_token' => Hash::make($tempToken),
        ]);

        return response()->json([
            'message' => 'OTP terverifikasi',
            'reset_token' => $tempToken,
            'user_id' => $otp->user_id,
        ]);
    }

    public function reset(Request $request)
    {
        OtpTableManager::ensurePasswordResetOtpsTable();

        $request->validate([
            'user_id' => 'required|integer|exists:users,id',
            'reset_token' => 'required|string',
            'password' => 'required|string|min:6|max:128',
        ]);

        $otp = PasswordResetOtp::where('user_id', $request->user_id)
            ->where('verified', true)
            ->where('expires_at', '>', now())
            ->latest()
            ->first();

        if (!$otp || empty($otp->reset_token) || !Hash::check($request->reset_token, $otp->reset_token)) {
            return response()->json(['error' => 'Sesi reset password tidak valid atau sudah kedaluwarsa'], 400);
        }

        $user = User::findOrFail($request->user_id);
        $user->update(['password' => $request->password]);

        PasswordResetOtp::where('user_id', $request->user_id)->delete();

        return response()->json(['message' => 'Password berhasil direset']);
    }
}
