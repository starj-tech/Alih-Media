<?php
/**
 * Sinkronisasi IP pengajuan agar:
 * - ip_address = IP server (202.10.48.17)
 * - device_ip_address = IP perangkat pengaju
 *
 * Jalankan sekali via browser lalu hapus file ini dari server.
 */

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

$serverIp = '202.10.48.17';

echo "<pre>\n";

if (!Schema::hasColumn('berkas', 'ip_address')) {
    Schema::table('berkas', function (Blueprint $table) {
        $table->string('ip_address', 45)->nullable()->after('rejected_from_status');
    });

    echo "✅ Column 'ip_address' added.\n";
}

if (!Schema::hasColumn('berkas', 'device_ip_address')) {
    Schema::table('berkas', function (Blueprint $table) {
        $table->string('device_ip_address', 45)->nullable()->after('ip_address');
    });

    echo "✅ Column 'device_ip_address' added.\n";
}

$migratedDeviceIp = DB::table('berkas')
    ->whereNull('device_ip_address')
    ->whereNotNull('ip_address')
    ->where('ip_address', '!=', $serverIp)
    ->update([
        'device_ip_address' => DB::raw('ip_address'),
    ]);

$updatedServerIp = DB::table('berkas')
    ->where(function ($query) use ($serverIp) {
        $query->whereNull('ip_address')
            ->orWhere('ip_address', '!=', $serverIp);
    })
    ->update([
        'ip_address' => $serverIp,
    ]);

echo "✅ device_ip_address tersalin dari data lama: {$migratedDeviceIp} baris.\n";
echo "✅ ip_address diseragamkan ke {$serverIp}: {$updatedServerIp} baris.\n";
echo "\n⚠️ Hapus file ini setelah selesai dijalankan.\n";
echo "</pre>";