<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddIpAddressToBerkasTable extends Migration
{
    public function up()
    {
        Schema::table('berkas', function (Blueprint $table) {
            $table->string('ip_address', 45)->nullable()->after('rejected_from_status');
        });
    }

    public function down()
    {
        Schema::table('berkas', function (Blueprint $table) {
            $table->dropColumn('ip_address');
        });
    }
}
