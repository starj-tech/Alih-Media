<?php

namespace App\Support;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class OtpTableManager
{
    public static function ensureRegistrationOtpsTable(): void
    {
        if (!Schema::hasTable('registration_otps')) {
            Schema::create('registration_otps', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('phone', 20);
                $table->string('email', 191)->unique();
                $table->string('otp_code', 191);
                $table->text('registration_data');
                $table->boolean('verified')->default(false);
                $table->timestamp('expires_at')->nullable();
                $table->timestamps();
            });
        }
    }

    public static function ensurePasswordResetOtpsTable(): void
    {
        if (!Schema::hasTable('password_reset_otps')) {
            Schema::create('password_reset_otps', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->unsignedBigInteger('user_id');
                $table->string('phone');
                $table->string('otp_code');
                $table->string('reset_token', 255)->nullable();
                $table->boolean('verified')->default(false);
                $table->timestamp('expires_at');
                $table->timestamps();

                $table->index('user_id');
                $table->index('phone');
            });

            return;
        }

        if (!Schema::hasColumn('password_reset_otps', 'reset_token')) {
            Schema::table('password_reset_otps', function (Blueprint $table) {
                $table->string('reset_token', 255)->nullable()->after('otp_code');
            });
        }
    }
}
