<?php

use Illuminate\Support\Facades\Schedule;

// Cleanup expired OTPs every hour
Schedule::call(function () {
    \App\Models\PasswordResetOtp::cleanupExpired();
})->hourly();
