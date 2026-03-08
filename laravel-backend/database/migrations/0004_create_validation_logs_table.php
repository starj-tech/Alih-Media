<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('validation_logs', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('berkas_id');
            $table->unsignedBigInteger('admin_id');
            $table->string('action');
            $table->string('ip_address')->nullable();
            $table->timestamps();

            $table->foreign('berkas_id')->references('id')->on('berkas')->cascadeOnDelete();
            $table->foreign('admin_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('validation_logs');
    }
};
