<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        if (!Schema::hasColumn('berkas', 'device_ip_address')) {
            Schema::table('berkas', function (Blueprint $table) {
                $table->string('device_ip_address', 45)->nullable()->after('ip_address');
            });
        }

        DB::table('berkas')
            ->whereNull('device_ip_address')
            ->whereNotNull('ip_address')
            ->where('ip_address', '!=', '202.10.48.17')
            ->update([
                'device_ip_address' => DB::raw('ip_address'),
            ]);

        DB::table('berkas')->update([
            'ip_address' => '202.10.48.17',
        ]);
    }

    public function down()
    {
        if (Schema::hasColumn('berkas', 'device_ip_address')) {
            Schema::table('berkas', function (Blueprint $table) {
                $table->dropColumn('device_ip_address');
            });
        }
    }
};