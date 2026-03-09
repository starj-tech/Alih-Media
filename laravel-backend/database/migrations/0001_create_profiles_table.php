<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateProfilesTable extends Migration
{
    public function up()
    {
        Schema::create('profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->unsignedBigInteger('user_id')->unique();
            $table->string('name');
            $table->string('email');
            $table->string('no_telepon')->default('');
            $table->string('pengguna')->default('Perorangan');
            // Valid: Perorangan, Staf PPAT, Notaris/PPAT, Bank, PT/Badan Hukum
            $table->string('nama_instansi')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('profiles');
    }
}
