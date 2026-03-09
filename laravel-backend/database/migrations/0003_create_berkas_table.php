<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateBerkasTable extends Migration
{
    public function up()
    {
        Schema::create('berkas', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->unsignedBigInteger('user_id');
            $table->date('tanggal_pengajuan')->nullable();
            $table->string('nama_pemegang_hak');
            $table->string('nama_pemilik_sertifikat')->nullable();
            $table->string('no_hak');
            $table->string('no_su_tahun');
            $table->string('jenis_hak');
            // Valid: HM, HGB, HP, HGU, HMSRS, HPL, HW
            $table->string('kecamatan');
            $table->string('desa');
            $table->string('no_telepon')->default('');
            $table->string('no_wa_pemohon')->nullable();
            $table->text('link_shareloc')->nullable();
            $table->string('status')->default('Proses');
            // Valid: Proses, Validasi SU & Bidang, Validasi BT, Selesai, Ditolak
            $table->string('file_sertifikat_url')->nullable();
            $table->string('file_ktp_url')->nullable();
            $table->string('file_foto_bangunan_url')->nullable();
            $table->unsignedBigInteger('validated_by')->nullable();
            $table->timestamp('validated_at')->nullable();
            $table->text('catatan_penolakan')->nullable();
            $table->string('rejected_from_status')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('validated_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::dropIfExists('berkas');
    }
}
