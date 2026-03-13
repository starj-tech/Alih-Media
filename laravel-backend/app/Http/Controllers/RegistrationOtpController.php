<?php

namespace App\Http\Controllers;

use App\Models\RegistrationOtp;
use App\Models\User;
use App\Models\Profile;
use App\Models\UserRole;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class RegistrationOtpController extends Controller
{
    private function ensureEmailConfiguration(): void
    {
        if (config('mail.default') !== 'smtp') {
            return;
        }

        $requiredConfig = [
            'MAIL_HOST' => config('mail.mailers.smtp.host'),
            'MAIL_PORT' => config('mail.mailers.smtp.port'),
            'MAIL_USERNAME' => config('mail.mailers.smtp.username'),
            'MAIL_PASSWORD' => config('mail.mailers.smtp.password'),
            'MAIL_FROM_ADDRESS' => config('mail.from.address'),
        ];

        $missing = [];
        foreach ($requiredConfig as $key => $value) {
            if ($value === null || (is_string($value) && trim($value) === '')) {
                $missing[] = $key;
            }
        }

        if (!empty($missing)) {
            throw new \RuntimeException('Konfigurasi email belum lengkap: ' . implode(', ', $missing));
        }
    }

    private function sendOtpEmail(string $email, string $otpCode): void
    {
        $this->ensureEmailConfiguration();

        Mail::raw(
            "Kode OTP Registrasi Anda: {$otpCode}\n\nKode ini berlaku selama 5 menit.\nJangan bagikan kode ini kepada siapapun.\n\n- Aplikasi Alih Media BPN Kab. Bogor II",
            function ($message) use ($email) {
                $message->to($email)
                    ->subject('Kode OTP Registrasi - Alih Media BPN');
            }
        );
    }

    /**
     * POST /api/auth/register/request-otp
     * Validate registration data and send OTP to email
     */
    public function request(Request $request)
    {
        $request->validate([
            'name' => 'required|string|min:2|max:100',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:6|max:128',
            'no_telepon' => 'required|string|min:10|max:20',
            'pengguna' => 'nullable|in:' . implode(',', Profile::PENGGUNA_TYPES),
            'nama_instansi' => 'nullable|string|max:200',
        ]);

        $otpCode = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        RegistrationOtp::cleanupExpired();

        // Delete any existing OTP for this email
        RegistrationOtp::where('email', $request->email)->delete();

        RegistrationOtp::create([
            'phone' => $request->no_telepon,
            'email' => $request->email,
            'otp_code' => Hash::make($otpCode),
            'registration_data' => json_encode([
                'name' => $request->name,
                'email' => $request->email,
                'password' => $request->password,
                'no_telepon' => $request->no_telepon,
                'pengguna' => $request->pengguna ?? 'Perorangan',
                'nama_instansi' => $request->nama_instansi,
            ]),
            'expires_at' => now()->addMinutes(5),
        ]);

        try {
            $this->sendOtpEmail($request->email, $otpCode);
        } catch (\Throwable $e) {
            \Log::error('Failed to send registration OTP email', [
                'email' => $request->email,
                'error' => $e->getMessage(),
            ]);

            // Avoid leaving unusable pending registration records
            RegistrationOtp::where('email', $request->email)->delete();

            return response()->json([
                'error' => 'OTP gagal dikirim ke email. Silakan cek konfigurasi email server atau coba lagi.',
            ], 500);
        }

        return response()->json([
            'message' => 'OTP telah dikirim ke email Anda',
            'email' => $request->email,
        ]);
    }

    /**
     * POST /api/auth/register/verify-otp
     * Verify OTP and complete registration
     */
    public function verify(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp_code' => 'required|string|size:6',
        ]);

        $otp = RegistrationOtp::where('email', $request->email)
            ->where('verified', false)
            ->where('expires_at', '>', now())
            ->latest()
            ->first();

        if (!$otp || !Hash::check($request->otp_code, $otp->otp_code)) {
            return response()->json(['error' => 'OTP tidak valid atau sudah kedaluwarsa'], 400);
        }

        $regData = json_decode($otp->registration_data, true);

        // Check if email is still available
        if (User::where('email', $regData['email'])->exists()) {
            $otp->delete();
            return response()->json(['error' => 'Email sudah terdaftar'], 400);
        }

        // Create user
        $user = User::create([
            'name' => $regData['name'],
            'email' => $regData['email'],
            'password' => $regData['password'],
            'email_verified_at' => now(),
        ]);

        Profile::create([
            'user_id' => $user->id,
            'name' => $regData['name'],
            'email' => $regData['email'],
            'no_telepon' => $regData['no_telepon'] ?? '',
            'pengguna' => $regData['pengguna'] ?? 'Perorangan',
            'nama_instansi' => $regData['nama_instansi'] ?? null,
        ]);

        UserRole::create([
            'user_id' => $user->id,
            'role' => 'user',
        ]);

        // Cleanup
        $otp->delete();

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Registrasi berhasil',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'name' => $regData['name'],
                'role' => 'user',
            ],
        ], 201);
    }

    /**
     * POST /api/auth/register/resend-otp
     * Resend OTP for pending registration
     */
    public function resend(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $otp = RegistrationOtp::where('email', $request->email)->latest()->first();

        if (!$otp) {
            return response()->json(['error' => 'Tidak ada registrasi pending untuk email ini'], 404);
        }

        $otpCode = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        try {
            $this->sendOtpEmail($request->email, $otpCode);
        } catch (\Throwable $e) {
            \Log::error('Failed to resend registration OTP email', [
                'email' => $request->email,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'OTP gagal dikirim ulang. Silakan cek konfigurasi email server atau coba lagi.',
            ], 500);
        }

        $otp->update([
            'otp_code' => Hash::make($otpCode),
            'expires_at' => now()->addMinutes(5),
            'verified' => false,
        ]);

        return response()->json([
            'message' => 'OTP baru telah dikirim ke email Anda',
            'email' => $otp->email,
        ]);
    }
}
