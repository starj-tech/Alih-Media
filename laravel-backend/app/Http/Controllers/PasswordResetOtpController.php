<?php

namespace App\Http\Controllers;

use App\Models\PasswordResetOtp;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class PasswordResetOtpController extends Controller
{
    public function request(Request $request)
    {
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

        $otp = PasswordResetOtp::create([
            'user_id' => $profile->user_id,
            'phone' => $request->phone,
            'otp_code' => Hash::make($otpCode),
            'expires_at' => now()->addMinutes(5),
        ]);

        return response()->json([
            'message' => 'OTP telah dikirim ke WhatsApp',
            'debug_otp' => $otpCode,
        ]);
    }

    public function verify(Request $request)
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

        $tempToken = bin2hex(random_bytes(32));

        return response()->json([
            'message' => 'OTP terverifikasi',
            'reset_token' => $tempToken,
            'user_id' => $otp->user_id,
        ]);
    }

    public function reset(Request $request)
    {
        $request->validate([
            'user_id' => 'required|integer|exists:users,id',
            'password' => 'required|string|min:6|max:128',
        ]);

        $user = User::findOrFail($request->user_id);
        $user->update(['password' => $request->password]);

        PasswordResetOtp::where('user_id', $request->user_id)->delete();

        return response()->json(['message' => 'Password berhasil direset']);
    }
}
