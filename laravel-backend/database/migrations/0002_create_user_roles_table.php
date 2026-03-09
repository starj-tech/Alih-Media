<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('user_roles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->string('role')->default('user');
            // Valid: admin, user, super_admin, super_user, admin_arsip, admin_validasi_su, admin_validasi_bt
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('user_roles');
    }
};
