<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateRegistrationOtpsTable extends Migration
{
    public function up()
    {
        Schema::create('registration_otps', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('phone', 20);
            $table->string('email', 191)->unique();
            $table->string('otp_code', 191);
            $table->text('registration_data'); // JSON encoded registration data
            $table->boolean('verified')->default(false);
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('registration_otps');
    }
}
