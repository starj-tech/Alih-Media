<?php

namespace App\Http\Controllers;

use App\Models\RegistrationOtp;
use App\Models\User;
use App\Models\Profile;
use App\Models\UserRole;
use App\Support\OtpTableManager;
use App\Support\SmtpConfigResolver;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class RegistrationOtpController extends Controller
{
    /**
     * Kirim email OTP dengan eksplisit SMTP mailer + diagnostik detail.
     */
    private function sendOtpEmail(string $email, string $otpCode): void
    {
        $resolution = SmtpConfigResolver::apply();

        // Baca konfigurasi SMTP setelah fallback diterapkan
        $host = config('mail.mailers.smtp.host');
        $port = config('mail.mailers.smtp.port');
        $username = config('mail.mailers.smtp.username');
        $fromAddr = config('mail.from.address');

        if (!empty($resolution['missing'])) {
            $msg = 'Konfigurasi SMTP belum lengkap di file .env/.env.example: ' . implode(', ', $resolution['missing']);
            Log::error('OTP Email Config Error', [
                'missing' => $resolution['missing'],
                'source' => $resolution['source'],
            ]);
            throw new \RuntimeException($msg);
        }

        Log::info('Sending OTP email', [
            'to' => $email,
            'smtp_host' => $host,
            'smtp_port' => $port,
            'smtp_user' => $username ? '***SET***' : '(kosong)',
            'from' => $fromAddr,
            'source' => $resolution['source'],
        ]);

        // Paksa gunakan mailer 'smtp' secara eksplisit
        Mail::mailer('smtp')->raw(
            "Kode OTP Registrasi Anda: {$otpCode}\n\nKode ini berlaku selama 5 menit.\nJangan bagikan kode ini kepada siapapun.\n\n- Aplikasi Alih Media BPN Kab. Bogor II",
            function ($message) use ($email, $fromAddr) {
                $message->from($fromAddr, config('mail.from.name', 'Alihmedia BPN'));
                $message->to($email);
                $message->subject('Kode OTP Registrasi - Alih Media BPN');
            }
        );

        Log::info('OTP email sent successfully', ['to' => $email]);
    }

    /**
     * POST /api/auth/register/request-otp
     */
    public function request(Request $request)
    {
        OtpTableManager::ensureRegistrationOtpsTable();

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
        } catch (\RuntimeException $e) {
            // Konfigurasi SMTP belum lengkap
            RegistrationOtp::where('email', $request->email)->delete();
            return response()->json([
                'error' => $e->getMessage(),
            ], 500);
        } catch (\Swift_TransportException $e) {
            // Gagal konek ke SMTP server (port diblokir, auth gagal, dll)
            Log::error('SMTP Transport Error', [
                'email' => $request->email,
                'error' => $e->getMessage(),
            ]);
            RegistrationOtp::where('email', $request->email)->delete();
            return response()->json([
                'error' => 'Gagal terhubung ke server email (SMTP). Kemungkinan port diblokir atau kredensial salah. Detail: ' . $e->getMessage(),
            ], 500);
        } catch (\Throwable $e) {
            Log::error('OTP Email Send Failed', [
                'email' => $request->email,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            RegistrationOtp::where('email', $request->email)->delete();
            return response()->json([
                'error' => 'Gagal mengirim email OTP: ' . $e->getMessage(),
            ], 500);
        }

        return response()->json([
            'message' => 'OTP telah dikirim ke email Anda',
            'email' => $request->email,
        ]);
    }

    /**
     * POST /api/auth/register/verify-otp
     */
    public function verify(Request $request)
    {
        OtpTableManager::ensureRegistrationOtpsTable();

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

        if (User::where('email', $regData['email'])->exists()) {
            $otp->delete();
            return response()->json(['error' => 'Email sudah terdaftar'], 400);
        }

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
     */
    public function resend(Request $request)
    {
        OtpTableManager::ensureRegistrationOtpsTable();

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
            Log::error('Failed to resend OTP', [
                'email' => $request->email,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'error' => 'Gagal kirim ulang OTP: ' . $e->getMessage(),
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
